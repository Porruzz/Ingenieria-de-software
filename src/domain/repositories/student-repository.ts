import { Student } from '../entities/student';

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>;
  updateLogistics(id: string, tiempoTrasladoMin: number, bufferSeguridadMin: number): Promise<void>;
  findByEmail(email: string): Promise<Student | null>;
  findByResetToken(token: string): Promise<Student | null>;
  createStudent(student: Student, passwordHash: string): Promise<void>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  updateResetToken(id: string, token: string | null, expires: Date | null): Promise<void>;
}
