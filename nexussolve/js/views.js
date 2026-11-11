/* ==========================================================
   views.js - ViewRenderer: clase que genera el HTML de cada
   pantalla a partir del estado. Los métodos auxiliares son
   privados (#) y solo se expone la interfaz pública.
   ========================================================== */
class ViewRenderer {
  #catalog;

  constructor(catalog) { this.#catalog = catalog; }

  /* ---------- Auxiliares privados ---------- */
  #mine(state) { return state.solutions.filter(s => s.isOwnedBy(state.user)); }

  #statusBadge(solution) {
    return solution.isAccepted
      ? '<span class="badge ok">✓ Aceptada</span>'
      : '<span class="badge wait">⏳ En revisión</span>';
  }

  #challengeCard(c, submitted) {
    const dl = c.deadlineLabel;
    return `
    <article class="card ${submitted ? 'done' : ''}">
      <div>
        <div class="card-top">
          <span class="company">${Utils.esc(c.company)}</span>
          <span class="badge ${c.badgeClass}">${Utils.esc(c.label)}</span>
        </div>
        <h3>${Utils.esc(c.title)}</h3>
        <p>${Utils.esc(c.summary)}</p>
        <div class="tags"><span class="tag">${Utils.esc(c.industry)}</span>${c.tags.map(t => `<span class="tag">${Utils.esc(t)}</span>`).join('')}<span class="tag">⌛ ~${c.estimatedHours} h</span></div>
      </div>
      <div class="card-foot stack">
        <div class="row">
          <div class="reward">${Utils.money(c.reward)}</div>
          <span class="deadline ${dl.urgent ? 'urgent' : ''}">⏱ ${dl.text}</span>
        </div>
        ${submitted
          ? `<button class="btn btn-ghost btn-block" data-action="nav" data-tab="mis-soluciones">✓ Ya enviaste una solución · Ver</button>`
          : c.isOpen
            ? `<button class="btn btn-primary btn-block" data-action="open-submit" data-id="${c.id}">Resolver este reto</button>`
            : `<button class="btn btn-ghost btn-block" disabled>Reto cerrado</button>`}
      </div>
    </article>`;
  }

  #solutionCard(s) {
    const c = this.#catalog.get(s.challengeId);
    return `
    <article class="card">
      <div>
        <div class="card-top">
          <span class="muted">${c ? Utils.esc(c.company) : 'Empresa'} · ${c ? Utils.esc(c.industry) : ''}</span>
          ${this.#statusBadge(s)}
        </div>
        <h3>${c ? Utils.esc(c.title) : 'Reto empresarial'}</h3>
        <div class="repo-pill" style="margin:10px 0"><span class="name">🐙 ${Utils.esc(s.repoName)}</span><span class="lang">JS</span></div>
        <p>${Utils.esc(s.description)}</p>
      </div>
      <div class="card-foot row">
        <div><div class="muted" style="font-size:11px">RECOMPENSA</div><div class="reward" style="font-size:17px">${c ? Utils.money(c.reward) : '-'}</div></div>
        <button class="btn btn-primary btn-sm" data-action="open-repo" data-id="${s.id}">🐙 Ver repositorio</button>
      </div>
    </article>`;
  }

  /* ---------- Pantalla de acceso ---------- */
  auth(state) {
    const reg = state.authMode === 'register';
    return `
    <div class="auth-wrap">
      <section class="auth-side">
        <div class="brand"><div class="brand-logo">&lt;/&gt;</div><div class="brand-name">Nexus<span>Solve</span></div></div>
        <h1>Resuelve retos reales.<br><span>Publica tu código.</span></h1>
        <p>Elige un desafío de una empresa, escribe tu solución en JavaScript, pruébala al instante y guárdala en tu propio repositorio.</p>
        <div class="stack" style="gap:18px">
          <div class="feature"><div class="ico">🚀</div><div><b>${this.#catalog.size} retos empresariales</b><span>Logística, finanzas, salud, energía y más.</span></div></div>
          <div class="feature"><div class="ico">▶️</div><div><b>Ejecuta tu código en el navegador</b><span>Sin instalar nada: escribe, prueba y envía.</span></div></div>
          <div class="feature"><div class="ico">🐙</div><div><b>Visor estilo GitHub</b><span>Cada solución tiene su repositorio con número de líneas y commit.</span></div></div>
        </div>
      </section>
      <section class="auth-panel">
        <button class="icon-btn theme-corner" data-action="toggle-theme" title="Cambiar tema" aria-label="Cambiar tema">${state.theme === 'dark' ? '☀️' : '🌙'}</button>
        <div class="auth-card">
          <h2>${reg ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h2>
          <p>${reg ? 'Regístrate para empezar a enviar soluciones.' : 'Inicia sesión para continuar con tus retos.'}</p>
          <div class="segmented">
            <button type="button" data-action="auth-mode" data-mode="login" class="${reg ? '' : 'active'}">Iniciar sesión</button>
            <button type="button" data-action="auth-mode" data-mode="register" class="${reg ? 'active' : ''}">Registrarme</button>
          </div>
          <form data-form="auth" novalidate>
            ${reg ? `<div class="field"><label for="f-name">Nombre o alias</label><input class="input" id="f-name" name="name" placeholder="Ej. Angelo García" autocomplete="name" /></div>` : ''}
            <div class="field"><label for="f-user">Usuario</label><input class="input" id="f-user" name="username" placeholder="tu_usuario" autocomplete="username" required /></div>
            <div class="field"><label for="f-pass">Contraseña</label>
              <div class="pass-wrap"><input class="input" id="f-pass" name="password" type="password" placeholder="••••••••" autocomplete="${reg ? 'new-password' : 'current-password'}" required />
              <button type="button" data-action="toggle-pass">Mostrar</button></div>
              ${reg ? '<div class="help">Mínimo 6 caracteres.</div>' : ''}
            </div>
            <div id="auth-error" class="form-error hidden" role="alert"></div>
            <button class="btn btn-primary btn-block" type="submit">${reg ? 'Crear cuenta y comenzar' : 'Entrar'}</button>
          </form>
          <div class="divider">o prueba sin registrarte</div>
          <button class="btn btn-ghost btn-block" data-action="quick-login">✨ Entrar con la cuenta de demostración</button>
        </div>
      </section>
    </div>`;
  }

  /* ---------- Estructura general ---------- */
  shell(state, content) {
    const u = state.user;
    const tabs = [['inicio', '🏠', 'Inicio'], ['explorar', '🚀', 'Explorar retos'], ['mis-soluciones', '📂', 'Mis soluciones']];
    return `
    <header class="topbar"><div class="topbar-inner">
      <div class="brand" data-action="nav" data-tab="inicio"><div class="brand-logo">&lt;/&gt;</div><div class="brand-name">Nexus<span>Solve</span></div></div>
      <nav class="nav" aria-label="Navegación principal">
        ${tabs.map(t => `<button data-action="nav" data-tab="${t[0]}" class="${state.tab === t[0] ? 'active' : ''}" ${state.tab === t[0] ? 'aria-current="page"' : ''}>
          <span>${t[1]}</span><span>${t[2]}</span>${t[0] === 'mis-soluciones' ? `<span class="count">${this.#mine(state).length}</span>` : ''}</button>`).join('')}
      </nav>
      <div class="topbar-right">
        <button class="icon-btn" data-action="toggle-theme" title="Cambiar tema" aria-label="Cambiar tema">${state.theme === 'dark' ? '☀️' : '🌙'}</button>
        <div class="user-chip"><div class="avatar">${Utils.esc(u.initial)}</div><span class="uname">${Utils.esc(u.username)}</span></div>
        <button class="btn btn-ghost btn-sm" data-action="logout">Salir</button>
      </div>
    </div></header>
    <main class="main" id="main">${content}</main>
    <footer class="footer"><div class="footer-inner">
      <span><b>NexusSolve</b> · Retos empresariales y repositorios de código</span>
      <button class="link-btn" data-action="reset-data">Restablecer datos de demostración</button>
    </div></footer>`;
  }

  /* ---------- Inicio ---------- */
  dashboard(state) {
    const mine = this.#mine(state);
    const submitted = new Set(mine.map(s => s.challengeId));
    const total = this.#catalog.size;
    const pct = Math.round((submitted.size / total) * 100);
    const earned = mine.filter(s => s.isAccepted).reduce((sum, s) => {
      const c = this.#catalog.get(s.challengeId); return sum + (c ? c.reward : 0);
    }, 0);
    const recommended = this.#catalog.all().filter(c => !submitted.has(c.id) && c.isOpen).sort((a, b) => b.reward - a.reward).slice(0, 3);
    const recent = mine.slice(0, 2);

    return `
    <div class="page">
      <section class="hero">
        <h1>¡Hola, <span>${Utils.esc(state.user.displayName)}</span>! 👋</h1>
        <p>Elige un reto, escribe tu solución en JavaScript, pruébala con un clic y guárdala en tu repositorio. Tu avance se guarda automáticamente.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-action="nav" data-tab="explorar">🚀 Explorar retos</button>
          <button class="btn btn-ghost" data-action="nav" data-tab="mis-soluciones">📂 Mis soluciones (${mine.length})</button>
        </div>
      </section>

      <section class="stats">
        <div class="stat purple"><div class="label">Soluciones enviadas</div><div class="value">${mine.length}</div><div class="hint">repositorios creados</div></div>
        <div class="stat green"><div class="label">Recompensa ganada</div><div class="value">${Utils.money(earned)}</div><div class="hint">de soluciones aceptadas</div></div>
        <div class="stat"><div class="label">Bolsa total</div><div class="value">${Utils.money(this.#catalog.totalReward)}</div><div class="hint">en ${total} retos</div></div>
        <div class="stat"><div class="label">Tu progreso</div><div class="value">${pct}%</div>
          <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div></div>
      </section>

      ${recommended.length ? `
      <div class="section-title"><h2>🔥 Retos con mayor recompensa para ti</h2><button class="link-btn" data-action="nav" data-tab="explorar">Ver todos →</button></div>
      <div class="grid">${recommended.map(c => this.#challengeCard(c, false)).join('')}</div>` : `
      <div class="empty" style="margin-top:24px"><div class="big">🏆</div><h3>¡No quedan retos pendientes!</h3><p>Revisa tus repositorios en "Mis soluciones".</p></div>`}

      ${recent.length ? `
      <div class="section-title"><h2>Últimas soluciones</h2><button class="link-btn" data-action="nav" data-tab="mis-soluciones">Ver todas →</button></div>
      <div class="grid two">${recent.map(s => this.#solutionCard(s)).join('')}</div>` : ''}
    </div>`;
  }

  /* ---------- Explorar ---------- */
  /** Solo la rejilla de resultados (se actualiza al escribir sin perder el foco). */
  exploreResults(state) {
    const submitted = new Set(this.#mine(state).map(s => s.challengeId));
    const list = this.#catalog.search({ query: state.search, industry: state.industry, sort: state.sort });
    if (!list.length) {
      return `<div class="empty"><div class="big">🔍</div><h3>No encontramos retos</h3><p>Prueba con otra palabra o cambia la industria.</p>
        <button class="btn btn-ghost" data-action="clear-filters">Limpiar filtros</button></div>`;
    }
    return `<div class="result-count">${list.length} ${list.length === 1 ? 'reto' : 'retos'} encontrados</div>
      <div class="grid">${list.map(c => this.#challengeCard(c, submitted.has(c.id))).join('')}</div>`;
  }

  explore(state) {
    const industries = ['Todas', ...this.#catalog.industries()];
    const sorts = [['numero', 'Ordenar: número'], ['recompensa', 'Mayor recompensa'], ['fecha', 'Cierre más próximo'], ['dificultad', 'Más fáciles primero']];
    return `
    <div class="page">
      <div class="page-head"><h1>🚀 Explorar retos</h1><p>Filtra por industria, busca por tecnología y ordena según lo que más te convenga.</p></div>
      <div class="toolbar">
        <div class="search"><span>🔍</span><input class="input" id="search-input" type="search" value="${Utils.esc(state.search)}" placeholder="Buscar por empresa, tema o tecnología…" aria-label="Buscar retos" /></div>
        <select class="select" id="sort-select" aria-label="Ordenar retos">
          ${sorts.map(o => `<option value="${o[0]}" ${state.sort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}
        </select>
      </div>
      <div class="chips" role="group" aria-label="Filtrar por industria">
        ${industries.map(i => `<button class="chip ${state.industry === i ? 'active' : ''}" data-action="set-industry" data-industry="${Utils.esc(i)}">${Utils.esc(i)}</button>`).join('')}
      </div>
      <div id="explore-results">${this.exploreResults(state)}</div>
    </div>`;
  }

  /* ---------- Mis soluciones ---------- */
  mySolutions(state) {
    const mine = this.#mine(state);
    const ok = mine.filter(s => s.isAccepted).length;
    return `
    <div class="page">
      <div class="page-head row" style="align-items:flex-end;flex-wrap:wrap">
        <div><h1>📂 Mis soluciones</h1><p>Aquí están tus repositorios. Ábrelos para ver el código, ejecutarlo, descargarlo o editarlo.</p></div>
        <div class="muted" style="font-size:14px"><b style="color:var(--text)">${mine.length}</b> enviadas · <b style="color:var(--success)">${ok}</b> aceptadas</div>
      </div>
      ${mine.length ? `<div class="grid two">${mine.map(s => this.#solutionCard(s)).join('')}</div>` : `
      <div class="empty"><div class="big">📭</div><h3>Aún no has enviado soluciones</h3><p>Elige un reto y escribe tu primera solución. Te recomendamos empezar por el de "Hola Mundo".</p>
        <button class="btn btn-primary" data-action="nav" data-tab="explorar">Explorar retos</button></div>`}
    </div>`;
  }

  /* ---------- Modal: enviar / editar ---------- */
  submitModal(state) {
    const m = state.modal;
    const editing = m.solutionId ? state.solutions.find(s => s.id === m.solutionId) : null;
    const c = this.#catalog.get(editing ? editing.challengeId : m.challengeId);
    if (!c) return '';
    const u = state.user.username.toLowerCase();
    return `
    <div class="overlay" data-action="overlay-close">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-head">
          <div>
            <div class="muted" style="font-size:12px"><b class="company">${Utils.esc(c.company)}</b> · Reto #${c.number} · <span class="badge ${c.badgeClass}">${Utils.esc(c.label)}</span></div>
            <h2 id="modal-title" style="margin-top:6px">${editing ? 'Editar solución' : 'Resolver'}: ${Utils.esc(c.title)}</h2>
            <div class="reward" style="font-size:15px;margin-top:6px">Recompensa: ${Utils.money(c.reward)}</div>
          </div>
          <button class="icon-btn" data-action="close-modal" aria-label="Cerrar">✕</button>
        </div>
        <form data-form="solution" class="modal-body" novalidate>
          <div class="steps"><span>1 · Escribe tu código</span><span>2 · Pruébalo</span><span>3 · Envía</span></div>
          <div class="field-row">
            <div class="field"><label for="s-repo">Nombre del repositorio</label>
              <input class="input mono" id="s-repo" name="repo" required value="${Utils.esc(editing ? editing.repoName : u + '/solucion-' + c.id)}" />
              <div class="help">Formato: usuario/nombre-del-repo</div></div>
            <div class="field"><label for="s-file">Archivo</label>
              <input class="input mono" id="s-file" name="file" required value="${Utils.esc(editing ? editing.fileName : c.file)}" />
              <div class="help">Debe terminar en .js</div></div>
          </div>
          <div class="field">
            <label for="s-code">Código fuente (JavaScript)</label>
            <textarea class="textarea" id="s-code" name="code" rows="14" spellcheck="false" required>${Utils.esc(editing ? editing.code : c.starter)}</textarea>
            <div class="row" style="margin-top:8px;flex-wrap:wrap">
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button type="button" class="btn btn-ghost btn-sm" data-action="run-draft">▶ Probar código</button>
                <button type="button" class="btn btn-ghost btn-sm" data-action="reset-starter" data-id="${c.id}">↺ Restaurar plantilla</button>
              </div>
              <span class="help">Tab inserta 2 espacios · Ctrl+Enter ejecuta</span>
            </div>
            <div id="draft-terminal" class="terminal terminal-inline hidden">
              <div class="terminal-head"><span>💻 Resultado de la prueba</span></div>
              <pre id="draft-output"></pre>
            </div>
          </div>
          <div class="field"><label for="s-desc">Descripción breve</label>
            <input class="input" id="s-desc" name="desc" required maxlength="140" value="${Utils.esc(editing ? editing.description : 'Solución al reto de ' + c.company)}" /></div>
          <div id="solution-error" class="form-error hidden" role="alert"></div>
          <div class="modal-foot" style="padding:16px 0 0;border:none">
            <span class="help">Se guardará en <b>Mis soluciones</b> y se abrirá tu repositorio.</span>
            <div style="display:flex;gap:8px">
              <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary">${editing ? 'Guardar cambios' : 'Enviar y crear repositorio'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>`;
  }

  /* ---------- Modal: visor estilo GitHub ---------- */
  repoModal(state) {
    const s = state.solutions.find(x => x.id === state.modal.solutionId);
    if (!s) return '';
    const c = this.#catalog.get(s.challengeId);
    const lines = s.code.replace(/\n$/, '').split('\n');
    const repoShort = s.repoName.split('/')[1] || s.repoName;
    return `
    <div class="overlay" data-action="overlay-close">
      <div class="modal" role="dialog" aria-modal="true" aria-label="Repositorio ${Utils.esc(s.repoName)}" style="max-width:960px">
        <div class="gh-bar">
          <div class="gh-title"><span class="muted">${Utils.esc(s.username)}</span><span class="muted">/</span><span class="repo">${Utils.esc(repoShort)}</span><span class="gh-vis">Public</span></div>
          <button class="icon-btn" data-action="close-modal" aria-label="Cerrar">✕</button>
        </div>
        <div class="gh-ctx">
          <span class="muted">Reto: <b style="color:var(--text)">${c ? Utils.esc(c.title) : 'Desafío'}</b> · <span class="company">${c ? Utils.esc(c.company) : ''}</span></span>
          <span>${this.#statusBadge(s)} <b class="reward" style="font-size:14px;margin-left:8px">${c ? Utils.money(c.reward) : ''}</b></span>
        </div>
        <div class="gh-actions">
          <div style="display:flex;gap:8px;align-items:center"><span class="branch">🌿 main</span><span class="muted" style="font-size:12px">1 rama · 1 commit · ${Utils.esc(s.submittedAt)}</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" data-action="run-solution">▶ Ejecutar</button>
            <button class="btn btn-ghost btn-sm" data-action="copy-code">📋 Copiar</button>
            <button class="btn btn-ghost btn-sm" data-action="download-code" data-id="${s.id}">⬇ Descargar</button>
            <button class="btn btn-ghost btn-sm" data-action="open-edit" data-id="${s.id}">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" data-action="delete-solution" data-id="${s.id}">🗑 Eliminar</button>
          </div>
        </div>
        <div class="commit"><span><b>${Utils.esc(s.username)}</b> ${Utils.esc(s.commitMessage)}</span><span class="hash">${Utils.esc(s.commitHash)}</span></div>
        <div class="code-box">
          <div class="code-head"><span>📄 ${Utils.esc(s.fileName)}</span><span>${s.lineCount} líneas · JavaScript</span></div>
          <div class="code-scroll"><table class="code-table"><tbody>
            ${lines.map((l, i) => `<tr><td class="ln">${i + 1}</td><td class="src">${Highlighter.line(l)}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
        <div id="repo-terminal" class="terminal hidden">
          <div class="terminal-head"><span>💻 Terminal</span><button class="link-btn" data-action="hide-terminal">Ocultar</button></div>
          <pre id="repo-output"></pre>
        </div>
        <div style="height:24px"></div>
      </div>
    </div>`;
  }
}
