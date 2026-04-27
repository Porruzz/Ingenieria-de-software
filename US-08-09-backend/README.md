# US-08 & US-09 — Backend (Spring Boot)

Backend REST API para la gestión académica de secciones e intercambios.

## User Stories implementadas

| US | Descripción | Endpoint |
|----|-------------|----------|
| **US-08** | Consulta de secciones con cupos disponibles | `GET /api/secciones/{materiaId}/disponibles` |
| **US-09** | Matching automático de intercambios de secciones | `POST /api/intercambios/registrar` |

## Arquitectura MVC

```
src/main/java/com/academico/
├── AcademicoApplication.java     ← Punto de entrada Spring Boot
├── WebConfig.java                ← Configuración CORS
├── model/
│   ├── Seccion.java              ← US-08: Entity JPA
│   └── Intercambio.java          ← US-09: Entity JPA
├── repository/
│   ├── SeccionRepository.java    ← US-08: Método derivado (filtro cupos > 0)
│   └── IntercambioRepository.java← US-09: @Query JPQL (match cruzado)
├── service/
│   ├── SeccionService.java       ← US-08: Lógica de consulta
│   └── IntercambioService.java   ← US-09: Algoritmo de matching @Transactional
└── controller/
    ├── SeccionController.java    ← US-08: REST Controller
    └── IntercambioController.java← US-09: REST Controller
```

## Requisitos

- Java 21+
- Maven 3.9+

## Cómo ejecutar

```bash
mvn spring-boot:run
```

La API estará disponible en `http://localhost:8080`.

## Endpoints

### US-08 — Cupos Disponibles

```http
GET /api/secciones/{materiaId}/disponibles
```

**Respuesta 200 OK:**
```json
[
  { "id": 5, "nombre": "Sección B", "materiaId": 3, "cuposDisponibles": 12 }
]
```

### US-09 — Matching de Intercambios

```http
POST /api/intercambios/registrar
Content-Type: application/json

{
  "estudianteId": 1,
  "materiaDeseadaId": 5,
  "materiaOfrecidaId": 3
}
```

**Respuesta 201 Created:**
```json
{
  "id": 4,
  "estudianteId": 1,
  "materiaDeseadaId": 5,
  "materiaOfrecidaId": 3,
  "estado": "MATCHED"
}
```

## Consola H2

Disponible en: `http://localhost:8080/h2-console`  
JDBC URL: `jdbc:h2:mem:academicodb`  
Usuario: `sa` / Contraseña: (vacía)

## Lógica de Matching (US-09)

```
Estudiante A: ofrece materia 3, desea materia 5  → PENDIENTE
Estudiante B: ofrece materia 5, desea materia 3  → MATCHED ✅
```

Cuando B registra su intercambio, el sistema detecta que es el inverso exacto del de A y actualiza **ambos** a `MATCHED` en una sola transacción atómica.
