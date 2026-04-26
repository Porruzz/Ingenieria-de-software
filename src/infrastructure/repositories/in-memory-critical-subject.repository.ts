import { CriticalSubjectRepositoryPort } from '../../application/ports/critical-subject-repository.port';
import { FailedCourseHistory, PriorityCalculation } from '../../domain/entities/critical-subject';

export class InMemoryCriticalSubjectRepository implements CriticalSubjectRepositoryPort {
  private failedCourses: FailedCourseHistory[] = [];
  private calculations: PriorityCalculation[] = [];

  async getFailedCourses(studentId: string): Promise<FailedCourseHistory[]> {
    return this.failedCourses.filter(f => f.studentId === studentId);
  }

  async savePriorityCalculation(calculation: PriorityCalculation): Promise<void> {
    this.calculations.push(calculation);
  }

  async getPriorityCalculations(studentId: string): Promise<PriorityCalculation[]> {
    return this.calculations.filter(c => c.studentId === studentId);
  }

  // Helper for setup
  addFailedCourse(failure: FailedCourseHistory) {
    this.failedCourses.push(failure);
  }
}
