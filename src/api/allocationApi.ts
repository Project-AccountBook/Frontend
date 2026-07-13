import { authRequest } from './client';
import type { MonthlyAllocationSummaryResponse } from './types';

/** AllocationController (/api/v1/allocation) */
export const allocationApi = {
  getMonthly: (yearMonth: string) =>
    authRequest<MonthlyAllocationSummaryResponse>(
      `/api/v1/allocation/${encodeURIComponent(yearMonth)}`
    ),
};
