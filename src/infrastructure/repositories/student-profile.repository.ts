import { Student } from '../../domain/entities/student';
import { ProhibitedTimeBlock } from '../../domain/entities/prohibited-time-block';
import { StudentProfilePort } from '../../application/ports/student-profile.port';
import { v4 as uuidv4 } from 'uuid';

/**
 * US-01 y US-03: Repositorio en memoria del perfil del estudiante.
 * Almacena las preferencias de vida y logística.
 */
export class InMemoryStudentProfileRepository implements StudentProfilePort {
  private readonly students: Map<string, Student> = new Map();

  async createInitialProfile(id: string, name: string): Promise<void> {
    const student = new Student({
        id,
        nombreCompleto: name,
        academicHistory: [],
        prohibitedTimeBlocks: [],
        tiempoTrasladoMin: 0,
        bufferSeguridadMin: 15,
        identificacionUniversidad: '',
        emailInstitucional: '',
        creditosAprobados: 0,
        promedioAcumulado: 0,
        trabaja: false,
        horasTrabajoSemanal: 0
    });
    this.students.set(id, student);
  }

  async updateTimeBlocks(studentId: string, blocks: any[]): Promise<void> {
    const student = this.students.get(studentId);
    if (!student) {
      throw new Error(`[US-01] Estudiante ${studentId} no encontrado.`);
    }

    const prohibitedTimeBlocks = blocks.map(b => new ProhibitedTimeBlock({
        id: uuidv4(),
        studentId,
        dayOfWeek: b.day || b.dayOfWeek,
        startTime: b.startTime,
        endTime: b.endTime,
        type: 'OTRO',
        isRecurring: true,
        recurrenceStartDate: null,
        recurrenceEndDate: null,
        description: b.label || b.description
    }));

    const updatedStudent = new Student({
        ...this.toProps(student),
        prohibitedTimeBlocks
    });

    this.students.set(studentId, updatedStudent);
  }

  async updateCommuteTime(studentId: string, minutes: number): Promise<void> {
    const student = this.students.get(studentId);
    if (!student) {
      throw new Error(`[US-03] Estudiante ${studentId} no encontrado.`);
    }

    const updatedStudent = new Student({
        ...this.toProps(student),
        tiempoTrasladoMin: minutes
    });

    this.students.set(studentId, updatedStudent);
  }

  async getStudentProfile(studentId: string): Promise<Student | null> {
    return this.students.get(studentId) || null;
  }

  // Helper para convertir entidad a props (ya que en la entidad son privadas)
  private toProps(student: any): any {
    return { ...student.props };
  }
}

