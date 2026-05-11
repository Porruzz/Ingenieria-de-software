import { ScheduleRepositoryPort } from '../ports/schedule-repository.port';

export interface HeatMapEntry {
  day: string;
  hour: number;      // 7 = 07:00 - 08:00
  campus: string;
  freeStudentsCount: number;
}

export class GenerateConcurrencyHeatMapUseCase {
  constructor(private readonly scheduleRepository: ScheduleRepositoryPort) {}

  async execute(): Promise<HeatMapEntry[]> {
    const acceptedSchedules = await this.scheduleRepository.getAllAcceptedSchedules();

    // Map: day -> campus -> hour -> count
    const heatMap = new Map<string, Map<string, Map<number, number>>>();

    for (const schedule of acceptedSchedules) {
      // 1. Agrupar clases del estudiante por día y campus
      const studentDayCampusClasses = new Map<string, Map<string, { start: number, end: number }[]>>();

      for (const item of schedule.items) {
        const campus = item.section.campus;
        for (const block of item.section.schedule) {
          const day = block.day;
          const startHour = parseInt(block.startTime.split(':')[0], 10);
          const endHour = parseInt(block.endTime.split(':')[0], 10);

          if (!studentDayCampusClasses.has(day)) {
            studentDayCampusClasses.set(day, new Map());
          }
          const campusMap = studentDayCampusClasses.get(day)!;
          if (!campusMap.has(campus)) {
            campusMap.set(campus, []);
          }
          campusMap.get(campus)!.push({ start: startHour, end: endHour });
        }
      }

      // 2. Calcular tiempo libre (huecos) por día y campus para este estudiante
      for (const [day, campusMap] of studentDayCampusClasses.entries()) {
        for (const [campus, classes] of campusMap.entries()) {
          if (classes.length === 0) continue;

          let minHour = 24;
          let maxHour = 0;
          const busyHours = new Set<number>();

          for (const cls of classes) {
            if (cls.start < minHour) minHour = cls.start;
            if (cls.end > maxHour) maxHour = cls.end;
            for (let h = cls.start; h < cls.end; h++) {
              busyHours.add(h);
            }
          }

          // El estudiante está libre en el campus en las horas entre minHour y maxHour que no están en busyHours
          for (let h = minHour; h < maxHour; h++) {
            if (!busyHours.has(h)) {
              this.incrementHeatMapCount(heatMap, day, campus, h);
            }
          }
        }
      }
    }

    // 3. Convertir a arreglo plano y ordenar
    const result: HeatMapEntry[] = [];
    for (const [day, campusMap] of heatMap.entries()) {
      for (const [campus, hourMap] of campusMap.entries()) {
        for (const [hour, count] of hourMap.entries()) {
          result.push({ day, campus, hour, freeStudentsCount: count });
        }
      }
    }

    // Ordenar por día (opcional, aquí alfabético o simple) y luego por hora
    const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    result.sort((a, b) => {
      if (a.day !== b.day) {
        return daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
      }
      if (a.campus !== b.campus) {
        return a.campus.localeCompare(b.campus);
      }
      return a.hour - b.hour;
    });

    return result;
  }

  private incrementHeatMapCount(
    heatMap: Map<string, Map<string, Map<number, number>>>,
    day: string,
    campus: string,
    hour: number
  ) {
    if (!heatMap.has(day)) heatMap.set(day, new Map());
    const campusMap = heatMap.get(day)!;
    if (!campusMap.has(campus)) campusMap.set(campus, new Map());
    const hourMap = campusMap.get(campus)!;
    
    const currentCount = hourMap.get(hour) || 0;
    hourMap.set(hour, currentCount + 1);
  }
}
