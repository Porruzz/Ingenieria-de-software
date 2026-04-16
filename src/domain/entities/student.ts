import { Course } from './course';
import { ProhibitedTimeBlock } from './prohibited-time-block';

export interface StudentProps {
  id: string;
  identificacionUniversidad: string;
  nombreCompleto: string;
  emailInstitucional: string;
  creditosAprobados: number;
  promedioAcumulado: number;
  trabaja: boolean;
  horasTrabajoSemanal: number;
  tiempoTrasladoMin: number;
  bufferSeguridadMin: number;
  academicHistory: string[]; // IDs de materias aprobadas
  prohibitedTimeBlocks: ProhibitedTimeBlock[];
}

/**
 * Entidad de dominio: Estudiante.
 * Contiene toda la información necesaria para la generación de horarios.
 * 
 * US-01: prohibitedTimeBlocks (zonas prohibidas)
 * US-02: academicHistory (historial sincronizado)
 * US-03: tiempoTrasladoMin, bufferSeguridadMin (logística)
 * US-04: Los datos sensibles se cifran en la capa de repositorio, no aquí.
 */
export class Student {
  private readonly props: StudentProps;

  constructor(props: StudentProps) {
    this.props = Object.freeze({ 
      ...props, 
      academicHistory: [...props.academicHistory],
      prohibitedTimeBlocks: [...props.prohibitedTimeBlocks]
    });
  }

  get id(): string { return this.props.id; }
  get nombreCompleto(): string { return this.props.nombreCompleto; }
  get academicHistory(): string[] { return [...this.props.academicHistory]; }
  get tiempoTrasladoMin(): number { return this.props.tiempoTrasladoMin; }
  get bufferSeguridadMin(): number { return this.props.bufferSeguridadMin; }
  get prohibitedTimeBlocks(): ProhibitedTimeBlock[] { 
    return [...this.props.prohibitedTimeBlocks]; 
  }

  /**
   * Verifica si el estudiante cumple los prerrequisitos de una materia.
   * US-06: Validación de prerrequisitos.
   */
  hasPrerequisites(course: Course): boolean {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return true;
    }
    return course.prerequisites.every((reqId: string) =>
      this.props.academicHistory.includes(reqId)
    );
  }

  /**
   * Verifica si el estudiante ya aprobó una materia.
   */
  hasApproved(courseId: string): boolean {
    return this.props.academicHistory.includes(courseId);
  }

  /**
   * Verifica si un bloque de tiempo choca con las zonas prohibidas.
   */
  isTimeBlocked(day: string, startTime: string, endTime: string): boolean {
    return this.props.prohibitedTimeBlocks.some(block => {
      if (block.dayOfWeek !== day) return false;
      return startTime < block.endTime && endTime > block.startTime;
    });
  }

  calculateEffectiveLogisticBuffer(): number {
    const total = this.props.tiempoTrasladoMin + this.props.bufferSeguridadMin;
    if (total <= 0) return 0;
    if (total > 300) return 300; 
    return Math.ceil(total / 15) * 15;
  }

  updateLogistics(tiempoTrasladoMin: number, bufferSeguridadMin: number): Student {
    if (tiempoTrasladoMin < 0 || bufferSeguridadMin < 0) {
      throw new Error("Los tiempos de logística no pueden ser negativos.");
    }
    const total = tiempoTrasladoMin + bufferSeguridadMin;
    if (total > 300) {
      throw new Error("El tiempo total de logística no puede superar los 300 minutos.");
    }

    return new Student({
      ...this.props,
      tiempoTrasladoMin,
      bufferSeguridadMin
    });
  }

  addTimeBlock(block: ProhibitedTimeBlock): Student {
    return new Student({
      ...this.props,
      prohibitedTimeBlocks: [...this.props.prohibitedTimeBlocks, block]
    });
  }
}

