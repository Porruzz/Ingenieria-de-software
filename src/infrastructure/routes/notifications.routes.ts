import { Router, Request, Response } from 'express';
import { GetNotifications } from '../../application/use-cases/get-notifications';
import { NotifyStatusChange } from '../../application/use-cases/notify-status-change';

// ============================================================
//  US-16 | Rutas HTTP — Notificaciones
// ============================================================

const router = Router();
const getNotifications   = new GetNotifications();
const notifyStatusChange = new NotifyStatusChange();

// ── Seed de notificaciones de ejemplo para pruebas ────────────────────────────
// En producción esto vendría de la BD. Se ejecuta una sola vez al arrancar.
const seeder = new NotifyStatusChange();
seeder.execute('EST-001', 'Tu intercambio de Cálculo III fue APROBADO.', 'INTERCAMBIO');
seeder.execute('EST-001', 'Tu intercambio de Física I fue RECHAZADO. La sección ya no tiene cupo.', 'INTERCAMBIO');
seeder.execute('EST-001', 'Tu solicitud de Álgebra Lineal está EN REVISIÓN por el coordinador.', 'INTERCAMBIO');
seeder.execute('EST-001', 'Faltan 2 días para el cierre del periodo de intercambios.', 'SISTEMA');

/**
 * GET /api/notificaciones/:estudianteId
 * Retorna todas las notificaciones de un estudiante (leídas y no leídas).
 */
router.get('/:estudianteId', (req: Request, res: Response) => {
  const { estudianteId } = req.params;
  const notificaciones = getNotifications.execute(estudianteId);
  res.json({ ok: true, data: notificaciones });
});

/**
 * GET /api/notificaciones/:estudianteId/no-leidas
 * Retorna solo las notificaciones NO leídas. Útil para el badge de la campana.
 */
router.get('/:estudianteId/no-leidas', (req: Request, res: Response) => {
  const { estudianteId } = req.params;
  const noLeidas = getNotifications.getUnread(estudianteId);
  res.json({ ok: true, count: noLeidas.length, data: noLeidas });
});

/**
 * PATCH /api/notificaciones/:id/leer
 * Marca una notificación específica como leída.
 */
router.patch('/:id/leer', (req: Request, res: Response) => {
  const { id } = req.params;
  const actualizada = getNotifications.markAsRead(id);
  if (!actualizada) {
    res.status(404).json({ ok: false, message: `Notificación ${id} no encontrada.` });
    return;
  }
  res.json({ ok: true, message: `Notificación ${id} marcada como leída.` });
});

/**
 * PATCH /api/notificaciones/:estudianteId/leer-todas
 * Marca TODAS las notificaciones de un estudiante como leídas.
 */
router.patch('/:estudianteId/leer-todas', (req: Request, res: Response) => {
  const { estudianteId } = req.params;
  const cantidad = getNotifications.markAllAsRead(estudianteId);
  res.json({ ok: true, message: `${cantidad} notificaciones marcadas como leídas.`, cantidad });
});

/**
 * POST /api/notificaciones
 * Crea una nueva notificación (para pruebas o uso interno).
 * Body: { estudianteId, mensaje, tipo }
 */
router.post('/', (req: Request, res: Response) => {
  const { estudianteId, mensaje, tipo } = req.body;
  if (!estudianteId || !mensaje) {
    res.status(400).json({ ok: false, message: 'estudianteId y mensaje son requeridos.' });
    return;
  }
  const nueva = notifyStatusChange.execute(estudianteId, mensaje, tipo ?? 'SISTEMA');
  res.status(201).json({ ok: true, data: nueva });
});

/**
 * DELETE /api/notificaciones/:estudianteId/borrar-todas
 * Elimina TODAS las notificaciones de un estudiante.
 */
router.delete('/:estudianteId/borrar-todas', (req: Request, res: Response) => {
  const { estudianteId } = req.params;
  const cantidad = getNotifications.deleteAll(estudianteId);
  res.json({ ok: true, message: `${cantidad} notificaciones eliminadas.`, cantidad });
});

export default router;
