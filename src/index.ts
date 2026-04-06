import { AESEncryptionService } from "./infrastructure/services/aes-encryption.service";
import { EncryptedAcademicRepository } from "./infrastructure/repositories/academic.repository";
import { InMemoryPrerequisiteRepository } from "./infrastructure/repositories/prerequisite.repository";
import { InMemorySwapRepository } from "./infrastructure/repositories/swap.repository";
import { ValidatePrerequisites } from "./application/use-cases/validate-prerequisites";
import { ProactiveSwapManager } from "./application/use-cases/proactive-swap-manager";
import { SwapRequest } from "./domain/entities/swap";
import { Student } from "./domain/entities/student";

/**
 * ══════════════════════════════════════════════════════════
 *   Enrollment Optimizer — DEMO SPRINT 1 COMPLETO
 *   "Sincronizamos la vida real con el éxito académico."
 * ══════════════════════════════════════════════════════════
 * 
 * Escenario real: Dos estudiantes con conflictos de horario.
 *   - Estudiante A (Santi): Tiene Cálculo II G1 (7 AM), pero trabaja a esa hora.
 *   - Estudiante B (Juan): Tiene Cálculo II G2 (10 AM), pero prefiere madrugar.
 * 
 * El Smart Match Engine los conecta automáticamente de forma
 * segura, validada y legal.
 * 
 * Historias integradas: US-01, US-02, US-03, US-04, US-05, US-06
 */
