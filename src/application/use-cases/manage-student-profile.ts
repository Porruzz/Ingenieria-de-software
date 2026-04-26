import { Student } from '../../domain/entities/student';
import { StudentProfilePort } from '../ports/student-profile.port';

/**
 * US-01: Configuración de "Zonas Prohibidas".
 * US-03: Definición de Tiempos de Desplazamiento.
 * 
 * Este caso de uso permite al estudiante moldear su "Perfil de Vida".
 * Se encarga de validar que los datos tengan sentido antes de guardarlos.
 */
export class ManageStudentProfile {
  constructor(private readonly profileRepository: StudentProfilePort) {}

  /**
   * Configura las zonas prohibidas del estudiante (US-01).
   * @param studentId ID del estudiante.
   * @param zones Lista de bloques de tiempo restringidos.
   */
  async setForbiddenZones(studentId: string, zones: any[]): Promise<void> {
    // Validación de negocio proactiva:
    for (const zone of zones) {
      if (this.toMinutes(zone.startTime) >= this.toMinutes(zone.endTime)) {
        throw new Error(`[US-01] Error en bloque (${zone.label || zone.description}): La hora de fin debe ser mayor a la de inicio.`);
      }
    }
    
    console.log(`[US-01] Guardando ${zones.length} zonas prohibidas para: ${studentId}`);
    return this.profileRepository.updateTimeBlocks(studentId, zones);
  }


  /**
   * Define cuánto tarda el estudiante en llegar a la U (US-03).
   * @param studentId ID del estudiante.
   * @param minutes Tiempo de desplazamiento en minutos.
   */
  async setCommuteTime(studentId: string, minutes: number): Promise<void> {
    if (minutes < 0 || minutes > 240) {
      throw new Error('[US-03] El tiempo de desplazamiento debe estar entre 0 y 240 minutos (4 hrs).');
    }

    console.log(`[US-03] Configurando tiempo de desplazamiento: ${minutes} min para ${studentId}`);
    return this.profileRepository.updateCommuteTime(studentId, minutes);
  }

  /**
   * Obtiene el perfil completo para el generador de horarios.
   */
  async getProfile(studentId: string): Promise<Student | null> {
    return this.profileRepository.getStudentProfile(studentId);
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
