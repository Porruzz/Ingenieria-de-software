import {
  TimeBlock,
  CourseSection,
  ScheduleItem,
  GeneratedSchedule,
  ScoreBreakdown,
  ScheduleGenerationInput,
} from '../../domain/entities/schedule';

/**
 * US-05: Motor de Optimización de Horarios.
 * RNF-05.2: Servicio independiente (separado del caso de uso).
 * RNF-05.3: Lógica de scoring documentada para auditoría académica.
 * 
 * ALGORITMO DE SCORING (Documentación para Auditoría):
 * ═══════════════════════════════════════════════════
 * El puntaje total (0-100) se calcula con los siguientes pesos:
 *   - Maximización de créditos:      30% (entre más créditos, mejor avance curricular)
 *   - Minimización de huecos:        20% (menos tiempo muerto entre clases)
 *   - Priorización de repitencia:    25% (materias perdidas tienen prioridad)
 *   - Respeto de desplazamiento:     10% (tiempo suficiente entre clases en distintos campus)
 *   - Respeto de zonas prohibidas:   15% (no violar horarios de trabajo/bienestar)
 */
export class ScheduleEngine {

  // ═══════════════════════════════════════════════════
  // PESOS DEL ALGORITMO DE SCORING (RNF-05.3)
  // ═══════════════════════════════════════════════════
  private static readonly WEIGHT_CREDITS = 0.30;
  private static readonly WEIGHT_GAPS = 0.20;
  private static readonly WEIGHT_FAILED = 0.25;
  private static readonly WEIGHT_COMMUTE = 0.10;
  private static readonly WEIGHT_ZONES = 0.15;

  // Límite de créditos por defecto si no se especifica
  private static readonly DEFAULT_MAX_CREDITS = 22;

  /**
   * Genera múltiples propuestas de horario óptimas.
   * RF-05.2: Al menos 3 propuestas ordenadas por puntaje.
   * RNF-05.1: Debe completarse en menos de 5 segundos.
   */
  generateProposals(
    input: ScheduleGenerationInput,
    availableSections: CourseSection[],
    prerequisitesMap: Map<string, string[]>
  ): GeneratedSchedule[] {
    const startTime = Date.now();
    const maxCredits = input.maxCredits ?? ScheduleEngine.DEFAULT_MAX_CREDITS;

    // ─── PASO 1: Filtrar secciones elegibles ───
    const eligibleSections = this.filterEligibleSections(
      availableSections,
      input.approvedCourseIds,
      prerequisitesMap
    );

    // ─── PASO 2: Agrupar secciones por materia ───
    const sectionsByCourse = this.groupSectionsByCourse(eligibleSections);

    // ─── PASO 3: Separar materias ancladas de las libres ───
    const { pinnedSections, freeCourseGroups } = this.separatePinnedSections(
      sectionsByCourse,
      input.pinnedSectionIds
    );

    // ─── PASO 4: Generar combinaciones válidas ───
    const combinations = this.generateValidCombinations(
      freeCourseGroups,
      pinnedSections,
      input.forbiddenZones,
      input.commuteTimeMinutes,
      maxCredits,
      input.criticalCourseIds || []
    );

    // ─── PASO 5: Calcular puntaje de cada combinación ───
    const scoredSchedules = combinations.map((items, index) =>
      this.buildScheduleProposal(
        `schedule-${Date.now()}-${index}`,
        input.studentId,
        items,
        input.failedCourseIds,
        input.forbiddenZones,
        input.commuteTimeMinutes,
        maxCredits
      )
    );

    // ─── PASO 6: Ordenar por puntaje descendente y tomar las mejores ───
    scoredSchedules.sort((a, b) => b.score - a.score);

    const elapsedMs = Date.now() - startTime;
    console.log(`[ScheduleEngine] ${combinations.length} combinaciones evaluadas en ${elapsedMs}ms`);

    // RF-05.2: Retornar mínimo 3 propuestas (o las que haya)
    return scoredSchedules.slice(0, Math.max(3, Math.min(scoredSchedules.length, 5)));
  }

  // ═══════════════════════════════════════════════════════════
  //  MÉTODOS INTERNOS DEL MOTOR
  // ═══════════════════════════════════════════════════════════

