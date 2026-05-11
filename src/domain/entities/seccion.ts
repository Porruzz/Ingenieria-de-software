// ============================================================
//  US-08 | Cupos Disponibles por Sección
//  Capa: Dominio  |  Entidad: Seccion
// ============================================================

/**
 * US-08 — Representa una sección de una materia universitaria.
 * Contiene los datos necesarios para determinar disponibilidad de cupos.
 */
export interface Seccion {
  /** Identificador único de la sección (ej: "CAL-101-A") */
  idSeccion: string;

  /** Nombre de la materia (ej: "Cálculo Diferencial") */
  nombreMateria: string;

  /** Número máximo de estudiantes que puede albergar la sección */
  cuposMaximos: number;

  /** Número de estudiantes actualmente inscritos */
  cuposOcupados: number;
}

/**
 * US-08 — Calcula los cupos libres de una sección.
 * @returns Número de cupos disponibles (mínimo 0)
 */
export function getCuposDisponibles(seccion: Seccion): number {
  const disponibles = seccion.cuposMaximos - seccion.cuposOcupados;
  return disponibles > 0 ? disponibles : 0;
}

/**
 * US-08 — Determina si una sección tiene al menos un cupo libre.
 * @returns true si hay cupos disponibles; false si está llena
 */
export function tieneDisponibilidad(seccion: Seccion): boolean {
  return seccion.cuposMaximos > seccion.cuposOcupados;
}
