import { GeneratedSchedule } from '../../domain/entities/schedule';

/**
 * Puerto para persistir las propuestas de horario generadas.
 * US-05: RF-05.7 — El estudiante puede aceptar, rechazar o modificar propuestas.
 * 
 * Sigue el patrón de Arquitectura Hexagonal (como AcademicRepositoryPort de US-02).
 */
export interface ScheduleRepositoryPort {
  /**
   * Guarda una propuesta de horario generada.
   */
  saveSchedule(schedule: GeneratedSchedule): Promise<void>;

  /**
   * Obtiene todas las propuestas de un estudiante.
   */
  getSchedulesByStudent(studentId: string): Promise<GeneratedSchedule[]>;

  /**
   * Actualiza el estado de una propuesta (PROPUESTO → ACEPTADO/RECHAZADO).
   * RF-05.7: El estudiante puede aceptar o rechazar.
   */
  updateStatus(scheduleId: string, status: 'ACEPTADO' | 'RECHAZADO'): Promise<void>;
}
