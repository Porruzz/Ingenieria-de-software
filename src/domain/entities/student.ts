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
  academicHistory: string[];
  prohibitedTimeBlocks: ProhibitedTimeBlock[];
}

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
  get tiempoTrasladoMin(): number { return this.props.tiempoTrasladoMin; }
  get bufferSeguridadMin(): number { return this.props.bufferSeguridadMin; }
  get prohibitedTimeBlocks(): ProhibitedTimeBlock[] { 
    return [...this.props.prohibitedTimeBlocks]; 
  }

  calculateEffectiveLogisticBuffer(): number {
    const total = this.props.tiempoTrasladoMin + this.props.bufferSeguridadMin;
    if (total <= 0) return 0;
    if (total > 300) return 300; // Limit at 300 but we'll round up. Wait, RNF says validate <= 300 on input so domain should just do it on calculation too or just return Math.ceil. Let's do validation inside the use-case or update method. 
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

