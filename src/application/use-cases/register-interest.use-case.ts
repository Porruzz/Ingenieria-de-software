import { MarketplaceRepositoryPort } from '../ports/marketplace-repository.port';
import { EnrollmentSystemPort } from '../ports/enrollment-system.port';
import { NotificationServicePort } from '../ports/notification-service.port';
import { ValidatePrerequisites } from './validate-prerequisites';
import { ProactiveInterest } from '../../domain/entities/marketplace';

export class RegisterInterestUseCase {
  constructor(
    private readonly marketplaceRepo: MarketplaceRepositoryPort,
    private readonly enrollmentSystem: EnrollmentSystemPort,
    private readonly notificationService: NotificationServicePort,
    private readonly validatePrerequisites: ValidatePrerequisites
  ) {}

  /**
   * RF-12.3: Validación Automática de Prerrequisitos
   * RNF-12.1: Gestión de Anonimato
   * RNF-12.3: Latencia de Notificación (< 5s)
   */
  async execute(
    interestedStudentId: string,
    offerId: string,
    exchangeEnrollmentId?: string
  ): Promise<ProactiveInterest> {
    console.log(`[US-12] Registrando interés proactivo de ${interestedStudentId} en la oferta ${offerId}`);

    const offer = await this.marketplaceRepo.getOfferById(offerId);
    if (!offer || offer.status !== 'EN_OFERTA') {
      throw new Error('La oferta no existe o ya no está disponible.');
    }

    // Obtener la inscripción original para saber de qué materia estamos hablando
    const sourceEnrollment = await this.enrollmentSystem.getEnrollmentById(offer.sourceEnrollmentId);
    if (!sourceEnrollment) {
      throw new Error('No se pudo resolver la inscripción original de la oferta.');
    }

    // RF-12.3: Validación de Prerrequisitos en tiempo real
    const validationResult = await this.validatePrerequisites.execute(
      interestedStudentId, 
      sourceEnrollment.courseId
    );

    if (validationResult.status === 'BLOQUEADO') {
      throw new Error(`RF-12.3: No cumples con los prerrequisitos para esta materia. ${validationResult.message}`);
    }

    // Calcular prioridad de sistema (Lógica simulada de Smart Match)
    // Se puede basar en si el interesado ofrece un intercambio directo que cuadre con el bloque prohibido del emisor
    let priorityScore = 50; 
    if (exchangeEnrollmentId) {
      priorityScore += 30; // Si ofrece algo a cambio, tiene más prioridad
    }

    const interest: ProactiveInterest = {
      interestId: `INT-${Date.now()}-${interestedStudentId.substring(0, 4)}`,
      offerId: offer.offerId,
      interestedStudentId: interestedStudentId, // RNF-12.1: Este ID no se expone al oferente
      exchangeEnrollmentId: exchangeEnrollmentId,
      systemPriorityScore: priorityScore,
      requestDate: new Date()
    };

    // Guardar interés
    await this.marketplaceRepo.saveInterest(interest);

    // RNF-12.3: Notificación en menos de 5 segundos al estudiante oferente
    // La notificación no revela la identidad del interesado (RNF-12.1 / RF-12.5)
    await this.notificationService.notifyStudent(
      offer.issuerStudentId,
      '¡Nuevo interesado en tu cupo!',
      `Alguien está interesado en tu cupo de ${sourceEnrollment.courseId}. Revisa las opciones de intercambio.`
    );

    console.log(`[US-12] Interés registrado con éxito. Prioridad: ${priorityScore}`);
    return interest;
  }
}
