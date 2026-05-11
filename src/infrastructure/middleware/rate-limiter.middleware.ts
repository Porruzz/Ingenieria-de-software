import { Request, Response, NextFunction } from 'express';
import { RateLimiterService } from '../services/rate-limiter.service';

/**
 * US-18: Middleware de Rate Limiting.
 * 
 * Limita la cantidad de requests por identificador (IP o studentId)
 * usando un sliding window. Protege el sistema de abuso y sobrecarga
 * durante picos de tráfico (semana de matrículas).
 * 
 * Headers de respuesta cuando se aplica rate limiting:
 * - X-RateLimit-Limit: Límite total de la ventana
 * - X-RateLimit-Remaining: Requests restantes
 * - Retry-After: Segundos hasta que se libere (solo en 429)
 */
export function createRateLimiterMiddleware(rateLimiter: RateLimiterService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Usar IP como identificador por defecto, o studentId si viene en headers
    const identifier = (req.headers['x-student-id'] as string) || req.ip || 'anonymous';

    try {
      const result = await rateLimiter.checkLimit(identifier);

      // Siempre enviar headers informativos
      res.setHeader('X-RateLimit-Limit', result.totalLimit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (!result.allowed) {
        const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
        res.setHeader('Retry-After', retryAfterSeconds);

        console.warn(`[US-18] Rate limit excedido para ${identifier}. Retry en ${retryAfterSeconds}s`);

        res.status(429).json({
          success: false,
          error: 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.',
          retryAfterSeconds,
          limit: result.totalLimit
        });
        return;
      }

      next();
    } catch (error) {
      // Si falla el rate limiter, dejar pasar (modo degradado, no bloquear al usuario)
      console.warn('[US-18] Rate limiter falló, operando en modo degradado:', error);
      next();
    }
  };
}
