import { Sugerencia, TipoSugerencia } from '../../domain/entities/suggestion';

// ============================================================
//  US-13 | Sugerencias de Cursos Cortos y Eventos Culturales
//  Capa: Aplicación  |  Caso de Uso: GetSuggestions
// ============================================================

/**
 * US-13 — Catálogo de sugerencias en memoria (simulación de BD).
 *
 * En un entorno real, estas sugerencias vendrían de una API del campus
 * o de una base de datos administrada por la institución.
 */
const SUGERENCIAS_EN_MEMORIA: Sugerencia[] = [

  // ── Cursos Cortos ────────────────────────────────────────────────────────
  {
    id: 'CC-001',
    titulo: 'Introducción a Python para Ciencia de Datos',
    descripcion: 'Aprende los fundamentos de Python aplicados al análisis de datos en solo 8 horas.',
    tipo: 'CURSO_CORTO',
    duracionHoras: 8,
    campus: 'Laboratorio de Cómputo - Bloque A',
    dias: ['Lunes', 'Miércoles'],
    horaInicio: '12:00',
    horaFin: '14:00',
    esGratuita: true,
  },
  {
    id: 'CC-002',
    titulo: 'Taller de Inglés para Ingeniería',
    descripcion: 'Vocabulario técnico en inglés orientado a ingeniería de software y documentación.',
    tipo: 'CURSO_CORTO',
    duracionHoras: 6,
    campus: 'Centro de Idiomas - Sala 3',
    dias: ['Martes', 'Jueves'],
    horaInicio: '13:00',
    horaFin: '15:00',
    esGratuita: true,
  },
  {
    id: 'CC-003',
    titulo: 'Diseño de Interfaces con Figma',
    descripcion: 'Crea prototipos profesionales de aplicaciones móviles y web desde cero.',
    tipo: 'CURSO_CORTO',
    duracionHoras: 10,
    campus: 'Laboratorio de Diseño - Bloque C',
    dias: ['Viernes'],
    horaInicio: '10:00',
    horaFin: '12:00',
    esGratuita: false,
  },
  {
    id: 'CC-004',
    titulo: 'Gestión del Tiempo y Productividad Académica',
    descripcion: 'Técnicas y herramientas para organizar tu semestre y rendir mejor en tus materias.',
    tipo: 'CURSO_CORTO',
    duracionHoras: 4,
    campus: 'Bienestar Universitario - Sala Principal',
    dias: ['Lunes', 'Viernes'],
    horaInicio: '11:00',
    horaFin: '13:00',
    esGratuita: true,
  },
  {
    id: 'CC-005',
    titulo: 'Introducción a Git y Control de Versiones',
    descripcion: 'Domina Git, GitHub y el flujo de trabajo colaborativo en proyectos de software.',
    tipo: 'CURSO_CORTO',
    duracionHoras: 6,
    campus: 'Laboratorio de Cómputo - Bloque B',
    dias: ['Miércoles', 'Jueves'],
    horaInicio: '14:00',
    horaFin: '16:00',
    esGratuita: true,
  },

  // ── Eventos Culturales ───────────────────────────────────────────────────
  {
    id: 'EC-001',
    titulo: 'Exposición de Arte Digital: "Algoritmos y Emoción"',
    descripcion: 'Obras de arte generadas con inteligencia artificial por estudiantes del programa de Diseño.',
    tipo: 'EVENTO_CULTURAL',
    duracionHoras: 2,
    campus: 'Galería Central - Planta Baja',
    dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    horaInicio: '08:00',
    horaFin: '18:00',
    esGratuita: true,
  },
  {
    id: 'EC-002',
    titulo: 'Concierto de Jazz Universitario',
    descripcion: 'Presentación en vivo del grupo de Jazz de la facultad de Artes. Entrada libre.',
    tipo: 'EVENTO_CULTURAL',
    duracionHoras: 2,
    campus: 'Auditorio Principal',
    dias: ['Viernes'],
    horaInicio: '17:00',
    horaFin: '19:00',
    esGratuita: true,
  },
  {
    id: 'EC-003',
    titulo: 'Charla: Emprendimiento Tecnológico en Latinoamérica',
    descripcion: 'Experiencias de fundadores de startups de la región. Oportunidades de networking.',
    tipo: 'EVENTO_CULTURAL',
    duracionHoras: 2,
    campus: 'Sala de Conferencias - Bloque D',
    dias: ['Martes'],
    horaInicio: '12:00',
    horaFin: '14:00',
    esGratuita: true,
  },
  {
    id: 'EC-004',
    titulo: 'Festival Gastronómico Internacional',
    descripcion: 'Muestras de cocina de más de 15 países representados por estudiantes internacionales.',
    tipo: 'EVENTO_CULTURAL',
    duracionHoras: 4,
    campus: 'Plaza Central del Campus',
    dias: ['Sábado'],
    horaInicio: '10:00',
    horaFin: '14:00',
    esGratuita: true,
  },
  {
    id: 'EC-005',
    titulo: 'Cine Foro: Tecnología y Sociedad',
    descripcion: 'Proyección de documentales sobre el impacto de la IA y el debate posterior con expertos.',
    tipo: 'EVENTO_CULTURAL',
    duracionHoras: 3,
    campus: 'Sala de Cine - Bloque E',
    dias: ['Jueves'],
    horaInicio: '15:00',
    horaFin: '18:00',
    esGratuita: true,
  },
];

