import { SyncAcademicHistory } from "../application/use-cases/sync-academic-history";
import { SiaAdapter } from "../infrastructure/adapters/sia-adapter";
import { EncryptedAcademicRepository } from "../infrastructure/repositories/academic.repository";
import { AESEncryptionService } from "../infrastructure/services/aes-encryption.service";

/**
 * Suite de Pruebas de Integración para US-02: Sincronización Académica.
 * Estas pruebas confirman que todos los criterios de aceptación en Jira se cumplen.
 */
describe("US-02 - Sincronización de Estado Académico", () => {
  let encryptionService: AESEncryptionService;
  let repository: EncryptedAcademicRepository;
  let portalAdapter: SiaAdapter;
  let syncUseCase: SyncAcademicHistory;

  beforeEach(() => {
    encryptionService = new AESEncryptionService();
    repository = new EncryptedAcademicRepository(encryptionService);
    portalAdapter = new SiaAdapter();
    syncUseCase = new SyncAcademicHistory(portalAdapter, repository);
  });

  test("RF-02.1 & RF-02.2: Debería extraer correctamente el historial del portal", async () => {
    const result = await syncUseCase.execute("TEST_STUDENT", "VALID_TOKEN");
    
    expect(result.studentId).toBe("TEST_STUDENT");
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.totalCredits).toBe(11); // Según el mock del SiaAdapter
    expect(result.currentSemester).toBe(3);
  });

  test("US-04: La información personal debe estar cifrada en la base de datos (repositorio)", async () => {
    const studentId = "CRYPTO_TEST";
    await syncUseCase.execute(studentId, "SECRET_TOKEN");

    // Intentamos leer directamente de la "BD" (el Map interno del repositorio)
    const rawData = await repository.debugGetEncryptedData(studentId);
    
    // El dato no debería ser un JSON legible, sino una cadena cifrada (hex:hex)
    expect(rawData).toBeDefined();
    expect(rawData).toContain(":"); // El formato IV:Data
    expect(() => JSON.parse(rawData!)).toThrow(); // No debe ser JSON válido
  });

  test("RF-02.5: Debería poder recuperar y descifrar el historial correctamente", async () => {
    const studentId = "RECOVERY_TEST";
    await syncUseCase.execute(studentId, "TOKEN");

    const recoveredData = await repository.getHistory(studentId);
    
    expect(recoveredData).not.toBeNull();
    expect(recoveredData?.studentId).toBe(studentId);
    expect(recoveredData?.records[0].courseName).toBe("Cálculo I");
  });

  test("Soporte Multi-Universidad (Strategy Pattern): Debería funcionar independientemente del adaptador", async () => {
    // Definimos un adaptador rápido para "Portal Banner" para probar la flexibilidad
    const bannerMock = {
        getAcademicHistory: jest.fn().mockResolvedValue({
            records: [{ courseId: 'B101', courseName: 'Banner Course', status: 'APROBADA', credits: 2, period: '1' }],
            totalCredits: 2,
            currentSemester: 1
        })
    };

    const flexSync = new SyncAcademicHistory(bannerMock as any, repository);
    const result = await flexSync.execute("BANNER_USER", "T1");

    expect(bannerMock.getAcademicHistory).toHaveBeenCalledWith("BANNER_USER", "T1");
    expect(result.records[0].courseName).toBe("Banner Course");
  });
});
