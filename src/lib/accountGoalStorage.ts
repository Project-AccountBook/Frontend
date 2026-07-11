import type { AccountResponse } from '../api/accountApi';
import type { TransactionResponse } from '../api/transactionApi';

/** 백엔드 연동 전 프론트 프로토타입용 — localStorage에만 저장 */
export type AccountRole = 'CHECKING' | 'SAVINGS' | 'INVESTMENT';

export interface AccountGoalConfig {
  role: AccountRole;
  goalAmount: number | null;
  goalDate: string | null;
}

export interface GoalProgressItem {
  accountId: number;
  name: string;
  balance: number;
  goalAmount: number;
  progressPercent: number;
  role: AccountRole;
  roleLabel: string;
  goalDate: string | null;
  dDay: number | null;
  color: string;
}

export interface AllocationBucketSummary {
  net: number;
  rate: number;
  inflow: number;
  outflow: number;
}

export interface MonthlyAllocationSummary {
  savings: AllocationBucketSummary;
  investment: AllocationBucketSummary;
}

const ACCOUNT_GOALS_KEY = 'jointliving-account-goals-v1';
const TRANSFER_CATEGORY_FLAGS_KEY = 'jointliving-transfer-category-flags-v1';
const TRANSFER_INVESTMENT_FLAGS_KEY = 'jointliving-transfer-investment-flags-v1';

const DEFAULT_SAVINGS_CATEGORY_NAMES = ['적금', '비상금'];
const DEFAULT_INVESTMENT_CATEGORY_NAMES = ['투자'];

export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  CHECKING: '생활 · 입출금',
  SAVINGS: '저축',
  INVESTMENT: '투자'
};

export const ACCOUNT_ROLE_OPTIONS: { value: AccountRole; label: string }[] = [
  { value: 'CHECKING', label: ACCOUNT_ROLE_LABELS.CHECKING },
  { value: 'SAVINGS', label: ACCOUNT_ROLE_LABELS.SAVINGS },
  { value: 'INVESTMENT', label: ACCOUNT_ROLE_LABELS.INVESTMENT }
];

/** @deprecated EMERGENCY 등 legacy 값 정규화 */
export function normalizeAccountRole(role: string | AccountRole): AccountRole {
  if (role === 'INVESTMENT') return 'INVESTMENT';
  if (role === 'EMERGENCY' || role === 'SAVINGS') return 'SAVINGS';
  return 'CHECKING';
}

