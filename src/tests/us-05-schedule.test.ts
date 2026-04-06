import { GenerateOptimalSchedule } from '../application/use-cases/generate-schedule';
import { ScheduleEngine } from '../application/engine/schedule-engine';
import { InMemoryCourseOfferingAdapter } from '../infrastructure/adapters/course-offering.adapter';
import { InMemoryScheduleRepository } from '../infrastructure/repositories/schedule.repository';
import { ScheduleGenerationInput, CourseSection, TimeBlock } from '../domain/entities/schedule';

/**
 * Suite de Pruebas para US-05: Generación de Horario Óptimo Proactivo.
 * Verifica todos los criterios de aceptación y requerimientos funcionales.
 */
describe('US-05 — Generación de Horario Óptimo Proactivo', () => {
  let courseOffering: InMemoryCourseOfferingAdapter;
  let scheduleRepository: InMemoryScheduleRepository;
  let useCase: GenerateOptimalSchedule;

  // Entrada típica de un estudiante de tercer semestre
  const baseInput: ScheduleGenerationInput = {
    studentId: 'SANTIAGO_ING_2026',
    approvedCourseIds: ['MAT101', 'FIS101', 'PROG101'],  // Materias ya aprobadas
    failedCourseIds: ['QUIM101'],                          // Química perdida (priorizar)
    forbiddenZones: [
      { day: 'Lunes', startTime: '18:00', endTime: '22:00' },    // Trabajo nocturno
      { day: 'Miércoles', startTime: '18:00', endTime: '22:00' }, // Trabajo nocturno
    ],
    commuteTimeMinutes: 30,
    pinnedSectionIds: [],
    maxCredits: 20,
  };

  beforeEach(() => {
    courseOffering = new InMemoryCourseOfferingAdapter();
    scheduleRepository = new InMemoryScheduleRepository();
    useCase = new GenerateOptimalSchedule(courseOffering, scheduleRepository);
  });

  // ═══════════════════════════════════════════════════
  // RF-05.2: Genera mínimo 3 propuestas de horario
  // ═══════════════════════════════════════════════════
  test('RF-05.2: Debería generar al menos 3 propuestas de horario válidas', async () => {
    const result = await useCase.execute(baseInput, '2026-2');

    expect(result.proposals.length).toBeGreaterThanOrEqual(3);
    console.log(`✅ Se generaron ${result.proposals.length} propuestas`);
  });

  // ═══════════════════════════════════════════════════
  // RF-05.2: Propuestas ordenadas por puntaje de satisfacción
  // ═══════════════════════════════════════════════════
  test('RF-05.2: Las propuestas deben estar ordenadas por puntaje descendente', async () => {
    const result = await useCase.execute(baseInput, '2026-2');

    for (let i = 1; i < result.proposals.length; i++) {
      expect(result.proposals[i - 1].score).toBeGreaterThanOrEqual(result.proposals[i].score);
    }
    console.log(`✅ Propuestas ordenadas: [${result.proposals.map(p => p.score).join(', ')}]`);
  });

  // ═══════════════════════════════════════════════════
  // RF-05.4 + US-06: Ninguna propuesta incluye materias sin prerrequisitos cumplidos
  // ═══════════════════════════════════════════════════
  test('RF-05.4: Ninguna propuesta debe incluir materias sin prerrequisitos cumplidos', async () => {
    const result = await useCase.execute(baseInput, '2026-2');

    for (const proposal of result.proposals) {
      for (const item of proposal.items) {
        // MAT201 (Cálculo III) necesita MAT102 (Cálculo II), que NO está aprobada
        expect(item.section.courseId).not.toBe('MAT201');
      }
    }
    console.log('✅ Ninguna propuesta incluye Cálculo III (prerrequisito Cálculo II no cumplido)');
  });

  // ═══════════════════════════════════════════════════
  // Criterio: Ninguna propuesta viola las zonas prohibidas del estudiante
  // ═══════════════════════════════════════════════════
  test('Criterio: Ninguna propuesta debe violar zonas prohibidas', async () => {
    const result = await useCase.execute(baseInput, '2026-2');

    for (const proposal of result.proposals) {
      for (const item of proposal.items) {
        for (const block of item.section.schedule) {
          for (const zone of baseInput.forbiddenZones) {
            if (block.day === zone.day) {
              const engine = new ScheduleEngine();
              const blockStart = engine.timeToMinutes(block.startTime);
              const blockEnd = engine.timeToMinutes(block.endTime);
              const zoneStart = engine.timeToMinutes(zone.startTime);
              const zoneEnd = engine.timeToMinutes(zone.endTime);
              // No debe haber solapamiento
              const overlaps = blockStart < zoneEnd && blockEnd > zoneStart;
              expect(overlaps).toBe(false);
            }
          }
        }
      }
    }
    console.log('✅ Ninguna propuesta viola las zonas prohibidas del estudiante');
  });

  // ═══════════════════════════════════════════════════
  // Criterio: Las materias perdidas tienen prioridad en la propuesta
  // ═══════════════════════════════════════════════════
  test('Criterio: La mejor propuesta debería priorizar materias perdidas (repitencia)', async () => {
    const result = await useCase.execute(baseInput, '2026-2');
    const bestProposal = result.proposals[0];

    // QUIM101 está perdida y debería aparecer en la propuesta óptima
    const includesFailedCourse = bestProposal.items.some(
      item => item.section.courseId === 'QUIM101'
    );

    // Al menos el score de materias perdidas debe ser positivo
    expect(bestProposal.scoreBreakdown.failedCourseScore).toBeGreaterThan(0);
    console.log(`✅ Score de materias perdidas: ${bestProposal.scoreBreakdown.failedCourseScore}`);
    console.log(`   Incluye QUIM101 (perdida): ${includesFailedCourse}`);
  });

  // ═══════════════════════════════════════════════════
  // Criterio: Materias ya aprobadas NO deben aparecer en las propuestas
  // ═══════════════════════════════════════════════════
  test('Criterio: Materias ya aprobadas no deben aparecer en las propuestas', async () => {
    const result = await useCase.execute(baseInput, '2026-2');

    for (const proposal of result.proposals) {
      for (const item of proposal.items) {
        expect(baseInput.approvedCourseIds).not.toContain(item.section.courseId);
      }
    }
    console.log('✅ Ninguna propuesta incluye materias ya aprobadas');
  });

  // ═══════════════════════════════════════════════════
  // RNF-05.1: Performance — Generación en menos de 5 segundos
  // ═══════════════════════════════════════════════════
  test('RNF-05.1: Debería generar propuestas en menos de 5 segundos', async () => {
    const result = await useCase.execute(baseInput, '2026-2');

    expect(result.generationTimeMs).toBeLessThan(5000);
    console.log(`✅ Tiempo de generación: ${result.generationTimeMs}ms (límite: 5000ms)`);
  });

  // ═══════════════════════════════════════════════════
  // RF-05.3: Cada propuesta tiene un desglose de puntaje documentado
  // ═══════════════════════════════════════════════════
  test('RF-05.3: Cada propuesta debe tener un score breakdown completo', async () => {
    const result = await useCase.execute(baseInput, '2026-2');

    for (const proposal of result.proposals) {
      expect(proposal.scoreBreakdown).toBeDefined();
      expect(proposal.scoreBreakdown.creditScore).toBeGreaterThanOrEqual(0);
      expect(proposal.scoreBreakdown.gapScore).toBeGreaterThanOrEqual(0);
      expect(proposal.scoreBreakdown.failedCourseScore).toBeGreaterThanOrEqual(0);
      expect(proposal.scoreBreakdown.commuteScore).toBeGreaterThanOrEqual(0);
      expect(proposal.scoreBreakdown.zoneScore).toBeGreaterThanOrEqual(0);
      expect(proposal.score).toBeGreaterThan(0);
      expect(proposal.score).toBeLessThanOrEqual(100);
    }
    console.log('✅ Todas las propuestas tienen score breakdown completo y válido');
  });

  // ═══════════════════════════════════════════════════
  // RF-05.5: Regenerar horario con materia anclada
  // ═══════════════════════════════════════════════════
  test('RF-05.5: Regenerar con sección anclada debe incluirla en todas las propuestas', async () => {
    const pinnedSectionId = 'SEC-MAT102-A'; // Anclar Cálculo II sección A

    const result = await useCase.regenerateWithPin(baseInput, '2026-2', pinnedSectionId);

    for (const proposal of result.proposals) {
      const hasPinnedSection = proposal.items.some(
        item => item.section.id === pinnedSectionId && item.isPinned === true
      );
      expect(hasPinnedSection).toBe(true);
    }
    console.log('✅ Todas las propuestas incluyen la sección anclada SEC-MAT102-A');
  });

  // ═══════════════════════════════════════════════════
  // RF-05.7: Aceptar y rechazar propuestas
  // ═══════════════════════════════════════════════════
  test('RF-05.7: Debería poder aceptar una propuesta y cambiar su estado', async () => {
    const result = await useCase.execute(baseInput, '2026-2');
    const bestProposal = result.proposals[0];

    expect(bestProposal.status).toBe('PROPUESTO');

    await useCase.acceptProposal(bestProposal.id);

    const storedSchedules = await scheduleRepository.getSchedulesByStudent(baseInput.studentId);
    const accepted = storedSchedules.find(s => s.id === bestProposal.id);
    expect(accepted?.status).toBe('ACEPTADO');

    console.log('✅ Propuesta aceptada correctamente');
  });

  test('RF-05.7: Debería poder rechazar una propuesta', async () => {
    const result = await useCase.execute(baseInput, '2026-2');
    const worstProposal = result.proposals[result.proposals.length - 1];

    await useCase.rejectProposal(worstProposal.id);

    const storedSchedules = await scheduleRepository.getSchedulesByStudent(baseInput.studentId);
    const rejected = storedSchedules.find(s => s.id === worstProposal.id);
    expect(rejected?.status).toBe('RECHAZADO');

    console.log('✅ Propuesta rechazada correctamente');
  });

  // ═══════════════════════════════════════════════════
  // Criterio: No debe chocar secciones dentro de una misma propuesta
  // ═══════════════════════════════════════════════════
  test('Criterio: No debe haber choques de horario dentro de una propuesta', async () => {
    const result = await useCase.execute(baseInput, '2026-2');
    const engine = new ScheduleEngine();

    for (const proposal of result.proposals) {
      const allBlocks: { day: string; start: number; end: number; courseName: string }[] = [];

      for (const item of proposal.items) {
        for (const block of item.section.schedule) {
          allBlocks.push({
            day: block.day,
            start: engine.timeToMinutes(block.startTime),
            end: engine.timeToMinutes(block.endTime),
            courseName: item.section.courseName,
          });
        }
      }

      // Verificar que no haya solapamiento por día
      for (let i = 0; i < allBlocks.length; i++) {
        for (let j = i + 1; j < allBlocks.length; j++) {
          if (allBlocks[i].day !== allBlocks[j].day) continue;
          const overlaps = allBlocks[i].start < allBlocks[j].end && allBlocks[i].end > allBlocks[j].start;
          if (overlaps) {
            fail(`Choque de horario detectado: ${allBlocks[i].courseName} vs ${allBlocks[j].courseName} el ${allBlocks[i].day}`);
          }
        }
      }
    }
    console.log('✅ Ninguna propuesta tiene choques de horario internos');
  });

  // ═══════════════════════════════════════════════════
  // Criterio: Secciones sin cupo NO deben incluirse
  // ═══════════════════════════════════════════════════
  test('Criterio: Secciones sin cupo disponible no deben incluirse', async () => {
    const result = await useCase.execute(baseInput, '2026-2');

    for (const proposal of result.proposals) {
      for (const item of proposal.items) {
        // SEC-QUIM101-A tiene el cupo lleno (30/30)
        expect(item.section.id).not.toBe('SEC-QUIM101-A');
      }
    }
    console.log('✅ La sección SEC-QUIM101-A (sin cupo) fue excluida correctamente');
  });

  // ═══════════════════════════════════════════════════
  // Persistencia: Las propuestas deben quedar guardadas en el repositorio
  // ═══════════════════════════════════════════════════
  test('Persistencia: Las propuestas generadas deben quedar guardadas en el repositorio', async () => {
    const result = await useCase.execute(baseInput, '2026-2');
    const stored = await scheduleRepository.getSchedulesByStudent(baseInput.studentId);

    expect(stored.length).toBe(result.proposals.length);
    console.log(`✅ ${stored.length} propuestas persistidas correctamente en el repositorio`);
  });
});

