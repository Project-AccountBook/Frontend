import { authRequest } from './client';
import type {
  BudgetCopyResponse,
  BudgetRequest,
  BudgetResponse,
  BudgetSummaryResponse,
} from './types';

/** BudgetController (/api/v1/budget) */
export const budgetApi = {
  create: (request: BudgetRequest) =>
    authRequest<number>('/api/v1/budget', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getMonthlyStatus: (yearMonth: string) =>
    authRequest<BudgetResponse[]>(`/api/v1/budget/${yearMonth}/status`),

  getMonthlySummary: (yearMonth: string) =>
    authRequest<BudgetSummaryResponse>(`/api/v1/budget/${yearMonth}/summary`),

  previewCopyFromLatest: (targetYearMonth: string) =>
    authRequest<BudgetCopyResponse>(`/api/v1/budget/${targetYearMonth}/copy-from-latest/preview`),

  copyFromLatest: (targetYearMonth: string) =>
    authRequest<BudgetCopyResponse>(`/api/v1/budget/${targetYearMonth}/copy-from-latest`, {
      method: 'POST',
    }),

  update: (budgetId: number, request: BudgetRequest) =>
    authRequest<void>(`/api/v1/budget/${budgetId}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (budgetId: number) =>
    authRequest<void>(`/api/v1/budget/${budgetId}`, {
      method: 'DELETE',
    }),
};
