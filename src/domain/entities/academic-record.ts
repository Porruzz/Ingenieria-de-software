export type CourseStatus = 'APROBADA' | 'PERDIDA' | 'CURSANDO';

export interface AcademicRecord {
  courseId: string;
  courseName: string;
  status: CourseStatus;
  grade?: string; // Se guardará cifrado si es necesario
  credits: number;
  period: string; // Ej: "2026-1"
}

export interface AcademicSummary {
  studentId: string;
  records: AcademicRecord[];
  totalCredits: number;
  currentSemester: number;
  lastSync: Date;
}
