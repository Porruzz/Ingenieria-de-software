import { PrerequisiteRelation } from '../../domain/entities/prerequisite';
import { PrerequisiteRepositoryPort } from '../../application/ports/prerequisite-repository.port';

/**
 * US-06: Repositorio en memoria del grafo de prerrequisitos del pensum.
 * 
 * Modela un DAG (Directed Acyclic Graph) de dependencias académicas.
 * RF-06.1: Mantiene el grafo de dependencias del pensum.
 * RF-06.4: Soporta pensum de múltiples programas académicos.
 * RNF-06.2: El grafo se mantiene en memoria para evitar consultas repetidas.
 * RNF-06.3: Soporta pensum de hasta 200 materias sin degradación.
 * 
 * En producción, este adaptador consultaría las tablas:
 *   - course (para nombres y códigos de materias)
 *   - prerequisite (para las relaciones de dependencia)
 *   - program (para filtrar por programa académico)
 */
export class InMemoryPrerequisiteRepository implements PrerequisiteRepositoryPort {

  /** Catálogo de materias del pensum: courseId → nombre legible */
  private readonly courseCatalog: Map<string, string> = new Map([
    ['MAT101', 'Cálculo I'],
    ['MAT102', 'Cálculo II'],
    ['MAT201', 'Cálculo III'],
    ['FIS101', 'Física Mecánica'],
    ['FIS102', 'Física Eléctrica'],
    ['PROG101', 'Fundamentos de Programación'],
    ['PROG201', 'Programación Orientada a Objetos'],
    ['PROG301', 'Estructuras de Datos'],
    ['QUIM101', 'Química General'],
    ['EST101', 'Probabilidad y Estadística'],
    ['ING101', 'Introducción a la Ingeniería'],
    ['ALG101', 'Álgebra Lineal'],
  ]);

  /**
   * Grafo de dependencias del pensum de Ingeniería de Sistemas.
   * Estructura: courseId → lista de relaciones de dependencia.
   * 
   * Tipos de relación:
   *   PRE = Prerrequisito obligatorio (debe estar APROBADA)
   *   CO  = Correquisito (debe estar CURSANDO o APROBADA)
   */
  private readonly prerequisiteGraph: Map<string, PrerequisiteRelation[]> = new Map([
    // ─── Cálculo II requiere Cálculo I ───
    ['MAT102', [
      { courseId: 'MAT102', requiredCourseId: 'MAT101', requiredCourseName: 'Cálculo I', type: 'PRE' },
    ]],

    // ─── Cálculo III requiere Cálculo II ───
    ['MAT201', [
      { courseId: 'MAT201', requiredCourseId: 'MAT102', requiredCourseName: 'Cálculo II', type: 'PRE' },
    ]],

    // ─── Física Eléctrica requiere Física Mecánica + Cálculo I (múltiples prereqs) ───
    ['FIS102', [
      { courseId: 'FIS102', requiredCourseId: 'FIS101', requiredCourseName: 'Física Mecánica', type: 'PRE' },
      { courseId: 'FIS102', requiredCourseId: 'MAT101', requiredCourseName: 'Cálculo I', type: 'PRE' },
    ]],

    // ─── POO requiere Fundamentos de Programación ───
    ['PROG201', [
      { courseId: 'PROG201', requiredCourseId: 'PROG101', requiredCourseName: 'Fundamentos de Programación', type: 'PRE' },
    ]],

    // ─── Estructuras de Datos requiere POO ───
    ['PROG301', [
      { courseId: 'PROG301', requiredCourseId: 'PROG201', requiredCourseName: 'Programación Orientada a Objetos', type: 'PRE' },
    ]],

    // ─── Probabilidad y Estadística requiere Cálculo I ───
    ['EST101', [
      { courseId: 'EST101', requiredCourseId: 'MAT101', requiredCourseName: 'Cálculo I', type: 'PRE' },
    ]],

    // ── Materias sin prerrequisitos: MAT101, FIS101, PROG101, QUIM101, ING101, ALG101 ──
    // No se agregan al mapa (getPrerequisitesForCourse retorna [] para ellas)
  ]);

  /**
   * Obtiene los prerrequisitos de una materia específica.
   * RNF-06.1: Respuesta en O(1) gracias al Map.
   */
  async getPrerequisitesForCourse(courseId: string): Promise<PrerequisiteRelation[]> {
    return this.prerequisiteGraph.get(courseId) || [];
  }

  /**
   * Obtiene el grafo completo de prerrequisitos para un programa.
   * RNF-06.2: Permite cachear todo el grafo en memoria de una sola vez.
   * RF-06.4: En producción, se filtrarían por programId.
   */
  async getFullPrerequisiteGraph(programId: string): Promise<Map<string, PrerequisiteRelation[]>> {
    console.log(`[PrerequisiteRepo] Cargando grafo para programa: ${programId}`);
    // En producción: SELECT * FROM prerequisite WHERE program_id = :programId
    return new Map(this.prerequisiteGraph);
  }

  /**
   * Obtiene el nombre de una materia dado su ID.
   * Usado para generar mensajes descriptivos (RF-06.3).
   */
  async getCourseName(courseId: string): Promise<string | null> {
    return this.courseCatalog.get(courseId) || null;
  }

  /**
   * Verifica si una materia existe en el pensum.
   */
  async courseExists(courseId: string): Promise<boolean> {
    return this.courseCatalog.has(courseId);
  }

  /**
   * Utilidad para debugging: muestra el grafo completo en consola.
   */
  debugPrintGraph(): void {
    console.log('\n[DEBUG] Grafo de Prerrequisitos del Pensum:');
    for (const [courseId, relations] of this.prerequisiteGraph) {
      const courseName = this.courseCatalog.get(courseId) || courseId;
      const deps = relations.map(r =>
        `${r.requiredCourseName} (${r.type})`
      ).join(' + ');
      console.log(`  ${courseName} ← requiere: ${deps}`);
    }

    const noDeps = [...this.courseCatalog.keys()].filter(id => !this.prerequisiteGraph.has(id));
    console.log(`  Sin prerrequisitos: ${noDeps.map(id => this.courseCatalog.get(id)).join(', ')}`);
  }
}
