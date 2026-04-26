import { CourseOfferingPort } from '../ports/course-offering.port';
import { CriticalSubjectRepositoryPort } from '../ports/critical-subject-repository.port';

export class ReservePredictiveQuotasUseCase {
  constructor(
    private readonly courseOffering: CourseOfferingPort,
    private readonly criticalSubjectRepo: CriticalSubjectRepositoryPort
  ) {}

  /**
   * RF-07.3: Reserva de Cupos Predictiva
   * Bloquea un porcentaje de cupos en materias críticas basándose en datos históricos.
   * @param period Periodo a reservar (ej. "2026-2")
   */
  async execute(period: string): Promise<{ courseId: string; reservedSeats: number }[]> {
    console.log(`[US-07] Iniciando reserva de cupos predictiva para el periodo ${period}`);
    
    // 1. Obtener todas las secciones disponibles
    const availableSections = await this.courseOffering.getAvailableSections(period);
    const uniqueCourseIds = [...new Set(availableSections.map(s => s.courseId))];
    
    const reservations: { courseId: string; reservedSeats: number }[] = [];

    // 2. Por cada materia, calcular la necesidad de cupos basados en el historial (simplificado)
    // En la vida real, esto consultaría a un modelo predictivo o historial agregado
    for (const courseId of uniqueCourseIds) {
      // Simulación: consultamos cálculos de prioridad históricos globales para esta materia
      // Para efectos del MVP, asumimos una reserva del 10% si la materia es considerada "llave"
      const isCritical = await this.checkIfCourseIsUniversallyCritical(courseId);
      
      if (isCritical) {
        // Buscar secciones de esta materia
        const sections = availableSections.filter(s => s.courseId === courseId);
        let totalReserved = 0;

        for (const section of sections) {
          // Reservar 15% de la capacidad de la sección para estudiantes con repitencia
          const reserveAmount = Math.floor(section.capacity * 0.15);
          
          if (reserveAmount > 0) {
            // Se llamaría a un método en courseOffering para bloquear los cupos
            // await this.courseOffering.blockQuotas(section.id, reserveAmount);
            totalReserved += reserveAmount;
            console.log(`[US-07] Reservados ${reserveAmount} cupos predictivos en sección ${section.id} de la materia ${courseId}`);
          }
        }

        if (totalReserved > 0) {
          reservations.push({ courseId, reservedSeats: totalReserved });
        }
      }
    }

    return reservations;
  }

  /**
   * Verifica si la materia es crítica a nivel general (ej. Cálculo I, Física).
   */
  private async checkIfCourseIsUniversallyCritical(courseId: string): Promise<boolean> {
    // Lógica simulada: se podría consultar el DAG completo y ver si tiene más de N dependientes.
    // O consultar la base de datos de historial de pérdida general.
    return true; // Simplificado para el ejemplo de arquitectura
  }
}
