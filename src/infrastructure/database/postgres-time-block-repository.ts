import { Pool } from 'pg';
import { ITimeBlockRepository } from '../../domain/repositories/time-block-repository';
import { ProhibitedTimeBlock } from '../../domain/entities/prohibited-time-block';
import { CryptoService, EncryptedData } from '../security/crypto-service';

export class PostgresTimeBlockRepository implements ITimeBlockRepository {
  constructor(
    private readonly pool: Pool,
    private readonly cryptoService: CryptoService
  ) {}

  async save(timeBlock: ProhibitedTimeBlock): Promise<void> {
    // Almacenamos el inicio y fin combinados en un solo cifrado para respetar 
    // el diseño de DB que tiene una sola columna de iv y auth_tag
    const combinedTimes = `${timeBlock.startTime}|${timeBlock.endTime}`;
    const encryptedData = this.cryptoService.encrypt(combinedTimes);

    const query = `
      INSERT INTO bloque_tiempo_prohibido (
        id_bloque, id_estudiante, dia_semana, hora_inicio, hora_fin, 
        iv, auth_tag, tipo, es_recurrente, fecha_inicio_recurrencia, 
        fecha_fin_recurrencia, descripcion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id_bloque) DO UPDATE 
      SET 
        dia_semana = EXCLUDED.dia_semana,
        hora_inicio = EXCLUDED.hora_inicio,
        hora_fin = EXCLUDED.hora_fin,
        iv = EXCLUDED.iv,
        auth_tag = EXCLUDED.auth_tag,
        tipo = EXCLUDED.tipo,
        es_recurrente = EXCLUDED.es_recurrente,
        fecha_inicio_recurrencia = EXCLUDED.fecha_inicio_recurrencia,
        fecha_fin_recurrencia = EXCLUDED.fecha_fin_recurrencia,
        descripcion = EXCLUDED.descripcion
    `;

    await this.pool.query(query, [
      timeBlock.id,
      timeBlock.studentId,
      timeBlock.dayOfWeek,
      encryptedData.encryptedValue, // start time field
      '[COMBINED_ABOVE]',           // end time field (placeholder)
      encryptedData.iv,
      encryptedData.authTag,
      timeBlock.type,
      timeBlock.isRecurring,
      timeBlock.recurrenceStartDate,
      timeBlock.recurrenceEndDate,
      timeBlock.description
    ]);
  }

  async findById(id: string): Promise<ProhibitedTimeBlock | null> {
    const query = `SELECT * FROM bloque_tiempo_prohibido WHERE id_bloque = $1`;
    const { rows } = await this.pool.query(query, [id]);
    
    if (rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async findByStudentId(studentId: string): Promise<ProhibitedTimeBlock[]> {
    const query = `SELECT * FROM bloque_tiempo_prohibido WHERE id_estudiante = $1`;
    const { rows } = await this.pool.query(query, [studentId]);
    
    return rows.map(row => this.mapToDomain(row));
  }

  async delete(id: string): Promise<void> {
    const query = `DELETE FROM bloque_tiempo_prohibido WHERE id_bloque = $1`;
    await this.pool.query(query, [id]);
  }

  private mapToDomain(row: any): ProhibitedTimeBlock {
    const encryptedData: EncryptedData = {
      encryptedValue: row.hora_inicio, // En hora_inicio guardamos el combinado
      iv: row.iv,
      authTag: row.auth_tag
    };

    const decryptedCombined = this.cryptoService.decrypt(encryptedData);
    const [startTime, endTime] = decryptedCombined.split('|');

    return new ProhibitedTimeBlock({
      id: row.id_bloque,
      studentId: row.id_estudiante,
      dayOfWeek: row.dia_semana,
      startTime,
      endTime,
      type: row.tipo,
      isRecurring: row.es_recurrente,
      recurrenceStartDate: row.fecha_inicio_recurrencia,
      recurrenceEndDate: row.fecha_fin_recurrencia,
      description: row.descripcion
    });
  }
}
