import { ValidatePrerequisites } from '../application/use-cases/validate-prerequisites';
import { InMemoryPrerequisiteRepository } from '../infrastructure/repositories/prerequisite.repository';
import { EncryptedAcademicRepository } from '../infrastructure/repositories/academic.repository';
import { AESEncryptionService } from '../infrastructure/services/aes-encryption.service';
import { SyncAcademicHistory } from '../application/use-cases/sync-academic-history';
import { SiaAdapter } from '../infrastructure/adapters/sia-adapter';

/**
 * Suite de Pruebas para US-06: Validación Automática de Prerrequisitos.
 * Verifica todos los criterios de aceptación y requerimientos funcionales.
 * 
 * Criterios de Aceptación:
 * - El sistema valida correctamente prerrequisitos para una materia dada.
 * - Si faltan prerrequisitos, el mensaje indica cuáles faltan.
 * - La validación funciona en menos de 100ms.
 * - El endpoint es consumible independientemente por otros servicios.
 */
describe('US-06 — Validación Automática de Prerrequisitos', () => {
  let validatePrereqs: ValidatePrerequisites;
  let prerequisiteRepo: InMemoryPrerequisiteRepository;
  let academicRepo: EncryptedAcademicRepository;
  let encryptionService: AESEncryptionService;

  const studentId = 'TEST_STUDENT_US06';

  beforeEach(async () => {
    encryptionService = new AESEncryptionService();
    academicRepo = new EncryptedAcademicRepository(encryptionService);
    prerequisiteRepo = new InMemoryPrerequisiteRepository();
    validatePrereqs = new ValidatePrerequisites(academicRepo, prerequisiteRepo);

    // Sincronizar historial del estudiante usando US-02 (flujo integrado)
    const portalAdapter = new SiaAdapter();
    const syncService = new SyncAcademicHistory(portalAdapter, academicRepo);
    await syncService.execute(studentId, 'TEST_TOKEN');
    // El estudiante tiene aprobadas: MAT101, FIS101, PROG101
    // Perdida: QUIM101
    // Cursando: MAT102
  });

  // ═══════════════════════════════════════════════════
  // RF-06.2: Validar en tiempo real si un estudiante puede inscribir una materia
  // ═══════════════════════════════════════════════════

  test('RF-06.2: Materia sin prerrequisitos → APROBADO', async () => {
    const result = await validatePrereqs.execute(studentId, 'ALG101');

    expect(result.status).toBe('APROBADO');
    expect(result.missingPrerequisites).toHaveLength(0);
    expect(result.message).toContain('Aprobado');
    console.log(`✅ ${result.message}`);
  });

  test('RF-06.2: Materia con prerrequisitos cumplidos → APROBADO', async () => {
    // MAT102 (Cálculo II) requiere MAT101 (Cálculo I) → que SÍ está aprobada
    const result = await validatePrereqs.execute(studentId, 'MAT102');

    expect(result.status).toBe('APROBADO');
    expect(result.missingPrerequisites).toHaveLength(0);
    expect(result.message).toContain('Aprobado');
    console.log(`✅ ${result.message}`);
  });

  test('RF-06.2: Materia con prerrequisitos NO cumplidos → BLOQUEADO', async () => {
    // MAT201 (Cálculo III) requiere MAT102 (Cálculo II) → que NO está aprobada (está CURSANDO)
    const result = await validatePrereqs.execute(studentId, 'MAT201');

    expect(result.status).toBe('BLOQUEADO');
    expect(result.missingPrerequisites.length).toBeGreaterThan(0);
    console.log(`✅ ${result.message}`);
  });

  // ═══════════════════════════════════════════════════
  // RF-06.3: Mensajes claros "Aprobado" o "Bloqueado por: [lista]"
  // ═══════════════════════════════════════════════════

  test('RF-06.3: El mensaje de bloqueo debe listar los prerrequisitos faltantes', async () => {
    const result = await validatePrereqs.execute(studentId, 'MAT201');

    expect(result.message).toContain('Bloqueado por');
    expect(result.message).toContain('Cálculo II');
    expect(result.message).toContain('Prerrequisito');
    expect(result.missingPrerequisites[0].courseName).toBe('Cálculo II');
    expect(result.missingPrerequisites[0].type).toBe('PRE');
    console.log(`✅ Mensaje descriptivo: ${result.message}`);
  });

  test('RF-06.3: Materia con MÚLTIPLES prerrequisitos faltantes debe listar todos', async () => {
    // FIS102 (Física Eléctrica) requiere FIS101 (Física Mecánica) + MAT101 (Cálculo I)
    // El estudiante tiene ambas aprobadas, así que busquemos un caso con múltiples faltantes

    // Creamos un estudiante sin materias aprobadas
    const emptyStudentId = 'EMPTY_STUDENT';
    const emptyEncryption = new AESEncryptionService();
    const emptyRepo = new EncryptedAcademicRepository(emptyEncryption);

    // Guardar historial vacío
    await emptyRepo.saveHistory({
      studentId: emptyStudentId,
      records: [],
      totalCredits: 0,
      currentSemester: 1,
      lastSync: new Date(),
    });

    const emptyValidator = new ValidatePrerequisites(emptyRepo, prerequisiteRepo);
    const result = await emptyValidator.execute(emptyStudentId, 'FIS102');

    expect(result.status).toBe('BLOQUEADO');
    expect(result.missingPrerequisites).toHaveLength(2); // FIS101 + MAT101
    expect(result.message).toContain('Física Mecánica');
    expect(result.message).toContain('Cálculo I');
    console.log(`✅ Múltiples faltantes detectados: ${result.message}`);
  });

  // ═══════════════════════════════════════════════════
  // RF-06.4: Soportar pensum de múltiples programas
  // ═══════════════════════════════════════════════════

  test('RF-06.4: Debe poder cargar el grafo completo de un programa', async () => {
    const graph = await prerequisiteRepo.getFullPrerequisiteGraph('ING_SISTEMAS');

    expect(graph.size).toBeGreaterThan(0);
    // Verificar que las relaciones estén bien formadas
    for (const [courseId, relations] of graph) {
      for (const rel of relations) {
        expect(rel.courseId).toBe(courseId);
        expect(rel.requiredCourseId).toBeTruthy();
        expect(rel.requiredCourseName).toBeTruthy();
        expect(['PRE', 'CO']).toContain(rel.type);
      }
    }
    console.log(`✅ Grafo cargado con ${graph.size} materias con prerrequisitos`);
  });

  // ═══════════════════════════════════════════════════
  // RF-06.5: Servicio independiente consumible por otros módulos
  // ═══════════════════════════════════════════════════

  test('RF-06.5: Validación por lotes (batch) para US-05', async () => {
    const courseIds = ['MAT102', 'MAT201', 'FIS102', 'PROG201', 'PROG301', 'ALG101'];
    const result = await validatePrereqs.executeBatch(studentId, courseIds);

    expect(result.totalEvaluated).toBe(6);
    expect(result.totalApproved + result.totalBlocked).toBe(6);
    expect(result.studentId).toBe(studentId);
    expect(result.results).toHaveLength(6);

    console.log(`✅ Batch: ${result.totalApproved} aprobadas, ${result.totalBlocked} bloqueadas de ${result.totalEvaluated} evaluadas`);

    // Imprimir detalle de cada validación
    for (const r of result.results) {
      const emoji = r.status === 'APROBADO' ? '🟢' : '🔴';
      console.log(`   ${emoji} ${r.courseName}: ${r.status}`);
    }
  });

  // ═══════════════════════════════════════════════════
  // RNF-06.1: Validación en menos de 100ms por materia
  // ═══════════════════════════════════════════════════

  test('RNF-06.1: Cada validación debe completarse en menos de 100ms', async () => {
    const courseIds = ['MAT102', 'MAT201', 'FIS102', 'PROG201', 'ALG101'];

    for (const courseId of courseIds) {
      const start = Date.now();
      await validatePrereqs.execute(studentId, courseId);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    }
    console.log('✅ Todas las validaciones completadas en menos de 100ms');
  });

  // ═══════════════════════════════════════════════════
  // RNF-06.2: Caché del grafo de prerrequisitos
  // ═══════════════════════════════════════════════════

  test('RNF-06.2: Debe soportar precarga de caché del grafo', async () => {
    // No debería lanzar error
    await expect(validatePrereqs.preloadCache('ING_SISTEMAS')).resolves.not.toThrow();
    validatePrereqs.clearCache();
    console.log('✅ Caché de prerrequisitos funciona correctamente');
  });

  // ═══════════════════════════════════════════════════
  // Edge cases y validaciones de robustez
  // ═══════════════════════════════════════════════════

  test('Edge: Materia que no existe en el pensum', async () => {
    const result = await validatePrereqs.execute(studentId, 'MATERIA_INVENTADA');

    expect(result.status).toBe('BLOQUEADO');
    expect(result.message).toContain('no existe en el pensum');
    console.log(`✅ Materia inexistente detectada: ${result.message}`);
  });

  test('Edge: Estudiante sin historial sincronizado', async () => {
    // Estudiante que nunca ejecutó US-02
    const result = await validatePrereqs.execute('STUDENT_SIN_SYNC', 'MAT102');

    expect(result.status).toBe('BLOQUEADO');
    expect(result.message).toContain('sincronizar');
    console.log(`✅ Estudiante sin sincronizar detectado: ${result.message}`);
  });

  test('Edge: Cadena de prerrequisitos (Cálculo I → II → III)', async () => {
    // Solo tiene Cálculo I aprobado
    // Cálculo II está CURSANDO (no es APROBADA)
    // Cálculo III requiere Cálculo II → debería estar BLOQUEADO
    const result = await validatePrereqs.execute(studentId, 'MAT201');

    expect(result.status).toBe('BLOQUEADO');
    expect(result.missingPrerequisites.some(m => m.courseId === 'MAT102')).toBe(true);
    console.log(`✅ Cadena de prerrequisitos validada correctamente`);
  });

  // ═══════════════════════════════════════════════════
  // Integración: Verifica que los IDs son consistentes con el sistema
  // ═══════════════════════════════════════════════════

  test('Integración: Los IDs del grafo coinciden con los del SiaAdapter (US-02)', async () => {
    // Los IDs que usa el SiaAdapter: MAT101, FIS101, PROG101, QUIM101, MAT102
    const siaIds = ['MAT101', 'FIS101', 'PROG101', 'QUIM101', 'MAT102'];

    for (const id of siaIds) {
      const exists = await prerequisiteRepo.courseExists(id);
      expect(exists).toBe(true);
    }
    console.log('✅ Todos los IDs del SiaAdapter existen en el grafo de prerrequisitos');
  });
});
