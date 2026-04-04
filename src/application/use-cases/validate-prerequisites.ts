import { AcademicRepositoryPort } from '../ports/academic-repository.port';

export class ValidatePrerequisites {
    // Aquí inyectamos el puerto que ya maneja el cifrado AES-256 (US-04)
    constructor(private readonly academicRepository: AcademicRepositoryPort) { }

    async execute(studentId: string, courseId: string): Promise<boolean> {
        // 1. Obtenemos el historial descifrado
        const history = await this.academicRepository.getHistory(studentId);

        if (!history) {
            throw new Error("Debe sincronizar su historial antes de validar.");
        }

        // 2. Lógica de la US-06: Validar si el prerequisito está APROBADA
        // Por ahora, simularemos que para 'Cálculo 2' necesitas 'Cálculo 1'
        const prerequisites: Record<string, string> = {
            'CALCULO_2': 'CALCULO_1',
            'FISICA_2': 'FISICA_1'
        };

        const idRequerido = prerequisites[courseId];

        // Si la materia no tiene prerrequisitos, se puede inscribir
        if (!idRequerido) return true;

        // Buscamos en el historial si la materia requerida está aprobada
        const cumplido = history.records.some(r =>
            r.courseId === idRequerido && r.status === 'APROBADA'
        );

        return cumplido;
    }
}