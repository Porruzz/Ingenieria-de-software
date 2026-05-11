import { Router, Request, Response } from 'express';
import { GetSuggestions, TiempoLibre } from '../../application/use-cases/get-suggestions';

// ============================================================
//  US-13 | Rutas HTTP — Sugerencias de Cursos y Eventos
// ============================================================

const router  = Router();
const getSuggestions = new GetSuggestions();

/**
 * GET /api/sugerencias
 * Retorna todas las sugerencias disponibles.
 * Query param opcional: ?tipo=CURSO_CORTO | EVENTO_CULTURAL
 *
 * Ejemplo: GET /api/sugerencias?tipo=CURSO_CORTO
 */
router.get('/', (req: Request, res: Response) => {
  const { tipo } = req.query;

  if (tipo && tipo !== 'CURSO_CORTO' && tipo !== 'EVENTO_CULTURAL') {
    res.status(400).json({
      ok: false,
      message: 'tipo debe ser CURSO_CORTO o EVENTO_CULTURAL',
    });
    return;
  }

  const sugerencias = getSuggestions.execute(
    tipo as 'CURSO_CORTO' | 'EVENTO_CULTURAL' | undefined
  );

  res.json({ ok: true, count: sugerencias.length, data: sugerencias });
});

/**
 * POST /api/sugerencias/tiempo-libre
 * Retorna sugerencias que encajan en los tiempos libres del estudiante.
 * Body: { tiemposLibres: TiempoLibre[], tipo?: string }
 *
 * Ejemplo body:
 * {
 *   "tiemposLibres": [
 *     { "dia": "Lunes", "horaInicio": "10:00", "horaFin": "12:00" },
 *     { "dia": "Viernes", "horaInicio": "08:00", "horaFin": "10:00" }
 *   ]
 * }
 */
router.post('/tiempo-libre', (req: Request, res: Response) => {
  const { tiemposLibres, tipo } = req.body;

  if (!tiemposLibres || !Array.isArray(tiemposLibres) || tiemposLibres.length === 0) {
    res.status(400).json({
      ok: false,
      message: 'tiemposLibres debe ser un array no vacío de bloques de tiempo.',
    });
    return;
  }

  const sugerencias = getSuggestions.getForFreeTime(
    tiemposLibres as TiempoLibre[],
    tipo as 'CURSO_CORTO' | 'EVENTO_CULTURAL' | undefined
  );

  res.json({ ok: true, count: sugerencias.length, data: sugerencias });
});

/**
 * GET /api/sugerencias/gratuitas
 * Retorna solo las sugerencias gratuitas.
 * Query param opcional: ?tipo=CURSO_CORTO | EVENTO_CULTURAL
 */
router.get('/gratuitas', (req: Request, res: Response) => {
  const { tipo } = req.query;
  const sugerencias = getSuggestions.getGratuitas(
    tipo as 'CURSO_CORTO' | 'EVENTO_CULTURAL' | undefined
  );
  res.json({ ok: true, count: sugerencias.length, data: sugerencias });
});

export default router;
