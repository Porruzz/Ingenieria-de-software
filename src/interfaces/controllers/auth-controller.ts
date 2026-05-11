import { Request, Response } from 'express';
import { AuthService } from '../../infrastructure/auth/auth.service';

/**
 * Controlador de Autenticación.
 * Endpoints públicos (no requieren token):
 * - POST /auth/login     → Iniciar sesión
 * - POST /auth/register  → Registrar cuenta
 * - GET  /auth/me        → Obtener perfil (requiere token)
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email y contraseña son requeridos.'
        });
      }

      const result = await this.authService.login(email, password);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[AuthController] login Error:', error.message);
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /auth/register
   */
  async register(req: Request, res: Response) {
    try {
      const { email, password, fullName, studentId, program, semester } = req.body;

      if (!email || !password || !fullName || !studentId) {
        return res.status(400).json({
          success: false,
          error: 'Email, contraseña, nombre completo y ID de estudiante son requeridos.'
        });
      }

      const result = await this.authService.register(
        email,
        password,
        fullName,
        studentId,
        program || 'No especificado',
        semester || 1
      );

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[AuthController] register Error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /auth/me — Requiere token
   * Devuelve el perfil del usuario autenticado.
   */
  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado.' });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: req.user.userId,
          studentId: req.user.studentId,
          email: req.user.email,
          fullName: req.user.fullName,
          role: req.user.role
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