function loadAllAccountGoals(): Record<number, AccountGoalConfig> {
  try {
    const raw = localStorage.getItem(ACCOUNT_GOALS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<number, AccountGoalConfig & { role: string }>;
    const normalized: Record<number, AccountGoalConfig> = {};
    for (const [id, config] of Object.entries(parsed)) {
      normalized[Number(id)] = {
        ...config,
        role: normalizeAccountRole(config.role)
      };
    }
    return normalized;
  } catch {
    return {};
  }
}

function loadTransferCategoryFlags(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(TRANSFER_CATEGORY_FLAGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, boolean>;
  } catch {
    return {};
  }
}

function loadTransferInvestmentFlags(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(TRANSFER_INVESTMENT_FLAGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, boolean>;
  } catch {
    return {};
  }
}

export function inferRoleFromAccountName(name: string): AccountRole {
  const n = name.toLowerCase();
  if (['투자', '증권', '주식', '펀드', 'isa'].some((k) => n.includes(k))) return 'INVESTMENT';
  if (['비상', '비상금', '적금', '저축', '청약', '연금'].some((k) => n.includes(k))) return 'SAVINGS';
  return 'CHECKING';
}

export function getAccountGoalConfig(accountId: number, accountName?: string): AccountGoalConfig {
  const stored = loadAllAccountGoals()[accountId];
  if (stored) return stored;
  return {
    role: accountName ? inferRoleFromAccountName(accountName) : 'CHECKING',
    goalAmount: null,
    goalDate: null
  };
}

export function saveAccountGoalConfig(accountId: number, config: AccountGoalConfig): void {
  const all = loadAllAccountGoals();
  all[accountId] = {
    ...config,
    role: normalizeAccountRole(config.role)
  };
  localStorage.setItem(ACCOUNT_GOALS_KEY, JSON.stringify(all));
}

export function deleteAccountGoalConfig(accountId: number): void {
  const all = loadAllAccountGoals();
  delete all[accountId];
  localStorage.setItem(ACCOUNT_GOALS_KEY, JSON.stringify(all));
}

export function isCategoryIncludedInSavingsRate(categoryId: number, categoryName: string): boolean {
  const flags = loadTransferCategoryFlags();
  if (Object.prototype.hasOwnProperty.call(flags, categoryId)) {
    return flags[categoryId];
  }
  return DEFAULT_SAVINGS_CATEGORY_NAMES.some((name) => categoryName.includes(name));
}

export function isCategoryIncludedInInvestmentRate(categoryId: number, categoryName: string): boolean {
  const flags = loadTransferInvestmentFlags();
  if (Object.prototype.hasOwnProperty.call(flags, categoryId)) {
    return flags[categoryId];
  }
  return DEFAULT_INVESTMENT_CATEGORY_NAMES.some((name) => categoryName.includes(name));
}

export function saveTransferCategorySavingsFlag(categoryId: number, include: boolean): void {
  const flags = loadTransferCategoryFlags();
  flags[categoryId] = include;
  localStorage.setItem(TRANSFER_CATEGORY_FLAGS_KEY, JSON.stringify(flags));
}

export function saveTransferCategoryInvestmentFlag(categoryId: number, include: boolean): void {
  const flags = loadTransferInvestmentFlags();
  flags[categoryId] = include;
  localStorage.setItem(TRANSFER_INVESTMENT_FLAGS_KEY, JSON.stringify(flags));
}

export function getTransferCategorySavingsFlag(
  categoryId: number,
  categoryName: string
): boolean {
  return isCategoryIncludedInSavingsRate(categoryId, categoryName);
}

export function getTransferCategoryInvestmentFlag(
  categoryId: number,
  categoryName: string
): boolean {
  return isCategoryIncludedInInvestmentRate(categoryId, categoryName);
}

function getAccountRoleMap(accounts: AccountResponse[]): Map<number, AccountRole> {
  const map = new Map<number, AccountRole>();
  for (const account of accounts) {
    map.set(account.id, getAccountGoalConfig(account.id, account.accountName).role);
  }
  return map;
}

function buildBucketSummary(
  inflow: number,
  outflow: number,
  totalIncome: number
): AllocationBucketSummary {
  const net = inflow - outflow;
  const rate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;
  return { net, rate, inflow, outflow };
}

export function computeMonthlyAllocationSummary(
  transactions: TransactionResponse[],
  accounts: AccountResponse[],
  totalIncome: number
): MonthlyAllocationSummary {
  const roleMap = getAccountRoleMap(accounts);
  let savingsInflow = 0;
  let savingsOutflow = 0;
  let investmentInflow = 0;
  let investmentOutflow = 0;

  for (const tx of transactions) {
    if (tx.type !== 'TRANSFER') continue;

    const amount = Math.abs(Number(tx.amount));
    if (amount <= 0) continue;

    const sourceRole = roleMap.get(tx.accountId) ?? 'CHECKING';
    const targetRole =
      tx.targetAccountId != null
        ? roleMap.get(tx.targetAccountId) ?? 'CHECKING'
        : 'CHECKING';

    const savingsCategory = isCategoryIncludedInSavingsRate(tx.categoryId, tx.categoryName);
    const investmentCategory = isCategoryIncludedInInvestmentRate(tx.categoryId, tx.categoryName);

    if (targetRole === 'SAVINGS') {
      savingsInflow += amount;
    } else if (targetRole === 'INVESTMENT') {
      investmentInflow += amount;
    } else if (savingsCategory) {
      savingsInflow += amount;
    } else if (investmentCategory) {
      investmentInflow += amount;
    }

    if (sourceRole === 'SAVINGS') savingsOutflow += amount;
    if (sourceRole === 'INVESTMENT') investmentOutflow += amount;
  }

  return {
    savings: buildBucketSummary(savingsInflow, savingsOutflow, totalIncome),
    investment: buildBucketSummary(investmentInflow, investmentOutflow, totalIncome)
  };
}

/** @deprecated computeMonthlyAllocationSummary 사용 */
export function computeMonthlySavingsSummary(
  transactions: TransactionResponse[],
  accounts: AccountResponse[],
  totalIncome: number
) {
  const summary = computeMonthlyAllocationSummary(transactions, accounts, totalIncome);
  return {
    netSavings: summary.savings.net,
    savingsRate: summary.savings.rate,
    savingsInflow: summary.savings.inflow,
    savingsOutflow: summary.savings.outflow
  };
}

function calcDDay(goalDate: string | null): number | null {
  if (!goalDate) return null;
  const target = new Date(goalDate);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildGoalProgressItems(
  accounts: AccountResponse[],
  colors: string[]
): GoalProgressItem[] {
  const items: GoalProgressItem[] = [];

  accounts.forEach((account, index) => {
    const config = getAccountGoalConfig(account.id, account.accountName);
    if (config.goalAmount == null || config.goalAmount <= 0) return;

    const balance = Number(account.currentBalance) || 0;
    const progressPercent = Math.min(100, Math.round((balance / config.goalAmount) * 100));

    items.push({
      accountId: account.id,
      name: account.accountName,
      balance,
      goalAmount: config.goalAmount,
      progressPercent,
      role: config.role,
      roleLabel: ACCOUNT_ROLE_LABELS[config.role],
      goalDate: config.goalDate,
      dDay: calcDDay(config.goalDate),
      color: colors[index % colors.length]
    });
  });

  return items.sort((a, b) => b.progressPercent - a.progressPercent);
}

export function formatGoalDateLabel(goalDate: string | null): string | null {
  if (!goalDate) return null;
  const [y, m, d] = goalDate.split('-');
  if (!y || !m || !d) return null;
  return `${y}.${m}.${d}`;
}

export function isGoalEligibleRole(role: AccountRole): boolean {
  return role === 'SAVINGS' || role === 'INVESTMENT';
}
