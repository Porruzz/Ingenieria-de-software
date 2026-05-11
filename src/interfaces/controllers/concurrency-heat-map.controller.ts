import { Request, Response } from 'express';
import { GenerateConcurrencyHeatMapUseCase } from '../../application/use-cases/generate-concurrency-heat-map.use-case';

export class ConcurrencyHeatMapController {
  constructor(
    private readonly generateConcurrencyHeatMapUseCase: GenerateConcurrencyHeatMapUseCase
  ) {}

  async getHeatMap(req: Request, res: Response) {
    try {
      const heatMap = await this.generateConcurrencyHeatMapUseCase.execute();
      
      res.status(200).json({
        success: true,
        data: heatMap
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
