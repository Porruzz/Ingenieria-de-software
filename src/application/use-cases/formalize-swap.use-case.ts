import { SwapRepositoryPort } from '../ports/swap-repository.port';
import { EnrollmentSystemPort } from '../ports/enrollment-system.port';
import { SwapMatch } from '../../domain/entities/swap';

export interface FormalizationResult {
  matchId: string;
  transactionId: string;
  isOfficial: boolean;
  message: string;
}

/**
 * US-11: Formalización Legal del Cambio.
 * "Como estudiante, quiero que el intercambio sea validado y registrado 
 * oficialmente en el sistema universitario para evitar fraudes."
 */
export class FormalizeSwapUseCase {
  constructor(
    private readonly swapRepo: SwapRepositoryPort,
    private readonly enrollmentSystem: EnrollmentSystemPort
  ) {}

  async execute(matchId: string): Promise<FormalizationResult> {
    console.log(`[US-11] Iniciando formalización legal del Match ${matchId}`);

    const match = await this.swapRepo.getMatchById(matchId);

    if (!match) {
      throw new Error('No se encontró el match para formalizar.');
    }

    // US-11 depende de que la US-10 esté completa (Confirmación Bilateral)
    if (match.status !== 'APROBADO') {
      throw new Error(`RF-11: El intercambio no puede formalizarse porque su estado es ${match.status}. Se requiere aprobación de ambas partes.`);
    }

    // Ejecutar el cambio atómico en el sistema universitario (Banner/SIA)
    const officialResult = await this.enrollmentSystem.registerOfficialSwap(
      match.studentA.id,
      match.studentA.delivers,
      match.studentB.id,
      match.studentB.delivers
    );

    if (!officialResult.success) {
      throw new Error('El sistema universitario rechazó la transacción oficial.');
    }

    // Actualizar el match con el sello digital y nuevo estado
    match.status = 'FORMALIZADO';
    match.formalizationToken = officialResult.transactionId;
    
    await this.swapRepo.updateMatch(match);

    console.log(`[US-11] ¡Éxito! Intercambio ${matchId} formalizado legalmente.`);

    return {
      matchId: match.matchId,
      transactionId: officialResult.transactionId,
      isOfficial: true,
      message: 'El cambio ha sido registrado oficialmente en tu historial académico.'
    };
  }
}
