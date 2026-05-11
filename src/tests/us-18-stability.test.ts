import { CheckSystemHealthUseCase } from '../application/use-cases/check-system-health.use-case';
import { CircuitBreakerPort } from '../application/ports/circuit-breaker.port';
import { RateLimiterService } from '../infrastructure/services/rate-limiter.service';
import { CircuitBreakerService } from '../infrastructure/services/circuit-breaker.service';
import { CircuitState } from '../domain/entities/health';

describe('US-18 — Estabilidad en Picos de Tráfico', () => {

  // ====== CIRCUIT BREAKER ======

  describe('Circuit Breaker', () => {
    let circuitBreaker: CircuitBreakerService;

    beforeEach(() => {
      circuitBreaker = new CircuitBreakerService(3, 1000); // 3 fallos, 1s reset
    });

    test('US-18: Debería empezar en estado CLOSED', () => {
      expect(circuitBreaker.getState('test-service')).toBe('CLOSED');
    });

    test('US-18: Debería ejecutar funciones normalmente cuando está CLOSED', async () => {
      const result = await circuitBreaker.execute('test-service', async () => 'success');
      expect(result).toBe('success');
      expect(circuitBreaker.getState('test-service')).toBe('CLOSED');
    });

    test('US-18: Debería abrir el circuito después de alcanzar el umbral de fallos', async () => {
      const failingFn = async () => { throw new Error('Service down'); };

      // Fallo 1
      await expect(circuitBreaker.execute('sia', failingFn)).rejects.toThrow('Service down');
      expect(circuitBreaker.getState('sia')).toBe('CLOSED');

      // Fallo 2
      await expect(circuitBreaker.execute('sia', failingFn)).rejects.toThrow('Service down');
      expect(circuitBreaker.getState('sia')).toBe('CLOSED');

      // Fallo 3 → OPEN
      await expect(circuitBreaker.execute('sia', failingFn)).rejects.toThrow('Service down');
      expect(circuitBreaker.getState('sia')).toBe('OPEN');
    });

    test('US-18: Debería rechazar llamadas inmediatamente cuando está OPEN', async () => {
      const failingFn = async () => { throw new Error('fail'); };

      // Abrir el circuito
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute('gemini', failingFn)).rejects.toThrow();
      }

      // La siguiente llamada debería fallar inmediatamente sin ejecutar fn
      let fnExecuted = false;
      await expect(
        circuitBreaker.execute('gemini', async () => { fnExecuted = true; return 'ok'; })
      ).rejects.toThrow('temporalmente no disponible');

      expect(fnExecuted).toBe(false);
    });

    test('US-18: Debería usar fallback cuando el circuito está OPEN y hay fallback', async () => {
      const failingFn = async () => { throw new Error('fail'); };

      // Abrir el circuito
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute('api', failingFn)).rejects.toThrow();
      }

      // Usar fallback
      const result = await circuitBreaker.execute(
        'api',
        async () => 'from-api',
        async () => 'from-fallback'
      );

      expect(result).toBe('from-fallback');
    });

    test('US-18: Debería volver a CLOSED tras éxito en HALF_OPEN', async () => {
      const cb = new CircuitBreakerService(2, 100); // 2 fallos, 100ms reset
      const failingFn = async () => { throw new Error('fail'); };

      // Abrir circuito
      await expect(cb.execute('svc', failingFn)).rejects.toThrow();
      await expect(cb.execute('svc', failingFn)).rejects.toThrow();
      expect(cb.getState('svc')).toBe('OPEN');

      // Esperar a que pase el timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Ahora debería intentar HALF_OPEN y si tiene éxito → CLOSED
      const result = await cb.execute('svc', async () => 'recovered');
      expect(result).toBe('recovered');
      expect(cb.getState('svc')).toBe('CLOSED');
    });

    test('US-18: Debería reportar todos los estados con getAllStates()', async () => {
      await circuitBreaker.execute('service-a', async () => 'ok');
      await circuitBreaker.execute('service-b', async () => 'ok');

      const states = circuitBreaker.getAllStates();
      expect(states.size).toBe(2);
      expect(states.get('service-a')?.state).toBe('CLOSED');
      expect(states.get('service-b')?.failures).toBe(0);
    });
  });

  // ====== HEALTH CHECK ======

  describe('System Health Check', () => {
    let circuitBreaker: CircuitBreakerService;
    let healthUseCase: CheckSystemHealthUseCase;

    beforeEach(() => {
      circuitBreaker = new CircuitBreakerService();
      healthUseCase = new CheckSystemHealthUseCase(circuitBreaker);
    });

    test('US-18: Debería reportar HEALTHY cuando todo está bien', async () => {
      const health = await healthUseCase.checkBasicHealth();

      expect(health.state).toBe('HEALTHY');
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    test('US-18: Debería registrar métricas de requests correctamente', async () => {
      healthUseCase.recordRequest(50, false);
      healthUseCase.recordRequest(100, false);
      healthUseCase.recordRequest(200, true);

      const detailed = await healthUseCase.checkDetailedHealth();

      expect(detailed.metrics.activeConnections).toBe(0);
      expect(detailed.metrics.errorRate).toBeGreaterThan(0); // 1/3 = 33%
      expect(detailed.metrics.memoryUsageMb).toBeGreaterThan(0);
    });

    test('US-18: Debería rastrear conexiones activas', async () => {
      healthUseCase.incrementConnections();
      healthUseCase.incrementConnections();

      let detailed = await healthUseCase.checkDetailedHealth();
      expect(detailed.metrics.activeConnections).toBe(2);

      healthUseCase.decrementConnections();

      detailed = await healthUseCase.checkDetailedHealth();
      expect(detailed.metrics.activeConnections).toBe(1);
    });

    test('US-18: Debería reportar DEGRADED cuando hay circuit breakers abiertos', async () => {
      const failingFn = async () => { throw new Error('fail'); };

      // Abrir un circuit breaker
      for (let i = 0; i < 5; i++) {
        try { await circuitBreaker.execute('critical-service', failingFn); } catch {}
      }

      const health = await healthUseCase.checkBasicHealth();
      expect(health.state).toBe('DEGRADED');
    });

    test('US-18: Debería incluir estado de servicios en el health detallado', async () => {
      await circuitBreaker.execute('gemini', async () => 'ok');
      await circuitBreaker.execute('sia', async () => 'ok');

      const detailed = await healthUseCase.checkDetailedHealth();

      expect(detailed.services).toHaveLength(2);
      expect(detailed.services.map(s => s.name)).toContain('gemini');
      expect(detailed.services.map(s => s.name)).toContain('sia');
    });
  });

  // ====== RATE LIMITER (in-memory fallback) ======

  describe('Rate Limiter (In-Memory Fallback)', () => {
    let rateLimiter: RateLimiterService;

    beforeEach(() => {
      // Crear con Redis mock que siempre falla → forzar in-memory fallback
      const fakeRedis = {
        get: async () => { throw new Error('no redis'); },
        set: async () => { throw new Error('no redis'); },
        del: async () => { throw new Error('no redis'); },
        acquireLock: async () => true,
        releaseLock: async () => {},
        disconnect: async () => {},
      } as any;

      rateLimiter = new RateLimiterService(fakeRedis, 60000, 5, 2); // 5 + 2 burst = 7 max
    });

    test('US-18: Debería permitir requests dentro del límite', async () => {
      const result = await rateLimiter.checkLimit('student-001');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    test('US-18: Debería bloquear requests que excedan el límite', async () => {
      // Consumir todos los tokens (5 + 2 burst = 7)
      for (let i = 0; i < 7; i++) {
        const r = await rateLimiter.checkLimit('student-spam');
        expect(r.allowed).toBe(true);
      }

      // El 8vo debería ser rechazado
      const blocked = await rateLimiter.checkLimit('student-spam');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });

    test('US-18: Debería aislar límites por estudiante', async () => {
      // Consumir todos para student-a
      for (let i = 0; i < 7; i++) {
        await rateLimiter.checkLimit('student-a');
      }

      // student-b no debería estar afectado
      const resultB = await rateLimiter.checkLimit('student-b');
      expect(resultB.allowed).toBe(true);
    });
  });
});
