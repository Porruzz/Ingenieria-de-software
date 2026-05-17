import { IStudentRepository } from '../../../domain/repositories/student-repository';
import { Student } from '../../../domain/entities/student';
import { PasswordHasher } from '../../../infrastructure/security/password-hasher';
import { CryptoService } from '../../../infrastructure/security/crypto-service';

export interface LoginStudentCommand {
  emailInstitucional: string;
  password?: string;
}

export interface LoginResponse {
  student: Student;
  token: string;
}

export class LoginStudentUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly cryptoService: CryptoService
  ) {}

  async execute(command: LoginStudentCommand): Promise<LoginResponse> {
    const { emailInstitucional, password } = command;

    if (!emailInstitucional || !password) {
      throw new Error('El correo y la contraseña son requeridos.');
    }

    const student = await this.studentRepo.findByEmail(emailInstitucional);
    if (!student) {
      throw new Error('Credenciales incorrectas o usuario no registrado.');
    }

    const storedHash = student.passwordHash;
    if (!storedHash) {
      throw new Error('Este usuario no tiene una contraseña configurada en el sistema.');
    }

    const isCorrect = PasswordHasher.verify(password, storedHash);
    if (!isCorrect) {
      throw new Error('Credenciales incorrectas o usuario no registrado.');
    }

    // Generate stateless token with encrypted payload
    const payload = JSON.stringify({
      studentId: student.id,
      email: student.emailInstitucional,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 24 Hours
    });

    const token = this.cryptoService.encrypt(payload);

    return {
      student,
      token
    };
  }
}
