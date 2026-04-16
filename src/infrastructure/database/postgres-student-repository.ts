import { Pool } from 'pg';
import { IStudentRepository } from '../../domain/repositories/student-repository';
import { Student } from '../../domain/entities/student';

// Relies on time blocks as in the DB design
export class PostgresStudentRepository implements IStudentRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Student | null> {
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
        buffer_seguridad_min
      FROM estudiante 
      WHERE id_estudiante = $1
    `;
    const { rows } = await this.pool.query(query, [id]);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    // Initialize with empty arrays as in basic loading, 
    // or you could fetch blocks if needed here. 
    // Usually aggregates are built together, but for updating logistics
    // we just need the student data.
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
      academicHistory: [], // Would normally fetch from related table
      prohibitedTimeBlocks: [] // Would normally fetch from time-blocks
    });
  }

  async updateLogistics(id: string, tiempoTrasladoMin: number, bufferSeguridadMin: number): Promise<void> {
    const query = `
      UPDATE estudiante 
      SET 
        tiempo_traslado_min = $2, 
        buffer_seguridad_min = $3,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_estudiante = $1
    `;
    
    await this.pool.query(query, [id, tiempoTrasladoMin, bufferSeguridadMin]);
  }
}
