import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import notificationsRouter from './infrastructure/routes/notifications.routes';
import suggestionsRouter  from './infrastructure/routes/suggestions.routes';

// ============================================================
//  Servidor Express — OptimaAcademia Backend
//  US-13: Sugerencias de cursos y eventos
//  US-16: Alertas de cambios de estado
// ============================================================

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ── Middleware ─────────────────────────────────────────────────────────────────

/** Permite solicitudes desde el frontend React (puerto 5173 en dev) */
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/** Cabeceras de seguridad HTTP */
app.use(helmet());

/** Parseo de JSON en el body */
app.use(express.json());

// ── Rutas ──────────────────────────────────────────────────────────────────────

/** Health check — verifica que el servidor está activo */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/** US-16: Notificaciones de cambios de estado */
app.use('/api/notificaciones', notificationsRouter);

/** US-13: Sugerencias de cursos y eventos culturales */
app.use('/api/sugerencias', suggestionsRouter);

// ── Manejo de rutas no encontradas ────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada.' });
});

// ── Inicio del servidor ───────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('  🎓 OptimaAcademia Backend corriendo');
  console.log(`  ➜  http://localhost:${PORT}/api/health`);
  console.log(`  ➜  US-16: http://localhost:${PORT}/api/notificaciones/EST-001`);
  console.log(`  ➜  US-13: http://localhost:${PORT}/api/sugerencias`);
  console.log('');
});

export default app;
