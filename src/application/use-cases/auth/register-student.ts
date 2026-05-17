import { IStudentRepository } from '../../../domain/repositories/student-repository';
import { Student } from '../../../domain/entities/student';
import { PasswordHasher } from '../../../infrastructure/security/password-hasher';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterStudentCommand {
  identificacionUniversidad: string;
  nombreCompleto: string;
  emailInstitucional: string;
  password: string;
  creditosAprobados?: number;
  promedioAcumulado?: number;
  trabaja?: boolean;
  horasTrabajoSemanal?: number;
  tiempoTrasladoMin?: number;
  bufferSeguridadMin?: number;
}

export class RegisterStudentUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(command: RegisterStudentCommand): Promise<Student> {
    const {
      identificacionUniversidad,
      nombreCompleto,
      emailInstitucional,
      password,
      creditosAprobados = 0,
      promedioAcumulado = 3.5,
      trabaja = false,
      horasTrabajoSemanal = 0,
      tiempoTrasladoMin = 0,
      bufferSeguridadMin = 15,
    } = command;

    if (!emailInstitucional || !password || !nombreCompleto || !identificacionUniversidad) {
      throw new Error('Todos los campos obligatorios (nombre, correo, identificación, contraseña) deben estar diligenciados.');
    }

    if (!emailInstitucional.endsWith('.edu.co') && !emailInstitucional.includes('@')) {
      throw new Error('El correo electrónico debe ser una cuenta institucional válida.');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    // Check if student email already exists
    const existingStudent = await this.studentRepo.findByEmail(emailInstitucional);
    if (existingStudent) {
      throw new Error('El correo institucional ya se encuentra registrado.');
    }

    const passwordHash = PasswordHasher.hash(password);
    const newId = uuidv4();

    const newStudent = new Student({
      id: newId,
      identificacionUniversidad,
      nombreCompleto,
      emailInstitucional,
      creditosAprobados,
      promedioAcumulado,
      trabaja,
      horasTrabajoSemanal,
      tiempoTrasladoMin,
      bufferSeguridadMin,
      academicHistory: [],
      prohibitedTimeBlocks: [],
      passwordHash
    });

    await this.studentRepo.createStudent(newStudent, passwordHash);

    return newStudent;
  }
}
