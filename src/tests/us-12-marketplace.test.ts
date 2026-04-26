import { PublishOfferUseCase } from '../application/use-cases/publish-offer.use-case';
import { RegisterInterestUseCase } from '../application/use-cases/register-interest.use-case';
import { ValidatePrerequisites } from '../application/use-cases/validate-prerequisites';
import { MarketplaceRepositoryPort } from '../application/ports/marketplace-repository.port';
import { EnrollmentSystemPort } from '../application/ports/enrollment-system.port';
import { NotificationServicePort } from '../application/ports/notification-service.port';
import { AcademicRepositoryPort } from '../application/ports/academic-repository.port';
import { PrerequisiteRepositoryPort } from '../application/ports/prerequisite-repository.port';

describe('US-12 — Marketplace Académico Validado (Publicación y Búsqueda Proactiva)', () => {
  let marketplaceRepo: jest.Mocked<MarketplaceRepositoryPort>;
  let enrollmentSystem: jest.Mocked<EnrollmentSystemPort>;
  let notificationService: jest.Mocked<NotificationServicePort>;
  
  let academicRepo: jest.Mocked<AcademicRepositoryPort>;
  let prereqRepo: jest.Mocked<PrerequisiteRepositoryPort>;
  let validatePrerequisites: ValidatePrerequisites;

  let publishUseCase: PublishOfferUseCase;
  let registerInterestUseCase: RegisterInterestUseCase;

  beforeEach(() => {
    marketplaceRepo = {
      saveOffer: jest.fn(),
      getOfferById: jest.fn(),
      getActiveOffersByCourse: jest.fn(),
      saveInterest: jest.fn(),
      getInterestsForOffer: jest.fn(),
    };

    enrollmentSystem = {
      validateActiveEnrollment: jest.fn(),
      getEnrollmentByCourse: jest.fn(),
      getEnrollmentById: jest.fn(),
    };

    notificationService = {
      notifyStudent: jest.fn(),
    };

    academicRepo = {
      getHistory: jest.fn(),
      saveHistory: jest.fn(),
    };

    prereqRepo = {
      getFullPrerequisiteGraph: jest.fn(),
      getPrerequisitesForCourse: jest.fn(),
      getCourseName: jest.fn(),
      courseExists: jest.fn(),
    };

    validatePrerequisites = new ValidatePrerequisites(academicRepo, prereqRepo);

    publishUseCase = new PublishOfferUseCase(enrollmentSystem, marketplaceRepo);
    registerInterestUseCase = new RegisterInterestUseCase(
      marketplaceRepo, 
      enrollmentSystem, 
      notificationService, 
      validatePrerequisites
    );
  });

  // ═══════════════════════════════════════════════════
  // Pruebas de Publicación de Oferta (PublishOffer)
  // ═══════════════════════════════════════════════════
  describe('Publicar Oferta (PublishOfferUseCase)', () => {
    test('RF-12.1: Debería fallar si el cupo no es oficial/activo en el sistema académico', async () => {
      // Simular que el estudiante NO tiene la inscripción activa
      enrollmentSystem.validateActiveEnrollment.mockResolvedValue(null);

      await expect(publishUseCase.execute('STU_01', 'ENROLL_01'))
        .rejects
        .toThrow('RF-12.1: El estudiante no posee este cupo de forma oficial o no está activo.');
    });

    test('RF-12.2 & RF-12.4: Debería publicar exitosamente y quedar En Oferta con vínculo a Zona Prohibida', async () => {
      enrollmentSystem.validateActiveEnrollment.mockResolvedValue({
        enrollmentId: 'ENROLL_01',
        studentId: 'STU_01',
        sectionId: 'SEC_A',
        courseId: 'MAT101',
        academicPeriod: '2026-1',
        status: 'ACTIVO'
      });

      const offer = await publishUseCase.execute('STU_01', 'ENROLL_01', 'ZONA_TRABAJO');

      expect(offer.issuerStudentId).toBe('STU_01');
      expect(offer.status).toBe('EN_OFERTA'); // RF-12.4
      expect(offer.forbiddenBlockId).toBe('ZONA_TRABAJO'); // RF-12.2
      expect(offer.validationToken).toBeDefined(); // RNF-12.2
      expect(marketplaceRepo.saveOffer).toHaveBeenCalledWith(offer);
    });
  });

  // ═══════════════════════════════════════════════════
  // Pruebas de Interés Proactivo (RegisterInterest)
  // ═══════════════════════════════════════════════════
  describe('Registrar Interés (RegisterInterestUseCase)', () => {
    test('RF-12.3: Debería fallar si el interesado no cumple los prerrequisitos', async () => {
      // Setup de la oferta
      marketplaceRepo.getOfferById.mockResolvedValue({
        offerId: 'OFR_123',
        issuerStudentId: 'STU_01',
        sourceEnrollmentId: 'ENROLL_01',
        status: 'EN_OFERTA',
        publicationDate: new Date(),
        validationToken: 'token'
      });

      // Setup de la inscripción origen
      enrollmentSystem.getEnrollmentById.mockResolvedValue({
        enrollmentId: 'ENROLL_01',
        studentId: 'STU_01',
        sectionId: 'SEC_A',
        courseId: 'MAT201', // Cálculo III
        academicPeriod: '2026-1',
        status: 'ACTIVO'
      });

      // Simular que el estudiante interesado no cumple prerrequisitos
      prereqRepo.courseExists.mockResolvedValue(true);
      prereqRepo.getCourseName.mockResolvedValue('Cálculo III');
      prereqRepo.getPrerequisitesForCourse.mockResolvedValue([
        { courseId: 'MAT201', requiredCourseId: 'MAT102', requiredCourseName: 'Cálculo II', type: 'PRE' }
      ]);
      // Historial vacío
      academicRepo.getHistory.mockResolvedValue({ studentId: 'STU_INTERESADO', records: [], totalCredits: 0, currentSemester: 1, lastSync: new Date() });

      await expect(registerInterestUseCase.execute('STU_INTERESADO', 'OFR_123'))
        .rejects
        .toThrow(/RF-12.3: No cumples con los prerrequisitos para esta materia/);
      
      // Asegurarse de que NO se notificó ni guardó nada
      expect(marketplaceRepo.saveInterest).not.toHaveBeenCalled();
      expect(notificationService.notifyStudent).not.toHaveBeenCalled();
    });

    test('RF-12.5 & RNF-12.3: Debería registrar interés y notificar anónimamente si cumple requisitos', async () => {
      // Setup de la oferta
      marketplaceRepo.getOfferById.mockResolvedValue({
        offerId: 'OFR_123',
        issuerStudentId: 'STU_01',
        sourceEnrollmentId: 'ENROLL_01',
        status: 'EN_OFERTA',
        publicationDate: new Date(),
        validationToken: 'token'
      });

      // Setup de la inscripción origen
      enrollmentSystem.getEnrollmentById.mockResolvedValue({
        enrollmentId: 'ENROLL_01',
        studentId: 'STU_01',
        sectionId: 'SEC_A',
        courseId: 'MAT201', 
        academicPeriod: '2026-1',
        status: 'ACTIVO'
      });

      // Simular que el estudiante cumple (sin prerrequisitos o ya los tiene)
      prereqRepo.courseExists.mockResolvedValue(true);
      prereqRepo.getPrerequisitesForCourse.mockResolvedValue([]); // Sin prerrequisitos para simplificar prueba
      
      const interest = await registerInterestUseCase.execute('STU_INTERESADO', 'OFR_123');

      expect(interest.offerId).toBe('OFR_123');
      expect(interest.interestedStudentId).toBe('STU_INTERESADO');
      expect(marketplaceRepo.saveInterest).toHaveBeenCalledWith(interest);

      // Verificación de RNF-12.1, RF-12.5 y RNF-12.3: La notificación es anónima y se envía al emisor
      expect(notificationService.notifyStudent).toHaveBeenCalledWith(
        'STU_01', // Emisor de la oferta
        expect.any(String), // Asunto genérico
        expect.stringContaining('Alguien está interesado en tu cupo') // Mensaje anónimo
      );
    });
  });
});
