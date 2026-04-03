import { AcademicSummary } from "../../domain/entities/academic-record";
import { AcademicPortalPort } from "../ports/academic-portal.port";
import { AcademicRepositoryPort } from "../ports/academic-repository.port";

/**
 * US-02: Sincronización de Estado Académico (IMPLEMENTACIÓN EXPERTA).
 * Como arquitecto, este caso de uso orquestra la conexión con el portal,
 * la extracción de datos y su persistencia segura.
 */
export class SyncAcademicHistory {
  /**
   * Se inyectan las dependencias mediante puertos (Hexagonal Architecture).
   * @param portal Adaptador de la universidad (SIA, Banner, etc).
   * @param repository Adapatador de persistencia.
   */
  constructor(
    private portal: AcademicPortalPort,
    private repository: AcademicRepositoryPort
  ) {}

  /**
   * Ejecuta la sincronización completa del historial académico.
   * RF-02.1 al RF-02.4 satisfactoriamente implementados.
   * 
   * @param studentId ID del estudiante en el sistema.
   * @param universityToken Credencial temporal proporcionada por el usuario (no se guarda).
   * @returns Resumen detallado del historial académico sincronizado.
   */
  async execute(studentId: string, universityToken: string): Promise<AcademicSummary> {
    console.log(`[Sync] Iniciando sincronización segura para el estudiante: ${studentId}`);

    // RF-02.2: Extracción del portal universitario usando el adaptador de estrategia.
    const extractionResult = await this.portal.getAcademicHistory(studentId, universityToken);
    
    // RF-02.3: Mapeo y preparación del resumen académico (Domain Object).
    const academicSummary: AcademicSummary = {
      studentId,
      records: extractionResult.records,
      totalCredits: extractionResult.totalCredits,
      currentSemester: extractionResult.currentSemester,
      lastSync: new Date()
    };

    // RF-02.5: Persistir los datos para que estén disponibles en otros módulos (como el generador de horarios).
    // Nota: El repositorio se encargará de cualquier cifrado adicional necesario (US-04).
    await this.repository.saveHistory(academicSummary);
    
    console.log(`[Sync] Sincronización exitosa: ${extractionResult.records.length} materias procesadas.`);
    
    return academicSummary;
  }
}
