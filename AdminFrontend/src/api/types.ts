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
  isGoalAlertEnabled: boolean;
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
  isGoalAlertEnabled: boolean;
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

export type GroupPurchaseStatus =
  | 'RECRUITING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CLOSED'
  | 'BLIND';

export interface GroupPurchaseResponse {
  id: number;
  creatorId: number;
  creatorNickname: string;
  categoryId: number;
  title: string;
  content: string;
  price: number;
  minParticipants: number;
  maxParticipants: number;
  currentParticipants: number;
  status: GroupPurchaseStatus;
  deadline: string;
  pickupLocation: string;
  viewCount: number;
  imageUrl: string | null;
  achievementRate: number;
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

export type NotificationType = 'BUDGET' | 'INTEREST_CATEGORY' | 'GOAL' | 'SYSTEM';

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

export type AccountRole = 'CHECKING' | 'SAVINGS' | 'INVESTMENT';

export interface CategoryResponse {
  id: number;
  name: string;
  type: TransactionType;
  isCustom: boolean;
  includeInSavingsRate: boolean;
  includeInInvestmentRate: boolean;
}

export interface CategoryRequest {
  name: string;
  type: TransactionType;
  includeInSavingsRate?: boolean | null;
  includeInInvestmentRate?: boolean | null;
}

export interface CategoryAllocationRequest {
  includeInSavingsRate: boolean;
  includeInInvestmentRate: boolean;
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
  categoryArchived?: boolean;
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

export interface BudgetCopyItem {
  categoryId: number;
  categoryName: string;
  totalBudget: number;
  expectedExpense: number;
  selected: boolean;
  skipReason: 'DELETED_CATEGORY' | 'ALREADY_EXISTS' | null;
}

export interface BudgetCopyResponse {
  sourceYearMonth: string;
  targetYearMonth: string;
  items: BudgetCopyItem[];
  copyCount: number;
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

export interface AllocationBucketResponse {
  net: number;
  rate: number;
  inflow: number;
  outflow: number;
}

export interface MonthlyAllocationResponse {
  savings: AllocationBucketResponse;
  investment: AllocationBucketResponse;
}

export interface MonthlyAllocationSummaryResponse {
  yearMonth: string;
  totalIncome: number;
  savings: AllocationBucketResponse;
  investment: AllocationBucketResponse;
}

export interface GoalProgressResponse {
  accountId: number;
  accountName: string;
  role: AccountRole;
  currentBalance: number;
  goalAmount: number;
  progressPercent: number;
  goalDate: string | null;
  dDay: number | null;
}

export interface DashboardResponse {
  categoryExpenses: Record<string, number>;
  trends: MonthlyTrendResponse[];
  budgetStatus: BudgetStatusResponse;
  summary: SummaryResponse;
  allocation: MonthlyAllocationResponse;
  goalProgress: GoalProgressResponse[];
  totalAsset: number;
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

/** Comparison-common enums (backend {Budget,Expense,Income,Portfolio}CompareType) */
export type CompareType = 'AGE' | 'AMOUNT' | 'CATEGORY' | 'LOCATION';

/** Budget compare */
export interface PublicMonthlyBudgetResponse {
  userId: number;
  username: string;
  yearMonth: string;
  totalBudget: number;
}

export interface BudgetCompareResponse {
  type: CompareType;
  yearMonth: string;
  myAmount: number;
  averageAmount: number;
  sampleSize: number;
  difference: number;
}

export interface UserBudgetCompareResponse {
  type: CompareType;
  yearMonth: string;
  myUserId: number;
  myLabel: string;
  myAmount: number;
  targetUserId: number;
  targetLabel: string;
  targetAmount: number;
  difference: number;
}

export interface UserBudgetDetailResponse {
  userId: number;
  username: string;
  yearMonth: string;
  totalBudget: number;
  categoryBudgets: CategoryBudgetResponse[];
}

export interface PairBudgetDetailResponse {
  me: UserBudgetDetailResponse;
  target: UserBudgetDetailResponse;
}

/** Expense compare */
export interface PublicMonthlyExpenseResponse {
  userId: number;
  username: string;
  yearMonth: string;
  totalExpense: number;
  fixedExpense: number;
  variableExpense: number;
}

export interface ExpenseCompareResponse {
  type: CompareType;
  yearMonth: string;
  myAmount: number;
  myFixedAmount: number;
  myVariableAmount: number;
  averageAmount: number;
  averageFixedAmount: number;
  averageVariableAmount: number;
  sampleSize: number;
  difference: number;
}

export interface UserExpenseCompareResponse {
  type: CompareType;
  yearMonth: string;
  myUserId: number;
  myLabel: string;
  myAmount: number;
  myFixedAmount: number;
  myVariableAmount: number;
  targetUserId: number;
  targetLabel: string;
  targetAmount: number;
  targetFixedAmount: number;
  targetVariableAmount: number;
  difference: number;
}

export interface UserExpenseDetailResponse {
  userId: number;
  username: string;
  yearMonth: string;
  totalExpense: number;
  fixedExpense: number;
  variableExpense: number;
  fixedCategoryExpenses: CategoryAmountResponse[];
  variableCategoryExpenses: CategoryAmountResponse[];
}

export interface PairExpenseDetailResponse {
  me: UserExpenseDetailResponse;
  target: UserExpenseDetailResponse;
}

/** Income compare */
export interface PublicMonthlyIncomeResponse {
  userId: number;
  username: string;
  yearMonth: string;
  totalIncome: number;
  fixedIncome: number;
  variableIncome: number;
}

export interface IncomeCompareResponse {
  type: CompareType;
  yearMonth: string;
  myAmount: number;
  myFixedAmount: number;
  myVariableAmount: number;
  averageAmount: number;
  averageFixedAmount: number;
  averageVariableAmount: number;
  sampleSize: number;
  difference: number;
}

export interface UserIncomeCompareResponse {
  type: CompareType;
  yearMonth: string;
  myUserId: number;
  myLabel: string;
  myAmount: number;
  myFixedAmount: number;
  myVariableAmount: number;
  targetUserId: number;
  targetLabel: string;
  targetAmount: number;
  targetFixedAmount: number;
  targetVariableAmount: number;
  difference: number;
}

export interface UserIncomeDetailResponse {
  userId: number;
  username: string;
  yearMonth: string;
  totalIncome: number;
  fixedIncome: number;
  variableIncome: number;
  fixedCategoryIncomes: CategoryAmountResponse[];
  variableCategoryIncomes: CategoryAmountResponse[];
}

export interface PairIncomeDetailResponse {
  me: UserIncomeDetailResponse;
  target: UserIncomeDetailResponse;
}

/** Portfolio compare (composite) */
export interface PublicMonthlyPortfolioResponse {
  userId: number;
  username: string;
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  totalBudget: number;
  balance: number;
}

export interface PortfolioCompareResponse {
  type: CompareType;
  yearMonth: string;
  income: IncomeCompareResponse;
  expense: ExpenseCompareResponse;
  budget: BudgetCompareResponse;
}

export interface UserPortfolioCompareResponse {
  type: CompareType;
  yearMonth: string;
  income: UserIncomeCompareResponse;
  expense: UserExpenseCompareResponse;
  budget: UserBudgetCompareResponse;
}

export interface UserPortfolioDetailResponse {
  userId: number;
  username: string;
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  totalBudget: number;
  balance: number;
  income: UserIncomeDetailResponse;
  expense: UserExpenseDetailResponse;
  budget: UserBudgetDetailResponse;
}

export interface PairPortfolioDetailResponse {
  me: UserPortfolioDetailResponse;
  target: UserPortfolioDetailResponse;
}

/** User location (Redis GEO) */
export interface LocationResponse {
  userId: number;
  latitude: number;
  longitude: number;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}

export interface NearbyUserResponse {
  userId: number;
  latitude: number;
  longitude: number;
  distanceKm: number;
}
