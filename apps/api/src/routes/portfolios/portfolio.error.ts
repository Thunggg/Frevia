import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PortfolioMessage } from '@shared/types';

export const FreelancerProfileNotFoundException = () =>
  new NotFoundException([
    { message: PortfolioMessage.PORTFOLIO_PROFILE_NOT_FOUND, path: 'id' },
  ]);

export const NoPortfoliosAvailableException = () =>
  new NotFoundException([
    { message: PortfolioMessage.NO_PORTFOLIOS_AVAILABLE, path: 'portfolios' },
  ]);

export const UnableToLoadPortfoliosException = () =>
  new InternalServerErrorException([
    { message: PortfolioMessage.UNABLE_TO_LOAD_PORTFOLIOS, path: 'portfolios' },
  ]);
