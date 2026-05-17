import { IStudentRepository } from '../../../domain/repositories/student-repository';
import { Student } from '../../../domain/entities/student';
import { CryptoService } from '../../../infrastructure/security/crypto-service';
import { PasswordHasher } from '../../../infrastructure/security/password-hasher';
import { v4 as uuidv4 } from 'uuid';

export interface SSOLoginCommand {
  emailInstitucional: string;
  nombreCompleto: string;
}

export interface SSOLoginResponse {
  student: Student;
  token: string;
  isNewUser: boolean;
}

export class SSOLoginUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly cryptoService: CryptoService
  ) {}

  async execute(command: SSOLoginCommand): Promise<SSOLoginResponse> {
    const { emailInstitucional, nombreCompleto } = command;

    if (!emailInstitucional) {
      throw new Error('El correo electrónico institucional es requerido para el inicio de sesión único.');
    }

    if (!emailInstitucional.includes('@') || !emailInstitucional.endsWith('.edu.co')) {
      throw new Error('El correo electrónico debe pertenecer a un dominio institucional válido (.edu.co).');
    }

    let student = await this.studentRepo.findByEmail(emailInstitucional);
    let isNewUser = false;

    if (!student) {
      isNewUser = true;
      const newId = uuidv4();
      
      // Extract a plausible university code or random code
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const universityId = `UN-${randomCode}`;

      // Create new student with dynamic credentials
      const placeholderPasswordHash = PasswordHasher.hash(uuidv4()); // High entropy placeholder

      student = new Student({
        id: newId,
        identificacionUniversidad: universityId,
        nombreCompleto: nombreCompleto || this.capitalizeNameFromEmail(emailInstitucional),
        emailInstitucional: emailInstitucional.toLowerCase(),
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

    // Generate encrypted session token
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
