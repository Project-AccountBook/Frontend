/** Backend ApiResponse<T> wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export type RequestResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ReissueRequest {
  refreshToken: string;
}

export interface EmailRequest {
  email: string;
}

export type VerificationType = 'SIGNUP' | 'RESET';

export interface VerifyRequest {
  email: string;
  code: string;
  type: VerificationType;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  birthDate: string | null;
  address: string | null;
}

export interface SignupResponse {
  userId: number;
  email: string;
  username: string;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  username: string;
  role: string;
  birthDate: string | null;
  address: string | null;
  hasPassword: boolean;
  budgetAlertThreshold: number;
  isPortfolioPublic: boolean;
  isBudgetAlertEnabled: boolean;
  isInterestCategoryEnabled: boolean;
  isSystemAlertEnabled: boolean;
}

export interface UpdateProfileRequest {
  username: string;
  birthDate: string | null;
  address: string | null;
  budgetAlertThreshold: number;
  isPortfolioPublic: boolean;
  isBudgetAlertEnabled: boolean;
  isInterestCategoryEnabled: boolean;
  isSystemAlertEnabled: boolean;
}

export interface UpdatePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface GroupPurchaseCategoryResponse {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterestCategoryResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  isAlarmEnabled: boolean;
}

/** Spring Data Page<T> */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type NotificationType = 'BUDGET' | 'INTEREST_CATEGORY' | 'SYSTEM';

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  redirectUrl: string | null;
  referenceId: number | null;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface CategoryResponse {
  id: number;
  name: string;
  type: TransactionType;
  isCustom: boolean;
}

export interface CategoryRequest {
  name: string;
  type: TransactionType;
}

export interface BudgetRequest {
  categoryId: number;
  yearMonth: string;
  totalBudget: number;
  expectedExpense: number;
}

export interface BudgetResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  totalBudget: number;
  expectedExpense: number;
  totalPlannedBudget: number;
  actualExpense: number;
  remainingBudget: number;
  progress: number;
}

export interface BudgetSummaryResponse {
  yearMonth: string;
  totalPlannedBudgetSum: number;
  totalActualExpenseSum: number;
  totalRemainingBudget: number;
}

/** DashboardController */
export interface MonthlyTrendResponse {
  yearMonth: string;
  income: number;
  expense: number;
}

export interface BudgetStatusResponse {
  totalPlanned: number;
  actualExpense: number;
  remaining: number;
}

export interface SummaryResponse {
  totalExpense: number;
}

export interface DashboardResponse {
  categoryExpenses: Record<string, number>;
  trends: MonthlyTrendResponse[];
  budgetStatus: BudgetStatusResponse;
  summary: SummaryResponse;
}

/** PortfolioController */
export interface CategoryAmountResponse {
  categoryId: number;
  categoryName: string;
  amount: number;
}

export interface MyIncomeResponse {
  yearMonth: string;
  totalIncome: number;
  fixedIncome: number;
  variableIncome: number;
  fixedCategoryIncomes: CategoryAmountResponse[];
  variableCategoryIncomes: CategoryAmountResponse[];
}

export interface MyExpenseResponse {
  yearMonth: string;
  totalExpense: number;
  fixedExpense: number;
  variableExpense: number;
  fixedCategoryExpenses: CategoryAmountResponse[];
  variableCategoryExpenses: CategoryAmountResponse[];
}

export interface CategoryBudgetResponse {
  categoryId: number;
  categoryName: string;
  totalBudget: number;
  actualExpense: number;
  remainingBudget: number;
}

export interface MyBudgetResponse {
  yearMonth: string;
  totalBudget: number;
  categoryBudgets: CategoryBudgetResponse[];
}

export interface MyPortfolioResponse {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  totalBudget: number;
  balance: number;
  income: MyIncomeResponse;
  expense: MyExpenseResponse;
  budget: MyBudgetResponse;
}
