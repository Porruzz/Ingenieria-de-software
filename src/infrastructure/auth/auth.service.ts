import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, AuthTokenPayload, LoginResponse } from '../../domain/entities/user';

const JWT_SECRET = process.env.JWT_SECRET || 'optima-academia-secret-2026-demo';
const JWT_EXPIRES_IN = '24h';

/**
 * Servicio de Autenticación.
 * Gestiona usuarios en memoria con contraseñas hasheadas y tokens JWT.
 * Diseñado para la demo con el profesor y futuro escalamiento a DB real.
 */
export class AuthService {
  private users: Map<string, User> = new Map();

  constructor() {
    this.seedDemoUsers();
  }

  /**
   * Registra un nuevo usuario.
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    studentId: string,
    program: string,
    semester: number
  ): Promise<LoginResponse> {
    // Validaciones
    if (this.findByEmail(email)) {
      throw new Error('Ya existe una cuenta con este correo electrónico.');
    }
    if (this.findByStudentId(studentId)) {
      throw new Error('Ya existe una cuenta con este ID de estudiante.');
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: `user-${Date.now()}`,
      studentId,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      program,
      semester,
      role: 'student',
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    this.users.set(user.id, user);
    console.log(`[Auth] Nuevo usuario registrado: ${fullName} (${studentId})`);

    return this.generateLoginResponse(user);
  }

  /**
   * Inicia sesión con email y contraseña.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = this.findByEmail(email.toLowerCase());
    if (!user) {
      throw new Error('Correo electrónico o contraseña incorrectos.');
    }

    if (!user.isActive) {
      throw new Error('Esta cuenta ha sido desactivada.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Correo electrónico o contraseña incorrectos.');
    }

    user.lastLoginAt = new Date();
    console.log(`[Auth] Login exitoso: ${user.fullName} (${user.studentId})`);

    return this.generateLoginResponse(user);
  }

  /**
   * Verifica y decodifica un token JWT.
   */
  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch (error) {
      throw new Error('Token inválido o expirado.');
    }
  }

  /**
   * Obtiene un usuario por su studentId.
   */
  getUserByStudentId(studentId: string): User | undefined {
    return this.findByStudentId(studentId);
  }

  /**
   * Lista todos los usuarios (para panel admin).
   */
  getAllUsers(): Omit<User, 'passwordHash'>[] {
    return Array.from(this.users.values()).map(u => ({
      ...u,
      passwordHash: '[PROTECTED]'
    }));
  }

  // ─── Helpers ───

  private findByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  private findByStudentId(studentId: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.studentId === studentId);
  }

  private generateLoginResponse(user: User): LoginResponse {
    const payload: AuthTokenPayload = {
      userId: user.id,
      studentId: user.studentId,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        email: user.email,
        fullName: user.fullName,
        program: user.program,
        semester: user.semester,
        role: user.role
      }
    };
  }

  /**
   * Usuarios de demo para la presentación al profesor.
   * Contraseñas legibles para la demo: "demo123"
   */
  private async seedDemoUsers() {
    const hash = await bcrypt.hash('demo123', 10);

    const demoUsers: User[] = [
      {
        id: 'user-santiago',
        studentId: 'santiago-123',
        email: 'santiago.parra@usa.edu.co',
        passwordHash: hash,
        fullName: 'Santiago Parra Acuña',
        program: 'Ingeniería de Sistemas',
        semester: 8,
        role: 'student',
        isActive: true,
        createdAt: new Date('2026-01-15'),
        lastLoginAt: new Date()
      },
      {
        id: 'user-roberto',
        studentId: 'roberto-martinez',
        email: 'roberto.martinez@usa.edu.co',
        passwordHash: hash,
        fullName: 'Roberto A. Martínez',
        program: 'Ingeniería de Sistemas',
        semester: 7,
        role: 'student',
        isActive: true,
        createdAt: new Date('2026-01-20'),
        lastLoginAt: new Date()
      },
      {
        id: 'user-elena',
        studentId: 'elena-garcia',
        email: 'elena.garcia@usa.edu.co',
        passwordHash: hash,
        fullName: 'Elena L. García',
        program: 'Ingeniería Industrial',
        semester: 6,
        role: 'student',
        isActive: true,
        createdAt: new Date('2026-02-01'),
        lastLoginAt: new Date()
      },
      {
        id: 'user-admin',
        studentId: 'admin-001',
        email: 'admin@optimaacademia.com',
        passwordHash: hash,
        fullName: 'Administrador Sistema',
        program: 'N/A',
        semester: 0,
        role: 'admin',
        isActive: true,
        createdAt: new Date('2025-01-01'),
        lastLoginAt: new Date()
      }
    ];

    for (const user of demoUsers) {
      this.users.set(user.id, user);
    }

    console.log(`[Auth] ${demoUsers.length} usuarios de demo precargados.`);
    console.log('[Auth] ── Credenciales de demo ──');
    console.log('[Auth]   santiago.parra@usa.edu.co / demo123');
    console.log('[Auth]   roberto.martinez@usa.edu.co / demo123');
    console.log('[Auth]   elena.garcia@usa.edu.co / demo123');
  }
}
