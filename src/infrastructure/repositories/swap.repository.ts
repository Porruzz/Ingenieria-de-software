import { SwapRequest, SwapMatch } from '../../domain/entities/swap';
import { SwapRepositoryPort } from '../../application/ports/swap-repository.port';

/**
 * RF-03: Repositorio en memoria para solicitudes de intercambio de cupos.
 * 
 * En producción, persistiría en PostgreSQL con las tablas:
 *   - swap_request (solicitudes con estado y timestamps)
 *   - swap_match (emparejamientos con hash de seguridad)
 * 
 * Sigue el mismo patrón que InMemoryScheduleRepository (US-05).
 */
export class InMemorySwapRepository implements SwapRepositoryPort {
  private readonly requests: Map<string, SwapRequest> = new Map();
  private readonly matches: SwapMatch[] = [];

  /** Mapa de sectionId → courseId (en producción vendría de la BD) */
  private readonly sectionCourseMap: Map<string, string> = new Map([
    ['SEC-MAT101-A', 'MAT101'], ['SEC-MAT101-B', 'MAT101'],
    ['SEC-MAT102-A', 'MAT102'], ['SEC-MAT102-B', 'MAT102'],
    ['SEC-MAT201-A', 'MAT201'],
    ['SEC-FIS101-A', 'FIS101'], ['SEC-FIS101-B', 'FIS101'],
    ['SEC-FIS102-A', 'FIS102'],
    ['SEC-PROG101-A', 'PROG101'], ['SEC-PROG101-B', 'PROG101'],
    ['SEC-PROG201-A', 'PROG201'],
    ['SEC-PROG301-A', 'PROG301'],
    ['SEC-QUIM101-A', 'QUIM101'], ['SEC-QUIM101-B', 'QUIM101'],
    ['SEC-EST101-A', 'EST101'],
    ['SEC-ALG101-A', 'ALG101'],
    ['SEC-ING101-A', 'ING101'],
  ]);

  async saveRequest(request: SwapRequest): Promise<void> {
    this.requests.set(request.id, { ...request });
  }

  async getPendingRequests(): Promise<SwapRequest[]> {
    return Array.from(this.requests.values())
      .filter(r => r.status === 'PENDIENTE');
  }

  async saveMatch(match: SwapMatch): Promise<void> {
    this.matches.push({ ...match });
  }

  async getMatchById(matchId: string): Promise<SwapMatch | null> {
    const match = this.matches.find(m => m.matchId === matchId);
    return match ? { ...match } : null;
  }

  async updateMatch(match: SwapMatch): Promise<void> {
    const index = this.matches.findIndex(m => m.matchId === match.matchId);
    if (index !== -1) {
      this.matches[index] = { ...match };
    } else {
      throw new Error(`[SwapRepo] Match ${match.matchId} no encontrado para actualizar.`);
    }
  }

  async updateRequestStatus(requestId: string, status: 'MATCHED' | 'COMPLETADO'): Promise<void> {

    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`[SwapRepo] Solicitud ${requestId} no encontrada.`);
    }
    request.status = status;
    this.requests.set(requestId, request);
  }

  async getCourseIdFromSection(sectionId: string): Promise<string | null> {
    return this.sectionCourseMap.get(sectionId) || null;
  }
}
