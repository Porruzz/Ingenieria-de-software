export interface ForbiddenZone {
  day: string;
  startTime: string;
  endTime: string;
  label: string; // Ej: "Gimnasio", "Trabajo"
}

export interface Student {
  id: string;
  name: string;
  academicHistory: string[]; // IDs de materias aprobadas
  forbiddenZones: ForbiddenZone[]; // US-01
  commuteTimeMinutes: number; // US-03
}
