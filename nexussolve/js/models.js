/* ==========================================================
   models.js - Modelo de dominio con los 4 PILARES DE LA POO

   ENCAPSULAMIENTO  Campos privados (#campo) con getters; el estado
                    solo cambia mediante métodos que validan.
   ABSTRACCIÓN      Entity y Challenge son clases abstractas: definen
                    el contrato y no se pueden instanciar.
   HERENCIA         User, Challenge y Solution extienden Entity;
                    Basic/Intermediate/Advanced/ExpertChallenge
                    extienden Challenge.
   POLIMORFISMO     Cada subclase de Challenge sobrescribe level,
                    label y estimatedHours; describe() y toJSON()
                    se comportan distinto según la clase.
   EXCEPCIONES      Toda validación lanza ValidationError.
   ========================================================== */

/* ---------- Validador reutilizable (lanza excepciones) ---------- */
class Validator {
  /** Valida texto; devuelve el texto sin espacios en los extremos. */
  static text(value, field, { min = 1, max = Infinity, pattern = null, message = null } = {}) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (text.length < min) throw new ValidationError(message || 'El campo "' + field + '" es obligatorio.', field);
    if (text.length > max) throw new ValidationError(message || 'El campo "' + field + '" admite máximo ' + max + ' caracteres.', field);
    if (pattern && !pattern.test(text)) throw new ValidationError(message || 'El campo "' + field + '" no tiene un formato válido.', field);
    return text;
  }

  static positiveNumber(value, field) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) throw new ValidationError('El campo "' + field + '" debe ser un número positivo.', field);
    return n;
  }

  static oneOf(value, allowed, field) {
    if (!allowed.includes(value)) throw new ValidationError('Valor no permitido para "' + field + '": ' + value, field);
    return value;
  }
}

/* ---------- ABSTRACCIÓN: entidad base ---------- */
class Entity {
  #id;
  #createdAt;

  constructor(id, createdAt = null) {
    if (new.target === Entity) throw new AbstractClassError('Entity');
    this.#id = Validator.text(id, 'id');
    this.#createdAt = createdAt || new Date().toISOString();
  }

