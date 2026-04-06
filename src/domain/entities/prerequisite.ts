/**
 * US-06: Entidades de dominio para el módulo de Validación de Prerrequisitos.
 * Modela el grafo de dependencias del pensum (DAG — Directed Acyclic Graph).
 * 
 * Referencia ERD: tabla `prerequisite` con campos:
 *   - course_id → materia que tiene el requisito
 *   - required_course_id → materia que se necesita haber aprobado
 *   - type → PRE (prerrequisito) o CO (correquisito)
 */

/** Tipo de dependencia académica */
export type DependencyType = 'PRE' | 'CO';

/** Relación de dependencia entre dos materias del pensum */
export interface PrerequisiteRelation {
  courseId: string;           // Materia que tiene la restricción
  requiredCourseId: string;   // Materia requerida
  requiredCourseName: string; // Nombre legible (para mensajes RF-06.3)
  type: DependencyType;       // PRE = prerrequisito, CO = correquisito
}

/** Información de un prerrequisito faltante (para mensajes descriptivos) */
export interface MissingPrerequisite {
  courseId: string;
  courseName: string;
  type: DependencyType;
}

/**
 * Resultado de la validación de prerrequisitos (RF-06.3).
 * Retorna mensajes claros: "Aprobado" o "Bloqueado por: [lista]".
 */
export interface PrerequisiteValidationResult {
  courseId: string;
  courseName: string;
  status: 'APROBADO' | 'BLOQUEADO';
  message: string;             // Mensaje legible para el estudiante
  missingPrerequisites: MissingPrerequisite[];
  validatedAt: Date;
}

/**
 * Resultado de una validación por lotes (múltiples materias a la vez).
 * Útil para el generador de horarios (US-05) y para la vista del estudiante.
 */
export interface BatchValidationResult {
  studentId: string;
  results: PrerequisiteValidationResult[];
  totalEvaluated: number;
  totalApproved: number;
  totalBlocked: number;
  validatedAt: Date;
}
