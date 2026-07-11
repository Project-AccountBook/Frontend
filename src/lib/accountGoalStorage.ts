import type { AccountResponse } from '../api/accountApi';
import type { CategoryResponse } from '../api/types';
import type { TransactionResponse } from '../api/transactionApi';

export type AccountRole = 'CHECKING' | 'SAVINGS' | 'INVESTMENT';

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

export function normalizeAccountRole(role: string | AccountRole | null | undefined): AccountRole {
  if (role === 'INVESTMENT') return 'INVESTMENT';
  if (role === 'EMERGENCY' || role === 'SAVINGS') return 'SAVINGS';
  return 'CHECKING';
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

function getCategoryAllocationFlags(
  categories: CategoryResponse[],
  categoryId: number
): { savings: boolean; investment: boolean } {
  const category = categories.find((item) => item.id === categoryId);
  return {
    savings: category?.includeInSavingsRate ?? false,
    investment: category?.includeInInvestmentRate ?? false
  };
}

export function computeMonthlyAllocationSummary(
  transactions: TransactionResponse[],
  accounts: AccountResponse[],
  categories: CategoryResponse[],
  totalIncome: number
): MonthlyAllocationSummary {
  const roleMap = new Map<number, AccountRole>();
  for (const account of accounts) {
    roleMap.set(account.id, normalizeAccountRole(account.role));
  }

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
      tx.targetAccountId != null ? roleMap.get(tx.targetAccountId) ?? 'CHECKING' : 'CHECKING';
    const categoryFlags = getCategoryAllocationFlags(categories, tx.categoryId);

    if (targetRole === 'SAVINGS') {
      savingsInflow += amount;
    } else if (targetRole === 'INVESTMENT') {
      investmentInflow += amount;
    } else if (categoryFlags.savings) {
      savingsInflow += amount;
    } else if (categoryFlags.investment) {
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
    const goalAmount = account.goalAmount != null ? Number(account.goalAmount) : null;
    if (goalAmount == null || goalAmount <= 0) return;

    const balance = Number(account.currentBalance) || 0;
    const progressPercent =
      account.progressPercent != null
        ? account.progressPercent
        : Math.min(100, Math.round((balance / goalAmount) * 100));
    const role = normalizeAccountRole(account.role);

    items.push({
      accountId: account.id,
      name: account.accountName,
      balance,
      goalAmount,
      progressPercent,
      role,
      roleLabel: ACCOUNT_ROLE_LABELS[role],
      goalDate: account.goalDate ?? null,
      dDay: calcDDay(account.goalDate ?? null),
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
