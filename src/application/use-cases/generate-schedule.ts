import { Student } from '../../domain/entities/student';
import { Course, Section } from '../../domain/entities/course';

/**
 * US-05: Generación de Horario Óptimo Proactivo.
 * Tu algoritmo estrella va aquí. Debe maximizar el avance curricular
 * respetando las restricciones del estudiante.
 */
export class GenerateSchedule {
  execute(student: Student, availableCourses: Course[]): Section[] {
    console.log(`Generando horario óptimo para ${student.name}`);

    // 1. Filtrar materias que puede ver Y que NO ha aprobado todavía
    const validCourses = availableCourses.filter(course =>
      student.hasPrerequisites(course) &&
      !student.academicHistory.includes(course.id) // <--- Esta línea es clave
    );

    // 2. Aquí iría la lógica de choque de horarios (US-01)
    const selectedSections: Section[] = [];

    // 3. Algoritmo simple: Intentar agregar cada sección si hay espacio
    validCourses.forEach(course => {
      const bestSection = course.sections[0]; // Por ahora tomamos la primera
      selectedSections.push(bestSection);
    });

    return selectedSections;

  }
}
