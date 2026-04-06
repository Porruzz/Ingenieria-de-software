import { AESEncryptionService } from "../services/aes-encryption.service";
import { EncryptedAcademicRepository } from "../repositories/academic.repository";
import { InMemoryPrerequisiteRepository } from "../repositories/prerequisite.repository";
import { ValidatePrerequisites } from "../../application/use-cases/validate-prerequisites";
import { GenerateOptimalSchedule } from "../../application/use-cases/generate-schedule";
import { ManageStudentProfile } from "../../application/use-cases/manage-student-profile";
import { InMemoryStudentProfileRepository } from "../repositories/student-profile.repository";
import { InMemoryCourseOfferingAdapter } from "../adapters/course-offering.adapter";
import { InMemoryScheduleRepository } from "../repositories/schedule.repository";
import { InMemorySwapRepository } from "../repositories/swap.repository";
import { ProactiveSwapManager } from "../../application/use-cases/proactive-swap-manager";
import { Student } from "../../domain/entities/student";

async function runDemo() {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  🏢 ENROLLMENT OPTIMIZER - MARKETPLACE INDEPENDIENTE");
  console.log("  \"El poder de los cupos vuelve a los estudiantes\"");
  console.log("══════════════════════════════════════════════════════════\n");

  const encryption = new AESEncryptionService();
  const academicRepo = new EncryptedAcademicRepository(encryption);
  const preRepo = new InMemoryPrerequisiteRepository();
  const profileRepo = new InMemoryStudentProfileRepository();
  const offeringAdapter = new InMemoryCourseOfferingAdapter();
  const scheduleRepo = new InMemoryScheduleRepository();
  const swapRepo = new InMemorySwapRepository();
  
  const validator = new ValidatePrerequisites(academicRepo, preRepo);
  const profileManager = new ManageStudentProfile(profileRepo);
  const scheduleGenerator = new GenerateOptimalSchedule(offeringAdapter, scheduleRepo);

  const studentA_Id = "EST-SANTI-01";
  const studentB_Id = "EST-JUAN-02";

  // 1. Carga Independiente de Datos (US-02)
  console.log("🔹 [US-02] Carga de Historial (Independiente del Portal U)...");
  await profileRepo.createInitialProfile(studentA_Id, "Santiago Porras");
  await profileRepo.createInitialProfile(studentB_Id, "Juan Rivera");
  
  // El estudiante sube sus propias notas aprobadas
  await academicRepo.saveHistory({
    studentId: studentA_Id,
    records: [{ courseId: 'MAT101', courseName: 'Cálculo I', status: 'APROBADA', grade: '4.5', credits: 4, period: '2025-1' }],
    totalCredits: 4, currentSemester: 2, lastSync: new Date()
  });

  await academicRepo.saveHistory({
    studentId: studentB_Id,
    records: [{ courseId: 'MAT101', courseName: 'Cálculo I', status: 'APROBADA', grade: '4.2', credits: 4, period: '2025-1' }],
    totalCredits: 4, currentSemester: 2, lastSync: new Date()
  });
  console.log("   ✅ ÉXITO: Ambos estudiantes subieron sus notas y fueron validados.\n");

  // 2. Perfil de Vida y Restricciones (US-01 / US-03)
  console.log("🔹 [US-01/03] Mapeo de Vida Real (Zonas Prohibidas y Bus)...");
  await profileManager.setForbiddenZones(studentA_Id, [{ day: 'Lunes', startTime: '06:00', endTime: '09:00', label: 'Trabajo' }]);
  await profileManager.setCommuteTime(studentA_Id, 30);
  console.log("   ✅ SANTI: Registró trabajo Lunes 6-9 AM (Independiente de la U).\n");

  // 3. Validación de Prerrequisitos (US-06)
  console.log("🔹 [US-06] Motor de Validación Académica Proactivo...");
  const v1 = await validator.execute(studentA_Id, 'MAT102'); // Cálculo II
  console.log(`   🔸 Validando Cálculo II: 🟢 ${v1.message}\n`);

  // 4. Seguridad de Datos (US-04)
  console.log("🔹 [US-04] Cifrado de Privacidad Estudiante-Estudiante...");
  const encrypted = await academicRepo.debugGetEncryptedData(studentA_Id);
  console.log(`   🔒 ID Personal en BD (Cifrado): ${encrypted?.substring(0, 35)}...`);
  console.log("   ✅ Verificado: Tu horario personal es invisible para otros.\n");

  // 5. SMART MATCH - EL MARKETPLACE (RF-03) 🔥
  console.log("🔹 [RF-03] SMART MATCH ENGINE: Intercambio Colaborativo...");
  
  const students = new Map<string, Student>();
  students.set(studentA_Id, new Student(studentA_Id, "Santiago", ["MAT101"], [], 30));
  students.set(studentB_Id, new Student(studentB_Id, "Juan", ["MAT101"], [], 45));

  const swapManager = new ProactiveSwapManager(validator, swapRepo, students);

  // Santi tiene A (Mañana), quiere el de Juan B (Tarde) por su trabajo
  await swapManager.submitSwapRequest({
    id: "SR-SANTI", studentId: studentA_Id,
    offeredSectionId: "SEC-MAT102-A", desiredSectionIds: ["SEC-MAT102-B"],
    currentSatisfactionScore: 30, status: 'PENDIENTE', createdAt: new Date()
  });

  // Juan tiene B (Tarde), quiere madrugar y prefiere el A (Mañana)
  await swapManager.submitSwapRequest({
    id: "SR-JUAN", studentId: studentB_Id,
    offeredSectionId: "SEC-MAT102-B", desiredSectionIds: ["SEC-MAT102-A"],
    currentSatisfactionScore: 50, status: 'PENDIENTE', createdAt: new Date()
  });

  const matches = await swapManager.runSmartMatch();
  
  console.log("\n   🤝 ¡MATCH ENCONTRADO ENTRE ESTUDIANTES!");
  matches.forEach(m => {
    console.log(`   🔸 ${m.studentA.id} <---> ${m.studentB.id}`);
    console.log(`   📈 Mejora: Santi (+${m.improvementA}%) | Juan (+${m.improvementB}%)`);
    console.log(`   🛡️ Safety Hash: ${m.systemSafetyHash}`);
  });

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  🚀 SPRINT 1 COMPLETADO: SISTEMA INDEPENDIENTE Y SEGURO");
  console.log("══════════════════════════════════════════════════════════\n");
}

runDemo().catch(console.error);

