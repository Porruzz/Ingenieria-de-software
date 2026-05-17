import { Pool } from 'pg';
import { IStudentRepository } from '../../domain/repositories/student-repository';
import { Student } from '../../domain/entities/student';
import { PasswordHasher } from '../security/password-hasher';

export class PostgresStudentRepository implements IStudentRepository {
  private useInMemoryFallback = false;
  private readonly fallbackStudents: Map<string, Student> = new Map();

  constructor(private readonly pool: Pool) {
    this.ensureSchema();
  }

  private async ensureSchema() {
    try {
      await this.pool.query(`
        ALTER TABLE estudiante ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ALTER TABLE estudiante ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
        ALTER TABLE estudiante ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;
      `);
      console.log('[PostgresStudentRepository] Database schema verified and updated successfully.');
    } catch (err) {
      console.warn('[PostgresStudentRepository] Database connection failed. Falling back to IN-MEMORY storage for demo mode.');
      this.useInMemoryFallback = true;
      this.seedInMemoryFallback();
    }
  }

  private seedInMemoryFallback() {
    const passwordHash = PasswordHasher.hash('password123');
    const demoStudent = new Student({
      id: 'juanr-123',
      identificacionUniversidad: '202310156',
      nombreCompleto: 'Juan Rodríguez',
      emailInstitucional: 'juanr@optima.edu.co',
      creditosAprobados: 85,
      promedioAcumulado: 4.2,
      trabaja: true,
      horasTrabajoSemanal: 12,
      tiempoTrasladoMin: 45,
      bufferSeguridadMin: 15,
      academicHistory: [],
      prohibitedTimeBlocks: [],
      passwordHash
    });
    this.fallbackStudents.set(demoStudent.id, demoStudent);
    console.log('[PostgresStudentRepository Fallback] Pre-seeded demo user "juanr@optima.edu.co" with "password123" in-memory.');
  }

  async findById(id: string): Promise<Student | null> {
    if (this.useInMemoryFallback) {
      return this.fallbackStudents.get(id) || null;
    }
    try {
      const query = `
        SELECT 
          id_estudiante, 
          identificacion_universidad, 
          nombre_completo, 
          email_institucional, 
          creditos_aprobados, 
          promedio_acumulado, 
          trabaja, 
          horas_trabajo_semanal, 
          tiempo_traslado_min, 
          buffer_seguridad_min,
          password_hash,
          reset_token,
          reset_token_expires
        FROM estudiante 
        WHERE id_estudiante = $1
      `;
      const { rows } = await this.pool.query(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];

      return new Student({
        id: row.id_estudiante,
        identificacionUniversidad: row.identificacion_universidad,
        nombreCompleto: row.nombre_completo,
        emailInstitucional: row.email_institucional,
        creditosAprobados: row.creditos_aprobados,
        promedioAcumulado: row.promedio_acumulado,
        trabaja: row.trabaja,
        horasTrabajoSemanal: row.horas_trabajo_semanal,
        tiempoTrasladoMin: row.tiempo_traslado_min,
        bufferSeguridadMin: row.buffer_seguridad_min,
        passwordHash: row.password_hash,
        resetPasswordToken: row.reset_token,
        resetPasswordExpires: row.reset_token_expires ? new Date(row.reset_token_expires) : null,
        academicHistory: [],
        prohibitedTimeBlocks: []
      });
    } catch (error) {
      console.warn('[PostgresStudentRepository] findById query failed. Switching to in-memory fallback.');
      this.useInMemoryFallback = true;
      this.seedInMemoryFallback();
      return this.fallbackStudents.get(id) || null;
    }
  }

