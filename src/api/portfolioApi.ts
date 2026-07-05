import { authRequest } from './client';
import type { MyPortfolioResponse } from './types';

/** PortfolioController (/api/v1/portfolios) */
export const portfolioApi = {
  getMyPortfolio: (yearMonth: string) =>
    authRequest<MyPortfolioResponse>(
      `/api/v1/portfolios/me?yearMonth=${encodeURIComponent(yearMonth)}`
    ),
};