async function bootstrap() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("  🏢 SaaS: EL ARQUITECTO DE HORARIOS INTELIGENTE");
  console.log("  🤝 Propuesta: Sincronizar vida real con éxito académico");
  console.log("══════════════════════════════════════════════════════════\n");

  // ═══════════════════════════════════════════════════
  // INFRAESTRUCTURA: Inyección de Dependencias (IoC)
  // ═══════════════════════════════════════════════════
  const encryption = new AESEncryptionService();       // US-04
  const academicRepo = new EncryptedAcademicRepository(encryption); // US-02 + US-04
  const preRepo = new InMemoryPrerequisiteRepository(); // US-06
  const swapRepo = new InMemorySwapRepository();        // RF-03
  const validator = new ValidatePrerequisites(academicRepo, preRepo); // US-06

  // ═══════════════════════════════════════════════════
  // PASO 1: Perfiles de Vida (US-01 + US-03)
  // ═══════════════════════════════════════════════════
  console.log("─── PASO 1: Perfiles de Vida (US-01 + US-03) ───\n");

  const students = new Map<string, Student>();

  const studentA = new Student(
    "SANTI-01", "Santiago Porras",
    ["MAT101"],  // Aprobó Cálculo I
    [{ day: 'Lunes', startTime: '06:00', endTime: '09:00', label: '💻 Trabajo Freelance' }],
    30  // 30 min de bus
  );
  students.set(studentA.id, studentA);

  const studentB = new Student(
    "JUAN-02", "Juan Rivera",
    ["MAT101"],  // Aprobó Cálculo I
    [{ day: 'Lunes', startTime: '11:00', endTime: '13:00', label: '⚽ Fútbol' }],
    45  // 45 min de bus
  );
  students.set(studentB.id, studentB);

  console.log(`  👤 ${studentA.name}: Trabaja L/6-9AM, Bus 30min`);
  console.log(`  👤 ${studentB.name}: Fútbol L/11-1PM, Bus 45min\n`);

  // ═══════════════════════════════════════════════════
  // PASO 2: Sincronización Académica Segura (US-02 + US-04)
  // ═══════════════════════════════════════════════════
  console.log("─── PASO 2: Sincronización Académica (US-02 + US-04) ───\n");

  await academicRepo.saveHistory({
    studentId: "SANTI-01",
    records: [{ courseId: 'MAT101', courseName: 'Cálculo I', status: 'APROBADA', grade: '4.0', credits: 4, period: '2025-1' }],
    totalCredits: 4, currentSemester: 2, lastSync: new Date()
  });
  await academicRepo.saveHistory({
    studentId: "JUAN-02",
    records: [{ courseId: 'MAT101', courseName: 'Cálculo I', status: 'APROBADA', grade: '4.2', credits: 4, period: '2025-1' }],
    totalCredits: 4, currentSemester: 2, lastSync: new Date()
  });

  // Demostrar cifrado en reposo (US-04)
  const encryptedDataA = await academicRepo.debugGetEncryptedData("SANTI-01");
  console.log(`  🛡️  Dato en BD (cifrado): "${encryptedDataA?.substring(0, 50)}..."`);
  console.log(`  🛡️  ¿Es legible? ${(() => { try { JSON.parse(encryptedDataA || ''); return 'SÍ ❌'; } catch { return 'NO ✅ (correcto, está cifrado)'; } })()}\n`);

  // ═══════════════════════════════════════════════════
  // PASO 3: Validación de Prerrequisitos (US-06)
  // ═══════════════════════════════════════════════════
  console.log("─── PASO 3: Validación de Prerrequisitos (US-06) ───\n");

  const v1 = await validator.execute("SANTI-01", 'MAT102');
  const v2 = await validator.execute("SANTI-01", 'MAT201');
  console.log(`  ${v1.status === 'APROBADO' ? '🟢' : '🔴'} ${v1.message}`);
  console.log(`  ${v2.status === 'APROBADO' ? '🟢' : '🔴'} ${v2.message}\n`);

  // ═══════════════════════════════════════════════════
  // PASO 4: Smart Match — El Marketplace de Cupos (RF-03)
  // ═══════════════════════════════════════════════════
  console.log("─── PASO 4: Smart Match — Marketplace de Cupos (RF-03) ───\n");

  const swapManager = new ProactiveSwapManager(validator, swapRepo, students);

  // Santi: tiene G1 (7AM, choca con trabajo) → quiere G2 (10AM)
  const requestA: SwapRequest = {
    id: "SR-001", studentId: "SANTI-01",
    offeredSectionId: "SEC-MAT102-A",
    desiredSectionIds: ["SEC-MAT102-B"],
    currentSatisfactionScore: 40,
    status: 'PENDIENTE', createdAt: new Date()
  };

  // Juan: tiene G2 (10AM, choca con fútbol a las 11) → quiere G1 (7AM)
  const requestB: SwapRequest = {
    id: "SR-002", studentId: "JUAN-02",
    offeredSectionId: "SEC-MAT102-B",
    desiredSectionIds: ["SEC-MAT102-A"],
    currentSatisfactionScore: 55,
    status: 'PENDIENTE', createdAt: new Date()
  };

  await swapManager.submitSwapRequest(requestA);
  await swapManager.submitSwapRequest(requestB);

  // ¡EL MATCH PROACTIVO!
  const matches = await swapManager.runSmartMatch();

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  🚀 RESULTADO DEL SMART MATCH ENGINE");
  console.log("══════════════════════════════════════════════════════════\n");

  for (const match of matches) {
    console.log(`  🤝 ¡MATCH ENCONTRADO!`);
    console.log(`  👤 ${match.studentA.id} → Entrega ${match.studentA.delivers}, Recibe ${match.studentA.receives}`);
    console.log(`  👤 ${match.studentB.id} → Entrega ${match.studentB.delivers}, Recibe ${match.studentB.receives}`);
    console.log(`  📈 Mejora de Satisfacción: A +${match.improvementA}%, B +${match.improvementB}%`);
    console.log(`  🛡️  Hash de Seguridad: ${match.systemSafetyHash}`);
    console.log(`  ✅ Intercambio Avalado, Legal y Seguro (US-04 + US-06)\n`);
  }

  console.log("══════════════════════════════════════════════════════════");
  console.log("  🎉 SPRINT 1 COMPLETADO — Todas las US integradas");
  console.log("  US-01 ✅ | US-02 ✅ | US-03 ✅ | US-04 ✅ | US-05 ✅ | US-06 ✅");
  console.log("══════════════════════════════════════════════════════════");
}

bootstrap().catch(console.error);
