import { Injectable, HttpException } from '@nestjs/common';
import { PortfolioRepository } from './portfolio.repo';
import {
  FreelancerProfileNotFoundException,
  NoPortfoliosAvailableException,
  UnableToLoadPortfoliosException,
} from './portfolio.error';
import { RoleName } from '@shared/types';

@Injectable()
export class PortfolioService {
  constructor(private readonly portfolioRepository: PortfolioRepository) {}

  async getPortfolios(profileId: number) {
    try {
      const profile =
        await this.portfolioRepository.findFreelancerProfileById(profileId);
      if (!profile) {
        throw FreelancerProfileNotFoundException();
      }

      const isFreelancer = profile.user.userRoles.some(
        (ur) => ur.role.name === RoleName.FREELANCER,
      );
      if (!isFreelancer) {
        throw FreelancerProfileNotFoundException();
      }

      const freelancerProfile = profile.freelancerProfile;
      if (!freelancerProfile) {
        throw NoPortfoliosAvailableException();
      }

      const portfolios =
        await this.portfolioRepository.findPortfoliosByFreelancerProfileId(
          freelancerProfile.id,
        );

      if (!portfolios || portfolios.length === 0) {
        throw NoPortfoliosAvailableException();
      }

      return portfolios;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw UnableToLoadPortfoliosException();
    }
  }
}
