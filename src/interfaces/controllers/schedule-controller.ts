import { Request, Response } from 'express';
import { GenerateOptimalSchedule } from '../../application/use-cases/generate-schedule';

export class ScheduleController {
  constructor(private readonly generateUseCase: GenerateOptimalSchedule) {}

  async generate(req: Request, res: Response) {
    try {
      const { studentId, period = '2026-2', forbiddenZones = [], commuteTimeMinutes = 30 } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: 'Falta studentId' });
      }

      // Preparamos el input para el caso de uso
      const input = {
        studentId,
        approvedCourseIds: req.body.approvedCourseIds || [],
        failedCourseIds: req.body.failedCourseIds || [],
        forbiddenZones,
        commuteTimeMinutes,
        pinnedSectionIds: []
      };


      const result = await this.generateUseCase.execute(input, period);
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[ScheduleController] Error:', error);
      return res.status(500).json({ 
        error: 'Error interno generando horarios',
        message: error.message 
      });
    }
  }
}
