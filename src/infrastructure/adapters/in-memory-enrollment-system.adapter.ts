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

  addEnrollment(enrollment: OfficialEnrollment) {
    this.enrollments.push(enrollment);
  }
}
