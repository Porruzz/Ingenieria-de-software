import { Request, Response, NextFunction } from 'express';
import { ROUTE_PRIORITIES, RequestPriority, STABILITY_DEFAULTS } from '../../domain/entities/health';
import { CheckSystemHealthUseCase } from '../../application/use-cases/check-system-health.use-case';

/**
 * US-18: Middleware de Cola de Requests con Prioridad.
 * 
 * Cuando el sistema detecta alta carga, en lugar de rechazar requests,
 * los encola por prioridad para procesamiento ordenado.
 * 
 * Prioridades:
 * - CRITICAL: Formalización de swaps (no se deben perder)
 * - HIGH: Generación de horarios, marketplace
 * - NORMAL: Sincronización académica
 * - LOW: Chat, health checks
 * 
 * Bajo carga normal, este middleware es transparente (pass-through).
 */
export function createRequestQueueMiddleware(healthUseCase: CheckSystemHealthUseCase) {
  // Cola en memoria segmentada por prioridad
  const queues: Record<RequestPriority, QueuedRequest[]> = {
    CRITICAL: [],
    HIGH: [],
    NORMAL: [],
    LOW: []
  };

  let isProcessing = false;
  let totalQueued = 0;

  /**
   * Determina la prioridad de un request basado en su ruta.
   */
  function getRequestPriority(path: string): RequestPriority {
    for (const [route, priority] of Object.entries(ROUTE_PRIORITIES)) {
      if (path.startsWith(route)) {
        return priority;
      }
    }
    return 'NORMAL';
  }

  /**
   * Procesa la cola en orden de prioridad.
   */
  async function processQueue(): Promise<void> {
    if (isProcessing) return;
    isProcessing = true;

    const priorities: RequestPriority[] = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'];

    for (const priority of priorities) {
      while (queues[priority].length > 0) {
        const item = queues[priority].shift()!;
        totalQueued--;
        healthUseCase.updateQueuedRequests(totalQueued);

        // Liberar el request para que continúe
        item.resolve();
      }
    }

    isProcessing = false;
  }

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const healthStatus = await healthUseCase.checkBasicHealth();

    // Si el sistema está sano, pass-through (no encolar)
    if (healthStatus.state === 'HEALTHY') {
      next();
      return;
    }

    const priority = getRequestPriority(req.path);

    // Requests CRITICAL siempre pasan
    if (priority === 'CRITICAL') {
      next();
      return;
    }

    // Si la cola está llena, rechazar LOW priority
    if (totalQueued >= STABILITY_DEFAULTS.MAX_QUEUE_SIZE) {
      if (priority === 'LOW') {
        res.status(503).json({
          success: false,
          error: 'El sistema está experimentando alta demanda. Intenta de nuevo en unos minutos.',
          systemState: healthStatus.state
        });
        return;
      }
    }

    // Encolar el request
    totalQueued++;
    healthUseCase.updateQueuedRequests(totalQueued);

    console.log(`[US-18] Request encolado [${priority}] ${req.method} ${req.path} (cola: ${totalQueued})`);

    // Crear promesa que se resolverá cuando sea el turno
    await new Promise<void>((resolve) => {
      queues[priority].push({ req, resolve, enqueuedAt: Date.now() });

      // Iniciar procesamiento
      processQueue();
    });

    next();
  };
}

interface QueuedRequest {
  req: Request;
  resolve: () => void;
  enqueuedAt: number;
}
