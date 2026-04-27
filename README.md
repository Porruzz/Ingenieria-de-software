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

## 🚀 Instrucciones para Ejecución

1. **Instalar dependencias:** `npm install`
2. **Configurar entorno:** Crear `.env` (Ver `.env.example`)
3. **Lanzar servidor:** `npm run dev`
4. **Endpoint Base:** `http://localhost:3000/api`

---

**Desarrollado con ❤️ por Santiago Parra Acuña**
*Ingeniería de Software - Universidad Sergio Arboleda*
