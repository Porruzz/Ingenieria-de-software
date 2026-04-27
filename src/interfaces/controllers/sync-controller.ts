import { Request, Response } from 'express';
import { SyncAcademicHistory } from '../../application/use-cases/sync-academic-history';

export class SyncController {
  constructor(private readonly syncUseCase: SyncAcademicHistory) {}

  async sync(req: Request, res: Response) {
    try {
      const { studentId, universityToken } = req.body;
      
      if (!studentId || !universityToken) {
        return res.status(400).json({ 
          error: 'Faltan datos obligatorios (studentId, universityToken)' 
        });
      }

      const result = await this.syncUseCase.execute(studentId, universityToken);
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[SyncController] Error:', error);
      return res.status(500).json({ 
        error: 'Error interno durante la sincronización',
        message: error.message 
      });
    }
  }
}
