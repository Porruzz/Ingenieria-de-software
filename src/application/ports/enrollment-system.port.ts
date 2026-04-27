import { OfficialEnrollment } from '../../domain/entities/marketplace';

export interface EnrollmentSystemPort {
  /**
   * RF-12.1: Sincronización Obligatoria con el Sistema Académico
   * Verifica que el estudiante efectivamente posee el cupo en el sistema oficial (Banner, SAP).
   * @param studentId ID del estudiante
   * @param enrollmentId ID de la inscripción a validar
   * @returns La inscripción si es válida y activa, null si no la posee o está inactiva.
   */
  validateActiveEnrollment(studentId: string, enrollmentId: string): Promise<OfficialEnrollment | null>;

  /**
   * Obtiene la inscripción usando el ID de curso y sección.
   */
  getEnrollmentByCourse(studentId: string, courseId: string, sectionId: string): Promise<OfficialEnrollment | null>;

  /**
   * Obtiene los detalles de una inscripción por su ID.
   */
  getEnrollmentById(enrollmentId: string): Promise<OfficialEnrollment | null>;

  /**
   * US-11: Formalización Legal del Cambio.
   * Ejecuta el intercambio de cupos en la base de datos oficial de la universidad.
   * Esta operación es atómica: o cambian los dos o no cambia ninguno.
   */
  registerOfficialSwap(
    studentAId: string, 
    enrollmentAId: string, 
    studentBId: string, 
    enrollmentBId: string
  ): Promise<{ success: boolean, transactionId: string }>;
}

