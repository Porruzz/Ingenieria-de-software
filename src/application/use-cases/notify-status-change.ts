import { Notificacion, TipoNotificacion, EstadoNotificacion } from '../../domain/entities/notification';

// ============================================================
//  US-16 | Alertas sobre Cambios de Estado de Solicitudes
//  Capa: Aplicación  |  Caso de Uso: NotifyStatusChange
// ============================================================

/**
 * US-16 — Almacén en memoria de notificaciones.
 *
 * Compartido entre NotifyStatusChange y GetNotifications
 * para que ambos casos de uso accedan a los mismos datos.
 * En producción, esto sería reemplazado por una BD o servicio externo.
 */
export const notificacionesStore: Notificacion[] = [];

/** Contador interno para generar IDs únicos */
let contadorId = 1;

/**
 * US-16 — Caso de Uso: Crear una notificación de cambio de estado.
 *
 * Implementa la historia de usuario:
 *   "Como usuario, quiero recibir alertas sobre cambios en el estado
 *    de mis solicitudes para no tener que revisar la app constantemente."
 *
 * Este caso de uso es invocado automáticamente por RegisterExchange (US-09)
 * cuando un intercambio pasa a estado MATCHED.
 */
export class NotifyStatusChange {

  /**
   * Crea y almacena una nueva notificación para un estudiante.
   *
   * @param estudianteId  ID del estudiante que recibirá la alerta
   * @param mensaje       Texto descriptivo del cambio ocurrido
   * @param tipo          Tipo de notificación: 'INTERCAMBIO' | 'SISTEMA'
   * @returns             La notificación creada con estado NO_LEIDA
   */
  execute(
    estudianteId: string,
    mensaje: string,
    tipo: TipoNotificacion = 'INTERCAMBIO'
  ): Notificacion {
    const nuevaNotificacion: Notificacion = {
      id: `NOTIF-${contadorId++}`,
      estudianteId,
      mensaje,
      tipo,
      estado: 'NO_LEIDA' as EstadoNotificacion,
      fecha: new Date(),
    };

    notificacionesStore.push(nuevaNotificacion);

    console.log(
      `[US-16] Notificación creada para estudiante ${estudianteId}: "${mensaje}"`
    );

    return nuevaNotificacion;
  }
}
