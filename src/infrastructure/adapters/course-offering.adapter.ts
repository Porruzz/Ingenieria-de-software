import { CourseOfferingPort } from '../../application/ports/course-offering.port';
import { CourseSection } from '../../domain/entities/schedule';

/**
 * US-05: Adaptador en memoria para la oferta académica.
 * 
 * En producción, este adaptador consultaría la base de datos PostgreSQL
 * (tablas: course, course_section, section_schedule, prerequisite).
 * 
 * Para el Sprint 1, simulamos un pensum de ingeniería de sistemas
 * con datos realistas para demostrar el funcionamiento del algoritmo.
 */
export class InMemoryCourseOfferingAdapter implements CourseOfferingPort {

  /** Mapa de prerrequisitos: courseId → [lista de IDs requeridos] */
  private readonly prerequisitesData: Map<string, string[]> = new Map([
    ['MAT101', []],                     // Cálculo I — Sin prerrequisitos
    ['MAT102', ['MAT101']],             // Cálculo II ← Cálculo I
    ['MAT201', ['MAT102']],             // Cálculo III ← Cálculo II
    ['FIS101', []],                     // Física Mecánica — Sin prerrequisitos
    ['FIS102', ['FIS101', 'MAT101']],   // Física Eléctrica ← Física Mecánica + Cálculo I
    ['PROG101', []],                    // Fundamentos de Programación — Sin prerrequisitos
    ['PROG201', ['PROG101']],           // Programación Orientada a Objetos ← Fundamentos
    ['PROG301', ['PROG201']],           // Estructuras de Datos ← POO
    ['QUIM101', []],                    // Química General — Sin prerrequisitos
    ['EST101', ['MAT101']],             // Probabilidad y Estadística ← Cálculo I
    ['ING101', []],                     // Introducción a la Ingeniería — Sin prerrequisitos
    ['ALG101', []],                     // Álgebra Lineal — Sin prerrequisitos
  ]);