  /**
   * Filtra secciones eliminando:
   * - Materias ya aprobadas
   * - Materias sin prerrequisitos cumplidos (US-06 integrada - RF-05.4)
   * - Secciones sin cupo
   */
  private filterEligibleSections(
    sections: CourseSection[],
    approvedCourseIds: string[],
    prerequisitesMap: Map<string, string[]>
  ): CourseSection[] {
    return sections.filter(section => {
      // No incluir materias ya aprobadas
      if (approvedCourseIds.includes(section.courseId)) return false;

      // No incluir secciones sin cupo disponible
      if (section.enrolledCount >= section.capacity) return false;

      // RF-05.4: Validar prerrequisitos (invoca lógica de US-06)
      const prerequisites = prerequisitesMap.get(section.courseId) || [];
      const hasAllPrereqs = prerequisites.every(preReqId =>
        approvedCourseIds.includes(preReqId)
      );
      if (!hasAllPrereqs) {
        console.log(
          `[ScheduleEngine] ${section.courseName} — Bloqueada por prerrequisitos: ` +
          `${prerequisites.filter(p => !approvedCourseIds.includes(p)).join(', ')}`
        );
        return false;
      }

      return true;
    });
  }

  /** Agrupa las secciones disponibles por materia */
  private groupSectionsByCourse(sections: CourseSection[]): Map<string, CourseSection[]> {
    const groups = new Map<string, CourseSection[]>();
    for (const section of sections) {
      const existing = groups.get(section.courseId) || [];
      existing.push(section);
      groups.set(section.courseId, existing);
    }
    return groups;
  }

  /** Separa las secciones ancladas (RF-05.5) de las libres */
  private separatePinnedSections(
    sectionsByCourse: Map<string, CourseSection[]>,
    pinnedSectionIds: string[]
  ): { pinnedSections: ScheduleItem[]; freeCourseGroups: CourseSection[][] } {
    const pinnedSections: ScheduleItem[] = [];
    const freeCourseGroups: CourseSection[][] = [];

    for (const [_courseId, sections] of sectionsByCourse) {
      const pinnedSection = sections.find(s => pinnedSectionIds.includes(s.id));
      if (pinnedSection) {
        pinnedSections.push({ section: pinnedSection, isPinned: true });
      } else {
        freeCourseGroups.push(sections);
      }
    }

    return { pinnedSections, freeCourseGroups };
  }

  /**
   * Genera combinaciones válidas de secciones.
   * Usa backtracking con poda para evitar:
   * - Choques de horario entre secciones
   * - Violaciones de zonas prohibidas
   * - Exceso de créditos
   */
  private generateValidCombinations(
    freeCourseGroups: CourseSection[][],
    pinnedSections: ScheduleItem[],
    forbiddenZones: TimeBlock[],
    commuteTimeMinutes: number,
    maxCredits: number,
    criticalCourseIds: string[]
  ): ScheduleItem[][] {
    const results: ScheduleItem[][] = [];
    const pinnedCredits = pinnedSections.reduce((sum, item) => sum + item.section.credits, 0);

    // Limitar la exploración para cumplir RNF-05.1 (< 5 segundos)
    const MAX_COMBINATIONS = 200;

    const backtrack = (
      courseIndex: number,
      currentItems: ScheduleItem[],
      currentCredits: number
    ): void => {
      // Condición de parada: ya evaluamos todas las materias o alcanzamos el límite
      if (results.length >= MAX_COMBINATIONS) return;

      // Guardar la combinación actual si tiene al menos 1 materia
      if (currentItems.length > 0) {
        results.push([...pinnedSections, ...currentItems]);
      }

      if (courseIndex >= freeCourseGroups.length) return;

      // Para cada materia restante, probar cada sección
      for (let i = courseIndex; i < freeCourseGroups.length; i++) {
        const sections = freeCourseGroups[i];
        for (const section of sections) {
          // Poda: ¿excede créditos?
          if (currentCredits + section.credits > maxCredits) continue;

          // Poda: ¿choca con secciones ya seleccionadas o zonas prohibidas?
          const allCurrentSections = [
            ...pinnedSections.map(p => p.section),
            ...currentItems.map(it => it.section),
          ];

          if (this.hasTimeConflict(section, allCurrentSections)) continue;
          
          // RF-07.5: Si es materia crítica, sobreescribe las zonas de bienestar
          const isCritical = criticalCourseIds.includes(section.courseId);
          if (!isCritical && this.violatesForbiddenZones(section, forbiddenZones)) continue;

          // Si pasa las validaciones, agregar y seguir explorando
          currentItems.push({ section, isPinned: false });
          backtrack(i + 1, currentItems, currentCredits + section.credits);
          currentItems.pop();
        }
      }
    };

    backtrack(0, [], pinnedCredits);

    // Si no se generaron combinaciones, retornar al menos las ancladas
    if (results.length === 0 && pinnedSections.length > 0) {
      results.push([...pinnedSections]);
    }

    return results;
  }

