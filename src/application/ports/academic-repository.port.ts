import { AcademicSummary } from "../../domain/entities/academic-record";

/**
 * Puerto para persistir el historial académico del estudiante.
 * US-02: RF-02.3 Map extracted courses to inner pensum.
 */
export interface AcademicRepositoryPort {
  /**
   * Guarda o actualiza el historial académico de un estudiante.
   */
  saveHistory(summary: AcademicSummary): Promise<void>;
  
  /**
   * Recupera el historial académico de un estudiante.
   */
  getHistory(studentId: string): Promise<AcademicSummary | null>;
}
