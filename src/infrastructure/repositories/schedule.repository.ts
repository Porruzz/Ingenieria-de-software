import { ScheduleRepositoryPort } from '../../application/ports/schedule-repository.port';
import { GeneratedSchedule } from '../../domain/entities/schedule';

/**
 * US-05: Repositorio en memoria para propuestas de horario.
 * 
 * En producción, este repositorio escribiría en las tablas:
 * - generated_schedule (propuestas con su score y status)
 * - schedule_item (secciones seleccionadas en cada propuesta)
 * 
 * Sigue el mismo patrón que EncryptedAcademicRepository (US-02).
 */
export class InMemoryScheduleRepository implements ScheduleRepositoryPort {
  private database: Map<string, GeneratedSchedule> = new Map();

  /**
   * Persiste una propuesta de horario.
   */
  async saveSchedule(schedule: GeneratedSchedule): Promise<void> {
    this.database.set(schedule.id, { ...schedule });
    console.log(
      `[ScheduleRepo] Propuesta ${schedule.id} guardada ` +
      `(Score: ${schedule.score}, Créditos: ${schedule.totalCredits}, Estado: ${schedule.status})`
    );
  }

  /**
   * Obtiene todas las propuestas de un estudiante.
   */
  async getSchedulesByStudent(studentId: string): Promise<GeneratedSchedule[]> {
    const schedules: GeneratedSchedule[] = [];
    for (const schedule of this.database.values()) {
      if (schedule.studentId === studentId) {
        schedules.push(schedule);
      }
    }
    return schedules.sort((a, b) => b.score - a.score);
  }

  /**
   * Actualiza el estado de una propuesta (RF-05.7).
   */
  async updateStatus(scheduleId: string, status: 'ACEPTADO' | 'RECHAZADO'): Promise<void> {
    const schedule = this.database.get(scheduleId);
    if (!schedule) {
      throw new Error(`Propuesta ${scheduleId} no encontrada.`);
    }
    schedule.status = status;
    this.database.set(scheduleId, schedule);
    console.log(`[ScheduleRepo] Propuesta ${scheduleId} actualizada a estado: ${status}`);
  }

  /**
   * Utilidad para depuración: obtiene todas las propuestas almacenadas.
   */
  async debugGetAll(): Promise<GeneratedSchedule[]> {
    return Array.from(this.database.values());
  }
}