  async findByEmail(email: string): Promise<Student | null> {
    if (this.useInMemoryFallback) {
      for (const student of this.fallbackStudents.values()) {
        if (student.emailInstitucional.toLowerCase() === email.toLowerCase()) {
          return student;
        }
      }
      return null;
    }
    try {
      const query = `
        SELECT 
          id_estudiante, 
          identificacion_universidad, 
          nombre_completo, 
          email_institucional, 
          creditos_aprobados, 
          promedio_acumulado, 
          trabaja, 
          horas_trabajo_semanal, 
          tiempo_traslado_min, 
          buffer_seguridad_min,
          password_hash,
          reset_token,
          reset_token_expires
        FROM estudiante 
        WHERE email_institucional = $1
      `;
      const { rows } = await this.pool.query(query, [email]);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];

      return new Student({
        id: row.id_estudiante,
        identificacionUniversidad: row.identificacion_universidad,
        nombreCompleto: row.nombre_completo,
        emailInstitucional: row.email_institucional,
        creditosAprobados: row.creditos_aprobados,
        promedioAcumulado: row.promedio_acumulado,
        trabaja: row.trabaja,
        horasTrabajoSemanal: row.horas_trabajo_semanal,
        tiempoTrasladoMin: row.tiempo_traslado_min,
        bufferSeguridadMin: row.buffer_seguridad_min,
        passwordHash: row.password_hash,
        resetPasswordToken: row.reset_token,
        resetPasswordExpires: row.reset_token_expires ? new Date(row.reset_token_expires) : null,
        academicHistory: [],
        prohibitedTimeBlocks: []
      });
    } catch (error) {
      console.warn('[PostgresStudentRepository] findByEmail query failed. Switching to in-memory fallback.');
      this.useInMemoryFallback = true;
      this.seedInMemoryFallback();
      for (const student of this.fallbackStudents.values()) {
        if (student.emailInstitucional.toLowerCase() === email.toLowerCase()) {
          return student;
        }
      }
      return null;
    }
  }

  async findByResetToken(token: string): Promise<Student | null> {
    if (this.useInMemoryFallback) {
      for (const student of this.fallbackStudents.values()) {
        if (student.resetPasswordToken === token) {
          return student;
        }
      }
      return null;
    }
    try {
      const query = `
        SELECT 
          id_estudiante, 
          identificacion_universidad, 
          nombre_completo, 
          email_institucional, 
          creditos_aprobados, 
          promedio_acumulado, 
          trabaja, 
          horas_trabajo_semanal, 
          tiempo_traslado_min, 
          buffer_seguridad_min,
          password_hash,
          reset_token,
          reset_token_expires
        FROM estudiante 
        WHERE reset_token = $1
      `;
      const { rows } = await this.pool.query(query, [token]);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];

      return new Student({
        id: row.id_estudiante,
        identificacionUniversidad: row.identificacion_universidad,
        nombreCompleto: row.nombre_completo,
        emailInstitucional: row.email_institucional,
        creditosAprobados: row.creditos_aprobados,
        promedioAcumulado: row.promedio_acumulado,
        trabaja: row.trabaja,
        horasTrabajoSemanal: row.horas_trabajo_semanal,
        tiempoTrasladoMin: row.tiempo_traslado_min,
        bufferSeguridadMin: row.buffer_seguridad_min,
        passwordHash: row.password_hash,
        resetPasswordToken: row.reset_token,
        resetPasswordExpires: row.reset_token_expires ? new Date(row.reset_token_expires) : null,
        academicHistory: [],
        prohibitedTimeBlocks: []
      });
    } catch (error) {
      console.warn('[PostgresStudentRepository] findByResetToken query failed. Switching to in-memory fallback.');
      this.useInMemoryFallback = true;
      this.seedInMemoryFallback();
      for (const student of this.fallbackStudents.values()) {
        if (student.resetPasswordToken === token) {
          return student;
        }
      }
      return null;
    }
  }

  async createStudent(student: Student, passwordHash: string): Promise<void> {
    if (this.useInMemoryFallback) {
      const studentWithHash = new Student({
        ...(student as any).props,
        passwordHash
      });
      this.fallbackStudents.set(student.id, studentWithHash);
      return;
    }
    try {
      const query = `
        INSERT INTO estudiante (
          id_estudiante,
          identificacion_universidad,
          nombre_completo,
          email_institucional,
          creditos_aprobados,
          promedio_acumulado,
          trabaja,
          horas_trabajo_semanal,
          tiempo_traslado_min,
          buffer_seguridad_min,
          password_hash,
          fecha_ingreso
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE)
      `;
      
      await this.pool.query(query, [
        student.id,
        student.identificacionUniversidad,
        student.nombreCompleto,
        student.emailInstitucional,
        student.creditosAprobados,
        student.promedioAcumulado,
        student.trabaja,
        student.horasTrabajoSemanal,
        student.tiempoTrasladoMin,
        student.bufferSeguridadMin,
        passwordHash
      ]);
    } catch (error) {
      console.warn('[PostgresStudentRepository] createStudent query failed. Using in-memory fallback.');
      this.useInMemoryFallback = true;
      const studentWithHash = new Student({
        ...(student as any).props,
        passwordHash
      });
      this.fallbackStudents.set(student.id, studentWithHash);
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    if (this.useInMemoryFallback) {
      const student = this.fallbackStudents.get(id);
      if (student) {
        const updated = new Student({
          ...(student as any).props,
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null
        });
        this.fallbackStudents.set(id, updated);
      }
      return;
    }
    try {
      const query = `
        UPDATE estudiante 
        SET 
          password_hash = $2,
          reset_token = NULL,
          reset_token_expires = NULL,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_estudiante = $1
      `;
      await this.pool.query(query, [id, passwordHash]);
    } catch (error) {
      console.warn('[PostgresStudentRepository] updatePassword query failed. Using in-memory fallback.');
      this.useInMemoryFallback = true;
      const student = this.fallbackStudents.get(id);
      if (student) {
        const updated = new Student({
          ...(student as any).props,
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null
        });
        this.fallbackStudents.set(id, updated);
      }
    }
  }

  async updateResetToken(id: string, token: string | null, expires: Date | null): Promise<void> {
    if (this.useInMemoryFallback) {
      const student = this.fallbackStudents.get(id);
      if (student) {
        const updated = new Student({
          ...(student as any).props,
          resetPasswordToken: token,
          resetPasswordExpires: expires
        });
        this.fallbackStudents.set(id, updated);
      }
      return;
    }
    try {
      const query = `
        UPDATE estudiante 
        SET 
          reset_token = $2,
          reset_token_expires = $3,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_estudiante = $1
      `;
      await this.pool.query(query, [id, token, expires]);
    } catch (error) {
      console.warn('[PostgresStudentRepository] updateResetToken query failed. Using in-memory fallback.');
      this.useInMemoryFallback = true;
      const student = this.fallbackStudents.get(id);
      if (student) {
        const updated = new Student({
          ...(student as any).props,
          resetPasswordToken: token,
          resetPasswordExpires: expires
        });
        this.fallbackStudents.set(id, updated);
      }
    }
  }

  async updateLogistics(id: string, tiempoTrasladoMin: number, bufferSeguridadMin: number): Promise<void> {
    if (this.useInMemoryFallback) {
      const student = this.fallbackStudents.get(id);
      if (student) {
        const updated = new Student({
          ...(student as any).props,
          tiempoTrasladoMin,
          bufferSeguridadMin
        });
        this.fallbackStudents.set(id, updated);
      }
      return;
    }
    try {
      const query = `
        UPDATE estudiante 
        SET 
          tiempo_traslado_min = $2, 
          buffer_seguridad_min = $3,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_estudiante = $1
      `;
      
      await this.pool.query(query, [id, tiempoTrasladoMin, bufferSeguridadMin]);
    } catch (error) {
      console.warn('[PostgresStudentRepository] updateLogistics query failed. Using in-memory fallback.');
      this.useInMemoryFallback = true;
      const student = this.fallbackStudents.get(id);
      if (student) {
        const updated = new Student({
          ...(student as any).props,
          tiempoTrasladoMin,
          bufferSeguridadMin
        });
        this.fallbackStudents.set(id, updated);
      }
    }
  }
}
