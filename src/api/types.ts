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
  email: string;
  username: string;
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
