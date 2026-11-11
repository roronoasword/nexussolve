/* ==========================================================
   storage.js - Persistencia con clases

   ABSTRACCIÓN   DataStore y Repository son abstractas.
   HERENCIA      LocalStorageStore / MemoryStore extienden DataStore;
                 UserRepository / SolutionRepository extienden Repository.
   POLIMORFISMO  El resto del código usa "DataStore" sin saber si hay
                 localStorage o memoria (StoreFactory elige).
   EXCEPCIONES   Los fallos de lectura/escritura lanzan StorageError.
   ========================================================== */

/* ---------- Almacenes de datos ---------- */
class DataStore {
  constructor() {
    if (new.target === DataStore) throw new AbstractClassError('DataStore');
  }
  get(key, fallback = null) { throw new AbstractMethodError(this.constructor.name, 'get()'); }
  set(key, value) { throw new AbstractMethodError(this.constructor.name, 'set()'); }
  remove(key) { throw new AbstractMethodError(this.constructor.name, 'remove()'); }
}

class LocalStorageStore extends DataStore {
  static isAvailable() {
    try {
      const probe = '__nexussolve_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      throw new StorageError('No se pudo leer "' + key + '" (datos dañados o bloqueados).', e);
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw new StorageError('No se pudo guardar "' + key + '". El navegador bloqueó el almacenamiento o está lleno.', e);
    }
  }

  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { throw new StorageError('No se pudo borrar "' + key + '".', e); }
  }
}

/** Alternativa cuando el navegador bloquea localStorage (los datos duran mientras la pestaña esté abierta). */
class MemoryStore extends DataStore {
  #data = new Map();
  get(key, fallback = null) { return this.#data.has(key) ? JSON.parse(this.#data.get(key)) : fallback; }
  set(key, value) { this.#data.set(key, JSON.stringify(value)); }
  remove(key) { this.#data.delete(key); }
}

class StoreFactory {
  static create() {
    return LocalStorageStore.isAvailable() ? new LocalStorageStore() : new MemoryStore();
  }
}

/* ---------- Repositorios ---------- */
class Repository {
  #store;
  #key;

  constructor(store, key) {
    if (new.target === Repository) throw new AbstractClassError('Repository');
    this.#store = store;
    this.#key = key;
  }

  /** Convierte un objeto plano en entidad (lo implementa cada subclase). */
  hydrate(raw) { throw new AbstractMethodError(this.constructor.name, 'hydrate()'); }

  /** Datos iniciales (objetos planos). */
  seed() { return []; }

  getAll() {
    let raw;
    try {
      raw = this.#store.get(this.#key, null);
    } catch (err) {
      if (!(err instanceof StorageError)) throw err;
      console.warn(err.message); // datos dañados: se parte de los datos iniciales
      raw = null;
    }
    if (!Array.isArray(raw)) raw = this.seed();

    const entities = [];
    for (const item of raw) {
      try {
        entities.push(this.hydrate(item));
      } catch (err) {
        if (!(err instanceof ValidationError)) throw err;
        console.warn('Registro descartado por inválido:', err.message);
      }
    }
    return entities;
  }

  saveAll(entities) {
    this.#store.set(this.#key, entities.map(e => e.toJSON()));
  }

  reset() {
    this.saveAll(this.seed().map(raw => this.hydrate(raw)));
  }
}

class UserRepository extends Repository {
  constructor(store) { super(store, 'nexussolve_users_v4'); }
  hydrate(raw) { return User.fromJSON(raw); }
  seed() { return [SeedData.DEMO_USER]; }
}

class SolutionRepository extends Repository {
  constructor(store) { super(store, 'nexussolve_solutions_v4'); }
  hydrate(raw) { return Solution.fromJSON(raw); }
  seed() { return SeedData.initialSolutions(); }
}

/** Preferencias: sesión activa y tema visual. */
class PreferencesStore {
  #store;
  static SESSION = 'nexussolve_session_v4';
  static THEME = 'nexussolve_theme';

  constructor(store) { this.#store = store; }

  getSession() {
    try {
      const s = this.#store.get(PreferencesStore.SESSION, null);
      return s && s.username ? s.username : null;
    } catch (e) { return null; }
  }

  setSession(username) {
    if (username) this.#store.set(PreferencesStore.SESSION, { username });
    else this.#store.remove(PreferencesStore.SESSION);
  }

  getTheme() {
    try { return this.#store.get(PreferencesStore.THEME, 'dark') === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; }
  }

  setTheme(theme) { this.#store.set(PreferencesStore.THEME, theme); }
}
