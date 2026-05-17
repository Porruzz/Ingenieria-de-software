import crypto from 'crypto';

export class PasswordHasher {
  /**
   * Hashes a plain-text password using PBKDF2 with SHA-512 and a secure 16-byte random salt.
   * Returns a salt:hash string.
   */
  static hash(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies a plain-text password against a stored salt:hash string.
   */
  static verify(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(':')) {
      return false;
    }
    const [salt, originalHash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return originalHash === verifyHash;
  }
}
