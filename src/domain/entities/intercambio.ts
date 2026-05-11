// ============================================================
//  US-09 | Matching de Intercambios de Secciones
//  Capa: Dominio  |  Entidad: Intercambio
// ============================================================

/**
 * US-09 — Estados posibles de una solicitud de intercambio.
 *
 * - PENDIENTE: No se encontró match todavía.
 * - MATCHED:   Se encontró un intercambio cruzado exitoso.
 */
export type EstadoIntercambio = 'PENDIENTE' | 'MATCHED';

/**
 * US-09 — Representa una solicitud de intercambio de sección
 * entre dos estudiantes.
 *
 * El algoritmo de matching busca dos solicitudes cruzadas:
 *   Estudiante A desea lo que B ofrece, y B desea lo que A ofrece.
 */
export interface Intercambio {
  /** Identificador único del intercambio */
  id: string;

  /** ID del estudiante que solicita el intercambio */
  estudianteId: string;

  /** ID de la sección/materia que el estudiante DESEA obtener */
  materiaDeseadaId: string;

  /** ID de la sección/materia que el estudiante OFRECE a cambio */
  materiaOfrecidaId: string;

  /** Estado actual del intercambio */
  estado: EstadoIntercambio;

  /** Fecha en que se registró la solicitud */
  fechaRegistro: Date;
}
