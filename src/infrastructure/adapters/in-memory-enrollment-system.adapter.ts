import { EnrollmentSystemPort } from '../../application/ports/enrollment-system.port';
import { OfficialEnrollment } from '../../domain/entities/marketplace';

export class InMemoryEnrollmentSystemAdapter implements EnrollmentSystemPort {
  private enrollments: OfficialEnrollment[] = [];

  async validateActiveEnrollment(studentId: string, enrollmentId: string): Promise<OfficialEnrollment | null> {
    return this.enrollments.find(e => e.studentId === studentId && e.enrollmentId === enrollmentId && e.status === 'ACTIVO') || null;
  }

  async getEnrollmentByCourse(studentId: string, courseId: string, sectionId: string): Promise<OfficialEnrollment | null> {
    return this.enrollments.find(e => e.studentId === studentId && e.courseId === courseId && e.sectionId === sectionId) || null;
  }

  async getEnrollmentById(enrollmentId: string): Promise<OfficialEnrollment | null> {
    return this.enrollments.find(e => e.enrollmentId === enrollmentId) || null;
  }

  async registerOfficialSwap(
    studentAId: string,
    enrollmentAId: string,
    studentBId: string,
    enrollmentBId: string
  ): Promise<{ success: boolean; transactionId: string }> {
    const enrA = this.enrollments.find(e => e.enrollmentId === enrollmentAId && e.studentId === studentAId);
    const enrB = this.enrollments.find(e => e.enrollmentId === enrollmentBId && e.studentId === studentBId);

    if (!enrA || !enrB) {
      throw new Error('No se pudo formalizar: Una de las inscripciones no es válida o no pertenece al estudiante.');
    }

    // Intercambio de secciones (Simulación de actualización en DB universitaria)
    const tempSection = enrA.sectionId;
    enrA.sectionId = enrB.sectionId;
    enrB.sectionId = tempSection;

    const transactionId = `TX-OFFICIAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    console.log(`[US-11] Intercambio formalizado en Sistema Universitario. ID Transacción: ${transactionId}`);
    
    return { success: true, transactionId };
  }

  addEnrollment(enrollment: OfficialEnrollment) {
    this.enrollments.push(enrollment);
  }
}

