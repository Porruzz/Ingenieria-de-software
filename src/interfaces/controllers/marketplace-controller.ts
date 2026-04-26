import { Request, Response } from 'express';
import { PublishOfferUseCase } from '../../application/use-cases/publish-offer.use-case';
import { RegisterInterestUseCase } from '../../application/use-cases/register-interest.use-case';
import { MarketplaceRepositoryPort } from '../../application/ports/marketplace-repository.port';

export class MarketplaceController {
  constructor(
    private readonly publishOffer: PublishOfferUseCase,
    private readonly registerInterest: RegisterInterestUseCase,
    private readonly marketplaceRepo: MarketplaceRepositoryPort
  ) {}

  async publish(req: Request, res: Response) {
    try {
      const { studentId, enrollmentId, forbiddenBlockId } = req.body;
      const offer = await this.publishOffer.execute(studentId, enrollmentId, forbiddenBlockId);
      
      res.status(201).json({
        success: true,
        data: offer
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async interest(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { studentId, exchangeEnrollmentId } = req.body;
      const interest = await this.registerInterest.execute(studentId, offerId, exchangeEnrollmentId);
      
      res.status(201).json({
        success: true,
        data: interest
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getOffersByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const offers = await this.marketplaceRepo.getActiveOffersByCourse(courseId);
      
      res.status(200).json({
        success: true,
        data: offers
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
