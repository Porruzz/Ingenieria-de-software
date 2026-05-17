import { IStudentRepository } from '../../../domain/repositories/student-repository';
import { NotificationServicePort } from '../../ports/notification-service.port';
import crypto from 'crypto';

export interface RequestPasswordResetCommand {
  emailInstitucional: string;
}

export interface RequestPasswordResetResponse {
  message: string;
  token: string;
  resetLink: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly notificationService: NotificationServicePort
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<RequestPasswordResetResponse> {
    const { emailInstitucional } = command;

    if (!emailInstitucional) {
      throw new Error('El correo institucional es requerido.');
    }

    const student = await this.studentRepo.findByEmail(emailInstitucional);
    if (!student) {
      // In a real-world scenario, we shouldn't leak whether the email exists.
      // But for development/academic demo purposes, throwing an error is much better to guide the user.
      throw new Error('El correo electrónico ingresado no se encuentra registrado.');
    }

    // Generate a secure 32-character hexadecimal token
    const token = crypto.randomBytes(16).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await this.studentRepo.updateResetToken(student.id, token, expires);

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    await this.notificationService.notifyStudent(
      student.id,
      'Restablecimiento de contraseña',
      `Hola ${student.nombreCompleto}, para restablecer tu contraseña ingresa al siguiente enlace: ${resetLink}`
    );

    return {
      message: 'Enlace de restablecimiento enviado correctamente al correo institucional.',
      token,
      resetLink
    };
  }
}
