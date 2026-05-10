# domain/entities

Aquí viven las **entidades del dominio** — son las interfaces y tipos que describen los objetos del negocio. No contienen lógica, solo la estructura de los datos.

| Archivo             | Historia de Usuario | Qué representa                                      |
|---------------------|---------------------|-----------------------------------------------------|
| `course.ts`         | US-05               | Curso académico y sus secciones de horario          |
| `student.ts`        | US-01 / US-03       | Estudiante, historial académico y zonas restringidas|
| `seccion.ts`        | US-08               | Sección de una materia y sus cupos disponibles      |
| `intercambio.ts`    | US-09               | Solicitud de intercambio de sección entre estudiantes|
| `notification.ts`   | US-16               | Alerta de cambio de estado enviada al estudiante    |
| `suggestion.ts`     | US-13               | Sugerencia de curso corto o evento cultural         |
