# NexusSolve

Plataforma de retos empresariales con repositorios de código, hecha en **JavaScript puro** (sin frameworks ni instalación).
Abre `index.html` con doble clic.

## Estructura (orden de carga)

| Archivo | Contenido |
|---|---|
| `js/errors.js` | Jerarquía de excepciones personalizadas |
| `js/data.js` | Datos semilla (usuario demo, 13 retos, soluciones iniciales) |
| `js/models.js` | `Validator`, `Entity`, `User`, `Challenge` y subclases, `ChallengeFactory`, `Solution` |
| `js/storage.js` | `DataStore`, `LocalStorageStore`, `MemoryStore`, `Repository` y repositorios concretos |
| `js/services.js` | `ChallengeCatalog`, `AuthService`, `SolutionService` |
| `js/utils.js` | `Utils`, `Highlighter`, `Notifier`, `CodeExecutor`, `WorkerExecutor` |
| `js/views.js` | `ViewRenderer` (HTML de cada pantalla) |
| `js/app.js` | Clase `App` (controlador) y arranque |

## Pilares de la POO

- **Encapsulamiento:** campos privados `#` en `User` (la contraseña no es legible, solo `verifyPassword()`), `Challenge`, `Solution`, servicios y `App`. `Challenge.tags` devuelve una copia.
- **Abstracción:** clases abstractas `Entity`, `Challenge`, `DataStore`, `Repository` y `CodeExecutor`; al instanciarlas lanzan `AbstractClassError`, y los métodos sin implementar lanzan `AbstractMethodError`.
- **Herencia:** `User`, `Challenge` y `Solution` extienden `Entity`; `Basic/Intermediate/Advanced/ExpertChallenge` extienden `Challenge`; `LocalStorageStore`/`MemoryStore` extienden `DataStore`; `UserRepository`/`SolutionRepository` extienden `Repository`; `WorkerExecutor` extiende `CodeExecutor`.
- **Polimorfismo:** cada subclase de `Challenge` sobrescribe `level`, `label` y `estimatedHours` (y `ExpertChallenge` también `describe()`); el resto del código usa `DataStore`, `Repository` y `CodeExecutor` sin saber la clase concreta.

## Excepciones

Jerarquía: `NexusError` → `ValidationError`, `AuthenticationError`, `PermissionError`, `DuplicateEntityError`, `NotFoundError`, `StorageError`, `ExecutionError`, `AbstractClassError`, `AbstractMethodError`.

- Se **lanzan** (`throw`) en modelos y servicios (por ejemplo, `Solution` valida repositorio, archivo `.js`, código y descripción; `AuthService` valida credenciales y duplicados).
- Se **atrapan** (`try/catch`) en `App`: los formularios muestran el mensaje junto al campo, `#dispatch` protege cada acción y `#report()` elige cómo mostrar cada tipo de error. Los errores del código que escribe el usuario llegan como `ExecutionError` y se muestran en la terminal.