  /**
   * Detecta si una sección choca con las secciones ya seleccionadas.
   * Considera el tiempo de desplazamiento entre campus distintos.
   */
  private hasTimeConflict(newSection: CourseSection, existingSections: CourseSection[]): boolean {
    for (const existing of existingSections) {
      for (const newBlock of newSection.schedule) {
        for (const existingBlock of existing.schedule) {
          if (newBlock.day !== existingBlock.day) continue;

          const newStart = this.timeToMinutes(newBlock.startTime);
          const newEnd = this.timeToMinutes(newBlock.endTime);
          const existStart = this.timeToMinutes(existingBlock.startTime);
          const existEnd = this.timeToMinutes(existingBlock.endTime);

          // Verificar solapamiento temporal
          if (newStart < existEnd && newEnd > existStart) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /** Verifica si una sección viola las zonas prohibidas del estudiante (US-01) */
  private violatesForbiddenZones(section: CourseSection, forbiddenZones: TimeBlock[]): boolean {
    for (const block of section.schedule) {
      for (const zone of forbiddenZones) {
        if (block.day !== zone.day) continue;

        const blockStart = this.timeToMinutes(block.startTime);
        const blockEnd = this.timeToMinutes(block.endTime);
        const zoneStart = this.timeToMinutes(zone.startTime);
        const zoneEnd = this.timeToMinutes(zone.endTime);

        if (blockStart < zoneEnd && blockEnd > zoneStart) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Construye una propuesta de horario con su puntaje detallado.
   * RNF-05.3: Documenta la lógica de scoring para auditoría.
   */
  private buildScheduleProposal(
    id: string,
    studentId: string,
    items: ScheduleItem[],
    failedCourseIds: string[],
    forbiddenZones: TimeBlock[],
    commuteTimeMinutes: number,
    maxCredits: number
  ): GeneratedSchedule {
    const totalCredits = items.reduce((sum, item) => sum + item.section.credits, 0);
    const totalGaps = this.calculateGaps(items);
    const failedCoursesIncluded = items.filter(
      item => failedCourseIds.includes(item.section.courseId)
    ).length;

    const scoreBreakdown = this.calculateScore(
      items,
      totalCredits,
      totalGaps,
      failedCourseIds,
      forbiddenZones,
      commuteTimeMinutes,
      maxCredits
    );

    const totalScore =
      scoreBreakdown.creditScore * ScheduleEngine.WEIGHT_CREDITS +
      scoreBreakdown.gapScore * ScheduleEngine.WEIGHT_GAPS +
      scoreBreakdown.failedCourseScore * ScheduleEngine.WEIGHT_FAILED +
      scoreBreakdown.commuteScore * ScheduleEngine.WEIGHT_COMMUTE +
      scoreBreakdown.zoneScore * ScheduleEngine.WEIGHT_ZONES;

    return {
      id,
      studentId,
      items,
      totalCredits,
      totalGaps,
      failedCoursesIncluded,
      score: Math.round(totalScore * 100) / 100,
      scoreBreakdown,
      status: 'PROPUESTO',
      createdAt: new Date(),
    };
  }

  /**
   * SISTEMA DE SCORING DETALLADO (RNF-05.3 — Para auditoría académica)
   * ═══════════════════════════════════════════════════════════════════
   * Cada componente retorna un valor entre 0 y 100.
   */
  private calculateScore(
    items: ScheduleItem[],
    totalCredits: number,
    totalGaps: number,
    failedCourseIds: string[],
    forbiddenZones: TimeBlock[],
    commuteTimeMinutes: number,
    maxCredits: number
  ): ScoreBreakdown {
    // ── 1. CRÉDITOS (30%): A más créditos, mayor avance curricular ──
    // Score lineal: (créditos inscritos / máximo permitido) * 100
    const creditScore = Math.min(100, (totalCredits / maxCredits) * 100);

    // ── 2. HUECOS (20%): Penalizar huecos entre clases en el mismo día ──
    // 0 huecos = 100 puntos, cada hueco resta 15 puntos
    const gapScore = Math.max(0, 100 - totalGaps * 15);

    // ── 3. MATERIAS PERDIDAS (25%): Priorizar repitencia ──
    // Si hay materias perdidas disponibles, se premia incluir la mayor cantidad
    const totalFailed = failedCourseIds.length;
    const failedIncluded = items.filter(it => failedCourseIds.includes(it.section.courseId)).length;
    const failedCourseScore = totalFailed > 0
      ? (failedIncluded / totalFailed) * 100
      : 100; // Si no hay materias perdidas, puntaje perfecto

    // ── 4. DESPLAZAMIENTO (10%): Verificar que haya tiempo entre clases ──
    const commuteViolations = this.countCommuteViolations(items, commuteTimeMinutes);
    const commuteScore = Math.max(0, 100 - commuteViolations * 25);

    // ── 5. ZONAS PROHIBIDAS (15%): Nunca deben violarse ──
    const zoneViolations = this.countZoneViolations(items, forbiddenZones);
    const zoneScore = zoneViolations === 0 ? 100 : 0; // Binario: cumple o no cumple

    return { creditScore, gapScore, failedCourseScore, commuteScore, zoneScore };
  }

  /** Calcula la cantidad de huecos entre clases en el mismo día */
  private calculateGaps(items: ScheduleItem[]): number {
    const blocksByDay = new Map<string, { start: number; end: number }[]>();

    for (const item of items) {
      for (const block of item.section.schedule) {
        const dayBlocks = blocksByDay.get(block.day) || [];
        dayBlocks.push({
          start: this.timeToMinutes(block.startTime),
          end: this.timeToMinutes(block.endTime),
        });
        blocksByDay.set(block.day, dayBlocks);
      }
    }

    let gaps = 0;
    for (const [_day, blocks] of blocksByDay) {
      if (blocks.length < 2) continue;
      blocks.sort((a, b) => a.start - b.start);

      for (let i = 1; i < blocks.length; i++) {
        const gapMinutes = blocks[i].start - blocks[i - 1].end;
        // Un hueco se cuenta si hay más de 30 minutos entre clases
        if (gapMinutes > 30) {
          gaps++;
        }
      }
    }

    return gaps;
  }

  /** Cuenta violaciones de tiempo de desplazamiento entre campus distintos */
  private countCommuteViolations(items: ScheduleItem[], commuteTimeMinutes: number): number {
    const blocksByDay = new Map<string, { start: number; end: number; campus: string }[]>();

    for (const item of items) {
      for (const block of item.section.schedule) {
        const dayBlocks = blocksByDay.get(block.day) || [];
        dayBlocks.push({
          start: this.timeToMinutes(block.startTime),
          end: this.timeToMinutes(block.endTime),
          campus: item.section.campus,
        });
        blocksByDay.set(block.day, dayBlocks);
      }
    }

    let violations = 0;
    for (const [_day, blocks] of blocksByDay) {
      if (blocks.length < 2) continue;
      blocks.sort((a, b) => a.start - b.start);

      for (let i = 1; i < blocks.length; i++) {
        const timeBetween = blocks[i].start - blocks[i - 1].end;
        const differentCampus = blocks[i].campus !== blocks[i - 1].campus;

        // Si están en campus distintos y no hay suficiente tiempo de desplazamiento
        if (differentCampus && timeBetween < commuteTimeMinutes) {
          violations++;
        }
      }
    }

    return violations;
  }

  /** Cuenta cuántas secciones violan zonas prohibidas */
  private countZoneViolations(items: ScheduleItem[], forbiddenZones: TimeBlock[]): number {
    let violations = 0;
    for (const item of items) {
      if (this.violatesForbiddenZones(item.section, forbiddenZones)) {
        violations++;
      }
    }
    return violations;
  }

  /** Convierte un string de hora "HH:MM" a minutos desde medianoche */
  public timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
