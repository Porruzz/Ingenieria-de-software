/**
 * Puerto para el servicio de cifrado según requisitos de seguridad de US-04.
 */
export interface EncryptionServicePort {
  encrypt(text: string): string;
  decrypt(encryptedText: string): string;
}
