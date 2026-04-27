import { Request, Response } from 'express';
import { ConfirmBilateralSwapUseCase } from '../../application/use-cases/confirm-bilateral-swap.use-case';
import { FormalizeSwapUseCase } from '../../application/use-cases/formalize-swap.use-case';

export class SwapController {
  constructor(
    private readonly confirmUseCase: ConfirmBilateralSwapUseCase,
    private readonly formalizeUseCase: FormalizeSwapUseCase
  ) {}

  async confirm(req: Request, res: Response) {
    try {
      const { matchId, studentId } = req.body;
      
      if (!matchId || !studentId) {
        return res.status(400).json({ error: 'Faltan matchId o studentId' });
      }

      const match = await this.confirmUseCase.execute(matchId, studentId);
      return res.status(200).json(match);
    } catch (error: any) {
      console.error('[SwapController] Confirm Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async formalize(req: Request, res: Response) {
    try {
      const { matchId } = req.body;

      if (!matchId) {
        return res.status(400).json({ error: 'Falta matchId' });
      }

      const result = await this.formalizeUseCase.execute(matchId);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[SwapController] Formalize Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const { matchId } = req.body;
      console.log(`[US-10] Match ${matchId} rechazado por el usuario.`);
      return res.status(200).json({ message: 'Intercambio rechazado correctamente.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

}
