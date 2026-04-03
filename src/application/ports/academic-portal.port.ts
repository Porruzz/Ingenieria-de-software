import { AcademicRecord } from "../../domain/entities/academic-record";

export interface AcademicExtractionResult {
  records: AcademicRecord[];
  totalCredits: number;
  currentSemester: number;
}

/**
 * Puerto para el portal académico universario (Pattern Strategy).
 * US-02: RF-02.1 & RNF-02.4
 */
export interface AcademicPortalPort {
  /**
   * Extrae el historial académico de un estudiante usando credenciales temporales.
   * RNF-02.2: No almacena credenciales.
   */
  getAcademicHistory(studentId: string, universityToken: string): Promise<AcademicExtractionResult>;
}
