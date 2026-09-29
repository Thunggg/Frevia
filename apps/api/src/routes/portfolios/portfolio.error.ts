import {
  ForbiddenException,
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

export const PortfolioForbiddenException = () =>
  new ForbiddenException([
    { message: PortfolioMessage.PORTFOLIO_FORBIDDEN, path: 'userId' },
  ]);

export const PortfolioNotFoundException = () =>
  new NotFoundException([
    { message: PortfolioMessage.PORTFOLIO_NOT_FOUND, path: 'id' },
  ]);

export const UnableToUpdatePortfolioException = () =>
  new InternalServerErrorException([
    {
      message: PortfolioMessage.PORTFOLIO_FAILED_TO_UPDATE,
      path: 'portfolios',
    },
  ]);
