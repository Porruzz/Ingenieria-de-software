import { ConfirmBilateralSwapUseCase } from '../application/use-cases/confirm-bilateral-swap.use-case';
import { FormalizeSwapUseCase } from '../application/use-cases/formalize-swap.use-case';
import { SwapRepositoryPort } from '../application/ports/swap-repository.port';
import { EnrollmentSystemPort } from '../application/ports/enrollment-system.port';
import { SwapMatch } from '../domain/entities/swap';

describe('US-10 & US-11 — Confirmación y Formalización de Intercambios', () => {
  let swapRepo: jest.Mocked<SwapRepositoryPort>;
  let enrollmentSystem: jest.Mocked<EnrollmentSystemPort>;
  
  let confirmUseCase: ConfirmBilateralSwapUseCase;
  let formalizeUseCase: FormalizeSwapUseCase;

  const mockMatchId = 'MATCH_001';
  const studentAId = 'STU_A';
  const studentBId = 'STU_B';

  beforeEach(() => {
    swapRepo = {
      saveRequest: jest.fn(),
      getPendingRequests: jest.fn(),
      saveMatch: jest.fn(),
      updateRequestStatus: jest.fn(),
      getCourseIdFromSection: jest.fn(),
      getMatchById: jest.fn(),
      updateMatch: jest.fn(),
    };

    enrollmentSystem = {
      validateActiveEnrollment: jest.fn(),
      getEnrollmentByCourse: jest.fn(),
      getEnrollmentById: jest.fn(),
      registerOfficialSwap: jest.fn(),
    };

    confirmUseCase = new ConfirmBilateralSwapUseCase(swapRepo);
    formalizeUseCase = new FormalizeSwapUseCase(swapRepo, enrollmentSystem);
  });

  test('US-10: Debería requerir confirmación de ambas partes antes de marcar como APROBADO', async () => {
    const mockMatch: SwapMatch = {
      matchId: mockMatchId,
      studentA: { id: studentAId, delivers: 'SEC_1', receives: 'SEC_2', confirmed: false },
      studentB: { id: studentBId, delivers: 'SEC_2', receives: 'SEC_1', confirmed: false },
      status: 'PENDIENTE_CONFIRMACION',
      improvementA: 20, improvementB: 20,
      systemSafetyHash: 'hash', createdAt: new Date()
    };

    swapRepo.getMatchById.mockResolvedValue(mockMatch);

    // 1. Estudiante A confirma
    let result = await confirmUseCase.execute(mockMatchId, studentAId);
    expect(result.isFullyApproved).toBe(false);
    expect(mockMatch.studentA.confirmed).toBe(true);

    // 2. Estudiante B confirma
    result = await confirmUseCase.execute(mockMatchId, studentBId);
    expect(result.isFullyApproved).toBe(true);
    expect(result.status).toBe('APROBADO');
    expect(swapRepo.updateMatch).toHaveBeenCalled();
  });

  test('US-11: Debería fallar la formalización si no hay aprobación bilateral previa', async () => {
    const mockMatch: SwapMatch = {
      matchId: mockMatchId,
      studentA: { id: studentAId, delivers: 'SEC_1', receives: 'SEC_2', confirmed: true },
      studentB: { id: studentBId, delivers: 'SEC_2', receives: 'SEC_1', confirmed: false }, // B no ha confirmado
      status: 'PENDIENTE_CONFIRMACION',
      improvementA: 20, improvementB: 20,
      systemSafetyHash: 'hash', createdAt: new Date()
    };

    swapRepo.getMatchById.mockResolvedValue(mockMatch);

    await expect(formalizeUseCase.execute(mockMatchId))
      .rejects
      .toThrow(/El intercambio no puede formalizarse porque su estado es PENDIENTE_CONFIRMACION/);
  });

  test('US-11: Debería registrar oficialmente el cambio y generar token de éxito si está aprobado', async () => {
    const mockMatch: SwapMatch = {
      matchId: mockMatchId,
      studentA: { id: studentAId, delivers: 'ENR_A', receives: 'ENR_B', confirmed: true },
      studentB: { id: studentBId, delivers: 'ENR_B', receives: 'ENR_A', confirmed: true },
      status: 'APROBADO',
      improvementA: 20, improvementB: 20,
      systemSafetyHash: 'hash', createdAt: new Date()
    };

    swapRepo.getMatchById.mockResolvedValue(mockMatch);
    enrollmentSystem.registerOfficialSwap.mockResolvedValue({ success: true, transactionId: 'DIGITAL_SEAL_123' });

    const result = await formalizeUseCase.execute(mockMatchId);

    expect(result.isOfficial).toBe(true);
    expect(result.transactionId).toBe('DIGITAL_SEAL_123');
    expect(mockMatch.status).toBe('FORMALIZADO');
    expect(swapRepo.updateMatch).toHaveBeenCalled();
  });
});
