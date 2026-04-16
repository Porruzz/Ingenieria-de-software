import { Request, Response } from 'express';
import { UpdateStudentLogisticsUseCase } from '../../application/use-cases/update-student-logistics';

export class StudentController {
  constructor(private readonly updateLogisticsUseCase: UpdateStudentLogisticsUseCase) {}

  async updateLogistics(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { tiempoTrasladoMin, bufferSeguridadMin } = req.body;

      if (tiempoTrasladoMin === undefined || bufferSeguridadMin === undefined) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos.' });
      }

      const updatedStudent = await this.updateLogisticsUseCase.execute({
        studentId,
        tiempoTrasladoMin: Number(tiempoTrasladoMin),
        bufferSeguridadMin: Number(bufferSeguridadMin)
      });
      
      const effectiveBuffer = updatedStudent.calculateEffectiveLogisticBuffer();
      
      res.status(200).json({
        success: true,
        data: {
          tiempoTrasladoMin: updatedStudent.tiempoTrasladoMin,
          bufferSeguridadMin: updatedStudent.bufferSeguridadMin,
          effectiveBuffer
        }
      });
    } catch (error: any) {
      if (error.message.includes('Concurrency')) {
        res.status(409).json({ success: false, error: error.message });
      } else if (error.message.includes('negativos') || error.message.includes('superar')) {
        res.status(400).json({ success: false, error: error.message });
      } else if (error.message.includes('no encontrado')) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }
}
