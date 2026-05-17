import { Request, Response } from 'express';
import { RegisterStudentUseCase } from '../../application/use-cases/auth/register-student';
import { LoginStudentUseCase } from '../../application/use-cases/auth/login-student';
import { RequestPasswordResetUseCase } from '../../application/use-cases/auth/request-password-reset';
import { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password';
import { SSOLoginUseCase } from '../../application/use-cases/auth/sso-login';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterStudentUseCase,
    private readonly loginUseCase: LoginStudentUseCase,
    private readonly requestResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly ssoLoginUseCase: SSOLoginUseCase
  ) {}

  async register(req: Request, res: Response) {
    try {
      const student = await this.registerUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        message: 'Estudiante registrado exitosamente.',
        data: {
          id: student.id,
          nombreCompleto: student.nombreCompleto,
          emailInstitucional: student.emailInstitucional,
          identificacionUniversidad: student.identificacionUniversidad
        }
      });
    } catch (error: any) {
      if (error.message.includes('obligatorios') || error.message.includes('válida') || error.message.includes('caracteres')) {
        res.status(400).json({ success: false, error: error.message });
      } else if (error.message.includes('ya se encuentra registrado')) {
        res.status(409).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { emailInstitucional, password } = req.body;
      const result = await this.loginUseCase.execute({ emailInstitucional, password });
      
      res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente.',
        data: {
          token: result.token,
          student: {
            id: result.student.id,
            nombreCompleto: result.student.nombreCompleto,
            emailInstitucional: result.student.emailInstitucional,
            identificacionUniversidad: result.student.identificacionUniversidad,
            creditosAprobados: result.student.creditosAprobados,
            promedioAcumulado: result.student.promedioAcumulado,
            trabaja: result.student.trabaja,
            horasTrabajoSemanal: result.student.horasTrabajoSemanal,
            tiempoTrasladoMin: result.student.tiempoTrasladoMin,
            bufferSeguridadMin: result.student.bufferSeguridadMin
          }
        }
      });
    } catch (error: any) {
      if (error.message.includes('incorrectas') || error.message.includes('requeridos') || error.message.includes('configurada')) {
        res.status(401).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { emailInstitucional } = req.body;
      const result = await this.requestResetUseCase.execute({ emailInstitucional });
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          token: result.token,
          resetLink: result.resetLink
        }
      });
    } catch (error: any) {
      if (error.message.includes('requerido') || error.message.includes('no se encuentra registrado')) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      await this.resetPasswordUseCase.execute({ token, newPassword });
      res.status(200).json({
        success: true,
        message: 'Contraseña restablecida exitosamente.'
      });
    } catch (error: any) {
      if (error.message.includes('requerido') || error.message.includes('caracteres')) {
        res.status(400).json({ success: false, error: error.message });
      } else if (error.message.includes('no es válido') || error.message.includes('expirado')) {
        res.status(401).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  async ssoCallback(req: Request, res: Response) {
    try {
      const { emailInstitucional, nombreCompleto } = req.body;
      const result = await this.ssoLoginUseCase.execute({ emailInstitucional, nombreCompleto });
      
      res.status(200).json({
        success: true,
        message: 'Sesión SSO iniciada correctamente.',
        data: {
          token: result.token,
          student: {
            id: result.student.id,
            nombreCompleto: result.student.nombreCompleto,
            emailInstitucional: result.student.emailInstitucional,
            identificacionUniversidad: result.student.identificacionUniversidad,
            creditosAprobados: result.student.creditosAprobados,
            promedioAcumulado: result.student.promedioAcumulado,
            trabaja: result.student.trabaja,
            horasTrabajoSemanal: result.student.horasTrabajoSemanal,
            tiempoTrasladoMin: result.student.tiempoTrasladoMin,
            bufferSeguridadMin: result.student.bufferSeguridadMin
          }
        }
      });
    } catch (error: any) {
      if (error.message.includes('requerido') || error.message.includes('dominio')) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  }

  async me(req: any, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado.' });
      }

      res.status(200).json({
        success: true,
        data: {
          id: req.user.userId || req.user.studentId,
          studentId: req.user.studentId,
          email: req.user.email,
          fullName: req.user.fullName,
          role: req.user.role,
          program: req.user.program || 'No especificado',
          semester: req.user.semester || 1
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
