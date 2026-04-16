import { IStudentRepository } from '../../domain/repositories/student-repository';
import { RedisService } from '../../infrastructure/cache/redis-service';
import { Student } from '../../domain/entities/student';

interface UpdateLogisticsCommand {
  studentId: string;
  tiempoTrasladoMin: number;
  bufferSeguridadMin: number;
}

export class UpdateStudentLogisticsUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(command: UpdateLogisticsCommand): Promise<Student> {
    const { studentId, tiempoTrasladoMin, bufferSeguridadMin } = command;

    const lockKey = `lock:student:logistics:${studentId}`;
    const acquired = await this.redisService.acquireLock(lockKey, 5);
    
    if (!acquired) {
      throw new Error("Concurrency error: The student logistics are currently being modified.");
    }

    try {
      const existingStudent = await this.studentRepo.findById(studentId);
      
      if (!existingStudent) {
        throw new Error("Estudiante no encontrado.");
      }

      // Domain validation through entity method
      const updatedStudent = existingStudent.updateLogistics(tiempoTrasladoMin, bufferSeguridadMin);

      // Persist exact input to DB
      await this.studentRepo.updateLogistics(studentId, updatedStudent.tiempoTrasladoMin, updatedStudent.bufferSeguridadMin);

      // Calculate effective rounded value and cache in Redis for rapid access in the scheduler
      const effectiveBuffer = updatedStudent.calculateEffectiveLogisticBuffer();
      const cacheKey = `logistics:student:${studentId}:effectiveBuffer`;
      
      // Store as minutes
      await this.redisService.set(cacheKey, effectiveBuffer.toString());

      return updatedStudent;
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }
}
