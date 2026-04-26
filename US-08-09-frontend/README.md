# US-08 & US-09 — Frontend

Interfaz web para consultar cupos disponibles (US-08) e intercambiar secciones (US-09).  
Se comunica con el backend Spring Boot mediante **fetch/AJAX**.

## Estructura

```
US-08-09-frontend/
├── index.html        ← Página principal con tabs US-08 / US-09
├── css/
│   └── styles.css    ← Estilos globales (tema oscuro, diseño moderno)
└── js/
    └── app.js        ← Lógica US08 y US09 (fetch al backend)
```

## Cómo ejecutar

Abre `index.html` directamente en el navegador, o sirve la carpeta con:

```bash
npx serve .
# o
python -m http.server 5500
```

> ⚠️ **El backend debe estar corriendo** en `http://localhost:8080` antes de usar el frontend.

## Funcionalidades

### Tab US-08 — Cupos Disponibles
- Ingresa el ID de una materia
- Consulta `GET /api/secciones/{materiaId}/disponibles`
- Muestra tabla con secciones disponibles y cupos restantes

### Tab US-09 — Intercambio de Secciones
- Ingresa ID de estudiante, materia deseada y materia ofrecida
- Llama `POST /api/intercambios/registrar`
- Muestra el resultado: **MATCHED** (intercambio confirmado) o **PENDIENTE** (en espera)
