/**
 * Entidad de dominio: Usuario del sistema.
 * Soporta autenticación JWT para la demo con el profesor.
 */
export interface User {
  id: string;
  studentId: string;            // ID académico (ej: 'santiago-123')
  email: string;
  passwordHash: string;
  fullName: string;
  program: string;              // Programa académico
  semester: number;
  role: 'student' | 'admin';
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthTokenPayload {
  userId: string;
  studentId: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    studentId: string;
    email: string;
    fullName: string;
    program: string;
    semester: number;
    role: string;
  };
}
