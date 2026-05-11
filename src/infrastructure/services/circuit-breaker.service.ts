import { CircuitBreakerPort } from '../../application/ports/circuit-breaker.port';
import { CircuitState, STABILITY_DEFAULTS } from '../../domain/entities/health';

/**
 * US-18: Implementación del patrón Circuit Breaker.
 * 
 * Protege las llamadas a servicios externos (SIA, Gemini AI, etc.)
 * previniendo cascading failures cuando un servicio no responde.
 * 
 * Estados:
 * - CLOSED: Funcionamiento normal, todas las llamadas pasan.
 * - OPEN: El servicio falló demasiado. Las llamadas son rechazadas inmediatamente.
 * - HALF_OPEN: Se permite una llamada de prueba para ver si el servicio se recuperó.
 * 
 * Diagrama de transición:
 * CLOSED --[fallos >= threshold]--> OPEN --[timeout]--> HALF_OPEN
 * HALF_OPEN --[éxito]--> CLOSED
 * HALF_OPEN --[fallo]--> OPEN
 */
export class CircuitBreakerService implements CircuitBreakerPort {
  private readonly circuits: Map<string, CircuitInfo> = new Map();
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(
    failureThreshold: number = STABILITY_DEFAULTS.CIRCUIT_BREAKER_THRESHOLD,
    resetTimeoutMs: number = STABILITY_DEFAULTS.CIRCUIT_BREAKER_RESET_TIMEOUT_MS
  ) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(serviceName);

    // Si el circuito está OPEN
    if (circuit.state === 'OPEN') {
      // Verificar si ya pasó el timeout para intentar HALF_OPEN
      if (Date.now() - circuit.lastStateChangeAt >= this.resetTimeoutMs) {
        circuit.state = 'HALF_OPEN';
        circuit.lastStateChangeAt = Date.now();
        console.log(`[US-18] Circuit Breaker [${serviceName}]: OPEN → HALF_OPEN (intentando reconexión)`);
      } else {
        // Aún en timeout, usar fallback o lanzar error
        console.warn(`[US-18] Circuit Breaker [${serviceName}]: OPEN — Rechazando llamada`);
        if (fallback) {
          return fallback();
        }
        throw new Error(
          `[US-18] Servicio "${serviceName}" temporalmente no disponible. ` +
          `El circuito está abierto por ${Math.ceil((this.resetTimeoutMs - (Date.now() - circuit.lastStateChangeAt)) / 1000)}s más.`
        );
      }
    }

    // Intentar ejecutar la función (CLOSED o HALF_OPEN)
    try {
      const result = await fn();

      // Éxito: resetear contadores
      if (circuit.state === 'HALF_OPEN') {
        console.log(`[US-18] Circuit Breaker [${serviceName}]: HALF_OPEN → CLOSED (servicio recuperado)`);
      }
      circuit.state = 'CLOSED';
      circuit.failureCount = 0;
      circuit.lastSuccessAt = new Date();
      circuit.lastStateChangeAt = Date.now();

      return result;
    } catch (error) {
      // Fallo: incrementar contadores
      circuit.failureCount++;
      circuit.lastFailureAt = new Date();

      console.warn(
        `[US-18] Circuit Breaker [${serviceName}]: Fallo #${circuit.failureCount}/${this.failureThreshold}`
      );

      // Si alcanzamos el umbral de fallos → OPEN
      if (circuit.failureCount >= this.failureThreshold) {
        circuit.state = 'OPEN';
        circuit.lastStateChangeAt = Date.now();
        console.error(
          `[US-18] Circuit Breaker [${serviceName}]: → OPEN (${circuit.failureCount} fallos consecutivos)`
        );
      }

      // Si estamos en HALF_OPEN y falla → volver a OPEN
      if (circuit.state === 'HALF_OPEN') {
        circuit.state = 'OPEN';
        circuit.lastStateChangeAt = Date.now();
        console.error(`[US-18] Circuit Breaker [${serviceName}]: HALF_OPEN → OPEN (prueba fallida)`);
      }

      throw error;
    }
  }

  getState(serviceName: string): CircuitState {
    const circuit = this.circuits.get(serviceName);
    return circuit?.state || 'CLOSED';
  }

  getAllStates(): Map<string, { state: CircuitState; failures: number; lastFailure: Date | null }> {
    const result = new Map<string, { state: CircuitState; failures: number; lastFailure: Date | null }>();

    for (const [name, info] of this.circuits) {
      result.set(name, {
        state: info.state,
        failures: info.failureCount,
        lastFailure: info.lastFailureAt
      });
    }

    return result;
  }

  private getOrCreateCircuit(serviceName: string): CircuitInfo {
    let circuit = this.circuits.get(serviceName);
    if (!circuit) {
      circuit = {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureAt: null,
        lastSuccessAt: null,
        lastStateChangeAt: Date.now()
      };
      this.circuits.set(serviceName, circuit);
    }
    return circuit;
  }
}

interface CircuitInfo {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: Date | null;
  lastSuccessAt: Date | null;
  lastStateChangeAt: number;
}
