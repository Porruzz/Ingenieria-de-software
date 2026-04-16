import { ProhibitedTimeBlock } from '../entities/prohibited-time-block';

export interface ITimeBlockRepository {
  save(timeBlock: ProhibitedTimeBlock): Promise<void>;
  findById(id: string): Promise<ProhibitedTimeBlock | null>;
  findByStudentId(studentId: string): Promise<ProhibitedTimeBlock[]>;
  delete(id: string): Promise<void>;
}
