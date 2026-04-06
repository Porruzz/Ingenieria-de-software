/**
 * RF-03: Solicitud de intercambio de cupo (Swap).
 * Modela el deseo de un estudiante de entregar una sección por otra mejor.
 */
export interface SwapRequest {
  id: string;
  studentId: string;
  offeredSectionId: string;  // La que tengo (Cupo actual)
  desiredSectionIds: string[]; // Las que quiero (Opciones de cambio)
  currentSatisfactionScore: number; // Mi puntaje actual con lo que tengo
  status: 'PENDIENTE' | 'MATCHED' | 'COMPLETADO';
  createdAt: Date;
}

/**
 * Resultado de un Match exitoso entre dos estudiantes.
 */
export interface SwapMatch {
  studentA: {
    id: string;
    delivers: string; // Entrega sección X
    receives: string; // Recibe sección Y
  };
  studentB: {
    id: string;
    delivers: string; // Entrega sección Y
    receives: string; // Recibe sección X
  };
  improvementA: number; // Cuánto mejoró el score de A
  improvementB: number; // Cuánto mejoró el score de B
  systemSafetyHash: string; // Hash para validar que es un cambio legal (US-04)
}
