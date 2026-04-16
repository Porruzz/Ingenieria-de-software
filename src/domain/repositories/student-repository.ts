import { Student } from '../entities/student';

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>;
  updateLogistics(id: string, tiempoTrasladoMin: number, bufferSeguridadMin: number): Promise<void>;
}
