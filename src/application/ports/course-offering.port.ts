import { CourseSection } from '../../domain/entities/schedule';

/**
 * Puerto para acceder a la oferta académica del semestre.
 * US-05: RF-05.1 — El generador necesita la oferta académica como entrada.
 * 
 * Sigue el patrón de Arquitectura Hexagonal (como AcademicPortalPort de US-02).
 * La implementación concreta puede ser una BD, una API externa, o un mock.
 */
export interface CourseOfferingPort {
  /**
   * Obtiene todas las secciones disponibles para un período académico.
   * @param period Período académico (ej: "2026-2")
   * @returns Lista de secciones con sus horarios y capacidad.
   */
  getAvailableSections(period: string): Promise<CourseSection[]>;

  /**
   * Obtiene los prerrequisitos de una materia por su ID.
   * @param courseId ID de la materia.
   * @returns Lista de IDs de materias prerrequisito.
   */
  getPrerequisites(courseId: string): Promise<string[]>;
}
