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
 * US-10: Requiere confirmación bilateral antes de ejecutarse.
 * US-11: Requiere un estado de formalización legal.
 */
export interface SwapMatch {
  matchId: string;
  studentA: {
    id: string;
    delivers: string; // Entrega sección X
    receives: string; // Recibe sección Y
    confirmed: boolean; // US-10
  };
  studentB: {
    id: string;
    delivers: string; // Entrega sección Y
    receives: string; // Recibe sección X
    confirmed: boolean; // US-10
  };
  status: 'PENDIENTE_CONFIRMACION' | 'APROBADO' | 'RECHAZADO' | 'FORMALIZADO'; // US-10 & US-11
  improvementA: number;
  improvementB: number;
  systemSafetyHash: string; // Hash para validar que es un cambio legal (US-04)
  formalizationToken?: string; // US-11: Sello digital de la universidad
  createdAt: Date;
}

