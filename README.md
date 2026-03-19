# 🎓 Enrollment Optimizer - Arquitectura de Software

Proyecto para la clase de Ingeniería de Software para resolver conflictos de horario en matrículas académicas.

## 🚀 Reglas del Equipo (Manifiesto)

### 1. Stack Tecnológico
- **Lenguaje:** TypeScript
- **Entorno:** Node.js
- **Base de Datos:** PostgreSQL
- **Arquitectura:** Hexagonal / Clean Architecture

### 2. Estándares de Código
- **SOLID:** Aplicar los 5 principios en cada clase.
- **Clean Code:** Funciones pequeñas (máx 20 líneas) y nombres descriptivos.
- **Idioma:** Código y comentarios en español (para ser consistentes).

### 3. Flujo de Trabajo (Git + Jira)
- **Ramas:** `feature/US-[ID]-[descripción]` (Ej: `feature/US-02-sync-academico`).
- **PRs:** Todo código debe ser revisado por al menos un compañero antes de ir a `main`.
- **Commits:** Deben empezar con el ID de la historia: `[US-02] descripción del cambio`.

### 4. Estructura del Proyecto
- `src/domain`: Reglas de negocio puras.
- `src/application`: Lógica de las historias de usuario.
- `src/infrastructure`: Conexiones externas (APIs, DB).
- `src/interface`: Controladores y entrada de datos.

---
**"Sincronizamos la vida real con el éxito académico."**
