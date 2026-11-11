/* ==========================================================
   services.js - Lógica de negocio (cada servicio es una clase
   que encapsula su estado y lanza excepciones ante errores)
   ========================================================== */

/** Catálogo de retos: búsqueda, filtros y orden. */
class ChallengeCatalog {
  #items;

  static #sorters = {
    numero: (a, b) => a.number - b.number,
    recompensa: (a, b) => b.reward - a.reward,
    fecha: (a, b) => a.deadline.localeCompare(b.deadline),
    dificultad: (a, b) => a.level - b.level
  };

  constructor(rawList) {
    this.#items = rawList.map(raw => ChallengeFactory.create(raw)); // polimorfismo: cada uno es de una subclase
  }

  all() { return [...this.#items]; }
  get size() { return this.#items.length; }
  get totalReward() { return this.#items.reduce((sum, c) => sum + c.reward, 0); }

  /** Devuelve el reto o null (para vistas que toleran su ausencia). */
  get(id) { return this.#items.find(c => c.id === id) || null; }

  /** Devuelve el reto o lanza NotFoundError. */
  find(id) {
    const challenge = this.get(id);
    if (!challenge) throw new NotFoundError('El reto "' + id + '" no existe.');
    return challenge;
  }

  industries() { return [...new Set(this.#items.map(c => c.industry))]; }

  search({ query = '', industry = 'Todas', sort = 'numero' } = {}) {
    const sorter = ChallengeCatalog.#sorters[sort] || ChallengeCatalog.#sorters.numero;
    return this.#items
      .filter(c => (industry === 'Todas' || c.industry === industry) && c.matches(query))
      .sort(sorter);
  }
}

/** Registro, inicio y cierre de sesión. */
class AuthService {
  #users;
  #prefs;

  constructor(userRepository, preferences) {
    this.#users = userRepository;
    this.#prefs = preferences;
  }

  #findByName(username) {
    return this.#users.getAll().find(u => u.hasUsername(username)) || null;
  }

  currentUser() {
    const name = this.#prefs.getSession();
    return name ? this.#findByName(name) : null;
  }

  /** @throws {ValidationError} @throws {AuthenticationError} */
  login(username, password) {
    Validator.text(username, 'usuario', { message: 'Escribe tu usuario.' });
    Validator.text(password, 'contraseña', { message: 'Escribe tu contraseña.' });
    const user = this.#findByName(username);
    if (!user || !user.verifyPassword(password)) throw new AuthenticationError();
    this.#prefs.setSession(user.username);
    return user;
  }

  loginDemo() {
    let user = this.#findByName(SeedData.DEMO_USER.username);
    if (!user) {
      user = User.fromJSON(SeedData.DEMO_USER);
      this.#users.saveAll([...this.#users.getAll(), user]);
    }
    this.#prefs.setSession(user.username);
    return user;
  }

  /** @throws {ValidationError} @throws {DuplicateEntityError} */
  register(username, password, displayName) {
    const user = new User({ username, password, displayName }); // la clase valida y lanza ValidationError
    const users = this.#users.getAll();
    if (users.some(u => u.hasUsername(user.username))) {
      throw new DuplicateEntityError('Ese usuario ya existe. Elige otro nombre.');
    }
    this.#users.saveAll([...users, user]);
    this.#prefs.setSession(user.username);
    return user;
  }

  logout() { this.#prefs.setSession(null); }

  resetUsers() { this.#users.reset(); }
}

/** Alta, edición y baja de soluciones. */
class SolutionService {
  #repo;
  #items;

  constructor(solutionRepository) {
    this.#repo = solutionRepository;
    this.#items = solutionRepository.getAll();
  }

  all() { return [...this.#items]; }
  forUser(user) { return this.#items.filter(s => s.isOwnedBy(user)); }

  /** @throws {NotFoundError} */
  find(id) {
    const solution = this.#items.find(s => s.id === id);
    if (!solution) throw new NotFoundError('La solución no existe o ya fue eliminada.');
    return solution;
  }

  /** @throws {ValidationError} @throws {DuplicateEntityError} */
  submit(user, challenge, content) {
    if (!challenge.isOpen) throw new ValidationError('Este reto ya cerró y no recibe más soluciones.', 'reto');
    if (this.forUser(user).some(s => s.challengeId === challenge.id)) {
      throw new DuplicateEntityError('Ya enviaste una solución para este reto. Puedes editarla desde "Mis soluciones".');
    }
    const solution = Solution.create(user, challenge, content);
    this.#items.unshift(solution);
    this.#persist();
    return solution;
  }

  /** @throws {NotFoundError} @throws {PermissionError} @throws {ValidationError} */
  update(id, user, content) {
    const solution = this.find(id);
    if (!solution.isOwnedBy(user)) throw new PermissionError('Solo puedes editar tus propias soluciones.');
    solution.update(content);
    this.#persist();
    return solution;
  }

  /** @throws {NotFoundError} @throws {PermissionError} */
  remove(id, user) {
    const solution = this.find(id);
    if (!solution.isOwnedBy(user)) throw new PermissionError('Solo puedes eliminar tus propias soluciones.');
    this.#items = this.#items.filter(s => s.id !== id);
    this.#persist();
  }

  reset() {
    this.#repo.reset();
    this.#items = this.#repo.getAll();
  }

  #persist() { this.#repo.saveAll(this.#items); }
}