/**
 * US-13 — Representa un bloque de tiempo libre de un estudiante.
 * Se usa para filtrar sugerencias que quepan en ese espacio.
 */
export interface TiempoLibre {
  /** Día de la semana (ej: "Lunes") */
  dia: string;

  /** Hora de inicio del tiempo libre (formato "HH:mm") */
  horaInicio: string;

  /** Hora de fin del tiempo libre (formato "HH:mm") */
  horaFin: string;
}

/**
 * US-13 — Caso de Uso: Obtener sugerencias de cursos y eventos para tiempos libres.
 *
 * Implementa la historia de usuario:
 *   "Como estudiante, quiero recibir sugerencias de cursos cortos o eventos
 *    culturales durante mis tiempos libres para aprovechar mi estancia en el campus."
 */
export class GetSuggestions {

  /**
   * Retorna todas las sugerencias disponibles, opcionalmente filtradas por tipo.
   *
   * @param tipo Filtro opcional: 'CURSO_CORTO' | 'EVENTO_CULTURAL'. Sin filtro → devuelve todas.
   * @returns Lista de sugerencias del tipo indicado (o todas si no se especifica)
   */
  execute(tipo?: TipoSugerencia): Sugerencia[] {
    if (!tipo) {
      return [...SUGERENCIAS_EN_MEMORIA];
    }
    return SUGERENCIAS_EN_MEMORIA.filter(s => s.tipo === tipo);
  }

  /**
   * US-13 — Lógica principal: filtra sugerencias que caben en los tiempos libres
   * del estudiante.
   *
   * Para cada sugerencia, verifica si hay algún bloque de tiempo libre donde:
   *   1. El día coincide con los días disponibles de la sugerencia.
   *   2. La sugerencia comienza dentro del bloque libre.
   *   3. La duración de la sugerencia no supera el tiempo libre disponible.
   *
   * @param tiemposLibres Bloques de tiempo libre del estudiante en la semana
   * @param tipo          Filtro opcional por tipo de sugerencia
   * @returns Sugerencias que encajan en al menos uno de los tiempos libres
   */
  getForFreeTime(tiemposLibres: TiempoLibre[], tipo?: TipoSugerencia): Sugerencia[] {
    const catalogo = tipo
      ? SUGERENCIAS_EN_MEMORIA.filter(s => s.tipo === tipo)
      : SUGERENCIAS_EN_MEMORIA;

    return catalogo.filter(sugerencia =>
      tiemposLibres.some(libre => this.encajaEnTiempoLibre(sugerencia, libre))
    );
  }

  /**
   * Retorna solo las sugerencias gratuitas.
   * Útil para estudiantes con restricciones económicas.
   *
   * @param tipo Filtro opcional por tipo
   * @returns Lista de sugerencias gratuitas
   */
  getGratuitas(tipo?: TipoSugerencia): Sugerencia[] {
    return this.execute(tipo).filter(s => s.esGratuita);
  }

  // ── Método privado de apoyo ──────────────────────────────────────────────

  /**
   * Verifica si una sugerencia puede realizarse dentro de un bloque de tiempo libre.
   *
   * @param sugerencia  La actividad a evaluar
   * @param tiempoLibre El bloque de tiempo libre del estudiante
   * @returns true si la sugerencia cabe en el tiempo libre indicado
   */
  private encajaEnTiempoLibre(sugerencia: Sugerencia, tiempoLibre: TiempoLibre): boolean {
    // Verificar que el día coincida
    const diaCoincide = sugerencia.dias.includes(tiempoLibre.dia);
    if (!diaCoincide) return false;

    // Convertir horas a minutos para comparación numérica
    const toMinutos = (hora: string): number => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const inicioLibre     = toMinutos(tiempoLibre.horaInicio);
    const finLibre        = toMinutos(tiempoLibre.horaFin);
    const inicioSugerencia = toMinutos(sugerencia.horaInicio);
    const duracionMinutos  = sugerencia.duracionHoras * 60;

    // La sugerencia debe comenzar dentro del bloque libre
    // y su duración no debe exceder el tiempo libre disponible
    const tiempoLibreDisponible = finLibre - inicioLibre;
    const comenzaDentroDelBloque =
      inicioSugerencia >= inicioLibre && inicioSugerencia < finLibre;

    return comenzaDentroDelBloque && duracionMinutos <= tiempoLibreDisponible;
  }
}
