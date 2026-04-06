import {
  PrerequisiteValidationResult,
  BatchValidationResult,
  MissingPrerequisite,
} from '../../domain/entities/prerequisite';
import { AcademicRepositoryPort } from '../ports/academic-repository.port';
import { PrerequisiteRepositoryPort } from '../ports/prerequisite-repository.port';

/**
 * US-06: Caso de Uso — Validación Automática de Prerrequisitos.
 * 
 * Verifica en tiempo real si un estudiante puede inscribir una materia
 * según su historial académico y el grafo de dependencias del pensum.
 * 
 * RF-06.2: Validación en tiempo real.
 * RF-06.3: Mensajes claros: "Aprobado" o "Bloqueado por: [lista de faltantes]".
 * RF-06.5: Servicio independiente consumible por US-05 y futuros módulos.
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo valida prerrequisitos.
 * - Open/Closed: Los datos del pensum vienen del puerto, no están hardcodeados.
 * - Dependency Inversion: Depende de abstracciones (puertos), no de implementaciones.
 */
export class ValidatePrerequisites {
  /**
   * Caché en memoria del grafo de prerrequisitos (RNF-06.2).
   * Evita consultas repetidas a la BD para mejorar el rendimiento.
   */
  private prerequisiteCache: Map<string, import('../../domain/entities/prerequisite').PrerequisiteRelation[]> | null = null;

  /**
   * Inyección de dependencias mediante puertos (Arquitectura Hexagonal).
   * @param academicRepository Puerto para consultar el historial del estudiante.
   * @param prerequisiteRepository Puerto para consultar el grafo de prerrequisitos del pensum.
   */
  constructor(
    private readonly academicRepository: AcademicRepositoryPort,
    private readonly prerequisiteRepository: PrerequisiteRepositoryPort
  ) {}

  /**
   * Valida si un estudiante puede inscribir una materia específica.
   * 
   * RF-06.2: Validación en tiempo real.
   * RF-06.3: Retorna "Aprobado" o "Bloqueado por: [lista]".
   * RNF-06.1: Debe responder en menos de 100ms por materia.
   * 
   * @param studentId ID del estudiante.
   * @param courseId ID de la materia a validar.
   * @returns Resultado detallado de la validación con mensajes descriptivos.
   */
  async execute(studentId: string, courseId: string): Promise<PrerequisiteValidationResult> {
    const startTime = Date.now();

    // 1. Verificar que la materia exista en el pensum
    const courseExists = await this.prerequisiteRepository.courseExists(courseId);
    if (!courseExists) {
      return {
        courseId,
        courseName: 'Desconocida',
        status: 'BLOQUEADO',
        message: `La materia ${courseId} no existe en el pensum del programa.`,
        missingPrerequisites: [],
        validatedAt: new Date(),
      };
    }

    // 2. Obtener el nombre de la materia para mensajes descriptivos (RF-06.3)
    const courseName = await this.prerequisiteRepository.getCourseName(courseId) || courseId;

    // 3. Obtener los prerrequisitos de la materia desde el puerto
    const prerequisites = await this.prerequisiteRepository.getPrerequisitesForCourse(courseId);

    // Si la materia no tiene prerrequisitos, se puede inscribir directamente
    if (prerequisites.length === 0) {
      this.logPerformance(startTime, courseId);
      return {
        courseId,
        courseName,
        status: 'APROBADO',
        message: `${courseName} — Aprobado. No tiene prerrequisitos.`,
        missingPrerequisites: [],
        validatedAt: new Date(),
      };
    }

    // 4. Obtener el historial del estudiante (descifrado por el repositorio — US-04)
    const history = await this.academicRepository.getHistory(studentId);

    if (!history) {
      return {
        courseId,
        courseName,
        status: 'BLOQUEADO',
        message: `${courseName} — Bloqueado. Debe sincronizar su historial académico primero (US-02).`,
        missingPrerequisites: prerequisites.map(p => ({
          courseId: p.requiredCourseId,
          courseName: p.requiredCourseName,
          type: p.type,
        })),
        validatedAt: new Date(),
      };
    }

    // 5. Determinar IDs de materias aprobadas en el historial
    const approvedCourseIds = new Set(
      history.records
        .filter(r => r.status === 'APROBADA')
        .map(r => r.courseId)
    );

    // 6. Verificar cada prerrequisito contra el historial
    const missingPrerequisites: MissingPrerequisite[] = [];

    for (const prereq of prerequisites) {
      if (!approvedCourseIds.has(prereq.requiredCourseId)) {
        missingPrerequisites.push({
          courseId: prereq.requiredCourseId,
          courseName: prereq.requiredCourseName,
          type: prereq.type,
        });
      }
    }

    // 7. Construir resultado con mensaje descriptivo (RF-06.3)
    this.logPerformance(startTime, courseId);

    if (missingPrerequisites.length === 0) {
      return {
        courseId,
        courseName,
        status: 'APROBADO',
        message: `${courseName} — Aprobado. Todos los prerrequisitos están cumplidos.`,
        missingPrerequisites: [],
        validatedAt: new Date(),
      };
    }

    // RF-06.3: Mensaje claro con lista de prerrequisitos faltantes
    const missingNames = missingPrerequisites
      .map(m => `${m.courseName} (${m.type === 'PRE' ? 'Prerrequisito' : 'Correquisito'})`)
      .join(', ');

    return {
      courseId,
      courseName,
      status: 'BLOQUEADO',
      message: `${courseName} — Bloqueado por: ${missingNames}. Esta materia se excluirá del horario propuesto automáticamente.`,
      missingPrerequisites,
      validatedAt: new Date(),
    };
  }

