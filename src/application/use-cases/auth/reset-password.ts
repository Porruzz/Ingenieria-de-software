import { IStudentRepository } from '../../../domain/repositories/student-repository';
import { PasswordHasher } from '../../../infrastructure/security/password-hasher';

export interface ResetPasswordCommand {
  token: string;
  newPassword?: string;
}

export class ResetPasswordUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const { token, newPassword } = command;

    if (!token) {
      throw new Error('El token de restablecimiento es requerido.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const student = await this.studentRepo.findByResetToken(token);
    if (!student) {
      throw new Error('El token de restablecimiento no es válido o ha expirado.');
    }

    // Verify token expiration
    if (student.resetPasswordExpires && student.resetPasswordExpires.getTime() < Date.now()) {
      // Clear token since it expired
      await this.studentRepo.updateResetToken(student.id, null, null);
      throw new Error('El enlace de restablecimiento ha expirado.');
    }

    const passwordHash = PasswordHasher.hash(newPassword);

    // Save password hash and automatically clear token fields inside repository implementation
    await this.studentRepo.updatePassword(student.id, passwordHash);
  }
}
