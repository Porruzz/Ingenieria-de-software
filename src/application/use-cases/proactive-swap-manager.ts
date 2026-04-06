import { SwapRequest, SwapMatch } from '../../domain/entities/swap';
import { SmartMatchEngine } from '../engine/smart-match.engine';
import { ValidatePrerequisites } from './validate-prerequisites';
import { SwapRepositoryPort } from '../ports/swap-repository.port';
import { Student } from '../../domain/entities/student';

/**
 * RF-03: Caso de Uso — Gestión Proactiva de Intercambio de Cupos.
 * 
 * Orquesta el flujo completo de intercambio:
 * 1. Recibe la solicitud del estudiante (qué tiene, qué quiere).
 * 2. Valida prerrequisitos de la(s) sección(es) deseada(s) (US-06).
 * 3. Persiste la solicitud en el repositorio (Hexagonal → Puerto).
 * 4. Ejecuta el motor de emparejamiento proactivo (SmartMatchEngine).
 * 5. Notifica los matches encontrados.
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo gestiona swaps.
 * - Dependency Inversion: Depende de puertos, no de implementaciones.
 * - Open/Closed: Los datos de secciones vienen del puerto, no hardcodeados.
 */
export class ProactiveSwapManager {
  private readonly engine: SmartMatchEngine = new SmartMatchEngine();

  constructor(
    private readonly validator: ValidatePrerequisites,
    private readonly swapRepository: SwapRepositoryPort,
    private readonly studentData: Map<string, Student>
  ) {}

  /**
   * Un estudiante envía una intención de cambio de cupo.
   * 
   * Validaciones:
   * 1. Verifica que el estudiante pueda tomar la materia deseada (US-06).
   * 2. Persiste la solicitud vía puerto (no en memoria local).
   * 
   * @param request Solicitud de intercambio.
   * @returns ID de confirmación de la solicitud.
   * @throws Error si el estudiante no cumple prerrequisitos.
   */
  async submitSwapRequest(request: SwapRequest): Promise<string> {
    console.log(`\n[RF-03] Procesando solicitud de cambio para Estudiante: ${request.studentId}`);

    // 1. Para cada sección deseada, obtener el courseId real desde el repositorio
    for (const desiredSectionId of request.desiredSectionIds) {
      const courseId = await this.swapRepository.getCourseIdFromSection(desiredSectionId);

      if (!courseId) {
        throw new Error(
          `[RF-03] Sección ${desiredSectionId} no encontrada en la oferta académica.`
        );
      }

      // 2. Validar que el estudiante cumpla los prerrequisitos (US-06)
      const validation = await this.validator.execute(request.studentId, courseId);

      if (validation.status === 'BLOQUEADO') {
        throw new Error(
          `[RF-03] 🚫 No puedes intercambiar al cupo ${desiredSectionId} (${validation.courseName}). ` +
          `Motivo: ${validation.message}`
        );
      }
    }

    // 3. Persistir la solicitud en el repositorio (Hexagonal)
    await this.swapRepository.saveRequest(request);
    console.log(`[RF-03] ✅ Solicitud ${request.id} registrada en el pool de intercambios.`);
    return `REQUEST-${request.id}-OK`;
  }

  /**
   * El sistema busca proactivamente matches para solucionar conflictos de horarios.
   * 
   * Flujo:
   * 1. Obtiene todas las solicitudes pendientes del repositorio.
   * 2. Ejecuta el motor de emparejamiento.
   * 3. Persiste los matches y actualiza los estados de las solicitudes.
   * 
   * @returns Lista de emparejamientos encontrados.
   */
  async runSmartMatch(): Promise<SwapMatch[]> {
    const pendingRequests = await this.swapRepository.getPendingRequests();
    console.log(`[SmartMatch] Buscando coincidencias en ${pendingRequests.length} solicitudes...`);

    const matches = this.engine.findBestPairSwaps(pendingRequests, this.studentData);

    // Persistir los matches y actualizar estados
    for (const match of matches) {
      await this.swapRepository.saveMatch(match);
    }

    if (matches.length > 0) {
      console.log(`[SmartMatch] 🎉 Se encontraron ${matches.length} intercambios mutuamente beneficiosos.`);
    } else {
      console.log(`[SmartMatch] Sin coincidencias por ahora. El sistema escanea 24/7.`);
    }

    return matches;
  }
}
