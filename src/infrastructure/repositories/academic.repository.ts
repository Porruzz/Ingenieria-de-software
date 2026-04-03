import { AcademicSummary } from "../../domain/entities/academic-record";
import { AcademicRepositoryPort } from "../../application/ports/academic-repository.port";
import { EncryptionServicePort } from "../../application/ports/encryption-service.port";

/**
 * Persistencia (En Memoria) de historial académico con CIFRADO en reposo.
 * US-02 + US-04: Cifrado para cumplimiento de Ley 1581 (Colombia).
 */
export class EncryptedAcademicRepository implements AcademicRepositoryPort {
  /**
   * Almacén de datos (Simulación de DB).
   * Los valores se guardarán cifrados.
   */
  private database: Map<string, string> = new Map();

  constructor(private encryptionService: EncryptionServicePort) {}

  /**
   * Guarda el historial académico de forma segura (CIFRADO).
   * RNF-04.1: Cifrado en reposo para datos personales.
   */
  async saveHistory(summary: AcademicSummary): Promise<void> {
    const jsonString = JSON.stringify(summary);
    
    // US-04: El repositorio NUNCA guarda datos personales en texto plano en la base de datos.
    const encryptedData = this.encryptionService.encrypt(jsonString);
    this.database.set(summary.studentId, encryptedData);
    
    console.log(`[Repository] Historial para el estudiante ${summary.studentId} guardado con cifrado AES-256.`);
  }

  /**
   * Recupera y DESCIFRA los datos para la aplicación.
   */
  async getHistory(studentId: string): Promise<AcademicSummary | null> {
    const encryptedData = this.database.get(studentId);
    if (!encryptedData) return null;

    try {
      const decryptedData = this.encryptionService.decrypt(encryptedData);
      return JSON.parse(decryptedData) as AcademicSummary;
    } catch (e) {
      console.error("[Repository] No se pudo descifrar el historial del estudiante.");
      return null;
    }
  }

  /**
   * Útil para auditoría de seguridad: Devuelve lo que hay REALMENTE en la base de datos (según US-04).
   * Un query directo a la BD no debería mostrar nada legible.
   */
  async debugGetEncryptedData(studentId: string): Promise<string | undefined> {
    return this.database.get(studentId);
  }
}
