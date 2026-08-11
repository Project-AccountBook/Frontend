import type { AccountKind, AccountResponse } from '../api/accountApi';
import type { GoalProgressResponse, MonthlyAllocationSummaryResponse } from '../api/types';

export type AccountRole = 'CHECKING' | 'SAVINGS' | 'INVESTMENT';

export interface GoalProgressItem {
  accountId: number;
  name: string;
  kind: AccountKind;
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
  CHECKING: '생활/입출금',
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

export function mapDashboardAllocation(
  allocation: {
    savings: { net: number; rate: number; inflow: number; outflow: number };
    investment: { net: number; rate: number; inflow: number; outflow: number };
  } | MonthlyAllocationSummaryResponse
): MonthlyAllocationSummary {
  const toBucket = (bucket: {
    net: number;
    rate: number;
    inflow: number;
    outflow: number;
  }): AllocationBucketSummary => ({
    net: Number(bucket.net),
    rate: Number(bucket.rate),
    inflow: Number(bucket.inflow),
    outflow: Number(bucket.outflow)
  });

  return {
    savings: toBucket(allocation.savings),
    investment: toBucket(allocation.investment)
  };
}

export function mapGoalProgressFromApi(
  items: GoalProgressResponse[],
  colors: string[]
): GoalProgressItem[] {
  return items.map((item, index) => {
    const role = normalizeAccountRole(item.role);
    return {
      accountId: item.accountId,
      name: item.accountName,
      kind: item.kind ?? 'ASSET',
      balance: Number(item.currentBalance),
      goalAmount: Number(item.goalAmount),
      progressPercent: Number(item.progressPercent),
      role,
      roleLabel: ACCOUNT_ROLE_LABELS[role],
      goalDate: item.goalDate,
      dDay: item.dDay,
      color: colors[index % colors.length]
    };
  });
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

/** 계좌 API 응답을 목표 진행 UI 모델로 변환 (대시보드 goalProgress fallback 등) */
export function mapGoalProgressFromAccounts(
  accounts: AccountResponse[],
  colors: string[]
): GoalProgressItem[] {
  const items: GoalProgressResponse[] = accounts
    .filter((account) => (account.kind ?? 'ASSET') !== 'CREDIT_CARD')
    .filter((account) => account.goalAmount != null
      && ((account.kind ?? 'ASSET') === 'LOAN' || account.goalAmount > 0))
    .map((account) => {
      const kind = account.kind ?? 'ASSET';
      const initialDebt = Math.max(0, Number(account.disbursedAmount) || 0);
      const currentDebt = Math.abs(Number(account.currentBalance));
      const targetDebt = Number(account.goalAmount);
      const debtProgress = initialDebt > targetDebt
        ? Math.min(100, Math.max(0, Math.round(
            ((initialDebt - currentDebt) / (initialDebt - targetDebt)) * 100
          )))
        : currentDebt <= targetDebt ? 100 : 0;
      return {
      accountId: account.id,
      accountName: account.accountName,
      kind,
      role: normalizeAccountRole(account.role),
      currentBalance: Number(account.currentBalance) || 0,
      goalAmount: Number(account.goalAmount),
      progressPercent:
        account.progressPercent != null
          ? account.progressPercent
          : kind === 'LOAN' ? debtProgress : Math.min(
              100,
              Math.round((Number(account.currentBalance) / Number(account.goalAmount)) * 100)
            ),
      goalDate: account.goalDate ?? null,
      dDay: calcDDay(account.goalDate ?? null)
      };
    });

  return mapGoalProgressFromApi(items, colors).sort(
    (a, b) => b.progressPercent - a.progressPercent
  );
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
