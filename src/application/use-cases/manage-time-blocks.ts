import { ITimeBlockRepository } from '../../domain/repositories/time-block-repository';
import { ProhibitedTimeBlock, ProhibitedTimeBlockProps } from '../../domain/entities/prohibited-time-block';
import { RedisService } from '../../infrastructure/cache/redis-service';
import { v4 as uuidv4 } from 'uuid';

export class ManageTimeBlocksUseCase {
  constructor(
    private readonly timeBlockRepo: ITimeBlockRepository,
    private readonly redisService: RedisService
  ) {}

  async createBlock(props: Omit<ProhibitedTimeBlockProps, 'id'>): Promise<ProhibitedTimeBlock> {
    const lockKey = `lock:student:${props.studentId}`;
    const acquired = await this.redisService.acquireLock(lockKey, 5);
    
    if (!acquired) {
      throw new Error("Concurrency error: The student schedule is currently being modified.");
    }

    try {
      const existingBlocks = await this.timeBlockRepo.findByStudentId(props.studentId);
      
      const newBlock = new ProhibitedTimeBlock({
        ...props,
        id: uuidv4()
      });

      // Validation: Overlap (RF-02)
      for (const block of existingBlocks) {
        if (newBlock.overlapsWith(block)) {
          throw new Error("El nuevo bloque se solapa con un bloque de tiempo existente.");
        }
      }

      await this.timeBlockRepo.save(newBlock);

      // Add to array and update cache
      existingBlocks.push(newBlock);
      await this.updateStudentBitmaskCache(props.studentId, existingBlocks);

      return newBlock;

    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  async getBlocksByStudent(studentId: string): Promise<ProhibitedTimeBlock[]> {
    return this.timeBlockRepo.findByStudentId(studentId);
  }

  async deleteBlock(studentId: string, blockId: string): Promise<void> {
    const block = await this.timeBlockRepo.findById(blockId);
    if (!block || block.studentId !== studentId) {
      throw new Error("Bloque no encontrado o no pertenece al estudiante.");
    }

    const lockKey = `lock:student:${studentId}`;
    const acquired = await this.redisService.acquireLock(lockKey, 5);
    
    if (!acquired) {
      throw new Error("Concurrency error: The student schedule is currently being modified.");
    }

    try {
      await this.timeBlockRepo.delete(blockId);
      const remainingBlocks = await this.timeBlockRepo.findByStudentId(studentId);
      await this.updateStudentBitmaskCache(studentId, remainingBlocks);
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  async updateBlock(studentId: string, blockId: string, updates: Partial<Omit<ProhibitedTimeBlockProps, 'id' | 'studentId'>>): Promise<ProhibitedTimeBlock> {
    const lockKey = `lock:student:${studentId}`;
    const acquired = await this.redisService.acquireLock(lockKey, 5);
    
    if (!acquired) {
      throw new Error("Concurrency error: The student schedule is currently being modified.");
    }

    try {
      const existingBlock = await this.timeBlockRepo.findById(blockId);
      if (!existingBlock || existingBlock.studentId !== studentId) {
        throw new Error("Bloque no encontrado o no pertenece al estudiante.");
      }

      const updatedProps = {
        id: existingBlock.id,
        studentId: existingBlock.studentId,
        dayOfWeek: updates.dayOfWeek ?? existingBlock.dayOfWeek,
        startTime: updates.startTime ?? existingBlock.startTime,
        endTime: updates.endTime ?? existingBlock.endTime,
        type: updates.type ?? existingBlock.type,
        isRecurring: updates.isRecurring ?? existingBlock.isRecurring,
        recurrenceStartDate: updates.recurrenceStartDate !== undefined ? updates.recurrenceStartDate : existingBlock.recurrenceStartDate,
        recurrenceEndDate: updates.recurrenceEndDate !== undefined ? updates.recurrenceEndDate : existingBlock.recurrenceEndDate,
        description: updates.description !== undefined ? updates.description : existingBlock.description,
      };

      const newBlock = new ProhibitedTimeBlock(updatedProps);

      const allBlocks = await this.timeBlockRepo.findByStudentId(studentId);
      
      // Validation: Overlap (RF-02) ignoring the current block being updated
      for (const block of allBlocks) {
        if (block.id !== blockId && newBlock.overlapsWith(block)) {
          throw new Error("El bloque actualizado se solapa con un bloque de tiempo existente.");
        }
      }

      await this.timeBlockRepo.save(newBlock);

      // Update the blocks array by replacing the updated one and update cache
      const updatedBlocks = allBlocks.map(b => b.id === blockId ? newBlock : b);
      await this.updateStudentBitmaskCache(studentId, updatedBlocks);

      return newBlock;
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  private async updateStudentBitmaskCache(studentId: string, blocks: ProhibitedTimeBlock[]): Promise<void> {
    let combinedBitmask = 0n;
    for (const block of blocks) {
      combinedBitmask |= block.toBitmask();
    }
    
    const cacheKey = `availability:student:${studentId}:bitmask`;
    await this.redisService.set(cacheKey, combinedBitmask.toString(16));
  }
}
