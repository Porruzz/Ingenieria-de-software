import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthTokenPayload } from '../../domain/entities/user';

// Extender Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Middleware de autenticación JWT.
 * Verifica el token en el header Authorization: Bearer <token>
 * y adjunta los datos del usuario al request.
 */
export function createAuthMiddleware(authService: AuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Acceso denegado. Se requiere un token de autenticación.',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = authService.verifyToken(token);
      req.user = payload;
      next();
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Token inválido o expirado. Inicia sesión nuevamente.',
        code: 'INVALID_TOKEN'
      });
    }
  };
}
