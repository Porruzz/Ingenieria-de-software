import * as crypto from 'crypto';
import { EncryptionServicePort } from '../../application/ports/encryption-service.port';

/**
 * Servicio de cifrado experto (US-04: RNF-04.2 & RNF-04.3).
 * Implementado usando el protocolo AES-256-CBC con vector de inicialización.
 */
export class AESEncryptionService implements EncryptionServicePort {
  // En producción, esta llave se leerá de variables de entorno (process.env.ENCRYPTION_KEY)
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = crypto.scryptSync('enrollment-optimizer-secret-key', 'salt', 32); 

  /**
   * Cifra un texto garantizando privacidad según la Ley 1581 (US-04).
   * @param text 
   * @returns El texto cifrado con su IV adjunto.
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Guardamos el IV al principio para que el descifrado sea autónomo
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Descifra el texto guardado de forma segura.
   * @param encryptedText 
   * @returns 
   */
  decrypt(encryptedText: string): string {
    const [ivHex, data] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
