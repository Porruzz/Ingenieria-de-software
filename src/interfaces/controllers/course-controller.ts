import { Request, Response } from 'express';
import { GetAvailableSections } from '../../application/use-cases/get-available-sections';

export class CourseController {
  constructor(private getAvailableSections: GetAvailableSections) {}

  getSections(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      // Nota: En esta implementación US-08, courseId se usa como el nombre de la materia para el filtro
      const sections = this.getAvailableSections.execute(courseId);
      console.log(`[US-08] Buscando "${courseId}". Encontradas ${sections.length} secciones.`);
      
      // El frontend espera el array directamente: setSections(data)
      res.json(sections);
    } catch (error) {
      console.error('[CourseController] Error:', error);
      res.status(500).json({ ok: false, message: 'Error al obtener secciones' });
    }
  }

  getAllCourseNames(_req: Request, res: Response) {
    try {
      const names = this.getAvailableSections.getNombresMaterias();
      res.json({ ok: true, data: names });
    } catch (error) {
      res.status(500).json({ ok: false, message: 'Error al obtener nombres de materias' });
    }
  }
}
