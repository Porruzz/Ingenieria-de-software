import {
  ScheduleGenerationInput,
  ScheduleGenerationResult,
  GeneratedSchedule,
} from '../../domain/entities/schedule';
import { CourseOfferingPort } from '../ports/course-offering.port';
import { ScheduleRepositoryPort } from '../ports/schedule-repository.port';
import { ScheduleEngine } from '../engine/schedule-engine';

/**
 * US-05: Caso de Uso — Generación de Horario Óptimo Proactivo.
 * 
 * Orquesta el flujo completo de generación de horarios:
 * 1. Recibe la entrada del estudiante (historial, zonas, desplazamiento).
 * 2. Consulta la oferta académica del semestre.
 * 3. Invoca el motor de optimización (ScheduleEngine).
 * 4. Persiste las propuestas generadas.
 * 5. Retorna las propuestas ordenadas por puntaje.
 * 
 * Patrón: Arquitectura Hexagonal con inyección de dependencias.
 * Similar a SyncAcademicHistory (US-02) en su estructura.
 */
export class GenerateOptimalSchedule {
  private readonly engine: ScheduleEngine;


  /**
   * Inyección de dependencias mediante puertos (Hexagonal Architecture).
   * @param courseOffering Adaptador para la oferta académica del semestre.
   * @param scheduleRepository Adaptador para persistencia de propuestas.
   */
  constructor(
    private readonly courseOffering: CourseOfferingPort,
    private readonly scheduleRepository: ScheduleRepositoryPort
  ) {
    this.engine = new ScheduleEngine();
  }

  /**
   * Ejecuta la generación completa de propuestas de horario.
   * 
   * RF-05.1: Recibe historial, zonas, desplazamiento y oferta.
   * RF-05.2: Genera mínimo 3 propuestas ordenadas por puntaje.
   * RF-05.4: Invoca validación de prerrequisitos antes de incluir materias.
   * RNF-05.1: Debe completarse en menos de 5 segundos.
   * 
   * @param input Datos del estudiante y sus restricciones.
   * @param period Período académico (ej: "2026-2").
   * @returns Resultado con las propuestas generadas y métricas.
   */
  async execute(input: ScheduleGenerationInput, period: string): Promise<ScheduleGenerationResult> {
    const startTime = Date.now();

    console.log(`[US-05] Iniciando generación de horario óptimo para: ${input.studentId}`);
    console.log(`[US-05] Restricciones: ${input.forbiddenZones.length} zonas prohibidas, ` +
      `${input.commuteTimeMinutes} min desplazamiento, ` +
      `${input.pinnedSectionIds.length} secciones ancladas`);

    // ─── PASO 1: Obtener oferta académica del semestre ───
    const availableSections = await this.courseOffering.getAvailableSections(period);
    console.log(`[US-05] Oferta académica cargada: ${availableSections.length} secciones disponibles`);

    // ─── PASO 2: Construir mapa de prerrequisitos (RF-05.4 → US-06) ───
    const prerequisitesMap = new Map<string, string[]>();
    const uniqueCourseIds = [...new Set(availableSections.map(s => s.courseId))];

    for (const courseId of uniqueCourseIds) {
      const prereqs = await this.courseOffering.getPrerequisites(courseId);
      prerequisitesMap.set(courseId, prereqs);
    }
    console.log(`[US-05] Mapa de prerrequisitos construido para ${uniqueCourseIds.length} materias`);

    // ─── PASO 3: Invocar el motor de optimización ───
    const proposals = this.engine.generateProposals(input, availableSections, prerequisitesMap);
    console.log(`[US-05] Motor generó ${proposals.length} propuestas`);

    // ─── PASO 4: Persistir las propuestas generadas ───
    for (const proposal of proposals) {
      await this.scheduleRepository.saveSchedule(proposal);
    }

    const generationTimeMs = Date.now() - startTime;

    // RNF-05.1: Verificar performance
    if (generationTimeMs > 5000) {
      console.warn(`[US-05] ⚠️ ADVERTENCIA: La generación tomó ${generationTimeMs}ms (límite: 5000ms)`);
    } else {
      console.log(`[US-05] ✅ Generación completada en ${generationTimeMs}ms (dentro del límite de 5s)`);
    }

    return {
      proposals,
      generationTimeMs,
      totalCombinationsEvaluated: proposals.length,
    };
  }

  /**
   * RF-05.5: Permite al estudiante anclar una sección y regenerar.
   * Toma una propuesta existente, fija la sección seleccionada y regenera.
   */
  async regenerateWithPin(
    input: ScheduleGenerationInput,
    period: string,
    pinSectionId: string
  ): Promise<ScheduleGenerationResult> {
    console.log(`[US-05] Regenerando con sección anclada: ${pinSectionId}`);

    const updatedInput: ScheduleGenerationInput = {
      ...input,
      pinnedSectionIds: [...input.pinnedSectionIds, pinSectionId],
    };

    return this.execute(updatedInput, period);
  }

  /**
   * RF-05.7: Permite al estudiante aceptar una propuesta.
   */
  async acceptProposal(scheduleId: string): Promise<void> {
    console.log(`[US-05] Propuesta aceptada: ${scheduleId}`);
    await this.scheduleRepository.updateStatus(scheduleId, 'ACEPTADO');
  }

  /**
   * RF-05.7: Permite al estudiante rechazar una propuesta.
   */
  async rejectProposal(scheduleId: string): Promise<void> {
    console.log(`[US-05] Propuesta rechazada: ${scheduleId}`);
    await this.scheduleRepository.updateStatus(scheduleId, 'RECHAZADO');
  }
}
