import { AcademicExtractionResult, AcademicPortalPort } from "../../application/ports/academic-portal.port";
import { AcademicRecord } from "../../domain/entities/academic-record";

/**
 * Adaptador para el portal académico SIA (Pattern Strategy - RNF-02.4).
 * US-02: RF-02.1 & RF-02.2
 */
export class SiaAdapter implements AcademicPortalPort {
  /**
   * Extrae el historial académico de SIA.
   * RF-02.3: Mapeo de materias al pensum interno.
   * 
   * @param studentId 
   * @param universityToken Token de sesión proporcionado (NO se guarda).
   * @returns Datos extraídos de forma estructurada.
   */
  async getAcademicHistory(studentId: string, universityToken: string): Promise<AcademicExtractionResult> {
    console.log(`[Portal SIA] Extrayendo para ${studentId} usando el token temporal: ${universityToken}`);

    // RF-01.1 y RF-01.2: En producción, aquí haríamos scraping o peticiones a la API del portal universitario.
    // Simulamos una respuesta con historial completo que el sistema procesará internamente.
    
    const subjects: AcademicRecord[] = [
      { courseId: 'MAT101', courseName: 'Cálculo I', status: 'APROBADA', grade: '4.5', credits: 4, period: '2025-1' },
      { courseId: 'FIS101', courseName: 'Física Mecánica', status: 'APROBADA', grade: '4.0', credits: 4, period: '2025-1' },
      { courseId: 'PROG101', courseName: 'Fundamentos de Programación', status: 'APROBADA', grade: '4.8', credits: 3, period: '2025-1' },
      { courseId: 'QUIM101', courseName: 'Química General', status: 'PERDIDA', grade: '2.5', credits: 3, period: '2025-2' },
      { courseId: 'MAT102', courseName: 'Cálculo II', status: 'CURSANDO', grade: 'N/A', credits: 4, period: '2026-1' }
    ];

    return {
      records: subjects,
      totalCredits: 11, // Créditos de materias aprobadas (4+4+3)
      currentSemester: 3
    };
  }
}
