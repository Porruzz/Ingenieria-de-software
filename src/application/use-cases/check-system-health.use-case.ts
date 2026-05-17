import { HealthStatus, SystemState, SystemMetrics, ServiceHealth } from '../../domain/entities/health';
import { CircuitBreakerPort } from '../ports/circuit-breaker.port';

/**
 * US-18: Caso de uso — Verificar Salud del Sistema.
 * 
 * Recopila métricas de rendimiento, estado de servicios externos,
 * y determina el estado global del sistema para que el frontend
 * pueda mostrar indicadores de salud al estudiante.
 * 
 * Responsabilidades:
 * - Recopilar métricas de proceso (memoria, uptime, conexiones)
 * - Consultar estado de circuit breakers de servicios externos
 * - Determinar estado global del sistema (HEALTHY, DEGRADED, OVERLOADED, DOWN)
 */
export class CheckSystemHealthUseCase {
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTimeMs = 0;
  private readonly startTime = Date.now();
  private activeConnections = 0;
  private queuedRequests = 0;

  constructor(
    private readonly circuitBreaker: CircuitBreakerPort
  ) {}

  /**
   * Registra una request entrante para métricas.
   * Llamado desde el middleware de monitoreo.
   */
  recordRequest(responseTimeMs: number, isError: boolean): void {
    this.requestCount++;
    this.totalResponseTimeMs += responseTimeMs;
    if (isError) {
      this.errorCount++;
    }
  }

  /** Incrementa/decrementa conexiones activas */
  incrementConnections(): void { this.activeConnections++; }
  decrementConnections(): void { this.activeConnections = Math.max(0, this.activeConnections - 1); }

  /** Actualiza requests en cola */
  updateQueuedRequests(count: number): void { this.queuedRequests = count; }

  /**
   * Genera un reporte de salud básico (para GET /api/health).
   * Ligero, pensado para polling frecuente.
   */
  async checkBasicHealth(): Promise<{ state: SystemState; uptime: number; timestamp: Date }> {
    const state = this.determineSystemState();
    return {
      state,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date()
    };
  }

  /**
   * Genera un reporte de salud detallado (para GET /api/health/detailed).
   * Incluye métricas completas y estado de servicios.
   */
  async checkDetailedHealth(): Promise<HealthStatus> {
    const metrics = this.collectMetrics();
    const services = this.collectServiceHealths();
    const state = this.determineSystemState();

    return {
      state,
      metrics,
      services,
      timestamp: new Date()
    };
  }

  /**
   * Recopila las métricas del sistema en tiempo real.
   */
  private collectMetrics(): SystemMetrics {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    // Calcular RPM (requests per minute)
    const uptimeMinutes = Math.max(1, uptimeSeconds / 60);
    const rpm = Math.round(this.requestCount / uptimeMinutes);

    // Error rate
    const errorRate = this.requestCount > 0
      ? Math.round((this.errorCount / this.requestCount) * 10000) / 100
      : 0;

    // Average response time
    const avgResponseTime = this.requestCount > 0
      ? Math.round(this.totalResponseTimeMs / this.requestCount)
      : 0;

    return {
      activeConnections: this.activeConnections,
      requestsPerMinute: rpm,
      averageResponseTimeMs: avgResponseTime,
      errorRate,
      memoryUsageMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      uptime: uptimeSeconds,
      queuedRequests: this.queuedRequests
    };
  }

  /**
   * Recopila el estado de salud de todos los servicios monitoreados
   * por el circuit breaker.
   */
  private collectServiceHealths(): ServiceHealth[] {
    const services: ServiceHealth[] = [];
    const states = this.circuitBreaker.getAllStates();

    for (const [name, info] of states) {
      services.push({
        name,
        status: info.state,
        lastSuccessAt: null,
        lastFailureAt: info.lastFailure,
        failureCount: info.failures,
        responseTimeMs: 0
      });
    }

    return services;
  }

  /**
   * Determina el estado global del sistema basado en múltiples indicadores.
   */
  private determineSystemState(): SystemState {
    const metrics = this.collectMetrics();
    const states = this.circuitBreaker.getAllStates();

    // Si hay un circuit breaker OPEN → DEGRADED
    let hasOpenCircuit = false;
    for (const [, info] of states) {
      if (info.state === 'OPEN') {
        hasOpenCircuit = true;
        break;
      }
    }

    // Error rate > 50% → DOWN
    if (metrics.errorRate > 50) return 'DOWN';

    // Error rate > 20% o circuit abierto → DEGRADED
    if (metrics.errorRate > 20 || hasOpenCircuit) return 'DEGRADED';

    // Memoria > 500MB o RPM muy alto → OVERLOADED
    if (metrics.memoryUsageMb > 500 || metrics.requestsPerMinute > 1000) return 'OVERLOADED';

    // Response time promedio > 5s → DEGRADED
    if (metrics.averageResponseTimeMs > 5000) return 'DEGRADED';

    return 'HEALTHY';
  }
}
