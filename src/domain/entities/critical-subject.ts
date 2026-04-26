export interface FailedCourseHistory {
  idReprobo: string;
  studentId: string;
  courseId: string;
  previousAttempts: number;
  lastFailedPeriod: string;
}

export interface PriorityCalculation {
  priorityId: string;
  studentId: string;
  courseId: string;
  criticalityIndex: number;
  calculationDate: Date;
}

export interface CriticalityReport {
  studentId: string;
  courseId: string;
  courseName: string;
  criticalityIndex: number;
  potentialDelaySemesters: number;
  isCritical: boolean;
  unlockedCoursesCount: number;
  unlockedCourses: string[]; // Nombres o IDs de las materias que desbloquea
}
