import * as readline from 'readline';
import { AESEncryptionService } from "../services/aes-encryption.service";
import { EncryptedAcademicRepository } from "../repositories/academic.repository";
import { InMemoryPrerequisiteRepository } from "../repositories/prerequisite.repository";
import { ValidatePrerequisites } from "../../application/use-cases/validate-prerequisites";
import { GenerateOptimalSchedule } from "../../application/use-cases/generate-schedule";
import { ManageStudentProfile } from "../../application/use-cases/manage-student-profile";
import { InMemoryStudentProfileRepository } from "../repositories/student-profile.repository";
import { InMemoryCourseOfferingAdapter } from "../adapters/course-offering.adapter";
import { InMemoryScheduleRepository } from "../repositories/schedule.repository";
import { Student } from "../../domain/entities/student";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => 
  new Promise((resolve) => rl.question(query, resolve));

async function runInteractiveClient() {
  console.clear();
  console.log("══════════════════════════════════════════════════════════");
  console.log("  🧪 MODO TESTER: ENROLLMENT OPTIMIZER (CLIENT-VIEW)");
  console.log("  Sincronizamos la vida real con el éxito académico");
  console.log("══════════════════════════════════════════════════════════\n");

  // --- SETUP INFRA ---
  const encryption = new AESEncryptionService();
  const academicRepo = new EncryptedAcademicRepository(encryption);
  const preRepo = new InMemoryPrerequisiteRepository();
  const profileRepo = new InMemoryStudentProfileRepository();
  const offeringAdapter = new InMemoryCourseOfferingAdapter();
  const scheduleRepo = new InMemoryScheduleRepository();
  
  const validator = new ValidatePrerequisites(academicRepo, preRepo);
  const profileManager = new ManageStudentProfile(profileRepo);
  const scheduleGenerator = new GenerateOptimalSchedule(offeringAdapter, scheduleRepo);

  // --- REGISTRO / LOGIN ---
  const studentName = await question("➤ Digita tu nombre completo: ");
  const studentId = await question("➤ Digita tu ID de estudiante (ej: SANTI-01): ");
  
  await profileRepo.createInitialProfile(studentId, studentName);
  
  // Simulamos sincronización académica automática (US-02)
  console.log(`\n[Sincronizando con SIA...]`);
  await academicRepo.saveHistory({
    studentId: studentId,
    records: [
      { courseId: 'MAT101', courseName: 'Cálculo I', status: 'APROBADA', grade: '4.5', credits: 4, period: '2025-1' },
      { courseId: 'FIS101', courseName: 'Física Mecánica', status: 'APROBADA', grade: '4.0', credits: 4, period: '2025-1' },
      { courseId: 'PROG101', courseName: 'Programación', status: 'APROBADA', grade: '4.8', credits: 3, period: '2025-1' },
    ],
    totalCredits: 11,
    currentSemester: 3,
    lastSync: new Date()
  });
  console.log("✅ Historial Académico sincronizado exitosamente (US-02).\n");

  let exit = false;
  while (!exit) {
    console.log("----------------------------------------------------------");
    console.log("MENU DE USUARIO (CLIENTE)");
    console.log("1. Configurar mis Zonas Prohibidas (Trabajo/Bienestar - US-01)");
    console.log("2. Configurar mi tiempo de transporte (Logística - US-03)");
    console.log("3. Validar si puedo inscribir una materia (US-06)");
    console.log("4. Generar mis propuestas de horario óptimo (US-05)");
    console.log("5. Salir");
    console.log("----------------------------------------------------------");
    
    const option = await question("➤ Elige una opción: ");

    switch (option) {
      case '1':
        const day = await question("   Día (ej: Lunes): ");
        const start = await question("   Hora Inicio (HH:MM): ");
        const end = await question("   Hora Fin (HH:MM): ");
        const label = await question("   ¿Por qué no puedes? (ej: Trabajo): ");
        
        try {
          await profileManager.setForbiddenZones(studentId, [{ day, startTime: start, endTime: end, label }]);
          console.log("   ✅ Zona prohibida agregada. El sistema la respetará.");
        } catch (e: any) {
          console.log(`\n   ❌ ERROR: ${e.message}`);
        }
        break;

      case '2':
        const time = await question("   ¿Cuántos minutos tardas en llegar a la U? (0-240): ");
        try {
          await profileManager.setCommuteTime(studentId, parseInt(time));
          console.log("   ✅ Tiempo de transporte actualizado.");
        } catch (e: any) {
          console.log(`\n   ❌ ERROR: ${e.message}`);
        }
        break;

      case '3':
        const course = await question("   ID de la materia a validar (ej: MAT102, MAT201, PROG201): ");
        const validation = await validator.execute(studentId, course);
        if (validation.status === 'APROBADO') {
          console.log(`   🟢 ${validation.message}`);
        } else {
          console.log(`   🔴 ${validation.message}`);
        }
        break;

      case '4':
        const period = await question("   ¿Para qué periodo quieres el horario? (ej: 2026-2): ");
        const currentProfile = await profileRepo.getStudentProfile(studentId);
        
        if (!currentProfile) break;
        
        const input = {
          studentId: studentId,
          approvedCourseIds: ['MAT101', 'FIS101', 'PROG101'],
          failedCourseIds: [],
          forbiddenZones: currentProfile.forbiddenZones,
          commuteTimeMinutes: currentProfile.commuteTimeMinutes,
          pinnedSectionIds: [],
          maxCredits: 20
        };

        console.log("\n[Generando propuestas óptimas...]");
        const result = await scheduleGenerator.execute(input, period);
        
        console.log(`\nSe encontraron ${result.proposals.length} propuestas para ti:`);
        result.proposals.slice(0, 3).forEach((p, idx) => {
          console.log(`\nPropuesta #${idx + 1} (Score: ${p.score}%)`);
          console.log(`  Créditos: ${p.totalCredits}`);
          console.log(`  Desglose: Gaps: ${p.scoreBreakdown.gapScore}, Transporte: ${p.scoreBreakdown.commuteScore}, Trabajo: ${p.scoreBreakdown.zoneScore}`);
          p.items.forEach(item => {
            console.log(`  - ${item.section.courseName} (${item.section.sectionCode}): ${JSON.stringify(item.section.schedule)}`);
          });
        });
        break;

      case '5':
        exit = true;
        console.log("¡Suerte en tu matrícula!");
        break;

      default:
        console.log("Opción no válida.");
    }
  }

  rl.close();
}

runInteractiveClient().catch(console.error);
