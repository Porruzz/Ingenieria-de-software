import { FailedCourseHistory, PriorityCalculation } from '../../domain/entities/critical-subject';

export interface CriticalSubjectRepositoryPort {
  /**
   * Obtiene el historial de materias perdidas de un estudiante.
   */
  getFailedCourses(studentId: string): Promise<FailedCourseHistory[]>;

  /**
   * Guarda o actualiza el cálculo de prioridad de un estudiante para una materia.
   */
  savePriorityCalculation(calculation: PriorityCalculation): Promise<void>;

  /**
   * Obtiene los cálculos de prioridad guardados para un estudiante.
   */
  getPriorityCalculations(studentId: string): Promise<PriorityCalculation[]>;
}
