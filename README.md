# 🚀 Enrollment Optimizer - Sistema de Optimización de Matrícula

Bienvenido al núcleo computacional de **OptimaAcademia**. Este sistema ha sido diseñado bajo estándares de ingeniería de software de alta disponibilidad y seguridad, utilizando una **Arquitectura Limpia (Clean Architecture)** para garantizar la escalabilidad y el desacoplamiento de componentes.

## 🏗️ Arquitectura Técnica

El sistema se divide en cuatro capas fundamentales:
1. **Domain (Core):** Contiene las reglas de negocio, entidades (Schedules, Swaps, AcademicState) e interfaces de puertos.
2. **Application (Use Cases):** Implementa la lógica de las Historias de Usuario (Sync, Generación de Horarios, Formalización de Swaps).
3. **Infrastructure:** Adaptadores para sistemas externos (SIA, Redis, PostgreSQL) y servicios de seguridad.
4. **Interfaces:** Controladores REST para la comunicación con el Frontend.

### 🛠️ Tech Stack
- **Runtime:** Node.js + TypeScript.
- **API:** Express.js con Middleware de Seguridad (Helmet, CORS).
- **Persistencia:** PostgreSQL con soporte para cifrado en reposo.
- **Caché & Resiliencia:** Redis (con Modo Degradado automático para alta disponibilidad).
- **Seguridad:** Cifrado de datos sensibles mediante **AES-256-GCM**.

---

## 🔬 Funcionamiento de las Historias de Usuario (US)

### [US-02] Sincronización de Estado Académico
- **Mecánica:** Se implementó un `SiaAdapter` que simula la conexión con el portal universitario mediante un token temporal.
- **Seguridad:** La historia académica del estudiante se guarda cifrada. El sistema nunca almacena datos en texto plano.

### [US-05] Arquitecto de Horarios IA
- **Motor de Optimización:** Algoritmo de evaluación de combinaciones basado en restricciones:
    - Validación de **Prerrequisitos** (Bloqueo automático de materias no aptas).
    - Optimización de **Zonas de Tiempo** (Evita huecos y desplazamientos innecesarios).
- **Output:** Devuelve 5 propuestas puntuadas (`score`) con un desglose técnico (`scoreBreakdown`) de por qué es la mejor opción.

### [US-10] Mercado de Swaps (Confirmación Bilateral)
- **Protocolo:** No se permiten intercambios automáticos. Se requiere una **Confirmación Bilateral** (Estado `PENDIENTE_CONFIRMACION` -> `APROBADO`).
- **Validación:** El sistema verifica que el estudiante A realmente tenga lo que el estudiante B necesita y viceversa antes de permitir el match.

### [US-11] Registro Oficial y Sello Digital
- **Formalización:** Una vez aprobado el match, el sistema se conecta con el "Nodo Universitario" (`MockEnrollmentSystem`).
- **Sello de Seguridad:** Se genera un **Hash Criptográfico único** (ID de Transacción) que sirve como certificado legal del intercambio.
- **Inmutabilidad:** Una vez formalizado, el intercambio queda bloqueado para evitar duplicados ("Double Spending" protection).

---

## 🚀 Instrucciones para Ejecución (DEMO PARA EL PROFESOR)

### Requisitos Previos
- **Node.js** v18+ instalado
- **npm** instalado

### Paso 1: Clonar ambos repositorios
```bash
# Backend
git clone <URL_BACKEND> enrollment-optimizer

# Frontend
git clone <URL_FRONTEND> Frontend-Ing-Software
```

### Paso 2: Configurar el Backend
```bash
cd enrollment-optimizer
npm install
```

Crear el archivo `.env` en la raíz del backend (copiar de `.env.example`):
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=enrollment_db
MASTER_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
JWT_SECRET=optima-academia-2026-demo
GEMINI_API_KEY=<pedir_al_equipo>
GEMINI_MODEL=gemini-2.0-flash
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=10
```

> ⚠️ **IMPORTANTE:** La `GEMINI_API_KEY` NO se sube al repo. Pedirla a Santiago Parra.

### Paso 3: Levantar el Backend
```bash
cd enrollment-optimizer
npm run dev
```
Deberías ver:
```
[Server] Corriendo en puerto 3000
[Seed] ✅ Demo lista. Credenciales:
   📧 santiago.parra@usa.edu.co / demo123
   📧 roberto.martinez@usa.edu.co / demo123
   📧 elena.garcia@usa.edu.co / demo123
```

### Paso 4: Levantar el Frontend (en otra terminal)
```bash
cd Frontend-Ing-Software
npm install
npm run dev
```
Abre: **http://localhost:5173**

### Paso 5: Login
1. Clic en **"Empezar"** en la landing page
2. Usa una de las cuentas de demo:

| Usuario | Email | Contraseña |
|---------|-------|------------|
| 🟣 Santiago Parra | `santiago.parra@usa.edu.co` | `demo123` |
| 🟢 Roberto Martínez | `roberto.martinez@usa.edu.co` | `demo123` |
| 🟠 Elena García | `elena.garcia@usa.edu.co` | `demo123` |

> También puedes hacer clic en **"Cuentas de Demo"** en la página de login para acceso rápido.

---

## 📋 Historias de Usuario Implementadas

| US | Nombre | Descripción |
|----|--------|-------------|
| US-01 | Zonas Prohibidas | Configurar horarios bloqueados (trabajo, gym, etc.) |
| US-02 | Sync Académico | Sincronización por imagen (Gemini Vision AI) o API |
| US-03 | Logística | Tiempos de traslado y buffers de seguridad |
| US-04 | Cifrado AES-256 | Datos sensibles cifrados en reposo |
| US-05 | Arquitecto IA | Motor de generación de horarios óptimos |
| US-06 | Prerrequisitos | Validación automática de cadenas de materias |
| US-07 | Priorización | Índice de criticidad académica |
| US-08 | Secciones | Consulta de secciones disponibles |
| US-09 | Intercambios | Solicitud de intercambio de secciones |
| US-10 | Confirmación | Protocolo bilateral de confirmación de swaps |
| US-11 | Formalización | Sello digital y registro oficial en SIA |
| US-12 | Marketplace | Mercado de ofertas de intercambio |
| US-17 | Chatbot 24/7 | Asistente virtual con Gemini AI (OptiBot) |
| US-18 | Estabilidad | Rate limiting, circuit breaker, health monitoring |

---

## 🔐 Seguridad

- **Autenticación:** JWT con expiración de 24h
- **Contraseñas:** Hasheadas con bcrypt (10 rounds)
- **Datos:** Cifrado AES-256-GCM para datos sensibles
- **API Keys:** Almacenadas solo en `.env` local (nunca en el repo)
- **Rate Limiting:** 60 req/min por estudiante con protección anti-abuso
- **Circuit Breaker:** Protección contra fallos en cascada de servicios externos

---

## 🛠️ Tech Stack
- **Runtime:** Node.js + TypeScript
- **API:** Express.js con Helmet y CORS
- **IA:** Google Gemini AI (chatbot + visión)
- **Auth:** JWT + bcrypt
- **Persistencia:** PostgreSQL + Redis (con modo degradado)
- **Seguridad:** AES-256-GCM, Rate Limiter, Circuit Breaker
- **Frontend:** React + Vite + TailwindCSS
- **Arquitectura:** Clean Architecture (Hexagonal)

---

**Desarrollado con ❤️ por el Equipo OptimaAcademia**
*Ingeniería de Software - Universidad Sergio Arboleda - 2026*
