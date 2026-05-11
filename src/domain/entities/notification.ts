// ============================================================
//  US-16 | Alertas sobre Cambios de Estado de Solicitudes
//  Capa: Dominio  |  Entidad: Notificacion
// ============================================================

/**
 * US-16 — Tipos de notificación que el sistema puede generar.
 *
 * - INTERCAMBIO: Alerta relacionada con un cambio de estado en un intercambio (US-09).
 * - SISTEMA:     Mensaje general del sistema (avisos, mantenimiento, etc.).
 */
export type TipoNotificacion = 'INTERCAMBIO' | 'SISTEMA';

/**
 * US-16 — Estado de lectura de una notificación.
 *
 * - NO_LEIDA: El estudiante aún no ha visto esta alerta.
 * - LEIDA:    El estudiante ya revisó la notificación.
 */
export type EstadoNotificacion = 'NO_LEIDA' | 'LEIDA';

/**
 * US-16 — Representa una alerta enviada a un estudiante
 * cuando el estado de alguna de sus solicitudes cambia.
 *
 * Las notificaciones de tipo INTERCAMBIO son disparadas automáticamente
 * por el caso de uso RegisterExchange (US-09) cuando se produce un match.
 */
export interface Notificacion {
  /** Identificador único de la notificación */
  id: string;

  /** ID del estudiante destinatario de la alerta */
  estudianteId: string;

  /** Mensaje descriptivo del cambio ocurrido */
  mensaje: string;

  /** Tipo de notificación: INTERCAMBIO o SISTEMA */
  tipo: TipoNotificacion;

  /** Estado de lectura: NO_LEIDA o LEIDA */
  estado: EstadoNotificacion;

  /** Fecha y hora en que se generó la notificación */
  fecha: Date;
}
