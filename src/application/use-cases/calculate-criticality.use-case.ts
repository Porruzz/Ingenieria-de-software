import { CriticalSubjectRepositoryPort } from '../ports/critical-subject-repository.port';
import { PrerequisiteRepositoryPort } from '../ports/prerequisite-repository.port';
import { PriorityCalculation, CriticalityReport } from '../../domain/entities/critical-subject';
import { PrerequisiteRelation } from '../../domain/entities/prerequisite';

export class CalculateCriticalityUseCase {
  constructor(
    private readonly criticalSubjectRepo: CriticalSubjectRepositoryPort,
    private readonly prerequisiteRepo: PrerequisiteRepositoryPort
  ) {}

  async execute(studentId: string, programId: string): Promise<CriticalityReport[]> {
    // 1. RF-07.1: Identificación de Materias en Repitencia
    const failedCourses = await this.criticalSubjectRepo.getFailedCourses(studentId);
    
    if (failedCourses.length === 0) {
      return [];
    }

    // 2. Obtener grafo de prerrequisitos (courseId -> requisitos)
    const prerequisiteGraph = await this.prerequisiteRepo.getFullPrerequisiteGraph(programId);
    
    // Invertir el grafo para saber qué materias DESBLOQUEA una materia (materia -> materias que dependen de ella)
    const unlockGraph = this.buildUnlockGraph(prerequisiteGraph);

    const reports: CriticalityReport[] = [];

    for (const failure of failedCourses) {
      const courseId = failure.courseId;
      const courseName = await this.prerequisiteRepo.getCourseName(courseId) || courseId;
      
      // Encontrar todas las materias que esta materia desbloquea (directa e indirectamente)
      const unlockedCoursesIds = this.getAllUnlockedCourses(courseId, unlockGraph);
      const unlockedCoursesCount = unlockedCoursesIds.size;
      
      // Obtener nombres para la explicabilidad (RNF-07.1)
      const unlockedCoursesNames: string[] = [];
      for (const unlockedId of Array.from(unlockedCoursesIds)) {
        const name = await this.prerequisiteRepo.getCourseName(unlockedId) || unlockedId;
        unlockedCoursesNames.push(name);
      }

      // RF-07.2: Cálculo del Índice de Criticidad Curricular
      // Formula base: (materias desbloqueadas / 10) + (intentos previos * 0.1)
      // Ajustado a máximo 1.0
      let criticalityIndex = (unlockedCoursesCount * 0.15) + (failure.previousAttempts * 0.1);
      if (criticalityIndex > 1.0) criticalityIndex = 1.0;

      // Retraso potencial estimado (ej. 1 semestre por cada 2 materias en cadena)
      // Esta es una estimación simple para cumplir con RF-07.4
      const potentialDelaySemesters = 1 + Math.floor(unlockedCoursesCount / 3);

      const isCritical = criticalityIndex >= 0.80; // RF-07.5: umbral para sobreescribir bienestar

      const report: CriticalityReport = {
        studentId,
        courseId,
        courseName,
        criticalityIndex,
        potentialDelaySemesters,
        isCritical,
        unlockedCoursesCount,
        unlockedCourses: unlockedCoursesNames
      };

      reports.push(report);

      // Guardar cálculo en persistencia
      const calculation: PriorityCalculation = {
        priorityId: `${studentId}-${courseId}-${Date.now()}`,
        studentId,
        courseId,
        criticalityIndex,
        calculationDate: new Date()
      };
      
      await this.criticalSubjectRepo.savePriorityCalculation(calculation);
    }

    return reports.sort((a, b) => b.criticalityIndex - a.criticalityIndex);
  }

  /**
   * Construye un mapa donde la llave es una materia, y el valor es un arreglo de 
   * materias que la tienen como requisito.
   */
  private buildUnlockGraph(prerequisiteGraph: Map<string, PrerequisiteRelation[]>): Map<string, string[]> {
    const unlockGraph = new Map<string, string[]>();

    for (const [courseId, prerequisites] of prerequisiteGraph.entries()) {
      for (const prereq of prerequisites) {
        if (!unlockGraph.has(prereq.requiredCourseId)) {
          unlockGraph.set(prereq.requiredCourseId, []);
        }
        unlockGraph.get(prereq.requiredCourseId)!.push(courseId);
      }
    }

    return unlockGraph;
  }

  /**
   * Recorre el grafo de desbloqueos (BFS o DFS) para encontrar todas las materias
   * que se desbloquean directa e indirectamente.
   */
  private getAllUnlockedCourses(courseId: string, unlockGraph: Map<string, string[]>): Set<string> {
    const unlocked = new Set<string>();
    const queue = [courseId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = unlockGraph.get(current) || [];

      for (const dep of dependents) {
        if (!unlocked.has(dep)) {
          unlocked.add(dep);
          queue.push(dep);
        }
      }
    }

    return unlocked;
  }
}
