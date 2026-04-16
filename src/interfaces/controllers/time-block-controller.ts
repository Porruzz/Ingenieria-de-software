import { Request, Response } from 'express';
import { ManageTimeBlocksUseCase } from '../../application/use-cases/manage-time-blocks';

export class TimeBlockController {
  constructor(private readonly useCase: ManageTimeBlocksUseCase) {}

  async createBlock(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const blockProps = { ...req.body, studentId };
      const newBlock = await this.useCase.createBlock(blockProps);
      
      res.status(201).json({
        success: true,
        data: newBlock
      });
    } catch (error: any) {
      if (error.message.includes('Concurrency')) {
        res.status(409).json({ success: false, error: error.message });
      } else {
        res.status(400).json({ success: false, error: error.message });
      }
    }
  }

  async getBlocks(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const blocks = await this.useCase.getBlocksByStudent(studentId);
      res.status(200).json({
        success: true,
        data: blocks
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteBlock(req: Request, res: Response) {
    try {
      const { studentId, blockId } = req.params;
      await this.useCase.deleteBlock(studentId, blockId);
      res.status(200).json({ success: true, message: "Bloque eliminado" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateBlock(req: Request, res: Response) {
    try {
      const { studentId, blockId } = req.params;
      const updates = req.body;
      const updatedBlock = await this.useCase.updateBlock(studentId, blockId, updates);
      
      res.status(200).json({
        success: true,
        data: updatedBlock
      });
    } catch (error: any) {
      if (error.message.includes('Concurrency') || error.message.includes('solapa')) {
        res.status(409).json({ success: false, error: error.message });
      } else {
        res.status(400).json({ success: false, error: error.message });
      }
    }
  }
}
