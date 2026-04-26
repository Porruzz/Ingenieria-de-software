import { MarketplaceRepositoryPort } from '../../application/ports/marketplace-repository.port';
import { OfferPublication, ProactiveInterest } from '../../domain/entities/marketplace';

export class InMemoryMarketplaceRepository implements MarketplaceRepositoryPort {
  private offers: OfferPublication[] = [];
  private interests: ProactiveInterest[] = [];

  async saveOffer(offer: OfferPublication): Promise<void> {
    const index = this.offers.findIndex(o => o.offerId === offer.offerId);
    if (index >= 0) this.offers[index] = offer;
    else this.offers.push(offer);
  }

  async getOfferById(offerId: string): Promise<OfferPublication | null> {
    return this.offers.find(o => o.offerId === offerId) || null;
  }

  async getActiveOffersByCourse(courseId: string): Promise<OfferPublication[]> {
    // Note: This would normally need a join with enrollments to find courseId
    // For in-memory simplification, we assume we can find it.
    return this.offers.filter(o => o.status === 'EN_OFERTA');
  }

  async saveInterest(interest: ProactiveInterest): Promise<void> {
    this.interests.push(interest);
  }

  async getInterestsForOffer(offerId: string): Promise<ProactiveInterest[]> {
    return this.interests.filter(i => i.offerId === offerId);
  }
}
