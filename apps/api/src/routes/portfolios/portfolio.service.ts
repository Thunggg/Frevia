import { Injectable, HttpException } from '@nestjs/common';
import { PortfolioRepository } from './portfolio.repo';
import {
  FreelancerProfileNotFoundException,
  NoPortfoliosAvailableException,
  UnableToLoadPortfoliosException,
  PortfolioForbiddenException,
} from './portfolio.error';
import { RoleName, AddPortfolioType } from '@shared/types';

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

  async addPortfolio(
    profileId: number,
    currentUserId: number,
    data: AddPortfolioType,
  ) {
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

      if (profile.userId !== currentUserId) {
        throw PortfolioForbiddenException();
      }

      return await this.portfolioRepository.addPortfolioToProfile(
        profileId,
        data,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw UnableToLoadPortfoliosException();
    }
  }
}
