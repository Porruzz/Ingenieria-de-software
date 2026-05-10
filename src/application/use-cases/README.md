# application/use-cases

Aquí vive la **lógica de negocio** — cada clase implementa exactamente una historia de usuario. Se comunican con las entidades del dominio y entre sí cuando es necesario.

| Archivo                        | Historia de Usuario | Qué hace                                                                 |
|-------------------------------|---------------------|--------------------------------------------------------------------------|
| `sync-academic-history.ts`    | US-02               | Sincroniza el historial académico del estudiante con el portal           |
| `generate-schedule.ts`        | US-05               | Genera el horario óptimo respetando restricciones del estudiante         |
| `get-available-sections.ts`   | US-08               | Busca secciones de una materia que aún tienen cupos libres               |
| `register-exchange.ts`        | US-09 → US-16       | Registra un intercambio y ejecuta el matching; al encontrar match notifica automáticamente a ambos estudiantes |
| `get-suggestions.ts`          | US-13               | Sugiere cursos cortos y eventos culturales según los tiempos libres del estudiante |
| `notify-status-change.ts`     | US-16               | Crea una notificación cuando el estado de una solicitud cambia           |
| `get-notifications.ts`        | US-16               | Lista notificaciones del estudiante y permite marcarlas como leídas      |
