import { CircuitState } from '../../domain/entities/health';

/**
 * US-18: Puerto del Circuit Breaker.
 * 
 * Protege llamadas a servicios externos (SIA, Gemini, etc.)
 * previniendo cascading failures cuando un servicio deja de responder.
 * 
 * Patrón: CLOSED → (fallos > umbral) → OPEN → (timeout) → HALF_OPEN → (éxito) → CLOSED
 */
export interface CircuitBreakerPort {
  /**
   * Ejecuta una función protegida por el circuit breaker.
   * Si el circuito está OPEN, lanza error inmediatamente sin ejecutar.
   * Si está HALF_OPEN, ejecuta y evalúa si cierra o reabre.
   * 
   * @param serviceName Nombre del servicio protegido (ej: "gemini", "sia")
   * @param fn Función a ejecutar
   * @param fallback Función fallback opcional cuando el circuito está abierto
   * @returns Resultado de fn o del fallback
   */
  execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T>;

  /**
   * Obtiene el estado actual del circuit breaker para un servicio.
   * @param serviceName Nombre del servicio
   */
  getState(serviceName: string): CircuitState;

  /**
   * Obtiene estadísticas de todos los servicios monitoreados.
   */
  getAllStates(): Map<string, { state: CircuitState; failures: number; lastFailure: Date | null }>;
}
