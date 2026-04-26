/**
 * US-05: Entidades de dominio para el módulo de Generación de Horario Óptimo.
 * Modela las propuestas de horario, sus ítems y el sistema de scoring.
 */

/** Estado de una propuesta de horario generada */
export type ScheduleStatus = 'PROPUESTO' | 'ACEPTADO' | 'RECHAZADO';

/** Bloque horario de una sección (día + hora inicio + hora fin) */
export interface TimeBlock {
  day: string;          // Ej: "Lunes", "Martes"
  startTime: string;    // Ej: "07:00"
  endTime: string;      // Ej: "09:00"
}

/** Sección de una materia con su info de horario y capacidad */
export interface CourseSection {
  id: string;
  courseId: string;
  courseName: string;
  sectionCode: string;
  credits: number;
  professor: string;
  campus: string;
  capacity: number;
  enrolledCount: number;
  schedule: TimeBlock[];
}

/** Un ítem dentro de una propuesta de horario (sección seleccionada) */
export interface ScheduleItem {
  section: CourseSection;
  isPinned: boolean;     // RF-05.5: El estudiante puede "anclar" una materia
}

/** Desglose detallado del puntaje de una propuesta */
export interface ScoreBreakdown {
  creditScore: number;       // Puntos por maximización de créditos
  gapScore: number;          // Puntos por minimización de huecos
  failedCourseScore: number; // Puntos por incluir materias perdidas (repitencia)
  commuteScore: number;      // Puntos por respetar tiempos de desplazamiento
  zoneScore: number;         // Puntos por respetar zonas prohibidas
}

/** Propuesta de horario generada por el motor (RF-05.2) */
export interface GeneratedSchedule {
  id: string;
  studentId: string;
  items: ScheduleItem[];
  totalCredits: number;
  totalGaps: number;          // Cantidad de huecos entre clases
  failedCoursesIncluded: number; // Materias perdidas priorizadas
  score: number;              // Puntaje global de satisfacción (0-100)
  scoreBreakdown: ScoreBreakdown;
  status: ScheduleStatus;
  createdAt: Date;
}

/** Configuración de entrada para el generador de horarios (RF-05.1) */
export interface ScheduleGenerationInput {
  studentId: string;
  approvedCourseIds: string[];       // Materias ya aprobadas
  failedCourseIds: string[];         // Materias perdidas (priorizar en repitencia)
  criticalCourseIds?: string[];      // US-07: Materias con IC >= 0.8 que sobreescriben zonas de bienestar
  forbiddenZones: TimeBlock[];       // Zonas prohibidas del estudiante (US-01)
  commuteTimeMinutes: number;        // Tiempo de desplazamiento (US-03)
  pinnedSectionIds: string[];        // Secciones ancladas por el estudiante (RF-05.5)
  maxCredits?: number;               // Límite máximo de créditos (opcional)
}

/** Resultado de la generación: mínimo 3 propuestas (RF-05.2) */
export interface ScheduleGenerationResult {
  proposals: GeneratedSchedule[];
  generationTimeMs: number;
  totalCombinationsEvaluated: number;
}
