import { OfferPublication, ProactiveInterest } from '../../domain/entities/marketplace';

export interface MarketplaceRepositoryPort {
  /**
   * Guarda una nueva publicación de oferta o actualiza su estado.
   */
  saveOffer(offer: OfferPublication): Promise<void>;

  /**
   * Obtiene una oferta por su ID.
   */
  getOfferById(offerId: string): Promise<OfferPublication | null>;

  /**
   * Busca ofertas activas ('EN_OFERTA') para un curso específico.
   */
  getActiveOffersByCourse(courseId: string): Promise<OfferPublication[]>;

  /**
   * Guarda el interés proactivo de un estudiante por una oferta.
   */
  saveInterest(interest: ProactiveInterest): Promise<void>;
  
  /**
   * Obtiene todos los interesados en una oferta específica.
   */
  getInterestsForOffer(offerId: string): Promise<ProactiveInterest[]>;
}
