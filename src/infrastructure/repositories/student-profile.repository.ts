import { ForbiddenZone, Student } from '../../domain/entities/student';
import { StudentProfilePort } from '../../application/ports/student-profile.port';

/**
 * US-01 y US-03: Repositorio en memoria del perfil del estudiante.
 * Almacena las preferencias de vida y logística.
 * 
 * En producción, esto interactuaría con la tabla `student` en PostgreSQL.
 * Campos mapeados:
 *   - forbidden_zones (como JSONB)
 *   - commute_time_minutes
 *   - personal_data (cifrados bajo la US-04 en el repositorio académico)
 */
export class InMemoryStudentProfileRepository implements StudentProfilePort {
  private readonly students: Map<string, Student> = new Map();

  /**
   * Crea un perfil inicial para el estudiante.
   * Usado en el onboarding (US-02).
   */
  async createInitialProfile(id: string, name: string): Promise<void> {
    const student = new Student(id, name, [], [], 0);
    this.students.set(id, student);
  }

  /**
   * Actualiza las zonas de trabajo/bienestar (US-01).
   * @throws Error si el estudiante no existe (debe hacer onboarding primero).
   */
  async updateForbiddenZones(studentId: string, zones: ForbiddenZone[]): Promise<void> {
    const student = this.students.get(studentId);
    if (!student) {
      throw new Error(`[US-01] Estudiante ${studentId} no encontrado. Debe completar el onboarding primero.`);
    }
    this.students.set(studentId, new Student(
      student.id,
      student.name,
      student.academicHistory,
      zones,
      student.commuteTimeMinutes
    ));
  }

  /**
   * Actualiza el tiempo de transporte (US-03).
   * @throws Error si el estudiante no existe (debe hacer onboarding primero).
   */
  async updateCommuteTime(studentId: string, minutes: number): Promise<void> {
    const student = this.students.get(studentId);
    if (!student) {
      throw new Error(`[US-03] Estudiante ${studentId} no encontrado. Debe completar el onboarding primero.`);
    }
    this.students.set(studentId, new Student(
      student.id,
      student.name,
      student.academicHistory,
      student.forbiddenZones,
      minutes
    ));
  }

  /**
   * Recupera el perfil completo del estudiante.
   */
  async getStudentProfile(studentId: string): Promise<Student | null> {
    return this.students.get(studentId) || null;
  }
}