  get id() { return this.#id; }
  get createdAt() { return this.#createdAt; }

  /** Método abstracto: cada subclase lo implementa a su manera (polimorfismo). */
  describe() { throw new AbstractMethodError(this.constructor.name, 'describe()'); }

  toJSON() { return { id: this.#id, createdAt: this.#createdAt }; }
}

/* ---------- Usuario ---------- */
class User extends Entity {
  #username;
  #password;
  #displayName;
  #bio;

  constructor(data) {
    const username = Validator.text(data.username, 'usuario', {
      pattern: /^[A-Za-z0-9_.-]{3,20}$/,
      message: 'El usuario debe tener 3 a 20 caracteres (letras, números, _ . -).'
    });
    super(data.id || 'usr-' + username.toLowerCase(), data.createdAt);
    if (typeof data.password !== 'string' || data.password.length < 6) {
      throw new ValidationError('La contraseña debe tener al menos 6 caracteres.', 'password');
    }
    this.#username = username;
    this.#password = data.password;
    this.#displayName = (data.displayName || '').trim() || username;
    this.#bio = (data.bio || '').trim();
  }

  get username() { return this.#username; }
  get displayName() { return this.#displayName; }
  get bio() { return this.#bio; }
  get initial() { return this.#username[0].toUpperCase(); }

  /** La contraseña nunca se expone: solo se puede comparar. */
  verifyPassword(candidate) { return this.#password === candidate; }

  hasUsername(name) { return this.#username.toLowerCase() === String(name || '').trim().toLowerCase(); }

  describe() { return 'Usuario ' + this.#username + ' (' + this.#displayName + ')'; }

  toJSON() {
    return { ...super.toJSON(), username: this.#username, password: this.#password, displayName: this.#displayName, bio: this.#bio };
  }

  static fromJSON(raw) { return new User(raw); }
}

/* ---------- ABSTRACCIÓN + HERENCIA: retos ---------- */
class Challenge extends Entity {
  #number; #company; #industry; #title; #summary; #reward; #tags; #deadline; #file; #starter;

  constructor(data) {
    super(data.id, data.createdAt);
    if (new.target === Challenge) throw new AbstractClassError('Challenge');
    this.#number = Validator.positiveNumber(data.number, 'número');
    this.#company = Validator.text(data.company, 'empresa');
    this.#industry = Validator.text(data.industry, 'industria');
    this.#title = Validator.text(data.title, 'título');
    this.#summary = Validator.text(data.summary, 'resumen');
    this.#reward = Validator.positiveNumber(data.reward, 'recompensa');
    this.#tags = Array.isArray(data.tags) ? [...data.tags] : [];
    this.#deadline = Validator.text(data.deadline, 'fecha límite', { pattern: /^\d{4}-\d{2}-\d{2}$/ });
    this.#file = Validator.text(data.file, 'archivo');
    this.#starter = String(data.starter || '');
  }

  get number() { return this.#number; }
  get company() { return this.#company; }
  get industry() { return this.#industry; }
  get title() { return this.#title; }
  get summary() { return this.#summary; }
  get reward() { return this.#reward; }
  get tags() { return [...this.#tags]; } // copia: el arreglo interno queda protegido
  get deadline() { return this.#deadline; }
  get file() { return this.#file; }
  get starter() { return this.#starter; }

  /* --- Miembros abstractos: las subclases DEBEN sobrescribirlos --- */
  get level() { throw new AbstractMethodError(this.constructor.name, 'level'); }
  get label() { throw new AbstractMethodError(this.constructor.name, 'label'); }
  get estimatedHours() { throw new AbstractMethodError(this.constructor.name, 'estimatedHours'); }

  /* --- Comportamiento compartido (herencia) --- */
  get badgeClass() { return 'lvl-' + this.level; }

  get daysLeft() {
    return Math.ceil((new Date(this.#deadline + 'T23:59:59') - new Date()) / 86400000);
  }

  get isOpen() { return this.daysLeft >= 0; }

  get deadlineLabel() {
    const d = this.daysLeft;
    if (d < 0) return { text: 'Cerrado', urgent: true };
    if (d === 0) return { text: 'Cierra hoy', urgent: true };
    return { text: 'Quedan ' + d + ' días', urgent: d <= 14 };
  }

  matches(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    return [this.#title, this.#company, this.#summary, this.#industry, this.#tags.join(' ')].join(' ').toLowerCase().includes(q);
  }

  describe() {
    return 'Reto #' + this.#number + ' [' + this.label + '] ' + this.#company + ' - ' + this.#title;
  }
}

/* ---------- POLIMORFISMO: cada nivel redefine su comportamiento ---------- */
class BasicChallenge extends Challenge {
  get level() { return 1; }
  get label() { return 'Básico'; }
  get estimatedHours() { return 1; }
}
class IntermediateChallenge extends Challenge {
  get level() { return 2; }
  get label() { return 'Intermedio'; }
  get estimatedHours() { return 4; }
}
class AdvancedChallenge extends Challenge {
  get level() { return 3; }
  get label() { return 'Avanzado'; }
  get estimatedHours() { return 10; }
}
class ExpertChallenge extends Challenge {
  get level() { return 4; }
  get label() { return 'Experto'; }
  get estimatedHours() { return 20; }
  describe() { return super.describe() + ' ★ requiere experiencia'; } // sobrescritura extendiendo al padre
}

/** Patrón Factory: decide qué subclase crear según la dificultad. */
class ChallengeFactory {
  static #types = { 1: BasicChallenge, 2: IntermediateChallenge, 3: AdvancedChallenge, 4: ExpertChallenge };

  static create(raw) {
    const Type = ChallengeFactory.#types[raw.difficulty];
    if (!Type) throw new ValidationError('Dificultad desconocida para el reto "' + raw.id + '": ' + raw.difficulty, 'difficulty');
    return new Type(raw);
  }
}

/* ---------- Solución (repositorio enviado por el usuario) ---------- */
class Solution extends Entity {
  static STATUS = Object.freeze({ REVIEW: 'en_revision', ACCEPTED: 'aceptada' });

  #challengeId; #username; #repoName; #fileName; #code; #description;
  #status; #commitMessage; #commitHash; #submittedAt;

  constructor(data) {
    super(data.id, data.createdAt);
    this.#challengeId = Validator.text(data.challengeId, 'reto');
    this.#username = Validator.text(data.username, 'usuario');
    this.#status = Validator.oneOf(data.status || Solution.STATUS.REVIEW, Object.values(Solution.STATUS), 'estado');
    this.#applyContent(data);
    this.#commitMessage = data.commitMessage || 'feat: entrega de solución';
    this.#commitHash = data.commitHash || Solution.#newHash();
    this.#submittedAt = data.submittedAt || Solution.#stamp();
  }

  /** Validación central del contenido (privada: nadie salta las reglas). */
  #applyContent({ repoName, fileName, code, description }) {
    const repo = Validator.text(repoName, 'repositorio', {
      pattern: /^[\w.-]+\/[\w.-]+$/,
      message: 'El repositorio debe tener el formato usuario/nombre (sin espacios).'
    });
    const file = Validator.text(fileName, 'archivo', { pattern: /\.js$/i, message: 'El archivo debe terminar en .js' });
    Validator.text(code, 'código', { min: 10, message: 'Escribe tu código antes de enviar.' });
    const desc = Validator.text(description, 'descripción', {
      max: 140,
      message: 'Agrega una descripción breve (máximo 140 caracteres).'
    });
    this.#repoName = repo;
    this.#fileName = file;
    this.#code = String(code);
    this.#description = desc;
  }

  static #newHash() { return Math.random().toString(16).slice(2, 9).padEnd(7, '0'); }

  static #stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /** Fábrica: crea una solución nueva para un reto y un usuario. */
  static create(user, challenge, content) {
    return new Solution({
      id: 'sol-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      challengeId: challenge.id,
      username: user.username,
      commitMessage: 'feat: entrega para el reto #' + challenge.number,
      ...content
    });
  }

  get challengeId() { return this.#challengeId; }
  get username() { return this.#username; }
  get repoName() { return this.#repoName; }
  get fileName() { return this.#fileName; }
  get code() { return this.#code; }
  get description() { return this.#description; }
  get status() { return this.#status; }
  get commitMessage() { return this.#commitMessage; }
  get commitHash() { return this.#commitHash; }
  get submittedAt() { return this.#submittedAt; }
  get isAccepted() { return this.#status === Solution.STATUS.ACCEPTED; }
  get lineCount() { return this.#code.replace(/\n$/, '').split('\n').length; }

  isOwnedBy(user) { return this.#username.toLowerCase() === user.username.toLowerCase(); }

  /** Edita la solución (nuevo commit). Lanza ValidationError si algo es inválido. */
  update(content) {
    this.#applyContent(content);
    this.#commitMessage = 'update: ajustes a la solución';
    this.#commitHash = Solution.#newHash();
    this.#submittedAt = Solution.#stamp();
    this.#status = Solution.STATUS.REVIEW;
  }

  accept() { this.#status = Solution.STATUS.ACCEPTED; }

  describe() { return 'Solución ' + this.#repoName + '/' + this.#fileName + ' (' + this.#status + ')'; }

  toJSON() {
    return {
      ...super.toJSON(),
      challengeId: this.#challengeId, username: this.#username, repoName: this.#repoName,
      fileName: this.#fileName, code: this.#code, description: this.#description, status: this.#status,
      commitMessage: this.#commitMessage, commitHash: this.#commitHash, submittedAt: this.#submittedAt
    };
  }

  static fromJSON(raw) { return new Solution(raw); }
}
