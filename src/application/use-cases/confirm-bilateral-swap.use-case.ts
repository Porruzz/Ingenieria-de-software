import { SwapRepositoryPort } from '../ports/swap-repository.port';
import { SwapMatch } from '../../domain/entities/swap';

export interface ConfirmationResult {
  matchId: string;
  isFullyApproved: boolean;
  status: string;
}

/**
 * US-10: Confirmación de Intercambio Bilateral.
 * "Como usuario, quiero un mecanismo de confirmación mutua para asegurar 
 * que ambas partes están de acuerdo con el swap antes de ejecutarlo."
 */
export class ConfirmBilateralSwapUseCase {
  constructor(private readonly swapRepo: SwapRepositoryPort) {}

  async execute(matchId: string, studentId: string): Promise<ConfirmationResult> {
    console.log(`[US-10] Estudiante ${studentId} intentando confirmar el match ${matchId}`);

    const match = await this.swapRepo.getMatchById(matchId);

    if (!match) {
      throw new Error('No se encontró el emparejamiento (Match) solicitado.');
    }

    if (match.status === 'RECHAZADO') {
      throw new Error('Este intercambio ya ha sido rechazado por una de las partes.');
    }

    if (match.status === 'FORMALIZADO') {
      throw new Error('Este intercambio ya ha sido formalizado oficialmente.');
    }

    // Identificar qué estudiante está confirmando y actualizar su estado
    let studentRole: 'A' | 'B' | null = null;

    if (match.studentA.id === studentId) {
      match.studentA.confirmed = true;
      studentRole = 'A';
    } else if (match.studentB.id === studentId) {
      match.studentB.confirmed = true;
      studentRole = 'B';
    } else {
      throw new Error('El estudiante no forma parte de este intercambio.');
    }

    console.log(`[US-10] Confirmación registrada para Estudiante ${studentRole}`);

    // Verificar si ambos ya confirmaron
    if (match.studentA.confirmed && match.studentB.confirmed) {
      match.status = 'APROBADO';
      console.log(`[US-10] ¡BINGO! Ambos estudiantes han confirmado. Match ${matchId} ahora está APROBADO.`);
    } else {
      match.status = 'PENDIENTE_CONFIRMACION';
    }

    await this.swapRepo.updateMatch(match);

    return {
      matchId: match.matchId,
      isFullyApproved: match.status === 'APROBADO',
      status: match.status
    };
  }

  /**
   * Permite a un estudiante rechazar el intercambio explícitamente.
   */
  async reject(matchId: string, studentId: string): Promise<void> {
    const match = await this.swapRepo.getMatchById(matchId);
    
    if (!match) throw new Error('Match no encontrado.');
    
    if (match.studentA.id === studentId || match.studentB.id === studentId) {
      match.status = 'RECHAZADO';
      await this.swapRepo.updateMatch(match);
      console.log(`[US-10] Match ${matchId} RECHAZADO por el estudiante ${studentId}`);
    } else {
      throw new Error('No autorizado para rechazar este match.');
    }
  }
}
