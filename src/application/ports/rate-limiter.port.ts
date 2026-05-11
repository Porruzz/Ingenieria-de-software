/**
 * US-18: Puerto del servicio de Rate Limiting.
 * 
 * Abstrae la estrategia de limitación de requests.
 * Permite intercambiar entre Redis-based, in-memory, o token bucket
 * sin modificar los middlewares.
 */
export interface RateLimiterPort {
  /**
   * Verifica si un identificador (IP o studentId) puede realizar un request.
   * Si puede, consume un token; si no, rechaza.
   * 
   * @param identifier IP del cliente o ID del estudiante
   * @returns Objeto con el resultado y metadata del rate limit
   */
  checkLimit(identifier: string): Promise<RateLimitResult>;

  /**
   * Obtiene el estado actual del rate limiter para un identificador.
   * @param identifier IP o studentId
   */
  getStatus(identifier: string): Promise<RateLimitStatus>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;        // Requests restantes en la ventana
  retryAfterMs: number;     // Ms hasta que se libere un token (0 si allowed)
  totalLimit: number;        // Límite total de la ventana
}

export interface RateLimitStatus {
  currentCount: number;
  windowResetAt: Date;
  isBlocked: boolean;
}
