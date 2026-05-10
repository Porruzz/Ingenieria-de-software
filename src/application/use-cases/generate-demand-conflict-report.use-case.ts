import { SwapRepositoryPort } from '../ports/swap-repository.port';
import { CourseOfferingPort } from '../ports/course-offering.port';

export interface DemandConflictReportEntry {
  courseId: string;
  courseName: string;
  demandCount: number; // Veces que se solicita esta materia (estudiantes que quieren entrar)
  supplyCount: number; // Veces que se ofrece entregar esta materia (estudiantes que quieren salir)
  netDemand: number; // demandCount - supplyCount (positiva = faltan cupos, negativa = sobran cupos)
}

export class GenerateDemandConflictReportUseCase {
  constructor(
    private readonly swapRepository: SwapRepositoryPort,
    private readonly courseOffering: CourseOfferingPort
  ) {}

  async execute(period: string): Promise<DemandConflictReportEntry[]> {
    // 1. Obtener todas las solicitudes de intercambio pendientes
    const pendingRequests = await this.swapRepository.getPendingRequests();

    // 2. Obtener la oferta académica para mapear secciones a materias
    const availableSections = await this.courseOffering.getAvailableSections(period);
    
    const sectionToCourseMap = new Map<string, { courseId: string; courseName: string }>();
    for (const section of availableSections) {
      sectionToCourseMap.set(section.id, {
        courseId: section.courseId,
        courseName: section.courseName,
      });
    }

    // 3. Contabilizar oferta y demanda por materia
    const reportMap = new Map<string, DemandConflictReportEntry>();

    for (const request of pendingRequests) {
      // Registrar la oferta (la sección que el estudiante tiene y quiere cambiar)
      const offeredCourseInfo = sectionToCourseMap.get(request.offeredSectionId);
      if (offeredCourseInfo) {
        this.incrementSupply(reportMap, offeredCourseInfo);
      }

      // Registrar la demanda (las secciones a las que el estudiante quiere cambiarse)
      // Agrupamos por materia para no contar dos veces si el estudiante seleccionó
      // varios grupos (secciones) de la misma materia como opciones.
      const desiredCourseIdsForThisRequest = new Set<string>();
      
      for (const desiredSectionId of request.desiredSectionIds) {
        const desiredCourseInfo = sectionToCourseMap.get(desiredSectionId);
        if (desiredCourseInfo) {
          if (!desiredCourseIdsForThisRequest.has(desiredCourseInfo.courseId)) {
            desiredCourseIdsForThisRequest.add(desiredCourseInfo.courseId);
            this.incrementDemand(reportMap, desiredCourseInfo);
          }
        }
      }
    }

    // 4. Calcular demanda neta y ordenar el reporte
    const report = Array.from(reportMap.values());
    report.forEach(entry => {
      entry.netDemand = entry.demandCount - entry.supplyCount;
    });

    // Ordenar de mayor a menor demanda neta, en caso de empate por mayor demanda total
    return report.sort((a, b) => {
      if (b.netDemand !== a.netDemand) {
        return b.netDemand - a.netDemand;
      }
      return b.demandCount - a.demandCount;
    });
  }

  private incrementSupply(map: Map<string, DemandConflictReportEntry>, courseInfo: { courseId: string; courseName: string }) {
    this.ensureEntryExists(map, courseInfo);
    map.get(courseInfo.courseId)!.supplyCount += 1;
  }

  private incrementDemand(map: Map<string, DemandConflictReportEntry>, courseInfo: { courseId: string; courseName: string }) {
    this.ensureEntryExists(map, courseInfo);
    map.get(courseInfo.courseId)!.demandCount += 1;
  }

  private ensureEntryExists(map: Map<string, DemandConflictReportEntry>, courseInfo: { courseId: string; courseName: string }) {
    if (!map.has(courseInfo.courseId)) {
      map.set(courseInfo.courseId, {
        courseId: courseInfo.courseId,
        courseName: courseInfo.courseName,
        demandCount: 0,
        supplyCount: 0,
        netDemand: 0
      });
    }
  }
}
