import { PrerequisiteRelation } from '../../domain/entities/prerequisite';

/**
 * Puerto para acceder al grafo de dependencias del pensum.
 * US-06: RF-06.1 — El sistema debe mantener un grafo de dependencias.
 * RNF-06.2: El grafo debe poder cachearse en memoria.
 * RF-06.4: Debe soportar pensum de múltiples programas académicos.
 * 
 * Sigue el patrón de Arquitectura Hexagonal (Ports & Adapters).
 * La implementación concreta puede ser PostgreSQL, Redis, o un mock en memoria.
 */
export interface PrerequisiteRepositoryPort {
  /**
   * Obtiene todos los prerrequisitos de una materia específica.
   * @param courseId ID de la materia a consultar.
   * @returns Lista de relaciones de prerrequisito/correquisito.
   */
  getPrerequisitesForCourse(courseId: string): Promise<PrerequisiteRelation[]>;

  /**
   * Obtiene el grafo completo de prerrequisitos de un programa académico.
   * RNF-06.2: Este método permite cachear todo el grafo en memoria.
   * @param programId ID del programa académico.
   * @returns Mapa completo courseId → [prerrequisitos].
   */
  getFullPrerequisiteGraph(programId: string): Promise<Map<string, PrerequisiteRelation[]>>;

  /**
   * Obtiene el nombre de una materia dado su ID.
   * Usado para generar mensajes descriptivos (RF-06.3).
   * @param courseId ID de la materia.
   * @returns Nombre de la materia o null si no existe.
   */
  getCourseName(courseId: string): Promise<string | null>;

  /**
   * Verifica si una materia existe en el pensum.
   * @param courseId ID de la materia.
   * @returns true si la materia existe.
   */
  courseExists(courseId: string): Promise<boolean>;
}
