import crypto from 'crypto';
import { EncryptionServicePort } from '../../application/ports/encryption-service.port';

export class CryptoService implements EncryptionServicePort {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(masterKeyHex: string) {
    if (!masterKeyHex || masterKeyHex.length !== 64) {
      throw new Error("Invalid master encryption key length. Needs 32 bytes hex (64 chars).");
    }
    this.key = Buffer.from(masterKeyHex, 'hex');
  }

  /**
   * Cifra un texto y devuelve una cadena en formato iv:tag:contenido.
   */
  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Descifra una cadena en formato iv:tag:contenido.
   */
  decrypt(combined: string): string {
    const [ivHex, authTagHex, encryptedValue] = combined.split(':');
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(ivHex, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
