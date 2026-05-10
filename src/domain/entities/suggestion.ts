// ============================================================
//  US-13 | Sugerencias de Cursos Cortos y Eventos Culturales
//  Capa: Dominio  |  Entidad: Sugerencia
// ============================================================

/**
 * US-13 — Tipos de sugerencia que el sistema puede ofrecer.
 *
 * - CURSO_CORTO:      Curso académico de corta duración (talleres, certificaciones, etc.)
 * - EVENTO_CULTURAL:  Evento cultural dentro del campus (conciertos, exposiciones, charlas, etc.)
 */
export type TipoSugerencia = 'CURSO_CORTO' | 'EVENTO_CULTURAL';

/**
 * US-13 — Representa una sugerencia de actividad para los tiempos libres
 * de un estudiante dentro del campus.
 *
 * Historia de Usuario (US-13):
 *   "Como estudiante, quiero recibir sugerencias de cursos cortos o eventos
 *    culturales durante mis tiempos libres para aprovechar mi estancia en el campus."
 */
export interface Sugerencia {
  /** Identificador único de la sugerencia */
  id: string;

  /** Nombre del curso o evento */
  titulo: string;

  /** Descripción breve de qué trata la actividad */
  descripcion: string;

  /** Tipo de actividad: CURSO_CORTO o EVENTO_CULTURAL */
  tipo: TipoSugerencia;

  /** Duración estimada de la actividad en horas */
  duracionHoras: number;

  /** Ubicación dentro del campus */
  campus: string;

  /** Días de la semana en que está disponible (ej: ["Lunes", "Miércoles"]) */
  dias: string[];

  /** Hora de inicio de disponibilidad (formato "HH:mm") */
  horaInicio: string;

  /** Hora de fin de disponibilidad (formato "HH:mm") */
  horaFin: string;

  /** Indica si la actividad es gratuita para estudiantes */
  esGratuita: boolean;
}
