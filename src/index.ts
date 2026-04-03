import { SyncAcademicHistory } from "./application/use-cases/sync-academic-history";
import { SiaAdapter } from "./infrastructure/adapters/sia-adapter";
import { EncryptedAcademicRepository } from "./infrastructure/repositories/academic.repository";
import { AESEncryptionService } from "./infrastructure/services/aes-encryption.service";

/**
 * Inyección de Dependencias — US-02: Arquitectura de Software Experto.
 * Aquí mostramos el flujo completo de la US-02 aplicando seguridad de US-04.
 */
async function bootstrap() {
  console.log("--- 🕵️ Enrollment Optimizer (Security Core v1.0) ---");
  console.log("--------------------------------------------------");

  // 1. Inicializar Servicios de Infraestructura
  const encryptionService = new AESEncryptionService(); // Capa seguridad US-04
  const repository = new EncryptedAcademicRepository(encryptionService); // Almacén seguro US-04
  
  // 2. Seleccionar Estrategia de Portal (Pattern Strategy US-02)
  const universityPortal = new SiaAdapter(); // Podría ser Banner o PeopleSoft
  
  // 3. Instanciar Caso de Uso de la US-02
  const syncService = new SyncAcademicHistory(universityPortal, repository);

  // 4. EJECUCIÓN DE LA SINCRONIZACIÓN (Simulación de Usuario)
  const studentId = "SANTIAGO_ING_2026";
  const userTempToken = "ABC-123-SECRET-GATEWAY-TOKEN"; // RF-02.2: Credencial dinámica del estudiante
  
  console.log(`\n🔹 Iniciando sincronización para el estudiante: ${studentId}...`);
  const syncedHistory = await syncService.execute(studentId, userTempToken);

  // 5. DEMOSTRACIÓN DE SEGURIDAD (Confirmar que US-04 está protegiendo los datos)
  console.log("\n--------------------------------------------------");
  console.log("🛡️ VERIFICACIÓN DE SEGURIDAD (Auditoría US-04):");
  
  // Recuperamos la raw data DIRECTA de la base de datos (antes de descifrar)
  const rawDBData = await repository.debugGetEncryptedData(studentId);
  console.log(`[Base de Datos] El query directo a la tabla muestra el siguiente valor:`);
  console.log(`>>> ${rawDBData}`); // Esto debería verse como texto cifrado hex:hex
  
  // Verificamos que el sistema sí pueda leerlo mediante el repositorio seguro
  const confirmedHistory = await repository.getHistory(studentId);
  if (confirmedHistory) {
    console.log(`\n✅ El sistema ha descifrado y validado los datos correctamente:`);
    console.log(`- Créditos acumulados: ${confirmedHistory.totalCredits}`);
    console.log(`- Materias procesadas: ${confirmedHistory.records.length}`);
    console.log(`- Estatus: Sincronizado el ${confirmedHistory.lastSync.toLocaleString()}`);
  }
}

bootstrap().catch((err) => {
  console.error("Critical System Failure:", err);
});
