import { Request, Response } from 'express';
import { CalculateCriticalityUseCase } from '../../application/use-cases/calculate-criticality.use-case';

export class CriticalSubjectController {
  constructor(private readonly calculateCriticality: CalculateCriticalityUseCase) {}

  async getCriticality(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { programId } = req.query;

      if (!programId) {
        return res.status(400).json({ success: false, error: 'programId is required' });
      }

      const reports = await this.calculateCriticality.execute(studentId, programId as string);
      
      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
