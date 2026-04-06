import { SwapRequest, SwapMatch } from '../../domain/entities/swap';

/**
 * RF-03: Puerto para persistir solicitudes de intercambio de cupos.
 * 
 * En producción, interactuaría con las tablas:
 *   - swap_request (solicitudes activas/completadas)
 *   - swap_match (emparejamientos encontrados)
 * 
 * Sigue Arquitectura Hexagonal (Ports & Adapters).
 */
export interface SwapRepositoryPort {
  /**
   * Persiste una nueva solicitud de intercambio.
   */
  saveRequest(request: SwapRequest): Promise<void>;

  /**
   * Obtiene todas las solicitudes pendientes (estado: PENDIENTE).
   */
  getPendingRequests(): Promise<SwapRequest[]>;

  /**
   * Persiste un match encontrado por el SmartMatchEngine.
   */
  saveMatch(match: SwapMatch): Promise<void>;

  /**
   * Actualiza el estado de una solicitud (PENDIENTE → MATCHED/COMPLETADO).
   */
  updateRequestStatus(requestId: string, status: 'MATCHED' | 'COMPLETADO'): Promise<void>;

  /**
   * Obtiene el courseId real a partir de un sectionId.
   * Necesario para la validación de prerrequisitos (US-06).
   */
  getCourseIdFromSection(sectionId: string): Promise<string | null>;
}
