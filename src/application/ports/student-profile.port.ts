import { Student } from '../../domain/entities/student';

/**
 * US-01 y US-03: Puerto para gestionar el perfil personal del estudiante.
 * Define las operaciones permitidas sobre las restricciones personales.
 */
export interface StudentProfilePort {
  /**
   * Guarda o actualiza los bloques de tiempo prohibidos (US-01).
   */
  updateTimeBlocks(studentId: string, blocks: any[]): Promise<void>;

  /**
   * Actualiza el tiempo de desplazamiento entre campus/casa (US-03).
   */
  updateCommuteTime(studentId: string, minutes: number): Promise<void>;

  /**
   * Obtiene el perfil completo del estudiante (identidad + restricciones).
   */
  getStudentProfile(studentId: string): Promise<Student | null>;
}

