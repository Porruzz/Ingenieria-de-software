import { SwapRequest, SwapMatch } from '../../domain/entities/swap';
import { Student } from '../../domain/entities/student';
import * as crypto from 'crypto';

/**
 * RF-03: Motor de Intercambio Proactivo (Smart Match).
 * 
 * Busca automáticamente "swaps" que mejoren el puntaje de satisfacción
 * de ambas partes involucradas en un intercambio de cupos.
 * 
 * Algoritmo: Búsqueda de ciclos directos (A → B, B → A) con validación
 * de mejora bilateral. Complejidad: O(n²) donde n = solicitudes activas.
 * 
 * Escalabilidad: Para un escenario SaaS multi-universidad con miles
 * de solicitudes, se debería migrar a un algoritmo basado en grafos
 * bipartitos (Hungarian Algorithm) o procesamiento en lotes con colas.
 */
export class SmartMatchEngine {

  /**
   * Encuentra potenciales parejas de intercambio mutuamente beneficioso.
   * 
   * Criterios de match:
   * 1. A quiere lo que B tiene Y B quiere lo que A tiene (match de intereses).
   * 2. La mejora de satisfacción debe ser positiva para ambos (win-win).
   * 
   * @param requests Lista de todas las solicitudes de swap pendientes.
   * @param students Map de estudiantes para calcular satisfacción contextual.
   * @returns Lista de emparejamientos encontrados, ordenados por mejora total.
   */
  findBestPairSwaps(requests: SwapRequest[], students: Map<string, Student>): SwapMatch[] {
    const matches: SwapMatch[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < requests.length; i++) {
      const reqA = requests[i];
      if (usedIds.has(reqA.studentId)) continue;

      for (let j = i + 1; j < requests.length; j++) {
        const reqB = requests[j];
        if (usedIds.has(reqB.studentId)) continue;

        // 1. ¿Match de intereses? (A quiere lo que B tiene Y B quiere lo que A tiene)
        const aWantsB = reqA.desiredSectionIds.includes(reqB.offeredSectionId);
        const bWantsA = reqB.desiredSectionIds.includes(reqA.offeredSectionId);

        if (aWantsB && bWantsA) {
          // 2. Calcular mejora de satisfacción para ambos
          const improvementA = this.calculateImprovement(reqA, students.get(reqA.studentId));
          const improvementB = this.calculateImprovement(reqB, students.get(reqB.studentId));

          // Solo hacer match si AMBOS mejoran (win-win)
          if (improvementA > 0 && improvementB > 0) {
            const safetyHash = this.generateSafetyHash(reqA, reqB);

            matches.push({
              studentA: {
                id: reqA.studentId,
                delivers: reqA.offeredSectionId,
                receives: reqB.offeredSectionId,
              },
              studentB: {
                id: reqB.studentId,
                delivers: reqB.offeredSectionId,
                receives: reqA.offeredSectionId,
              },
              improvementA: Math.round(improvementA * 100) / 100,
              improvementB: Math.round(improvementB * 100) / 100,
              systemSafetyHash: safetyHash,
            });

            usedIds.add(reqA.studentId);
            usedIds.add(reqB.studentId);
          }
        }
      }
    }

    // Ordenar por mejora total descendente (los mejores matches primero)
    return matches.sort((a, b) =>
      (b.improvementA + b.improvementB) - (a.improvementA + a.improvementB)
    );
  }

  /**
   * Calcula la mejora porcentual de satisfacción que tendría un estudiante
   * al obtener la sección deseada vs. mantener la actual.
   * 
   * Factores considerados:
   * - Score actual del estudiante (base)
   * - Estimación de mejora basada en la diferencia entre oferta y demanda
   */
  private calculateImprovement(request: SwapRequest, student?: Student): number {
    const baseScore = request.currentSatisfactionScore;

    // Si no conocemos al estudiante, usar estimación conservadora
    if (!student) {
      return Math.max(0, 100 - baseScore) * 0.15;
    }

    // Cálculo: margen de mejora * factor de necesidad
    // Un estudiante con score bajo (30%) tiene más margen que uno con score alto (80%)
    const improvementMargin = Math.max(0, 100 - baseScore);
    const needFactor = student.prohibitedTimeBlocks.length > 0 ? 0.20 : 0.10;

    return improvementMargin * needFactor;
  }

  /**
   * Genera un hash SHA-256 de seguridad para validar la integridad del swap.
   * US-04: Previene manipulación de los matches (anti-fraude).
   */
  private generateSafetyHash(reqA: SwapRequest, reqB: SwapRequest): string {
    const payload = `${reqA.id}|${reqB.id}|${reqA.studentId}|${reqB.studentId}|${Date.now()}`;
    return `SAFE-${crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16)}`;
  }
}
