import { Student } from '../../domain/entities/student';
import { Course, Section } from '../../domain/entities/course';

/**
 * US-05: Generación de Horario Óptimo Proactivo.
 * Tu algoritmo estrella va aquí. Debe maximizar el avance curricular
 * respetando las restricciones del estudiante.
 */
export class GenerateSchedule {
  execute(student: Student, availableCourses: Course[]): Section[] {
    console.log(`Generando horario óptimo para ${student.nombreCompleto}`);

    // Aquí programarás el algoritmo que cruza:
    // 1. Materias que puede ver (validando US-06).
    // 2. Horarios que no choquen conforbiddenZones (US-01).
    // 3. Maximización de créditos.

    return []; // Retorna el listado de secciones elegidas
  }
}
