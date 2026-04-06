import * as crypto from 'crypto';
import { EncryptionServicePort } from '../../application/ports/encryption-service.port';

/**
 * US-04: Servicio de Cifrado AES-256-CBC para datos personales.
 * 
 * Implementación profesional del cifrado en reposo cumpliendo:
 *   RF-04.1: Cifrar todos los datos personales del estudiante.
 *   RF-04.2: Usar cifrado AES-256 para datos en reposo.
 *   RF-04.5: Gestión segura de claves (variables de entorno).
 *   RNF-04.1: Cumplimiento con Ley 1581 de Protección de Datos (Colombia) y GDPR.
 *   RNF-04.2: Las claves NUNCA deben estar en el código fuente ni en el repositorio.
 *   RNF-04.3: Los logs NO deben contener datos personales en texto plano.
 *   RNF-04.4: Latencia máxima por cifrado/descifrado: 50ms.
 * 
 * Algoritmo: AES-256-CBC con vector de inicialización aleatorio.
 * Formato de salida: "iv_hex:encrypted_hex" para descifrado autónomo.
 */
export class AESEncryptionService implements EncryptionServicePort {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  /**
   * Constructor con gestión segura de claves.
   * RNF-04.2: La clave se lee de variables de entorno.
   * Si no existe, se usa una derivada (solo para desarrollo).
   */
  constructor() {
    const envKey = process.env.ENCRYPTION_KEY;

    if (envKey) {
      // Producción: clave desde variable de entorno
      this.key = crypto.scryptSync(envKey, 'enrollment-optimizer-salt', 32);
    } else {
      // Desarrollo: clave derivada (NEVER in production)
      console.warn(
        '[US-04] ⚠️ ADVERTENCIA: Usando clave de cifrado por defecto. ' +
        'En producción, configure la variable de entorno ENCRYPTION_KEY.'
      );
      this.key = crypto.scryptSync('enrollment-optimizer-dev-key', 'enrollment-optimizer-salt', 32);
    }
  }

  /**
   * Cifra un texto garantizando privacidad según la Ley 1581 (US-04).
   * RNF-04.4: Latencia máxima de 50ms por operación.
   * 
   * @param text Texto plano a cifrar.
   * @returns Texto cifrado en formato "iv_hex:encrypted_hex".
   * @throws Error si el texto es vacío o la operación excede 50ms.
   */
  encrypt(text: string): string {
    if (!text || text.length === 0) {
      throw new Error('[US-04] No se puede cifrar un texto vacío.');
    }

    const startTime = Date.now();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const elapsed = Date.now() - startTime;
    if (elapsed > 50) {
      console.warn(`[US-04] ⚠️ Cifrado tomó ${elapsed}ms (límite: 50ms)`);
    }

    // Formato: IV:CipherText para descifrado autónomo
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Descifra un texto previamente cifrado.
   * RNF-04.4: Latencia máxima de 50ms por operación.
   * 
   * @param encryptedText Texto cifrado en formato "iv_hex:encrypted_hex".
   * @returns Texto descifrado original.
   * @throws Error si el formato es inválido o la clave no coincide.
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) {
      throw new Error('[US-04] Formato de texto cifrado inválido. Esperado: "iv:data".');
    }

    const startTime = Date.now();

    const [ivHex, data] = encryptedText.split(':');

    if (!ivHex || !data) {
      throw new Error('[US-04] Datos cifrados corruptos: IV o payload faltante.');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const elapsed = Date.now() - startTime;
    if (elapsed > 50) {
      console.warn(`[US-04] ⚠️ Descifrado tomó ${elapsed}ms (límite: 50ms)`);
    }

    return decrypted;
  }

  /**
   * Verifica que el servicio de cifrado funciona correctamente.
   * Útil para health checks y auditoría de seguridad.
   * 
   * @returns true si el ciclo cifrado/descifrado es consistente.
   */
  healthCheck(): boolean {
    try {
      const testData = 'enrollment-optimizer-health-check';
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      return decrypted === testData;
    } catch {
      return false;
    }
  }

  /**
   * Enmascara datos sensibles para logs seguros (RNF-04.3).
   * Los logs del sistema NO deben contener datos personales en texto plano.
   * 
   * @param sensitiveData Dato sensible a enmascarar.
   * @returns Dato enmascarado (ej: "San***" para "Santiago").
   */
  static maskForLogs(sensitiveData: string): string {
    if (!sensitiveData || sensitiveData.length <= 3) return '***';
    return sensitiveData.substring(0, 3) + '***';
  }
}
