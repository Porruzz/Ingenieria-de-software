export interface ForbiddenZone {
    day: string;
    startTime: string;
    endTime: string;
    label: string;
}

export class Student {
    constructor(
        public id: string,
        public name: string,
        public academicHistory: string[], // IDs de materias aprobadas
        public forbiddenZones: ForbiddenZone[],
        public commuteTimeMinutes: number
    ) { }

    // LÓGICA DE LA US-06: Verificar si cumple requisitos
    hasPrerequisites(course: any): boolean {
        // Si la materia no tiene requisitos, puede verla
        if (!course.prerequisites || course.prerequisites.length === 0) {
            return true;
        }

        // Verifica que TODOS los requisitos de la materia estén en su historial
        return course.prerequisites.every((reqId: string) =>
            this.academicHistory.includes(reqId)
        );
    }
}