  /**
   * Valida múltiples materias en lote para un estudiante.
   * Útil para el generador de horarios (US-05) y la vista del estudiante.
   * 
   * @param studentId ID del estudiante.
   * @param courseIds Lista de IDs de materias a validar.
   * @returns Resultado consolidado con todas las validaciones.
   */
  async executeBatch(studentId: string, courseIds: string[]): Promise<BatchValidationResult> {
    const results: PrerequisiteValidationResult[] = [];

    for (const courseId of courseIds) {
      const result = await this.execute(studentId, courseId);
      results.push(result);
    }

    const totalApproved = results.filter(r => r.status === 'APROBADO').length;
    const totalBlocked = results.filter(r => r.status === 'BLOQUEADO').length;

    return {
      studentId,
      results,
      totalEvaluated: results.length,
      totalApproved,
      totalBlocked,
      validatedAt: new Date(),
    };
  }

  /**
   * Precarga el grafo de prerrequisitos en caché para mejorar rendimiento.
   * RNF-06.2: El grafo de pensum debe cachearse en memoria.
   * 
   * @param programId ID del programa académico.
   */
  async preloadCache(programId: string): Promise<void> {
    console.log(`[US-06] Precargando grafo de prerrequisitos para programa: ${programId}`);
    this.prerequisiteCache = await this.prerequisiteRepository.getFullPrerequisiteGraph(programId);
    console.log(`[US-06] Grafo cacheado: ${this.prerequisiteCache.size} materias con prerrequisitos`);
  }

  /**
   * Limpia la caché del grafo de prerrequisitos.
   */
  clearCache(): void {
    this.prerequisiteCache = null;
    console.log('[US-06] Caché de prerrequisitos limpiada');
  }

  /** Registra el tiempo de ejecución para monitorear RNF-06.1 (< 100ms) */
  private logPerformance(startTime: number, courseId: string): void {
    const elapsed = Date.now() - startTime;
    if (elapsed > 100) {
      console.warn(`[US-06] ⚠️ Validación de ${courseId} tomó ${elapsed}ms (límite: 100ms)`);
    }
  }
}