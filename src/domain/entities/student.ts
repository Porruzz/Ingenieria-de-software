import { Course } from './course';

/**
 * US-01: Interface para las zonas prohibidas del estudiante.
 * Bloques de tiempo donde el sistema NO debe asignar clases.
 */
export interface ForbiddenZone {
  day: string;       // Día de la semana (ej: "Lunes", "Martes")
  startTime: string; // Hora de inicio (ej: "18:00")
  endTime: string;   // Hora de fin (ej: "22:00")
  label: string;     // Etiqueta descriptiva (ej: "Trabajo", "Gimnasio")
}

/**
 * Entidad de dominio: Estudiante.
 * Contiene toda la información necesaria para la generación de horarios.
 * 
 * US-01: forbiddenZones (zonas prohibidas)
 * US-02: academicHistory (historial sincronizado)
 * US-03: commuteTimeMinutes (tiempo de desplazamiento)
 * US-04: Los datos sensibles se cifran en la capa de repositorio, no aquí.
 */
export class Student {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly academicHistory: string[],  // IDs de materias aprobadas
    public readonly forbiddenZones: ForbiddenZone[],
    public readonly commuteTimeMinutes: number
  ) {}

  /**
   * Verifica si el estudiante cumple los prerrequisitos de una materia.
   * Usado internamente por el motor de horarios (US-05).
   * 
   * Nota: La validación completa con mensajes descriptivos está en
   * ValidatePrerequisites (US-06). Este método es un helper rápido
   * para el dominio que retorna solo boolean.
   * 
   * @param course Materia a verificar (tipada correctamente, sin `any`).
   * @returns true si cumple todos los prerrequisitos.
   */
  hasPrerequisites(course: Course): boolean {
    // Si la materia no tiene prerrequisitos, puede inscribirla
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return true;
    }

    // Verifica que TODOS los prerrequisitos estén en su historial de aprobadas
    return course.prerequisites.every((reqId: string) =>
      this.academicHistory.includes(reqId)
    );
  }

  /**
   * Verifica si el estudiante ya aprobó una materia.
   * @param courseId ID de la materia.
   * @returns true si ya la aprobó.
   */
  hasApproved(courseId: string): boolean {
    return this.academicHistory.includes(courseId);
  }

  /**
   * Verifica si un bloque de tiempo choca con las zonas prohibidas.
   * Útil para validaciones rápidas en el dominio.
   * 
   * @param day Día de la semana.
   * @param startTime Hora de inicio (formato "HH:MM").
   * @param endTime Hora de fin (formato "HH:MM").
   * @returns true si el bloque choca con alguna zona prohibida.
   */
  isTimeBlocked(day: string, startTime: string, endTime: string): boolean {
    return this.forbiddenZones.some(zone => {
      if (zone.day !== day) return false;
      const [zs, ze] = [this.toMinutes(zone.startTime), this.toMinutes(zone.endTime)];
      const [bs, be] = [this.toMinutes(startTime), this.toMinutes(endTime)];
      return bs < ze && be > zs; // Solapamiento temporal
    });
  }

  /** Convierte "HH:MM" a minutos desde medianoche */
  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}