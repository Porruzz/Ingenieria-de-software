import { Notificacion } from '../../domain/entities/notification';
import { notificacionesStore } from './notify-status-change';

// ============================================================
//  US-16 | Alertas sobre Cambios de Estado de Solicitudes
//  Capa: Aplicación  |  Caso de Uso: GetNotifications
// ============================================================

/**
 * US-16 — Caso de Uso: Consultar y gestionar notificaciones de un estudiante.
 *
 * Implementa la historia de usuario:
 *   "Como usuario, quiero recibir alertas sobre cambios en el estado
 *    de mis solicitudes para no tener que revisar la app constantemente."
 *
 * Permite al estudiante:
 *   - Ver todas sus notificaciones (leídas y no leídas).
 *   - Ver solo las no leídas (para el contador de la campana).
 *   - Marcar una notificación individual como leída.
 *   - Marcar todas sus notificaciones como leídas.
 */
export class GetNotifications {

  /**
   * Retorna todas las notificaciones de un estudiante,
   * ordenadas de más reciente a más antigua.
   *
   * @param estudianteId ID del estudiante
   * @returns Lista completa de notificaciones del estudiante
   */
  execute(estudianteId: string): Notificacion[] {
    return notificacionesStore
      .filter(n => n.estudianteId === estudianteId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  /**
   * Retorna solo las notificaciones NO leídas de un estudiante.
   * Útil para mostrar el contador de alertas en la campana de la UI.
   *
   * @param estudianteId ID del estudiante
   * @returns Lista de notificaciones con estado 'NO_LEIDA'
   */
  getUnread(estudianteId: string): Notificacion[] {
    return notificacionesStore.filter(
      n => n.estudianteId === estudianteId && n.estado === 'NO_LEIDA'
    );
  }

  /**
   * Marca una notificación específica como leída.
   *
   * @param notificacionId ID de la notificación a marcar
   * @returns true si se encontró y actualizó; false si no existe
   */
  markAsRead(notificacionId: string): boolean {
    const notificacion = notificacionesStore.find(n => n.id === notificacionId);
    if (!notificacion) return false;

    notificacion.estado = 'LEIDA';
    console.log(`[US-16] Notificación ${notificacionId} marcada como leída.`);
    return true;
  }

  /**
   * Marca TODAS las notificaciones de un estudiante como leídas.
   * Acción típica del botón "Marcar todas como leídas".
   *
   * @param estudianteId ID del estudiante
   * @returns Cantidad de notificaciones actualizadas
   */
  markAllAsRead(estudianteId: string): number {
    const sinLeer = notificacionesStore.filter(
      n => n.estudianteId === estudianteId && n.estado === 'NO_LEIDA'
    );

    sinLeer.forEach(n => { n.estado = 'LEIDA'; });

    console.log(
      `[US-16] ${sinLeer.length} notificaciones marcadas como leídas para estudiante ${estudianteId}.`
    );

    return sinLeer.length;
  }
}
