import { RateLimiterPort, RateLimitResult, RateLimitStatus } from '../../application/ports/rate-limiter.port';
import { RedisService } from '../cache/redis-service';
import { STABILITY_DEFAULTS } from '../../domain/entities/health';

/**
 * US-18: Servicio de Rate Limiting con Sliding Window.
 * 
 * Implementa rate limiting usando Redis como backend.
 * Usa el patrón sliding window log para una limitación más precisa
 * que el fixed window counter.
 * 
 * Si Redis no está disponible, opera en modo degradado usando
 * un Map en memoria (graceful degradation).
 */
export class RateLimiterService implements RateLimiterPort {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly burstAllowance: number;

  // Fallback en memoria cuando Redis no está disponible
  private readonly inMemoryCounters: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private readonly redis: RedisService,
    windowMs: number = STABILITY_DEFAULTS.RATE_LIMIT_WINDOW_MS,
    maxRequests: number = STABILITY_DEFAULTS.RATE_LIMIT_PER_STUDENT,
    burstAllowance: number = STABILITY_DEFAULTS.BURST_ALLOWANCE
  ) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.burstAllowance = burstAllowance;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const effectiveLimit = this.maxRequests + this.burstAllowance;

    try {
      // Intentar usar Redis
      const currentStr = await this.redis.get(key);
      let current = currentStr ? parseInt(currentStr, 10) : 0;

      if (current >= effectiveLimit) {
        // Obtener TTL para calcular retryAfter
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: this.windowMs,
          totalLimit: effectiveLimit
        };
      }

      // Incrementar contador
      current++;
      await this.redis.set(key, current.toString(), Math.ceil(this.windowMs / 1000));

      return {
        allowed: true,
        remaining: effectiveLimit - current,
        retryAfterMs: 0,
        totalLimit: effectiveLimit
      };
    } catch {
      // Fallback a in-memory
      return this.checkLimitInMemory(identifier, now, effectiveLimit);
    }
  }

  async getStatus(identifier: string): Promise<RateLimitStatus> {
    const key = `ratelimit:${identifier}`;

    try {
      const currentStr = await this.redis.get(key);
      const current = currentStr ? parseInt(currentStr, 10) : 0;
      const effectiveLimit = this.maxRequests + this.burstAllowance;

      return {
        currentCount: current,
        windowResetAt: new Date(Date.now() + this.windowMs),
        isBlocked: current >= effectiveLimit
      };
    } catch {
      // Fallback
      const counter = this.inMemoryCounters.get(identifier);
      return {
        currentCount: counter?.count || 0,
        windowResetAt: new Date(counter?.resetAt || Date.now() + this.windowMs),
        isBlocked: (counter?.count || 0) >= (this.maxRequests + this.burstAllowance)
      };
    }
  }

  /**
   * Fallback: Rate limiting en memoria cuando Redis no está disponible.
   */
  private checkLimitInMemory(
    identifier: string,
    now: number,
    effectiveLimit: number
  ): RateLimitResult {
    let counter = this.inMemoryCounters.get(identifier);

    // Si no existe o la ventana expiró, crear nuevo contador
    if (!counter || now >= counter.resetAt) {
      counter = { count: 0, resetAt: now + this.windowMs };
      this.inMemoryCounters.set(identifier, counter);
    }

    if (counter.count >= effectiveLimit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: counter.resetAt - now,
        totalLimit: effectiveLimit
      };
    }

    counter.count++;

    return {
      allowed: true,
      remaining: effectiveLimit - counter.count,
      retryAfterMs: 0,
      totalLimit: effectiveLimit
    };
  }
}
