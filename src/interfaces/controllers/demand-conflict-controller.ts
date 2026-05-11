import { Request, Response } from 'express';
import { GenerateDemandConflictReportUseCase } from '../../application/use-cases/generate-demand-conflict-report.use-case';

export class DemandConflictController {
  constructor(
    private readonly generateDemandConflictReport: GenerateDemandConflictReportUseCase
  ) {}

  async getReport(req: Request, res: Response) {
    try {
      // En un entorno real, el periodo vendría como parámetro (ej. /api/reports/demand-conflict?period=2026-2)
      // Si no viene, asumimos un valor por defecto o requerimos que esté presente.
      const period = req.query.period as string || '2026-2';
      
      const report = await this.generateDemandConflictReport.execute(period);
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
