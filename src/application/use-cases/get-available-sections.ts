import { Seccion, tieneDisponibilidad, getCuposDisponibles } from '../../domain/entities/seccion';

// ============================================================
//  US-08 | Cupos Disponibles por Sección
//  Capa: Aplicación  |  Caso de Uso: GetAvailableSections
// ============================================================

/**
 * US-08 — Datos de secciones en memoria (simulación de BD).
 *
 * En un entorno real, estos datos vendrían de una base de datos
 * o de una API del sistema académico de la universidad.
 */
const SECCIONES_EN_MEMORIA: Seccion[] = [
  // ── Cálculo Diferencial ─────────────────────────────────────────────────
  { idSeccion: 'CAL-101-A', nombreMateria: 'Cálculo Diferencial', cuposMaximos: 35, cuposOcupados: 35 }, // LLENA
  { idSeccion: 'CAL-101-B', nombreMateria: 'Cálculo Diferencial', cuposMaximos: 35, cuposOcupados: 20 },
  { idSeccion: 'CAL-101-C', nombreMateria: 'Cálculo Diferencial', cuposMaximos: 30, cuposOcupados: 28 },
  { idSeccion: 'CAL-101-D', nombreMateria: 'Cálculo Diferencial', cuposMaximos: 40, cuposOcupados: 40 }, // LLENA

  // ── Álgebra Lineal ──────────────────────────────────────────────────────
  { idSeccion: 'ALG-201-A', nombreMateria: 'Álgebra Lineal', cuposMaximos: 30, cuposOcupados: 15 },
  { idSeccion: 'ALG-201-B', nombreMateria: 'Álgebra Lineal', cuposMaximos: 30, cuposOcupados: 30 }, // LLENA
  { idSeccion: 'ALG-201-C', nombreMateria: 'Álgebra Lineal', cuposMaximos: 25, cuposOcupados: 10 },

  // ── Ingeniería de Software ──────────────────────────────────────────────
  { idSeccion: 'ING-301-A', nombreMateria: 'Ingeniería de Software', cuposMaximos: 40, cuposOcupados: 39 },
  { idSeccion: 'ING-301-B', nombreMateria: 'Ingeniería de Software', cuposMaximos: 40, cuposOcupados: 40 }, // LLENA
  { idSeccion: 'ING-301-C', nombreMateria: 'Ingeniería de Software', cuposMaximos: 35, cuposOcupados: 12 },

  // ── Estructuras de Datos ────────────────────────────────────────────────
  { idSeccion: 'EST-401-A', nombreMateria: 'Estructuras de Datos', cuposMaximos: 30, cuposOcupados: 30 }, // LLENA
  { idSeccion: 'EST-401-B', nombreMateria: 'Estructuras de Datos', cuposMaximos: 30, cuposOcupados: 30 }, // LLENA
  { idSeccion: 'EST-401-C', nombreMateria: 'Estructuras de Datos', cuposMaximos: 25, cuposOcupados: 5  },

  // ── Bases de Datos ──────────────────────────────────────────────────────
  { idSeccion: 'BDD-501-A', nombreMateria: 'Bases de Datos', cuposMaximos: 35, cuposOcupados: 20 },
  { idSeccion: 'BDD-501-B', nombreMateria: 'Bases de Datos', cuposMaximos: 35, cuposOcupados: 35 }, // LLENA
];

/**
 * US-08 — Caso de Uso: Obtener secciones con cupos disponibles.
 *
 * Implementa la historia de usuario:
 *   "Como estudiante, quiero ver qué secciones de una materia tienen
 *    cupos disponibles, para evaluar un posible cambio de sección."
 */
export class GetAvailableSections {

  /**
   * Busca todas las secciones de una materia que aún tienen cupos libres.
   *
   * Flujo:
   *   1. Valida que el nombre de materia no sea vacío.
   *   2. Filtra por nombre de materia (sin distinguir mayúsculas).
   *   3. De ese subconjunto, conserva solo las que tienen disponibilidad.
   *   4. Retorna la lista con cupos calculados.
   *
   * @param nombreMateria Nombre (o parte del nombre) de la materia a buscar
   * @returns Lista de secciones disponibles con sus cupos libres calculados
   */
  execute(nombreMateria: string): Array<Seccion & { cuposDisponibles: number }> {
    // Validación: parámetro vacío → lista vacía
    if (!nombreMateria || nombreMateria.trim() === '') {
      return [];
    }

    const termino = nombreMateria.trim().toLowerCase();

    return SECCIONES_EN_MEMORIA
      .filter(seccion =>
        seccion.nombreMateria.toLowerCase().includes(termino) &&
        tieneDisponibilidad(seccion)
      )
      .map(seccion => ({
        ...seccion,
        cuposDisponibles: getCuposDisponibles(seccion),
      }));
  }

  /**
   * Retorna los nombres únicos de todas las materias disponibles.
   * Útil para poblar selectores en la interfaz.
   *
   * @returns Lista de nombres de materias sin duplicados
   */
  getNombresMaterias(): string[] {
    const nombres = new Set(SECCIONES_EN_MEMORIA.map(s => s.nombreMateria));
    return Array.from(nombres);
  }
}
