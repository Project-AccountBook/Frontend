import { authRequest } from './client';
import type { DashboardResponse } from './types';

/** DashboardController (/api/v1/dashboard) */
export const dashboardApi = {
  getDashboard: (yearMonth: string) =>
    authRequest<DashboardResponse>(`/api/v1/dashboard?yearMonth=${encodeURIComponent(yearMonth)}`),
};
