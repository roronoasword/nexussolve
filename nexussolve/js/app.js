/* ==========================================================
   app.js - Clase App: controlador principal.

   ENCAPSULAMIENTO  Estado y dependencias son campos privados.
   ABSTRACCIÓN      App solo conoce interfaces (CodeExecutor, servicios)
                    y recibe sus dependencias por el constructor.
   EXCEPCIONES      Toda acción pasa por #dispatch (try/catch) y los
                    errores se muestran según su tipo con #report().
   ========================================================== */
class App {
  #auth; #solutions; #catalog; #executor; #notifier; #prefs; #views;
  #state = {
    user: null, solutions: [], tab: 'inicio', search: '', industry: 'Todas',
    sort: 'numero', theme: 'dark', authMode: 'login', modal: null
  };

  constructor({ auth, solutions, catalog, executor, notifier, preferences, views }) {
    this.#auth = auth;
    this.#solutions = solutions;
    this.#catalog = catalog;
    this.#executor = executor;
    this.#notifier = notifier;
    this.#prefs = preferences;
    this.#views = views;
  }

  /* ---------- Arranque ---------- */
  init() {
    this.#state.theme = this.#prefs.getTheme();
    this.#applyTheme();
    this.#state.user = this.#auth.currentUser();
    this.#sync();
    this.#bindEvents();
    this.#render();
  }

  /* ---------- Estado y renderizado ---------- */
  #sync() { this.#state.solutions = this.#solutions.all(); }

  #applyTheme() { document.documentElement.setAttribute('data-theme', this.#state.theme); }

  #render() {
    const root = document.getElementById('app');
    const s = this.#state;
    if (!s.user) {
      root.innerHTML = this.#views.auth(s);
    } else {
      const pages = {
        inicio: (st) => this.#views.dashboard(st),
        explorar: (st) => this.#views.explore(st),
        'mis-soluciones': (st) => this.#views.mySolutions(st)
      };
      root.innerHTML = this.#views.shell(s, (pages[s.tab] || pages.inicio)(s));
    }
    this.#renderModal();
  }

  #renderModal() {
    const root = document.getElementById('modal-root');
    const s = this.#state;
    if (!s.modal || !s.user) {
      root.innerHTML = '';
      document.body.style.overflow = '';
      return;
    }
    root.innerHTML = s.modal.type === 'submit' ? this.#views.submitModal(s) : this.#views.repoModal(s);
    document.body.style.overflow = 'hidden';
  }

  #openModal(modal) { this.#state.modal = modal; this.#renderModal(); }
  #closeModal() { this.#state.modal = null; this.#renderModal(); }

  /* ---------- Manejo centralizado de excepciones ---------- */
  #showInline(id, message) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = message;
    el.classList.remove('hidden');
    return true;
  }

  /**
   * Decide cómo mostrar cada tipo de excepción.
   * Errores del usuario (validación, credenciales, duplicados) van junto al formulario;
   * el resto, como notificación; lo inesperado se registra en consola.
   */
  #report(err, inlineId = null) {
    const userFacing = err instanceof ValidationError || err instanceof AuthenticationError || err instanceof DuplicateEntityError;
    if (userFacing && inlineId && this.#showInline(inlineId, err.message)) return;

    if (err instanceof ValidationError) return this.#notifier.error('Datos inválidos', err.message);
    if (err instanceof AuthenticationError) return this.#notifier.error('No pudimos iniciar sesión', err.message);
    if (err instanceof PermissionError) return this.#notifier.error('Acción no permitida', err.message);
    if (err instanceof DuplicateEntityError) return this.#notifier.error('Ya existe', err.message);
    if (err instanceof NotFoundError) return this.#notifier.error('No encontrado', err.message);
    if (err instanceof StorageError) return this.#notifier.error('Problema de almacenamiento', err.message);
    if (err instanceof NexusError) return this.#notifier.error('Error', err.message);

    console.error(err);
    this.#notifier.error('Error inesperado', 'Algo salió mal. Revisa la consola del navegador para más detalles.');
  }

  /** Ejecuta una acción dentro de try/catch para que ningún error rompa la interfaz. */
  async #dispatch(handler, ...args) {
    try {
      await handler(...args);
    } catch (err) {
      this.#report(err);
    }
  }

  /* ---------- Acciones (data-action) ---------- */
  #actions = {
    nav: (d) => {
      this.#state.tab = d.tab;
      this.#closeModal();
      this.#render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    'toggle-theme': () => {
      this.#state.theme = this.#state.theme === 'dark' ? 'light' : 'dark';
      this.#prefs.setTheme(this.#state.theme);
      this.#applyTheme();
      this.#render();
    },

    'auth-mode': (d) => { this.#state.authMode = d.mode; this.#render(); },

    'toggle-pass': (d, el) => {
      const input = document.getElementById('f-pass');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      el.textContent = show ? 'Ocultar' : 'Mostrar';
    },

    'quick-login': () => {
      const user = this.#auth.loginDemo();
      this.#startSession(user, 'Entraste con la cuenta de demostración.');
    },

    logout: () => {
      this.#auth.logout();
      this.#state.user = null;
      this.#state.modal = null;
      this.#state.authMode = 'login';
      this.#notifier.info('Sesión cerrada', 'Hasta pronto 👋');
      this.#render();
    },

    'set-industry': (d) => { this.#state.industry = d.industry; this.#render(); },

    'clear-filters': () => {
      Object.assign(this.#state, { search: '', industry: 'Todas', sort: 'numero' });
      this.#render();
    },

    'open-submit': (d) => this.#openModal({ type: 'submit', challengeId: this.#catalog.find(d.id).id }),
    'open-edit': (d) => this.#openModal({ type: 'submit', solutionId: this.#solutions.find(d.id).id }),
    'open-repo': (d) => this.#openModal({ type: 'repo', solutionId: this.#solutions.find(d.id).id }),
    'close-modal': () => this.#closeModal(),

    'overlay-close': (d, el, ev) => { if (ev.target === el) this.#closeModal(); },

    'reset-starter': (d) => {
      document.getElementById('s-code').value = this.#catalog.find(d.id).starter;
    },

    'run-draft': () => this.#runInTerminal(document.getElementById('s-code').value, 'draft-terminal', 'draft-output'),

    'run-solution': () => {
      const solution = this.#solutions.find(this.#state.modal && this.#state.modal.solutionId);
      return this.#runInTerminal(solution.code, 'repo-terminal', 'repo-output');
    },

    'hide-terminal': () => document.getElementById('repo-terminal').classList.add('hidden'),

    'copy-code': async () => {
      const solution = this.#solutions.find(this.#state.modal && this.#state.modal.solutionId);
      try {
        await navigator.clipboard.writeText(solution.code);
        this.#notifier.success('Código copiado', 'Ya está en tu portapapeles.');
      } catch (e) {
        throw new NexusError('No se pudo copiar. Selecciona el código manualmente.', 'CLIPBOARD');
      }
    },

    'download-code': (d) => {
      const solution = this.#solutions.find(d.id);
      downloadTextFile(solution.fileName, solution.code);
    },

    'delete-solution': (d) => {
      const solution = this.#solutions.find(d.id);
      if (!confirm('¿Eliminar el repositorio "' + solution.repoName + '"? Esta acción no se puede deshacer.')) return;
      this.#solutions.remove(d.id, this.#state.user); // puede lanzar NotFoundError / PermissionError
      this.#sync();
      this.#closeModal();
      this.#render();
      this.#notifier.info('Solución eliminada', 'Puedes volver a enviarla cuando quieras.');
    },

    'reset-data': () => {
      if (!confirm('Esto restablece las cuentas y soluciones de demostración. ¿Continuar?')) return;
      this.#auth.resetUsers();
      this.#solutions.reset();
      if (!this.#auth.currentUser()) { this.#auth.logout(); this.#state.user = null; }
      this.#state.modal = null;
      this.#sync();
      this.#render();
      this.#notifier.success('Datos restablecidos', 'Se restauraron los datos originales.');
    }
  };

  #startSession(user, message) {
    this.#state.user = user;
    this.#state.tab = 'inicio';
    this.#sync();
    this.#notifier.success('¡Bienvenido, ' + user.displayName + '!', message);
    this.#render();
  }

  /** Ejecuta código del usuario y pinta el resultado; ExecutionError se atrapa aquí. */
  async #runInTerminal(code, boxId, outId) {
    const box = document.getElementById(boxId);
    const out = document.getElementById(outId);
    box.classList.remove('hidden');
    out.className = '';
    out.textContent = 'Ejecutando…';
    try {
      const result = await this.#executor.run(code);
      out.textContent = CodeExecutor.formatSuccess(result);
    } catch (err) {
      if (!(err instanceof ExecutionError)) throw err;
      out.className = 'err';
      out.textContent = CodeExecutor.formatFailure(err);
    }
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- Formularios (data-form) ---------- */
  #forms = {
    auth: (form) => {
      const data = new FormData(form);
      const registering = this.#state.authMode === 'register';
      try {
        const user = registering
          ? this.#auth.register(data.get('username'), data.get('password'), data.get('name'))
          : this.#auth.login(data.get('username'), data.get('password'));
        this.#startSession(user, registering ? 'Tu cuenta fue creada.' : 'Sesión iniciada con éxito.');
      } catch (err) {
        this.#report(err, 'auth-error');
      }
    },

    solution: (form) => {
      const data = new FormData(form);
      const content = {
        repoName: data.get('repo'), fileName: data.get('file'),
        code: data.get('code'), description: data.get('desc')
      };
      const modal = this.#state.modal;
      try {
        let solution;
        if (modal.solutionId) {
          solution = this.#solutions.update(modal.solutionId, this.#state.user, content);
          this.#notifier.success('Cambios guardados', 'Se creó un nuevo commit en ' + solution.repoName + '.');
        } else {
          solution = this.#solutions.submit(this.#state.user, this.#catalog.find(modal.challengeId), content);
          this.#notifier.success('¡Solución enviada!', 'Creamos el repositorio ' + solution.repoName + '.');
        }
        this.#sync();
        this.#state.tab = 'mis-soluciones';
        this.#state.modal = { type: 'repo', solutionId: solution.id };
        this.#render();
      } catch (err) {
        this.#report(err, 'solution-error');
      }
    }
  };

  /* ---------- Eventos globales (delegación) ---------- */
  #bindEvents() {
    document.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-action]');
      const handler = el && this.#actions[el.dataset.action];
      if (handler) this.#dispatch(handler, el.dataset, el, ev);
    });

    document.addEventListener('submit', (ev) => {
      const form = ev.target.closest('[data-form]');
      if (!form) return;
      ev.preventDefault();
      this.#dispatch(this.#forms[form.dataset.form], form);
    });

    document.addEventListener('input', (ev) => {
      if (ev.target.id === 'search-input') {
        this.#state.search = ev.target.value;
        document.getElementById('explore-results').innerHTML = this.#views.exploreResults(this.#state);
      }
    });

    document.addEventListener('change', (ev) => {
      if (ev.target.id === 'sort-select') {
        this.#state.sort = ev.target.value;
        document.getElementById('explore-results').innerHTML = this.#views.exploreResults(this.#state);
      }
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && this.#state.modal) this.#closeModal();
      const ta = ev.target;
      if (ta && ta.id === 's-code') {
        if (ev.key === 'Tab') {
          ev.preventDefault();
          const s = ta.selectionStart;
          ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
          ta.selectionStart = ta.selectionEnd = s + 2;
        } else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
          ev.preventDefault();
          this.#dispatch(this.#actions['run-draft']);
        }
      }
    });

    // Red de seguridad: promesas rechazadas sin atrapar
    window.addEventListener('unhandledrejection', (ev) => {
      ev.preventDefault();
      this.#report(ev.reason);
    });
  }
}

/* ---------- Composición de dependencias y arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const store = StoreFactory.create();
    const preferences = new PreferencesStore(store);
    const catalog = new ChallengeCatalog(SeedData.CHALLENGES);
    const app = new App({
      auth: new AuthService(new UserRepository(store), preferences),
      solutions: new SolutionService(new SolutionRepository(store)),
      catalog,
      executor: new WorkerExecutor(),
      notifier: new Notifier('toast-root'),
      preferences,
      views: new ViewRenderer(catalog)
    });
    app.init();
  } catch (err) {
    console.error(err);
    document.getElementById('app').innerHTML =
      '<div style="padding:40px;font-family:sans-serif"><h2>No se pudo iniciar NexusSolve</h2><p>' +
      Utils.esc(err.message || err) + '</p></div>';
  }
});
