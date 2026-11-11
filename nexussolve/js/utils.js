/* ==========================================================
   utils.js - Utilidades en forma de clases

   Utils          Funciones estáticas de formato y seguridad.
   Highlighter    Resaltado de sintaxis JS.
   Notifier       Notificaciones (toasts) en pantalla.
   CodeExecutor   Clase ABSTRACTA para ejecutar código del usuario.
   WorkerExecutor Implementación concreta en un Web Worker aislado
                  (HERENCIA + POLIMORFISMO: se podría cambiar por otro
                  ejecutor sin tocar el resto de la app).
   ========================================================== */
class Utils {
  /** Escapa texto para insertarlo en HTML (evita XSS). */
  static esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  static money(n) { return '$' + Number(n).toLocaleString('en-US') + ' USD'; }
}

class Highlighter {
  static #TOKEN = /(\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|if|else|for|while|class|new|async|await|of|in|break|continue|try|catch|throw|null|undefined|true|false|this|constructor|extends|super|static)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)(?=\()/g;

  static line(line) {
    let out = '';
    let last = 0;
    line.replace(Highlighter.#TOKEN, (m, comment, str, kw, num, fn, offset) => {
      out += Utils.esc(line.slice(last, offset));
      const cls = comment ? 'tk-c' : str ? 'tk-s' : kw ? 'tk-k' : num ? 'tk-n' : 'tk-f';
      out += '<span class="' + cls + '">' + Utils.esc(m) + '</span>';
      last = offset + m.length;
      return m;
    });
    return out + Utils.esc(line.slice(last));
  }
}

class Notifier {
  #root;

  constructor(rootId) { this.#root = document.getElementById(rootId); }

  show(type, title, message = '') {
    if (!this.#root) return;
    const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = '<div>' + (icons[type] || 'ℹ️') + '</div><div><b>' + Utils.esc(title) + '</b><span>' + Utils.esc(message) +
      '</span></div><button class="x" aria-label="Cerrar">✕</button>';
    el.querySelector('.x').onclick = () => el.remove();
    this.#root.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  success(title, message) { this.show('success', title, message); }
  error(title, message) { this.show('error', title, message); }
  info(title, message) { this.show('info', title, message); }
}

/* ---------- Ejecución de código ---------- */
class CodeExecutor {
  constructor() {
    if (new.target === CodeExecutor) throw new AbstractClassError('CodeExecutor');
  }

  /** @returns {Promise<{logs: string[], ms: number}>} @throws {ExecutionError} */
  async run(code) { throw new AbstractMethodError(this.constructor.name, 'run()'); }

  /** Formato de salida de consola para una ejecución correcta. */
  static formatSuccess(result) {
    const body = result.logs.join('\n') || '(el script no imprimió nada con console.log)';
    return '$ node script.js\n' + body + '\n\n[OK] Terminó sin errores en ' + result.ms + ' ms';
  }

  /** Formato para una ejecución que lanzó ExecutionError. */
  static formatFailure(err) {
    const printed = err.logs && err.logs.length ? err.logs.join('\n') + '\n\n' : '';
    return '$ node script.js\n' + printed + '[ERROR] ' + err.message;
  }
}

class WorkerExecutor extends CodeExecutor {
  #timeoutMs;

  static #SOURCE = [
    'const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;',
    'function fmt(v) { if (typeof v === "string") return v; try { return typeof v === "object" ? JSON.stringify(v) : String(v); } catch (e) { return String(v); } }',
    'self.onmessage = async function (e) {',
    '  const logs = [];',
    '  const push = (...a) => logs.push(a.map(fmt).join(" "));',
    '  const fakeConsole = { log: push, info: push, warn: push, error: push, table: push };',
    '  const t0 = performance.now();',
    '  try {',
    '    await new AsyncFunction("console", e.data)(fakeConsole);',
    '    self.postMessage({ ok: true, logs: logs, ms: Math.round(performance.now() - t0) });',
    '  } catch (err) {',
    '    self.postMessage({ ok: false, logs: logs, error: String(err && err.message ? err.name + ": " + err.message : err) });',
    '  }',
    '};'
  ].join('\n');

  constructor(timeoutMs = 3000) {
    super();
    this.#timeoutMs = timeoutMs;
  }

  run(code) {
    return new Promise((resolve, reject) => {
      let worker;
      let url;
      try {
        url = URL.createObjectURL(new Blob([WorkerExecutor.#SOURCE], { type: 'application/javascript' }));
        worker = new Worker(url);
      } catch (e) {
        return reject(new ExecutionError('Tu navegador no permite ejecutar el sandbox (Web Worker).'));
      }
      const finish = () => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); };
      const timer = setTimeout(() => {
        finish();
        reject(new ExecutionError('Tiempo agotado: el script tardó más de ' + this.#timeoutMs / 1000 + ' s (¿bucle infinito?).'));
      }, this.#timeoutMs);

      worker.onmessage = (ev) => {
        finish();
        const r = ev.data;
        if (r.ok) resolve({ logs: r.logs, ms: r.ms });
        else reject(new ExecutionError(r.error, r.logs));
      };
      worker.onerror = (ev) => {
        finish();
        reject(new ExecutionError(ev.message || 'Error de sintaxis en el código.'));
      };
      worker.postMessage(code);
    });
  }
}

/** Descarga un texto como archivo. */
function downloadTextFile(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
