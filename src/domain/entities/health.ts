/**
 * US-18: Entidades de dominio para Estabilidad en Picos de Tráfico.
 * Modela la salud del sistema, métricas de rendimiento y estados del circuit breaker.
 */

/** Estado global del sistema */
export type SystemState = 'HEALTHY' | 'DEGRADED' | 'OVERLOADED' | 'DOWN';

/** Estado del circuit breaker */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Métricas en tiempo real del sistema */
export interface SystemMetrics {
  activeConnections: number;
  requestsPerMinute: number;
  averageResponseTimeMs: number;
  errorRate: number;          // Porcentaje de errores (0-100)
  memoryUsageMb: number;
  uptime: number;             // Segundos desde el inicio
  queuedRequests: number;     // Requests en cola de prioridad
}

/** Estado de un servicio externo monitoreado */
export interface ServiceHealth {
  name: string;
  status: CircuitState;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  failureCount: number;
  responseTimeMs: number;
}

/** Reporte completo de salud del sistema */
export interface HealthStatus {
  state: SystemState;
  metrics: SystemMetrics;
  services: ServiceHealth[];
  timestamp: Date;
}

/** Configuración del rate limiter */
export interface RateLimitConfig {
  windowMs: number;             // Ventana de tiempo en ms
  maxRequestsPerWindow: number; // Máximo de requests por ventana
  burstAllowance: number;       // Requests extra permitidos en ráfaga
}

/** Prioridad de una operación para la cola */
export type RequestPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

/** Mapeo de rutas a prioridades para la cola de requests */
export const ROUTE_PRIORITIES: Record<string, RequestPriority> = {
  '/api/swaps/formalize': 'CRITICAL',
  '/api/swaps/confirm': 'CRITICAL',
  '/api/schedules/generate': 'HIGH',
  '/api/marketplace/offers': 'HIGH',
  '/api/sync': 'NORMAL',
  '/api/sync/image': 'NORMAL',
  '/api/chat': 'LOW',
  '/api/health': 'LOW',
};

/** Constantes de estabilidad del sistema */
export const STABILITY_DEFAULTS = {
  /** Requests por minuto por estudiante */
  RATE_LIMIT_PER_STUDENT: 60,
  /** Ventana del rate limiter en ms (1 minuto) */
  RATE_LIMIT_WINDOW_MS: 60_000,
  /** Ráfaga permitida */
  BURST_ALLOWANCE: 10,
  /** Umbral para considerar el sistema degradado */
  DEGRADED_THRESHOLD_RPM: 500,
  /** Umbral para considerar el sistema sobrecargado */
  OVERLOADED_THRESHOLD_RPM: 1000,
  /** Cantidad máxima de requests en cola */
  MAX_QUEUE_SIZE: 200,
  /** Umbral de fallos para abrir el circuit breaker */
  CIRCUIT_BREAKER_THRESHOLD: 5,
  /** Tiempo en ms antes de reintentar (half-open) */
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 30_000,
};
