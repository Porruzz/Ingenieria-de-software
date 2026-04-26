import { CalculateCriticalityUseCase } from '../application/use-cases/calculate-criticality.use-case';
import { CriticalSubjectRepositoryPort } from '../application/ports/critical-subject-repository.port';
import { PrerequisiteRepositoryPort } from '../application/ports/prerequisite-repository.port';
import { ScheduleEngine } from '../application/engine/schedule-engine';
import { PrerequisiteRelation } from '../domain/entities/prerequisite';
import { FailedCourseHistory } from '../domain/entities/critical-subject';
import { CourseSection, ScheduleGenerationInput } from '../domain/entities/schedule';

describe('US-07 — Priorización de Materias Críticas', () => {
  let criticalRepo: jest.Mocked<CriticalSubjectRepositoryPort>;
  let prereqRepo: jest.Mocked<PrerequisiteRepositoryPort>;
  let useCase: CalculateCriticalityUseCase;

  beforeEach(() => {
    criticalRepo = {
      getFailedCourses: jest.fn(),
      savePriorityCalculation: jest.fn(),
      getPriorityCalculations: jest.fn(),
    };

    prereqRepo = {
      getFullPrerequisiteGraph: jest.fn(),
      getPrerequisitesForCourse: jest.fn(),
      getCourseName: jest.fn(),
      courseExists: jest.fn(),
    };

    useCase = new CalculateCriticalityUseCase(criticalRepo, prereqRepo);
  });

  // ═══════════════════════════════════════════════════
  // RF-07.2: Cálculo del Índice de Criticidad Curricular
  // ═══════════════════════════════════════════════════
  test('RF-07.2: Debería calcular correctamente el IC basado en materias desbloqueadas', async () => {
    // Escenario: Materia A desbloquea Materia B y Materia C. Materia B desbloquea Materia D.
    // Total desbloqueadas por A: 3 (B, C, D).
    
    const studentId = 'STUDENT_01';
    const programId = 'ING_SOFT';

    criticalRepo.getFailedCourses.mockResolvedValue([
      { idReprobo: '1', studentId, courseId: 'MAT_A', previousAttempts: 1, lastFailedPeriod: '2026-1' }
    ]);

    const mockGraph = new Map<string, PrerequisiteRelation[]>();
    mockGraph.set('MAT_B', [{ courseId: 'MAT_B', requiredCourseId: 'MAT_A', requiredCourseName: 'A', type: 'PRE' }]);
    mockGraph.set('MAT_C', [{ courseId: 'MAT_C', requiredCourseId: 'MAT_A', requiredCourseName: 'A', type: 'PRE' }]);
    mockGraph.set('MAT_D', [{ courseId: 'MAT_D', requiredCourseId: 'MAT_B', requiredCourseName: 'B', type: 'PRE' }]);

    prereqRepo.getFullPrerequisiteGraph.mockResolvedValue(mockGraph);
    prereqRepo.getCourseName.mockImplementation(async (id) => `Name_${id}`);

    const reports = await useCase.execute(studentId, programId);

    expect(reports.length).toBe(1);
    const report = reports[0];

    // Calculo esperado: (3 desbloqueadas * 0.15) + (1 intento * 0.1) = 0.45 + 0.1 = 0.55
    expect(report.unlockedCoursesCount).toBe(3);
    expect(report.criticalityIndex).toBeCloseTo(0.55);
    expect(report.unlockedCourses).toContain('Name_MAT_B');
    expect(report.unlockedCourses).toContain('Name_MAT_D');
  });

  // ═══════════════════════════════════════════════════
  // RF-07.5: Sobreescritura de Preferencias de Bienestar
  // ═══════════════════════════════════════════════════
  test('RF-07.5: El motor de horarios debe permitir materias críticas en zonas prohibidas', () => {
    const engine = new ScheduleEngine();
    
    const sections: CourseSection[] = [
      {
        id: 'SEC_CRITICAL', courseId: 'MAT_CRITICAL', courseName: 'Materia Muy Critica',
        sectionCode: 'A', credits: 4, professor: 'Dr. X', campus: 'Central',
        capacity: 30, enrolledCount: 10,
        schedule: [{ day: 'Lunes', startTime: '18:00', endTime: '20:00' }], // Choca con zona
      }
    ];

    const input: ScheduleGenerationInput = {
      studentId: 'TEST_STUDENT',
      approvedCourseIds: [],
      failedCourseIds: ['MAT_CRITICAL'],
      criticalCourseIds: ['MAT_CRITICAL'], // Marcada como crítica (IC >= 0.80)
      forbiddenZones: [
        { day: 'Lunes', startTime: '17:00', endTime: '22:00' } // Zona de bienestar
      ],
      commuteTimeMinutes: 0,
      pinnedSectionIds: [],
    };

    const proposals = engine.generateProposals(input, sections, new Map());

    // DEBE aparecer la propuesta a pesar del choque, porque es crítica
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals[0].items[0].section.courseId).toBe('MAT_CRITICAL');
  });

  test('RF-07.5: No debe permitir materias NO críticas en zonas prohibidas', () => {
    const engine = new ScheduleEngine();
    
    const sections: CourseSection[] = [
      {
        id: 'SEC_FAILED', courseId: 'MAT_FAILED', courseName: 'Materia Fallida Normal',
        sectionCode: 'A', credits: 4, professor: 'Dr. Y', campus: 'Central',
        capacity: 30, enrolledCount: 10,
        schedule: [{ day: 'Lunes', startTime: '18:00', endTime: '20:00' }], // Choca
      }
    ];

    const input: ScheduleGenerationInput = {
      studentId: 'TEST_STUDENT',
      approvedCourseIds: [],
      failedCourseIds: ['MAT_FAILED'],
      criticalCourseIds: [], // NO es crítica (IC < 0.80)
      forbiddenZones: [
        { day: 'Lunes', startTime: '17:00', endTime: '22:00' }
      ],
      commuteTimeMinutes: 0,
      pinnedSectionIds: [],
    };

    const proposals = engine.generateProposals(input, sections, new Map());

    // NO debe haber propuestas porque la única sección viola la zona y no es crítica
    expect(proposals.length).toBe(0);
  });
});
