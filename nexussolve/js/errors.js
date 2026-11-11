/* ==========================================================
   errors.js - Jerarquía de EXCEPCIONES personalizadas
   (HERENCIA: todas extienden NexusError, que extiende Error).
   Se lanzan con "throw" en modelos y servicios y se atrapan con
   "try/catch" en la capa de la aplicación (app.js).
   ========================================================== */

/** Excepción base de la aplicación. */
class NexusError extends Error {
  constructor(message, code = 'NEXUS_ERROR') {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

/** Datos inválidos (formato, longitud, campos vacíos...). */
class ValidationError extends NexusError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR');
    this.field = field;
  }
}

/** Credenciales incorrectas. */
class AuthenticationError extends NexusError {
  constructor(message = 'Usuario o contraseña incorrectos.') {
    super(message, 'AUTH_ERROR');
  }
}

/** El usuario no puede modificar un recurso ajeno. */
class PermissionError extends NexusError {
  constructor(message = 'No tienes permiso para realizar esta acción.') {
    super(message, 'PERMISSION_ERROR');
  }
}

/** Intento de crear algo que ya existe (usuario o solución repetida). */
class DuplicateEntityError extends NexusError {
  constructor(message) {
    super(message, 'DUPLICATE_ERROR');
  }
}

/** Entidad inexistente. */
class NotFoundError extends NexusError {
  constructor(message) {
    super(message, 'NOT_FOUND');
  }
}

/** Fallo leyendo o escribiendo en el almacenamiento del navegador. */
class StorageError extends NexusError {
  constructor(message, cause = null) {
    super(message, 'STORAGE_ERROR');
    this.cause = cause;
  }
}

/** Error al ejecutar código del usuario (sintaxis, excepción, timeout). */
class ExecutionError extends NexusError {
  constructor(message, logs = []) {
    super(message, 'EXECUTION_ERROR');
    this.logs = logs;
  }
}

/** Se intentó instanciar una clase abstracta. */
class AbstractClassError extends NexusError {
  constructor(className) {
    super('"' + className + '" es una clase abstracta y no puede instanciarse directamente.', 'ABSTRACT_CLASS');
  }
}

/** Una subclase no implementó un método abstracto. */
class AbstractMethodError extends NexusError {
  constructor(className, member) {
    super('"' + className + '" debe implementar "' + member + '".', 'ABSTRACT_METHOD');
  }
}
