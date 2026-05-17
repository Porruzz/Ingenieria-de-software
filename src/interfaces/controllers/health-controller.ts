import { Request, Response } from 'express';
import { CheckSystemHealthUseCase } from '../../application/use-cases/check-system-health.use-case';

/**
 * US-18: Controlador de Health Check y Métricas del Sistema.
 * 
 * Expone endpoints para que el frontend pueda:
 * - Verificar si el backend está respondiendo (health ping)
 * - Mostrar estado del sistema al estudiante (barra de estado)
 * - Obtener métricas detalladas (panel de administración)
 * 
 * Endpoints:
 * - GET /health          → Health check básico (ligero, para polling)
 * - GET /health/detailed → Métricas detalladas con servicios
 */
export class HealthController {
  constructor(private readonly healthUseCase: CheckSystemHealthUseCase) {}

  /**
   * GET /health
   * Health check rápido. Responde con estado global y uptime.
   * Diseñado para polling frecuente desde el frontend.
   */
  async basicHealth(req: Request, res: Response) {
    try {
      const health = await this.healthUseCase.checkBasicHealth();

      // Status code basado en el estado del sistema
      const statusCode = health.state === 'HEALTHY' ? 200 :
                         health.state === 'DEGRADED' ? 200 :
                         health.state === 'OVERLOADED' ? 503 : 503;

      return res.status(statusCode).json({
        success: true,
        data: {
          state: health.state,
          uptime: health.uptime,
          timestamp: health.timestamp
        }
      });
    } catch (error: any) {
      console.error('[HealthController] basicHealth Error:', error);
      return res.status(500).json({
        success: false,
        data: {
          state: 'DOWN',
          error: error.message
        }
      });
    }
  }

  /**
   * GET /health/detailed
   * Métricas detalladas: memoria, RPM, error rate, estado de servicios externos.
   * Para panel de monitoreo o debugging.
   */
  async detailedHealth(req: Request, res: Response) {
    try {
      const health = await this.healthUseCase.checkDetailedHealth();

      return res.status(200).json({
        success: true,
        data: health
      });
    } catch (error: any) {
      console.error('[HealthController] detailedHealth Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
