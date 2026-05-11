import { Seccion, tieneDisponibilidad, getCuposDisponibles } from '../../domain/entities/seccion';

/**
 * US-08 — Datos de secciones sincronizados con el catálogo oficial.
 */
const SECCIONES_EN_MEMORIA: Seccion[] = [
  { idSeccion: 'MAT101-A', nombreMateria: 'Cálculo I', cuposMaximos: 35, cuposOcupados: 30 },
  { idSeccion: 'MAT101-B', nombreMateria: 'Cálculo I', cuposMaximos: 35, cuposOcupados: 35 }, // LLENA
  { idSeccion: 'MAT102-A', nombreMateria: 'Cálculo II', cuposMaximos: 30, cuposOcupados: 10 },
  { idSeccion: 'MAT201-A', nombreMateria: 'Cálculo III', cuposMaximos: 25, cuposOcupados: 25 }, // LLENA
  { idSeccion: 'FIS101-A', nombreMateria: 'Física Mecánica', cuposMaximos: 40, cuposOcupados: 20 },
  { idSeccion: 'FIS102-A', nombreMateria: 'Física Eléctrica', cuposMaximos: 30, cuposOcupados: 28 },
  { idSeccion: 'PROG101-A', nombreMateria: 'Fundamentos de Programación', cuposMaximos: 35, cuposOcupados: 15 },
  { idSeccion: 'PROG201-A', nombreMateria: 'Programación Orientada a Objetos', cuposMaximos: 30, cuposOcupados: 30 }, // LLENA
  { idSeccion: 'PROG301-A', nombreMateria: 'Estructuras de Datos', cuposMaximos: 25, cuposOcupados: 5 },
  { idSeccion: 'QUIM101-A', nombreMateria: 'Química General', cuposMaximos: 30, cuposOcupados: 12 },
  { idSeccion: 'EST101-A', nombreMateria: 'Probabilidad y Estadística', cuposMaximos: 40, cuposOcupados: 38 },
  { idSeccion: 'ING101-A', nombreMateria: 'Introducción a la Ingeniería', cuposMaximos: 50, cuposOcupados: 20 },
  { idSeccion: 'ALG101-A', nombreMateria: 'Álgebra Lineal', cuposMaximos: 35, cuposOcupados: 35 }, // LLENA
];

export class GetAvailableSections {
  execute(terminoBusqueda: string): Array<Seccion & { cuposDisponibles: number }> {
    if (!terminoBusqueda || terminoBusqueda.trim() === '') return [];

    const termino = terminoBusqueda.trim().toLowerCase();

    return SECCIONES_EN_MEMORIA
      .filter(seccion =>
        (seccion.nombreMateria.toLowerCase().includes(termino) || 
         seccion.idSeccion.toLowerCase().includes(termino)) &&
        tieneDisponibilidad(seccion)
      )
      .map(seccion => ({
        ...seccion,
        cuposDisponibles: getCuposDisponibles(seccion),
      }));
  }

  getNombresMaterias(): string[] {
    return Array.from(new Set(SECCIONES_EN_MEMORIA.map(s => s.nombreMateria)));
  }
}
