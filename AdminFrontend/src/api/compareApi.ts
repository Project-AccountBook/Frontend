import { authRequest } from './client';
import type {
  BudgetCompareResponse,
  CompareType,
  ExpenseCompareResponse,
  IncomeCompareResponse,
  MyBudgetResponse,
  MyExpenseResponse,
  MyIncomeResponse,
  MyPortfolioResponse,
  PairBudgetDetailResponse,
  PairExpenseDetailResponse,
  PairIncomeDetailResponse,
  PairPortfolioDetailResponse,
  PortfolioCompareResponse,
  PublicMonthlyBudgetResponse,
  PublicMonthlyExpenseResponse,
  PublicMonthlyIncomeResponse,
  PublicMonthlyPortfolioResponse,
  UserBudgetCompareResponse,
  UserExpenseCompareResponse,
  UserIncomeCompareResponse,
  UserPortfolioCompareResponse,
} from './types';

interface UsersFilter {
  year: number;
  month: number;
  minAmount?: number;
  maxAmount?: number;
}

interface PortfolioUsersFilter {
  year: number;
  month: number;
  minBudget?: number;
  maxBudget?: number;
  minExpense?: number;
  maxExpense?: number;
  minIncome?: number;
  maxIncome?: number;
}

interface CompareFilter {
  type: CompareType;
  yearMonth: string;
  categoryId?: number;
  minAmount?: number;
  maxAmount?: number;
  radiusKm?: number;
}

interface PortfolioCompareFilter {
  type: CompareType;
  yearMonth: string;
  categoryId?: number;
  minBudget?: number;
  maxBudget?: number;
  minExpense?: number;
  maxExpense?: number;
  minIncome?: number;
  maxIncome?: number;
  radiusKm?: number;
}

interface UserCompareFilter {
  type: CompareType;
  yearMonth: string;
  categoryId?: number;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/** BudgetCompareController (/api/v1/budgets) */
export const budgetCompareApi = {
  me: (yearMonth: string) =>
    authRequest<MyBudgetResponse>(`/api/v1/budgets/me${toQuery({ yearMonth })}`),
  users: (f: UsersFilter) =>
    authRequest<PublicMonthlyBudgetResponse[]>(
      `/api/v1/budgets/compare/users${toQuery({ ...f })}`
    ),
  compare: (f: CompareFilter) =>
    authRequest<BudgetCompareResponse>(
      `/api/v1/budgets/compare${toQuery({ ...f })}`
    ),
  userCompare: (targetUserId: number, f: UserCompareFilter) =>
    authRequest<UserBudgetCompareResponse>(
      `/api/v1/budgets/compare/users/${targetUserId}${toQuery({ ...f })}`
    ),
  userDetails: (targetUserId: number, yearMonth: string) =>
    authRequest<PairBudgetDetailResponse>(
      `/api/v1/budgets/compare/users/${targetUserId}/details${toQuery({ yearMonth })}`
    ),
};

/** ExpenseCompareController (/api/v1/expenses) */
export const expenseCompareApi = {
  me: (yearMonth: string) =>
    authRequest<MyExpenseResponse>(`/api/v1/expenses/me${toQuery({ yearMonth })}`),
  users: (f: UsersFilter) =>
    authRequest<PublicMonthlyExpenseResponse[]>(
      `/api/v1/expenses/compare/users${toQuery({ ...f })}`
    ),
  compare: (f: CompareFilter) =>
    authRequest<ExpenseCompareResponse>(
      `/api/v1/expenses/compare${toQuery({ ...f })}`
    ),
  userCompare: (targetUserId: number, f: UserCompareFilter) =>
    authRequest<UserExpenseCompareResponse>(
      `/api/v1/expenses/compare/users/${targetUserId}${toQuery({ ...f })}`
    ),
  userDetails: (targetUserId: number, yearMonth: string) =>
    authRequest<PairExpenseDetailResponse>(
      `/api/v1/expenses/compare/users/${targetUserId}/details${toQuery({ yearMonth })}`
    ),
};

/** IncomeCompareController (/api/v1/incomes) */
export const incomeCompareApi = {
  me: (yearMonth: string) =>
    authRequest<MyIncomeResponse>(`/api/v1/incomes/me${toQuery({ yearMonth })}`),
  users: (f: UsersFilter) =>
    authRequest<PublicMonthlyIncomeResponse[]>(
      `/api/v1/incomes/compare/users${toQuery({ ...f })}`
    ),
  compare: (f: CompareFilter) =>
    authRequest<IncomeCompareResponse>(
      `/api/v1/incomes/compare${toQuery({ ...f })}`
    ),
  userCompare: (targetUserId: number, f: UserCompareFilter) =>
    authRequest<UserIncomeCompareResponse>(
      `/api/v1/incomes/compare/users/${targetUserId}${toQuery({ ...f })}`
    ),
  userDetails: (targetUserId: number, yearMonth: string) =>
    authRequest<PairIncomeDetailResponse>(
      `/api/v1/incomes/compare/users/${targetUserId}/details${toQuery({ yearMonth })}`
    ),
};

/** PortfolioCompareController (/api/v1/portfolios) */
export const portfolioCompareApi = {
  me: (yearMonth: string) =>
    authRequest<MyPortfolioResponse>(
      `/api/v1/portfolios/me${toQuery({ yearMonth })}`
    ),
  users: (f: PortfolioUsersFilter) =>
    authRequest<PublicMonthlyPortfolioResponse[]>(
      `/api/v1/portfolios/compare/users${toQuery({ ...f })}`
    ),
  compare: (f: PortfolioCompareFilter) =>
    authRequest<PortfolioCompareResponse>(
      `/api/v1/portfolios/compare${toQuery({ ...f })}`
    ),
  userCompare: (targetUserId: number, f: UserCompareFilter) =>
    authRequest<UserPortfolioCompareResponse>(
      `/api/v1/portfolios/compare/users/${targetUserId}${toQuery({ ...f })}`
    ),
  userDetails: (targetUserId: number, yearMonth: string) =>
    authRequest<PairPortfolioDetailResponse>(
      `/api/v1/portfolios/compare/users/${targetUserId}/details${toQuery({ yearMonth })}`
    ),
};
