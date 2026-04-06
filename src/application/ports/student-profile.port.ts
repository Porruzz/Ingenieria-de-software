import { ForbiddenZone, Student } from '../../domain/entities/student';

/**
 * US-01 y US-03: Puerto para gestionar el perfil personal del estudiante.
 * Define las operaciones permitidas sobre las restricciones personales.
 */
export interface StudentProfilePort {
  /**
   * Guarda o actualiza las zonas prohibidas del estudiante (US-01).
   */
  updateForbiddenZones(studentId: string, zones: ForbiddenZone[]): Promise<void>;

  /**
   * Actualiza el tiempo de desplazamiento entre campus/casa (US-03).
   */
  updateCommuteTime(studentId: string, minutes: number): Promise<void>;

  /**
   * Obtiene el perfil completo del estudiante (identidad + restricciones).
   */
  getStudentProfile(studentId: string): Promise<Student | null>;
}
