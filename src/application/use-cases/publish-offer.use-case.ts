import { EnrollmentSystemPort } from '../ports/enrollment-system.port';
import { MarketplaceRepositoryPort } from '../ports/marketplace-repository.port';
import { OfferPublication } from '../../domain/entities/marketplace';
import { randomBytes } from 'crypto';

export class PublishOfferUseCase {
  constructor(
    private readonly enrollmentSystem: EnrollmentSystemPort,
    private readonly marketplaceRepo: MarketplaceRepositoryPort
  ) {}

  /**
   * Ejecuta la publicación de un cupo que el estudiante ya no necesita.
   * RF-12.1: Sincronización Obligatoria con el Sistema Académico
   * RF-12.2: Selección de Motivo de Descarte (Vínculo con Zonas Prohibidas)
   * RF-12.4: Estado Dinámico 'En Oferta'
   */
  async execute(
    studentId: string, 
    enrollmentId: string, 
    forbiddenBlockId?: string
  ): Promise<OfferPublication> {
    console.log(`[US-12] Iniciando publicación de oferta para inscripción ${enrollmentId} por estudiante ${studentId}`);

    // RF-12.1: Validar con el sistema académico (Banner/SAP)
    const activeEnrollment = await this.enrollmentSystem.validateActiveEnrollment(studentId, enrollmentId);
    
    if (!activeEnrollment || activeEnrollment.status !== 'ACTIVO') {
      throw new Error('RF-12.1: El estudiante no posee este cupo de forma oficial o no está activo.');
    }

    // RNF-12.2: Seguridad y Cifrado (Generación de token único para validación anónima)
    const validationToken = randomBytes(32).toString('hex');

    const offer: OfferPublication = {
      offerId: `OFR-${Date.now()}-${studentId.substring(0, 4)}`,
      issuerStudentId: studentId,
      sourceEnrollmentId: enrollmentId,
      forbiddenBlockId: forbiddenBlockId, // RF-12.2
      status: 'EN_OFERTA', // RF-12.4: Sigue activo en su horario real, pero en oferta en el marketplace
      publicationDate: new Date(),
      validationToken: validationToken
    };

    await this.marketplaceRepo.saveOffer(offer);
    
    console.log(`[US-12] Oferta publicada exitosamente. ID: ${offer.offerId}`);
    return offer;
  }
}