  /** Oferta académica completa del semestre para demostración */
  private readonly semesterOffering: CourseSection[] = [
    // ─── CÁLCULO I (2 secciones) ───
    {
      id: 'SEC-MAT101-A', courseId: 'MAT101', courseName: 'Cálculo I',
      sectionCode: 'A', credits: 4, professor: 'Dr. García', campus: 'Principal',
      capacity: 40, enrolledCount: 35,
      schedule: [
        { day: 'Lunes', startTime: '07:00', endTime: '09:00' },
        { day: 'Miércoles', startTime: '07:00', endTime: '09:00' },
      ],
    },
    {
      id: 'SEC-MAT101-B', courseId: 'MAT101', courseName: 'Cálculo I',
      sectionCode: 'B', credits: 4, professor: 'Dra. López', campus: 'Principal',
      capacity: 40, enrolledCount: 30,
      schedule: [
        { day: 'Martes', startTime: '09:00', endTime: '11:00' },
        { day: 'Jueves', startTime: '09:00', endTime: '11:00' },
      ],
    },

    // ─── CÁLCULO II (2 secciones) ───
    {
      id: 'SEC-MAT102-A', courseId: 'MAT102', courseName: 'Cálculo II',
      sectionCode: 'A', credits: 4, professor: 'Dr. Morales', campus: 'Principal',
      capacity: 35, enrolledCount: 28,
      schedule: [
        { day: 'Lunes', startTime: '09:00', endTime: '11:00' },
        { day: 'Miércoles', startTime: '09:00', endTime: '11:00' },
      ],
    },
    {
      id: 'SEC-MAT102-B', courseId: 'MAT102', courseName: 'Cálculo II',
      sectionCode: 'B', credits: 4, professor: 'Dra. Ramírez', campus: 'Norte',
      capacity: 35, enrolledCount: 20,
      schedule: [
        { day: 'Martes', startTime: '14:00', endTime: '16:00' },
        { day: 'Jueves', startTime: '14:00', endTime: '16:00' },
      ],
    },

    // ─── CÁLCULO III (1 sección) ───
    {
      id: 'SEC-MAT201-A', courseId: 'MAT201', courseName: 'Cálculo III',
      sectionCode: 'A', credits: 4, professor: 'Dr. Hernández', campus: 'Principal',
      capacity: 30, enrolledCount: 25,
      schedule: [
        { day: 'Lunes', startTime: '11:00', endTime: '13:00' },
        { day: 'Miércoles', startTime: '11:00', endTime: '13:00' },
      ],
    },

    // ─── FÍSICA MECÁNICA (2 secciones) ───
    {
      id: 'SEC-FIS101-A', courseId: 'FIS101', courseName: 'Física Mecánica',
      sectionCode: 'A', credits: 4, professor: 'Dr. Torres', campus: 'Principal',
      capacity: 40, enrolledCount: 38,
      schedule: [
        { day: 'Martes', startTime: '07:00', endTime: '09:00' },
        { day: 'Jueves', startTime: '07:00', endTime: '09:00' },
      ],
    },
    {
      id: 'SEC-FIS101-B', courseId: 'FIS101', courseName: 'Física Mecánica',
      sectionCode: 'B', credits: 4, professor: 'Dra. Castro', campus: 'Norte',
      capacity: 35, enrolledCount: 30,
      schedule: [
        { day: 'Lunes', startTime: '14:00', endTime: '16:00' },
        { day: 'Miércoles', startTime: '14:00', endTime: '16:00' },
      ],
    },

    // ─── FÍSICA ELÉCTRICA (1 sección) ───
    {
      id: 'SEC-FIS102-A', courseId: 'FIS102', courseName: 'Física Eléctrica',
      sectionCode: 'A', credits: 4, professor: 'Dr. Vargas', campus: 'Principal',
      capacity: 30, enrolledCount: 22,
      schedule: [
        { day: 'Miércoles', startTime: '14:00', endTime: '16:00' },
        { day: 'Viernes', startTime: '14:00', endTime: '16:00' },
      ],
    },

    // ─── FUNDAMENTOS DE PROGRAMACIÓN (2 secciones) ───
    {
      id: 'SEC-PROG101-A', courseId: 'PROG101', courseName: 'Fundamentos de Programación',
      sectionCode: 'A', credits: 3, professor: 'Ing. Rivera', campus: 'Principal',
      capacity: 35, enrolledCount: 33,
      schedule: [
        { day: 'Martes', startTime: '11:00', endTime: '13:00' },
        { day: 'Viernes', startTime: '09:00', endTime: '11:00' },
      ],
    },
    {
      id: 'SEC-PROG101-B', courseId: 'PROG101', courseName: 'Fundamentos de Programación',
      sectionCode: 'B', credits: 3, professor: 'Ing. Pardo', campus: 'Principal',
      capacity: 35, enrolledCount: 25,
      schedule: [
        { day: 'Lunes', startTime: '16:00', endTime: '18:00' },
        { day: 'Jueves', startTime: '16:00', endTime: '18:00' },
      ],
    },

    // ─── POO (1 sección) ───
    {
      id: 'SEC-PROG201-A', courseId: 'PROG201', courseName: 'Programación Orientada a Objetos',
      sectionCode: 'A', credits: 3, professor: 'Ing. Mendoza', campus: 'Principal',
      capacity: 30, enrolledCount: 20,
      schedule: [
        { day: 'Martes', startTime: '16:00', endTime: '18:00' },
        { day: 'Jueves', startTime: '11:00', endTime: '13:00' },
      ],
    },

    // ─── ESTRUCTURAS DE DATOS (1 sección) ───
    {
      id: 'SEC-PROG301-A', courseId: 'PROG301', courseName: 'Estructuras de Datos',
      sectionCode: 'A', credits: 3, professor: 'Ing. Sánchez', campus: 'Principal',
      capacity: 25, enrolledCount: 15,
      schedule: [
        { day: 'Miércoles', startTime: '16:00', endTime: '18:00' },
        { day: 'Viernes', startTime: '11:00', endTime: '13:00' },
      ],
    },

    // ─── QUÍMICA GENERAL (sección con cupo lleno para probar filtro) ───
    {
      id: 'SEC-QUIM101-A', courseId: 'QUIM101', courseName: 'Química General',
      sectionCode: 'A', credits: 3, professor: 'Dra. Peña', campus: 'Norte',
      capacity: 30, enrolledCount: 30, // ← SIN CUPO
      schedule: [
        { day: 'Viernes', startTime: '07:00', endTime: '10:00' },
      ],
    },
    {
      id: 'SEC-QUIM101-B', courseId: 'QUIM101', courseName: 'Química General',
      sectionCode: 'B', credits: 3, professor: 'Dr. Ortiz', campus: 'Principal',
      capacity: 30, enrolledCount: 18,
      schedule: [
        { day: 'Jueves', startTime: '14:00', endTime: '17:00' },
      ],
    },

    // ─── PROBABILIDAD Y ESTADÍSTICA (1 sección) ───
    {
      id: 'SEC-EST101-A', courseId: 'EST101', courseName: 'Probabilidad y Estadística',
      sectionCode: 'A', credits: 3, professor: 'Dr. Reyes', campus: 'Principal',
      capacity: 40, enrolledCount: 28,
      schedule: [
        { day: 'Lunes', startTime: '14:00', endTime: '16:00' },
        { day: 'Viernes', startTime: '14:00', endTime: '16:00' },
      ],
    },

    // ─── ÁLGEBRA LINEAL (1 sección) ───
    {
      id: 'SEC-ALG101-A', courseId: 'ALG101', courseName: 'Álgebra Lineal',
      sectionCode: 'A', credits: 4, professor: 'Dra. Muñoz', campus: 'Principal',
      capacity: 35, enrolledCount: 20,
      schedule: [
        { day: 'Martes', startTime: '07:00', endTime: '09:00' },
        { day: 'Jueves', startTime: '07:00', endTime: '09:00' },
      ],
    },

    // ─── INTRODUCCIÓN A LA INGENIERÍA (1 sección) ───
    {
      id: 'SEC-ING101-A', courseId: 'ING101', courseName: 'Introducción a la Ingeniería',
      sectionCode: 'A', credits: 2, professor: 'Ing. Gómez', campus: 'Principal',
      capacity: 50, enrolledCount: 30,
      schedule: [
        { day: 'Viernes', startTime: '07:00', endTime: '09:00' },
      ],
    },
  ];

  /**
   * Retorna todas las secciones disponibles para el período.
   * En producción, consultaría las tablas course_section y section_schedule.
   */
  async getAvailableSections(period: string): Promise<CourseSection[]> {
    console.log(`[CourseOffering] Cargando oferta académica para período ${period}`);
    return this.semesterOffering;
  }

  /**
   * Retorna los prerrequisitos de una materia.
   * En producción, consultaría la tabla prerequisite.
   */
  async getPrerequisites(courseId: string): Promise<string[]> {
    return this.prerequisitesData.get(courseId) || [];
  }
}
