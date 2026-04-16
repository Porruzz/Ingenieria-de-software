export type TimeBlockType = 'TRABAJO' | 'BIENESTAR' | 'OTRO';

export interface ProhibitedTimeBlockProps {
  id: string;
  studentId: string;
  dayOfWeek: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  type: TimeBlockType;
  isRecurring: boolean;
  recurrenceStartDate: Date | null;
  recurrenceEndDate: Date | null;
  description: string | null;
}

export class ProhibitedTimeBlock {
  private readonly props: ProhibitedTimeBlockProps;

  constructor(props: ProhibitedTimeBlockProps) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(props.startTime) || !timeRegex.test(props.endTime)) {
      throw new Error("Invalid time format. Must be HH:mm");
    }

    if (props.startTime >= props.endTime) {
      throw new Error("startTime must be before endTime");
    }

    this.props = Object.freeze({ ...props });
  }

  get id(): string { return this.props.id; }
  get studentId(): string { return this.props.studentId; }
  get dayOfWeek(): string { return this.props.dayOfWeek; }
  get startTime(): string { return this.props.startTime; }
  get endTime(): string { return this.props.endTime; }
  get type(): TimeBlockType { return this.props.type; }
  get isRecurring(): boolean { return this.props.isRecurring; }
  get recurrenceStartDate(): Date | null { return this.props.recurrenceStartDate; }
  get recurrenceEndDate(): Date | null { return this.props.recurrenceEndDate; }
  get description(): string | null { return this.props.description; }

  overlapsWith(other: ProhibitedTimeBlock): boolean {
    if (this.dayOfWeek !== other.dayOfWeek) return false;
    return this.startTime < other.endTime && other.startTime < this.endTime;
  }

  /**
   * Genera una máscara de bits (BigInt de 96 bits) donde cada bit
   * representa un segmento de 15 minutos de un día de 24 horas.
   */
  toBitmask(): bigint {
    const startMins = this.timeToMinutes(this.startTime);
    const endMins = this.timeToMinutes(this.endTime);

    const startIdx = Math.floor(startMins / 15);
    const endIdx = Math.ceil(endMins / 15);

    let bitmask = 0n;
    for (let i = startIdx; i < endIdx; i++) {
        bitmask |= (1n << BigInt(i));
    }

    return bitmask;
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
  }
}
