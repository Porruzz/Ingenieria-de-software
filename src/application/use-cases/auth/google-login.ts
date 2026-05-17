import { IStudentRepository } from '../../../domain/repositories/student-repository';
import { Student } from '../../../domain/entities/student';
import { CryptoService } from '../../../infrastructure/security/crypto-service';
import { PasswordHasher } from '../../../infrastructure/security/password-hasher';
import { v4 as uuidv4 } from 'uuid';

export interface GoogleLoginCommand {
  email: string;
  nombreCompleto: string;
}

export interface GoogleLoginResponse {
  student: Student;
  token: string;
  isNewUser: boolean;
}

export class GoogleLoginUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly cryptoService: CryptoService
  ) {}

  async execute(command: GoogleLoginCommand): Promise<GoogleLoginResponse> {
    const { email, nombreCompleto } = command;

    if (!email) {
      throw new Error('El correo electrónico es requerido para el inicio de sesión con Google.');
    }

    if (!email.includes('@')) {
      throw new Error('Por favor ingrese un correo electrónico válido.');
    }

    let student = await this.studentRepo.findByEmail(email);
    let isNewUser = false;

    if (!student) {
      isNewUser = true;
      const newId = uuidv4();
      
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const universityId = `GGL-${randomCode}`;

      const placeholderPasswordHash = PasswordHasher.hash(uuidv4());

      student = new Student({
        id: newId,
        identificacionUniversidad: universityId,
        nombreCompleto: nombreCompleto || this.capitalizeNameFromEmail(email),
        emailInstitucional: email.toLowerCase(),
        creditosAprobados: 0,
        promedioAcumulado: 4.0,
        trabaja: false,
        horasTrabajoSemanal: 0,
        tiempoTrasladoMin: 0,
        bufferSeguridadMin: 15,
        academicHistory: [],
        prohibitedTimeBlocks: [],
        passwordHash: placeholderPasswordHash
      });

      await this.studentRepo.createStudent(student, placeholderPasswordHash);
    }

    const payload = JSON.stringify({
      studentId: student.id,
      email: student.emailInstitucional,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 24 Hours
    });

    const token = this.cryptoService.encrypt(payload);

    return {
      student,
      token,
      isNewUser
    };
  }

  private capitalizeNameFromEmail(email: string): string {
    const username = email.split('@')[0];
    return username
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