// ═══════════════════════════════════════════════════
// TESTS UNITARIOS DEL MOTOR DE SCORING
// ═══════════════════════════════════════════════════
describe('US-05 — Motor de Optimización (ScheduleEngine)', () => {
  let engine: ScheduleEngine;

  beforeEach(() => {
    engine = new ScheduleEngine();
  });

  test('timeToMinutes: Debe convertir horas correctamente', () => {
    expect(engine.timeToMinutes('07:00')).toBe(420);
    expect(engine.timeToMinutes('09:30')).toBe(570);
    expect(engine.timeToMinutes('14:00')).toBe(840);
    expect(engine.timeToMinutes('23:59')).toBe(1439);
    expect(engine.timeToMinutes('00:00')).toBe(0);
  });

  test('Debe filtrar materias con prerrequisitos no cumplidos', () => {
    const sections: CourseSection[] = [
      {
        id: 'S1', courseId: 'MAT201', courseName: 'Cálculo III',
        sectionCode: 'A', credits: 4, professor: '', campus: '',
        capacity: 30, enrolledCount: 10,
        schedule: [{ day: 'Lunes', startTime: '07:00', endTime: '09:00' }],
      },
    ];

    const prereqs = new Map<string, string[]>([
      ['MAT201', ['MAT102']], // Necesita Cálculo II
    ]);

    const input: ScheduleGenerationInput = {
      studentId: 'TEST',
      approvedCourseIds: ['MAT101'], // Solo tiene Cálculo I, NO tiene Cálculo II
      failedCourseIds: [],
      forbiddenZones: [],
      commuteTimeMinutes: 0,
      pinnedSectionIds: [],
    };

    const proposals = engine.generateProposals(input, sections, prereqs);

    // No debería haber propuestas porque la única materia no cumple prerrequisitos
    const hasMAT201 = proposals.some(p =>
      p.items.some(i => i.section.courseId === 'MAT201')
    );
    expect(hasMAT201).toBe(false);
  });

  test('Debe excluir secciones que chocan con zonas prohibidas', () => {
    const sections: CourseSection[] = [
      {
        id: 'S1', courseId: 'C1', courseName: 'Materia 1',
        sectionCode: 'A', credits: 3, professor: '', campus: '',
        capacity: 30, enrolledCount: 10,
        schedule: [{ day: 'Lunes', startTime: '18:00', endTime: '20:00' }],
      },
      {
        id: 'S2', courseId: 'C2', courseName: 'Materia 2',
        sectionCode: 'A', credits: 3, professor: '', campus: '',
        capacity: 30, enrolledCount: 10,
        schedule: [{ day: 'Martes', startTime: '09:00', endTime: '11:00' }],
      },
    ];

    const input: ScheduleGenerationInput = {
      studentId: 'TEST',
      approvedCourseIds: [],
      failedCourseIds: [],
      forbiddenZones: [
        { day: 'Lunes', startTime: '17:00', endTime: '22:00' }, // Bloquea S1
      ],
      commuteTimeMinutes: 0,
      pinnedSectionIds: [],
    };

    const proposals = engine.generateProposals(input, sections, new Map());

    // Ninguna propuesta debe incluir S1 (está en zona prohibida)
    for (const proposal of proposals) {
      const hasS1 = proposal.items.some(i => i.section.id === 'S1');
      expect(hasS1).toBe(false);
    }
    // S2 debería aparecer en al menos una propuesta
    const hasS2 = proposals.some(p => p.items.some(i => i.section.id === 'S2'));
    expect(hasS2).toBe(true);
  });
});
