import { Intercambio, EstadoIntercambio } from '../../domain/entities/intercambio';
import { NotifyStatusChange } from './notify-status-change';

// ============================================================
//  US-09 | Matching de Intercambios de Secciones
//  Capa: Aplicación  |  Caso de Uso: RegisterExchange
// ============================================================

/**
 * US-09 — Almacén en memoria de solicitudes de intercambio.
 * En producción, esto sería reemplazado por una BD o repositorio real.
 */
const intercambiosStore: Intercambio[] = [];

/** Contador interno para generar IDs únicos */
let contadorId = 1;

/**
 * US-09 — Caso de Uso: Registrar un intercambio y ejecutar matching automático.
 *
 * Implementa la historia de usuario:
 *   "Como estudiante, quiero intercambiar mi sección por otra disponible
 *    cuando encuentre a alguien que desee la mía."
 *
 * Algoritmo de matching:
 *   Busca en los intercambios PENDIENTES uno donde:
 *     - El estudianteId sea diferente al solicitante.
 *     - El otro estudiante DESEA lo que el actual OFRECE.
 *     - El otro estudiante OFRECE lo que el actual DESEA.
 *   Si lo encuentra → ambos pasan a MATCHED.
 *   Si no → el nuevo queda en PENDIENTE.
 *
 * ─── Integración con US-16 ───────────────────────────────────────────────
 * Cuando se produce un match, este caso de uso llama automáticamente a
 * NotifyStatusChange para alertar a AMBOS estudiantes del cambio.
 */
export class RegisterExchange {

  /** Servicio de notificaciones (US-16) inyectado en el constructor */
  private readonly notifyStatusChange: NotifyStatusChange;

  constructor() {
    this.notifyStatusChange = new NotifyStatusChange();
  }

  /**
   * Registra una solicitud de intercambio y ejecuta el algoritmo de matching.
   *
   * @param estudianteId      ID del estudiante que solicita el intercambio
   * @param materiaDeseadaId  ID de la sección/materia que desea obtener
   * @param materiaOfrecidaId ID de la sección/materia que ofrece a cambio
   * @returns El intercambio creado con estado PENDIENTE o MATCHED
   */
  execute(
    estudianteId: string,
    materiaDeseadaId: string,
    materiaOfrecidaId: string
  ): Intercambio {
    // Crear la nueva solicitud en estado PENDIENTE
    const nuevoIntercambio: Intercambio = {
      id: `INT-${contadorId++}`,
      estudianteId,
      materiaDeseadaId,
      materiaOfrecidaId,
      estado: 'PENDIENTE' as EstadoIntercambio,
      fechaRegistro: new Date(),
    };

    // Guardar en el almacén
    intercambiosStore.push(nuevoIntercambio);

    console.log(
      `[US-09] Intercambio registrado: Estudiante ${estudianteId} ` +
      `ofrece ${materiaOfrecidaId} y desea ${materiaDeseadaId}. Estado: PENDIENTE`
    );

    // ── Algoritmo de Matching ─────────────────────────────────────────────
    // Busca un intercambio cruzado: alguien que quiera lo que yo ofrezco
    // y que ofrezca lo que yo quiero, y que no sea yo mismo.
    const match = intercambiosStore.find(intercambio =>
      intercambio.estado === 'PENDIENTE' &&
      intercambio.estudianteId !== estudianteId &&
      intercambio.materiaDeseadaId === materiaOfrecidaId &&
      intercambio.materiaOfrecidaId === materiaDeseadaId
    );

    if (match) {
      // ── Match encontrado: actualizar ambos a MATCHED ───────────────────
      nuevoIntercambio.estado = 'MATCHED';
      match.estado = 'MATCHED';

      console.log(
        `[US-09] ¡Match encontrado! Intercambio ${nuevoIntercambio.id} ` +
        `<-> ${match.id} → ambos en estado MATCHED.`
      );

      // ── US-16: Notificar a AMBOS estudiantes del match ─────────────────
      this.notifyStatusChange.execute(
        estudianteId,
        `✅ ¡Tu solicitud de intercambio fue aprobada! ` +
        `Obtendrás la sección ${materiaDeseadaId} a cambio de ${materiaOfrecidaId}.`,
        'INTERCAMBIO'
      );

      this.notifyStatusChange.execute(
        match.estudianteId,
        `✅ ¡Tu solicitud de intercambio fue aprobada! ` +
        `Obtendrás la sección ${match.materiaDeseadaId} a cambio de ${match.materiaOfrecidaId}.`,
        'INTERCAMBIO'
      );
    }

    return nuevoIntercambio;
  }

  /**
   * Retorna todos los intercambios registrados en el sistema.
   * Útil para vistas de administración o historial.
   *
   * @returns Lista completa de intercambios
   */
  getAll(): Intercambio[] {
    return [...intercambiosStore];
  }

  /**
   * Retorna los intercambios de un estudiante específico.
   *
   * @param estudianteId ID del estudiante
   * @returns Lista de intercambios del estudiante
   */
  getByEstudiante(estudianteId: string): Intercambio[] {
    return intercambiosStore.filter(i => i.estudianteId === estudianteId);
  }
}
