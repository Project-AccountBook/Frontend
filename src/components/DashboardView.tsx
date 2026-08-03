import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Coins,
  ShoppingBag
} from 'lucide-react';
import { getAccounts, type AccountResponse } from '../api/accountApi';
import { fetchAllUserTransactionsInRange, type TransactionResponse } from '../api/transactionApi';
import { budgetApi, dashboardApi, groupPurchaseApi, groupPurchaseCategoryApi, portfolioApi } from '../api';
import {
  mapGoalProgressFromAccounts,
  formatGoalDateLabel,
  mapDashboardAllocation,
  mapGoalProgressFromApi
} from '../lib/accountGoalStorage';
import type {
  BudgetResponse,
  BudgetSummaryResponse,
  CategoryAmountResponse,
  DashboardResponse,
  GroupPurchaseCategoryResponse,
  MyPortfolioResponse
} from '../api';
import { mapToDashboardGroupBuyItem, type DashboardGroupBuyItem } from '../lib/groupPurchaseDisplay';
import { MonthYearNavigator } from './MonthYearNavigator';

interface CategoryData {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface BudgetVsActualItem {
  categoryId: number;
  categoryName: string;
  categoryArchived?: boolean;
  planned: number;
  actual: number;
  remaining: number;
  progress: number;
  status: 'over' | 'warning' | 'ok';
}

interface MonthlyFlowRow {
  month: string;
  yearMonth: string;
  income: number;
  expense: number;
  savings: number;
}

interface DashboardViewProps {
  onViewAllGroupBuys?: () => void;
  onGoToGoalSettings?: () => void;
  onGoToBudget?: () => void;
}

const BUDGET_VS_ACTUAL_LIMIT = 5;
const BUDGET_WARNING_THRESHOLD = 85;

const DASHBOARD_GROUP_BUY_LIMIT = 3;
const MONTHLY_FLOW_CHART_SLOTS = 6;

const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f43f5e',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#64748b'
];

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number(value) || 0;
}

function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function shiftYearMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return formatYearMonth(d);
}

function formatMonthLabel(yearMonth: string): string {
  const [, m] = yearMonth.split('-').map(Number);
  return `${m}월`;
}

function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value));
}

function formatDiffLabel(diff: number): string {
  const sign = diff >= 0 ? '+' : '';
  return `전월 대비 ${sign}${formatKRW(diff)}원`;
}

function mergeCategoryAmounts(items: CategoryAmountResponse[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const amount = Math.abs(toNumber(item.amount));
    if (amount <= 0) continue;
    map.set(item.categoryName, (map.get(item.categoryName) ?? 0) + amount);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function mapToCategoryData(items: { name: string; value: number }[]): CategoryData[] {
  const total = items.reduce((acc, item) => acc + item.value, 0);
  if (total <= 0) return [];

  return items.map((item, index) => ({
    name: item.name,
    value: item.value,
    percent: Math.round((item.value / total) * 100),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }));
}

function mapExpensesToCategoryData(expenses: Record<string, number>): CategoryData[] {
  const items = Object.entries(expenses)
    .map(([name, value]) => ({ name, value: Math.abs(toNumber(value)) }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  return mapToCategoryData(items);
}

function buildTransferCategoryItems(transactions: TransactionResponse[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== 'TRANSFER') continue;
    const amount = Math.abs(toNumber(tx.amount));
    if (amount <= 0) continue;
    map.set(tx.categoryName, (map.get(tx.categoryName) ?? 0) + amount);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function formatCategoryDisplayName(name: string, archived?: boolean) {
  return archived ? `${name} (보관됨)` : name;
}

function mapBudgetVsActualItems(budgets: BudgetResponse[]): BudgetVsActualItem[] {
  return budgets
    .map((item) => {
      const planned = toNumber(item.totalPlannedBudget);
      const actual = toNumber(item.actualExpense);
      const remaining = toNumber(item.remainingBudget);
      const progress =
        item.progress != null
          ? Math.round(toNumber(item.progress))
          : planned > 0
            ? Math.round((actual / planned) * 100)
            : 0;
      const status: BudgetVsActualItem['status'] =
        remaining < 0 ? 'over' : progress >= BUDGET_WARNING_THRESHOLD ? 'warning' : 'ok';

      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        categoryArchived: item.categoryArchived,
        planned,
        actual,
        remaining,
        progress,
        status
      };
    })
    .filter((item) => item.planned > 0)
    .sort((a, b) => {
      if (a.status === 'over' && b.status !== 'over') return -1;
      if (a.status !== 'over' && b.status === 'over') return 1;
      if (a.status === 'over' && b.status === 'over') {
        return a.remaining - b.remaining;
      }
      return b.progress - a.progress;
    })
    .slice(0, BUDGET_VS_ACTUAL_LIMIT);
}

function budgetStatusLabel(status: BudgetVsActualItem['status']) {
  if (status === 'over') return '초과';
  if (status === 'warning') return '주의';
  return '여유';
}

function budgetStatusColor(status: BudgetVsActualItem['status']) {
  if (status === 'over') return 'var(--red)';
  if (status === 'warning') return '#ea580c';
  return 'var(--green)';
}

function budgetBarColor(status: BudgetVsActualItem['status']) {
  if (status === 'over') return 'var(--red)';
  if (status === 'warning') return '#f59e0b';
  return 'var(--blue)';
}

function buildMonthlyFlowRows(trends: DashboardResponse['trends']): MonthlyFlowRow[] {
  return trends.map((trend) => {
    const income = toNumber(trend.income);
    const expense = toNumber(trend.expense);
    const savings = Math.max(0, income - expense);
    return {
      month: formatMonthLabel(trend.yearMonth),
      yearMonth: trend.yearMonth,
      income,
      expense,
      savings
    };
  });
}

interface MonthlyFlowChartSlot {
  data: MonthlyFlowRow | null;
  dataIndex: number | null;
}

function buildMonthlyFlowChartSlots(rows: MonthlyFlowRow[]): MonthlyFlowChartSlot[] {
  return Array.from({ length: MONTHLY_FLOW_CHART_SLOTS }, (_, slotIndex) => ({
    data: rows[slotIndex] ?? null,
    dataIndex: rows[slotIndex] != null ? slotIndex : null
  }));
}

interface ChartTooltipItem {
  label: string;
  value: number;
  color: string;
}

interface ChartTooltipState {
  x: number;
  y: number;
  title: string;
  items: ChartTooltipItem[];
}

function formatFlowMonthLabel(row: MonthlyFlowRow): string {
  const [year] = row.yearMonth.split('-');
  return `${year}년 ${row.month}`;
}

function buildFlowTooltipItems(row: MonthlyFlowRow): ChartTooltipItem[] {
  return [
    { label: '수입', value: row.income, color: '#3b82f6' },
    { label: '지출', value: row.expense, color: '#f43f5e' },
    { label: '남은 금액', value: row.savings, color: '#10b981' }
  ];
}

function ChartHoverTooltip({ data }: { data: ChartTooltipState | null }) {
  if (!data) return null;

  return (
    <div
      className="chart-hover-tooltip"
      style={{ left: data.x, top: data.y }}
      role="tooltip"
    >
      <div className="chart-hover-tooltip-title">{data.title}</div>
      {data.items.map((item) => (
        <div key={item.label} className="chart-hover-tooltip-row">
          <span className="chart-hover-tooltip-dot" style={{ backgroundColor: item.color }} />
          <span className="chart-hover-tooltip-label">{item.label}</span>
          <span className="chart-hover-tooltip-value">{formatKRW(item.value)}원</span>
        </div>
      ))}
    </div>
  );
}

function showChartTooltip(
  container: HTMLDivElement | null,
  event: React.MouseEvent,
  title: string,
  items: ChartTooltipItem[],
  setTooltip: React.Dispatch<React.SetStateAction<ChartTooltipState | null>>
) {
  if (!container) return;
  const rect = container.getBoundingClientRect();
  setTooltip({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    title,
    items
  });
}

function buildFallbackDashboard(
  summary: BudgetSummaryResponse,
  portfolio: MyPortfolioResponse
): DashboardResponse {
  const categoryExpenses: Record<string, number> = {};
  for (const cat of [
    ...portfolio.expense.fixedCategoryExpenses,
    ...portfolio.expense.variableCategoryExpenses
  ]) {
    const amount = Math.abs(toNumber(cat.amount));
    if (amount <= 0) continue;
    categoryExpenses[cat.categoryName] = (categoryExpenses[cat.categoryName] ?? 0) + amount;
  }

  const emptyBucket = { net: 0, rate: 0, inflow: 0, outflow: 0 };

  return {
    categoryExpenses,
    trends: [],
    budgetStatus: {
      totalPlanned: toNumber(summary.totalPlannedBudgetSum),
      actualExpense: toNumber(summary.totalActualExpenseSum),
      remaining: toNumber(summary.totalRemainingBudget)
    },
    summary: { totalExpense: toNumber(summary.totalActualExpenseSum) },
    allocation: {
      savings: emptyBucket,
      investment: emptyBucket
    },
    goalProgress: [],
    totalAsset: 0
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onViewAllGroupBuys,
  onGoToGoalSettings,
  onGoToBudget
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState('지출');
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState<number | null>(null);
  const [mobileSection, setMobileSection] = useState<'analysis' | 'goals' | 'groupbuy'>('analysis');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [portfolio, setPortfolio] = useState<MyPortfolioResponse | null>(null);
  const [prevPortfolio, setPrevPortfolio] = useState<MyPortfolioResponse | null>(null);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetResponse[]>([]);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [chartTooltip, setChartTooltip] = useState<ChartTooltipState | null>(null);
  const [hoveredFlowIndex, setHoveredFlowIndex] = useState<number | null>(null);
  const [groupBuys, setGroupBuys] = useState<DashboardGroupBuyItem[]>([]);
  const [groupBuyLoading, setGroupBuyLoading] = useState(true);
  const [monthTransactions, setMonthTransactions] = useState<TransactionResponse[]>([]);
  const [monthlyAllocation, setMonthlyAllocation] = useState({
    savings: { net: 0, rate: 0, inflow: 0, outflow: 0 },
    investment: { net: 0, rate: 0, inflow: 0, outflow: 0 }
  });
  const barChartRef = useRef<HTMLDivElement>(null);

  const yearMonth = formatYearMonth(selectedDate);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setLoadWarning(null);
      setBudgetItems([]);

      const prevYm = shiftYearMonth(yearMonth, -1);

      try {
        const [y, m] = yearMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const monthStart = `${yearMonth}-01`;
        const monthEnd = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

        const [dashboardRes, portfolioRes, prevPortfolioRes, accounts, txPage, budgetStatusRes] =
          await Promise.all([
            dashboardApi.getDashboard(yearMonth),
            portfolioApi.getMyPortfolio(yearMonth),
            portfolioApi.getMyPortfolio(prevYm),
            getAccounts().catch(() => []),
            fetchAllUserTransactionsInRange(monthStart, monthEnd).catch(() => ({ content: [] })),
            budgetApi
              .getMonthlyStatus(yearMonth)
              .catch(() => ({ ok: false as const, status: 0, data: null, error: null }))
          ]);

        if (cancelled) return;

        if (!portfolioRes.ok || !portfolioRes.data) {
          const detail = portfolioRes.error ? ` (포트폴리오: ${portfolioRes.error})` : '';
          setError(`데이터를 불러오지 못했습니다.${detail}`);
          setLoading(false);
          return;
        }

        let dashboardData = dashboardRes.ok ? dashboardRes.data : null;

        if (!dashboardData) {
          const budgetRes = await budgetApi.getMonthlySummary(yearMonth);
          if (cancelled) return;

          if (budgetRes.ok && budgetRes.data) {
            dashboardData = buildFallbackDashboard(budgetRes.data, portfolioRes.data);
            setLoadWarning(
              dashboardRes.error
                ? `대시보드 API 오류로 일부 차트 데이터를 대체 표시합니다. (${dashboardRes.error})`
                : '대시보드 API를 불러오지 못해 일부 차트 데이터를 대체 표시합니다.'
            );
          } else {
            const detail = dashboardRes.error ? ` (${dashboardRes.error})` : '';
            setError(`대시보드 데이터를 불러오지 못했습니다.${detail}`);
            setLoading(false);
            return;
          }
        }

        setDashboard(dashboardData);
        setPortfolio(portfolioRes.data);
        setPrevPortfolio(prevPortfolioRes.ok ? prevPortfolioRes.data : null);
        setAccounts(accounts);
        setBudgetItems(budgetStatusRes.ok && budgetStatusRes.data ? budgetStatusRes.data : []);
        if (dashboardData.allocation) {
          setMonthlyAllocation(mapDashboardAllocation(dashboardData.allocation));
        }
        setMonthTransactions(
          txPage.content.map((tx) => ({
            ...tx,
            amount: Number(tx.amount),
            description: tx.description ?? ''
          }))
        );
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [yearMonth]);

  useEffect(() => {
    let cancelled = false;

    const loadGroupBuys = async () => {
      setGroupBuyLoading(true);

      try {
        const [categoryRes, purchaseRes] = await Promise.all([
          groupPurchaseCategoryApi.getAll(),
          groupPurchaseApi.getAll({ sortBy: 'deadline', nearMe: true })
        ]);

        if (cancelled) return;

        const categories: GroupPurchaseCategoryResponse[] =
          categoryRes.ok && categoryRes.data ? categoryRes.data : [];

        if (purchaseRes.ok && purchaseRes.data) {
          const mapped = purchaseRes.data
            .slice(0, DASHBOARD_GROUP_BUY_LIMIT)
            .map((item) => mapToDashboardGroupBuyItem(item, categories));
          setGroupBuys(mapped);
        } else {
          setGroupBuys([]);
        }
      } catch {
        if (!cancelled) {
          setGroupBuys([]);
        }
      } finally {
        if (!cancelled) {
          setGroupBuyLoading(false);
        }
      }
    };

    loadGroupBuys();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalIncome = toNumber(portfolio?.totalIncome);
  const totalExpense = toNumber(portfolio?.totalExpense);
  const prevIncome = toNumber(prevPortfolio?.totalIncome);
  const prevExpense = toNumber(prevPortfolio?.totalExpense);
  const incomeDiff = totalIncome - prevIncome;
  const expenseDiff = totalExpense - prevExpense;

  const budgetRemaining = toNumber(dashboard?.budgetStatus.remaining);
  const budgetPlanned = toNumber(dashboard?.budgetStatus.totalPlanned);

  const totalAsset = useMemo(() => {
    if (dashboard?.totalAsset != null) {
      return toNumber(dashboard.totalAsset);
    }
    return accounts.reduce((acc, account) => acc + toNumber(account.currentBalance), 0);
  }, [dashboard, accounts]);

  const goalProgressItems = useMemo(() => {
    if (dashboard?.goalProgress?.length) {
      return mapGoalProgressFromApi(dashboard.goalProgress, CATEGORY_COLORS);
    }
    return mapGoalProgressFromAccounts(accounts, CATEGORY_COLORS);
  }, [dashboard, accounts]);

  const accountBreakdown = useMemo(() => {
    const items = accounts
      .map((account) => ({
        id: account.id,
        name: account.accountName,
        balance: toNumber(account.currentBalance)
      }))
      .sort((a, b) => b.balance - a.balance);

    const total = items.reduce((acc, item) => acc + item.balance, 0);

    return items.map((item, index) => ({
      ...item,
      percent: total > 0 ? Math.round((item.balance / total) * 100) : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));
  }, [accounts]);

  const expenseCategoryItems = useMemo(() => {
    if (!portfolio) return [];
    return mergeCategoryAmounts([
      ...portfolio.expense.fixedCategoryExpenses,
      ...portfolio.expense.variableCategoryExpenses
    ]);
  }, [portfolio]);

  const incomeCategoryItems = useMemo(() => {
    if (!portfolio) return [];
    return mergeCategoryAmounts([
      ...portfolio.income.fixedCategoryIncomes,
      ...portfolio.income.variableCategoryIncomes
    ]);
  }, [portfolio]);

  const transferCategoryItems = useMemo(
    () => buildTransferCategoryItems(monthTransactions),
    [monthTransactions]
  );

  const categoryData = useMemo<Record<string, CategoryData[]>>(() => {
    const expenseFromDashboard = dashboard
      ? mapExpensesToCategoryData(dashboard.categoryExpenses)
      : mapToCategoryData(expenseCategoryItems);

    return {
      지출: expenseFromDashboard.length > 0 ? expenseFromDashboard : mapToCategoryData(expenseCategoryItems),
      수입: mapToCategoryData(incomeCategoryItems),
      이체: mapToCategoryData(transferCategoryItems)
    };
  }, [dashboard, expenseCategoryItems, incomeCategoryItems, transferCategoryItems]);

  const budgetVsActualItems = useMemo(
    () => mapBudgetVsActualItems(budgetItems),
    [budgetItems]
  );

  const overBudgetCount = useMemo(
    () => budgetItems.filter((item) => toNumber(item.totalPlannedBudget) > 0 && toNumber(item.remainingBudget) < 0).length,
    [budgetItems]
  );

  const monthlyFlowData = useMemo(
    () => buildMonthlyFlowRows(dashboard?.trends ?? []),
    [dashboard]
  );

  const monthlyFlowChartSlots = useMemo(
    () => buildMonthlyFlowChartSlots(monthlyFlowData),
    [monthlyFlowData]
  );

  const avgIncome = useMemo(() => {
    if (monthlyFlowData.length === 0) return 0;
    return monthlyFlowData.reduce((acc, row) => acc + row.income, 0) / monthlyFlowData.length;
  }, [monthlyFlowData]);

  const avgExpense = useMemo(() => {
    if (monthlyFlowData.length === 0) return 0;
    return monthlyFlowData.reduce((acc, row) => acc + row.expense, 0) / monthlyFlowData.length;
  }, [monthlyFlowData]);

  const barChartMax = useMemo(() => {
    const values = monthlyFlowData.flatMap((row) => [row.income, row.expense, row.savings]);
    const max = Math.max(...values, 1);
    return max * 1.1;
  }, [monthlyFlowData]);

  const handleFlowHover = (
    index: number,
    event: React.MouseEvent,
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => {
    const row = monthlyFlowData[index];
    if (!row) return;
    setHoveredFlowIndex(index);
    showChartTooltip(
      containerRef.current,
      event,
      formatFlowMonthLabel(row),
      buildFlowTooltipItems(row),
      setChartTooltip
    );
  };

  const clearChartTooltip = () => {
    setChartTooltip(null);
    setHoveredFlowIndex(null);
  };

  const currentCategoryData = categoryData[activeCategoryTab] ?? [];
  const totalAmount = currentCategoryData.reduce((acc, curr) => acc + curr.value, 0);

  let accumulatedPercent = 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        대시보드 데이터를 불러오는 중…
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in" style={{ padding: '48px', textAlign: 'center', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="fade-in dashboard-page">
      <div className="dashboard-view-header">
        <MonthYearNavigator date={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {loadWarning && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            fontSize: '13px'
          }}
        >
          {loadWarning}
        </div>
      )}

      <div className="dashboard-grid-4">
        <div className="card stat-card blue-theme">
          <div className="card-header-row">
            <span className="card-title">월 총 수입</span>
            <div className="icon-wrapper">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="stat-value">+{formatKRW(totalIncome)}</div>
          <div className={`stat-sub ${incomeDiff >= 0 ? 'up' : 'down'}`}>
            <span>{formatDiffLabel(incomeDiff)}</span>
          </div>
        </div>

        <div className="card stat-card red-theme">
          <div className="card-header-row">
            <span className="card-title">월 총 지출</span>
            <div className="icon-wrapper">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="stat-value">-{formatKRW(totalExpense)}</div>
          <div className={`stat-sub ${expenseDiff <= 0 ? 'up' : 'down'}`}>
            <span>{formatDiffLabel(expenseDiff)}</span>
          </div>
        </div>

        <div className="card stat-card purple-theme">
          <div className="card-header-row">
            <span className="card-title">가계부 예산 잔액</span>
            <div className="icon-wrapper">
              <Wallet size={20} />
            </div>
          </div>
          <div className="stat-value">{formatKRW(budgetRemaining)}</div>
          <div className="stat-label">월 예산: {formatKRW(budgetPlanned)}원</div>
        </div>

        <div className="card stat-card navy-theme">
          <div className="card-header-row">
            <span className="card-title">현재 종합 자산</span>
            <div className="icon-wrapper">
              <Coins size={20} />
            </div>
          </div>
          <div className="stat-value">{formatKRW(totalAsset)}</div>
          <div className="stat-label">계좌 잔액 합계</div>
        </div>
      </div>

      <div className="dashboard-body" data-mobile-section={mobileSection}>
        <nav className="dashboard-mobile-tabs" aria-label="대시보드 섹션">
          {(
            [
              { id: 'analysis' as const, label: '분석' },
              { id: 'goals' as const, label: '목표·자산' },
              { id: 'groupbuy' as const, label: '공동구매' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dashboard-mobile-tab ${mobileSection === tab.id ? 'active' : ''}`}
              onClick={() => setMobileSection(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

      <div className="dashboard-grid-3">
        <div className="dashboard-col dashboard-section dashboard-section--analysis">
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">카테고리 비율</span>
              <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
                {['수입', '지출', '이체'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveCategoryTab(tab);
                      setHoveredDonutSlice(null);
                    }}
                    className={`sub-tab-btn ${activeCategoryTab === tab ? 'active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {currentCategoryData.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                해당 기간의 {activeCategoryTab} 데이터가 없습니다.
              </div>
            ) : (
              <>
                <div className="donut-chart-container">
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    {currentCategoryData.map((slice, index) => {
                      const strokeDashoffset = circumference - (accumulatedPercent / 100) * circumference;
                      const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
                      const isHovered = hoveredDonutSlice === index;
                      accumulatedPercent += slice.percent;

                      return (
                        <circle
                          key={slice.name}
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth={isHovered ? 14 : 10}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="donut-segment"
                          transform="rotate(-90 50 50)"
                          onMouseEnter={() => setHoveredDonutSlice(index)}
                          onMouseLeave={() => setHoveredDonutSlice(null)}
                        />
                      );
                    })}
                  </svg>
                  <div className="donut-center-text">
                    <span className="donut-center-val">
                      {hoveredDonutSlice !== null
                        ? `${currentCategoryData[hoveredDonutSlice].percent}%`
                        : activeCategoryTab}
                    </span>
                    <span className="donut-center-lbl">
                      {hoveredDonutSlice !== null
                        ? currentCategoryData[hoveredDonutSlice].name
                        : `${formatKRW(totalAmount)}원`}
                    </span>
                  </div>
                </div>

                <div className="chart-legend">
                  {currentCategoryData.map((slice, index) => (
                    <div
                      key={slice.name}
                      className="legend-item"
                      style={{
                        backgroundColor: hoveredDonutSlice === index ? '#f1f5f9' : 'transparent',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={() => setHoveredDonutSlice(index)}
                      onMouseLeave={() => setHoveredDonutSlice(null)}
                    >
                      <div className="legend-dot-label">
                        <div className="legend-dot" style={{ backgroundColor: slice.color }} />
                        <span className="legend-name">{slice.name}</span>
                        <span className="legend-percent">{slice.percent}%</span>
                      </div>
                      <span className="legend-val">{formatKRW(slice.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-header-row">
              <span className="card-title">예산 현황</span>
              <span className="stat-label">
                {overBudgetCount > 0 ? `${overBudgetCount}개 초과` : '카테고리별 소진율'}
              </span>
            </div>

            {budgetVsActualItems.length === 0 ? (
              <div className="goal-empty-state">
                <p>이번 달 설정된 카테고리 예산이 없습니다.</p>
                <span className="goal-empty-hint">예산 관리에서 카테고리별 예산을 설정하면 소진율을 확인할 수 있습니다.</span>
                {onGoToBudget && (
                  <button type="button" className="btn-goal-settings-link" onClick={onGoToBudget}>
                    예산 설정하기
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="asset-progress-list budget-vs-list">
                  {budgetVsActualItems.map((item) => (
                    <div key={item.categoryId} className="asset-progress-item">
                      <div className="asset-progress-header">
                        <div className="budget-vs-title-row">
                          <span className="asset-progress-name">
                            {formatCategoryDisplayName(item.categoryName, item.categoryArchived)}
                          </span>
                          <span
                            className={`budget-vs-badge budget-vs-badge--${item.status}`}
                          >
                            {budgetStatusLabel(item.status)}
                          </span>
                        </div>
                        <span
                          className="asset-progress-val"
                          style={{ color: budgetStatusColor(item.status) }}
                        >
                          {item.progress}%
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.max(item.progress, item.actual > 0 ? 4 : 0))}%`,
                            backgroundColor: budgetBarColor(item.status)
                          }}
                        />
                      </div>
                      <div className="budget-vs-meta">
                        <span>
                          {formatKRW(item.actual)}원 / {formatKRW(item.planned)}원
                        </span>
                        <span style={{ color: budgetStatusColor(item.status) }}>
                          {item.status === 'over'
                            ? `${formatKRW(Math.abs(item.remaining))}원 초과`
                            : `${formatKRW(item.remaining)}원 남음`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {onGoToBudget && (
                  <button type="button" className="btn-goal-settings-link subtle" onClick={onGoToBudget}>
                    예산 관리 보기
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="dashboard-col dashboard-section dashboard-section--analysis">
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">월별 현금흐름 분석</span>
            </div>

            {monthlyFlowData.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                최근 6개월 추이 데이터가 없습니다.
              </div>
            ) : (
              <div className="bar-chart-card-content">
                <div className="bar-chart-stats">
                  <div className="bar-chart-stat-item">
                    <span className="bar-chart-stat-lbl">평균 수입금액</span>
                    <span className="bar-chart-stat-val blue-text">{formatKRW(avgIncome)}원</span>
                    <span className="stat-label" style={{ fontSize: '10px' }}>최근 {monthlyFlowData.length}개월 평균</span>
                  </div>
                  <div className="bar-chart-stat-item">
                    <span className="bar-chart-stat-lbl">평균 지출금액</span>
                    <span className="bar-chart-stat-val red-text">{formatKRW(avgExpense)}원</span>
                    <span className="stat-label" style={{ fontSize: '10px' }}>최근 {monthlyFlowData.length}개월 평균</span>
                  </div>
                </div>

                <div
                  className="svg-bar-chart-container"
                  ref={barChartRef}
                  onMouseLeave={clearChartTooltip}
                >
                  {monthlyFlowChartSlots.map((slot, slotIndex) => {
                    const data = slot.data;
                    const dataIndex = slot.dataIndex;
                    const isHovered = dataIndex !== null && hoveredFlowIndex === dataIndex;

                    if (!data || dataIndex === null) {
                      return (
                        <div
                          key={`empty-${slotIndex}`}
                          className="svg-bar-group is-empty"
                          aria-hidden="true"
                        >
                          <div className="svg-bar-bars" />
                          <span className="svg-bar-label" />
                        </div>
                      );
                    }

                    const incHeight = Math.max(5, (data.income / barChartMax) * 100);
                    const expHeight = Math.max(5, (data.expense / barChartMax) * 100);
                    const savHeight = Math.max(5, (data.savings / barChartMax) * 100);

                    return (
                      <div
                        key={data.yearMonth}
                        className={`svg-bar-group${isHovered ? ' is-hovered' : ''}`}
                        onMouseEnter={(event) => handleFlowHover(dataIndex, event, barChartRef)}
                        onMouseMove={(event) => handleFlowHover(dataIndex, event, barChartRef)}
                      >
                        <div className="svg-bar-bars">
                          <div className="svg-bar blue" style={{ height: `${incHeight}%` }} />
                          <div className="svg-bar green" style={{ height: `${savHeight}%` }} />
                          <div className="svg-bar red" style={{ height: `${expHeight}%` }} />
                        </div>
                        <span className="svg-bar-label">{data.month}</span>
                      </div>
                    );
                  })}
                  <ChartHoverTooltip data={chartTooltip} />
                </div>

                <div className="svg-bar-legend">
                  <div className="svg-bar-legend-item">
                    <div className="legend-dot" style={{ backgroundColor: '#3b82f6' }} />
                    <span>수입</span>
                  </div>
                  <div className="svg-bar-legend-item">
                    <div className="legend-dot" style={{ backgroundColor: '#10b981' }} />
                    <span>남은 금액</span>
                  </div>
                  <div className="svg-bar-legend-item">
                    <div className="legend-dot" style={{ backgroundColor: '#f43f5e' }} />
                    <span>지출</span>
                  </div>
                </div>
                <p className="trend-line-hint">막대 위에 마우스를 올리면 해당 월의 금액을 볼 수 있습니다.</p>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header-row">
              <span className="card-title">월별 내역 상세</span>
            </div>
            <div className="custom-table-container">
              <table className="custom-table dashboard-monthly-table">
                <thead>
                  <tr>
                    <th>월</th>
                    <th>수입</th>
                    <th>지출</th>
                    <th>남은 금액</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyFlowData.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>데이터 없음</td>
                    </tr>
                  ) : (
                    monthlyFlowData.map((row) => (
                      <tr key={row.yearMonth}>
                        <td style={{ fontWeight: '700' }}>{row.month}</td>
                        <td>{formatKRW(row.income)}</td>
                        <td>{formatKRW(row.expense)}</td>
                        <td style={{ color: '#10b981', fontWeight: '700' }}>{formatKRW(row.savings)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-col dashboard-section dashboard-section--goals">
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">목표 달성률</span>
              <div className="goal-rate-badges">
                <span className="goal-savings-rate-badge">
                  저축률 {monthlyAllocation.savings.rate.toFixed(1)}%
                </span>
                <span className="goal-investment-rate-badge">
                  투자율 {monthlyAllocation.investment.rate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="goal-summary-strip">
              <div className="goal-summary-item">
                <span className="goal-summary-label">순저축</span>
                <span className="goal-summary-value">{formatKRW(monthlyAllocation.savings.net)}원</span>
              </div>
              <div className="goal-summary-item">
                <span className="goal-summary-label">순투자</span>
                <span className="goal-summary-value">{formatKRW(monthlyAllocation.investment.net)}원</span>
              </div>
              <div className="goal-summary-item">
                <span className="goal-summary-label">월 수입</span>
                <span className="goal-summary-value muted">{formatKRW(totalIncome)}원</span>
              </div>
            </div>

            {goalProgressItems.length === 0 ? (
              <div className="goal-empty-state">
                <p>목표가 설정된 계좌가 없습니다.</p>
                <span className="goal-empty-hint">내역 및 자산 관리 &gt; 계좌 목표에서 설정할 수 있습니다.</span>
                {onGoToGoalSettings && (
                  <button type="button" className="btn-goal-settings-link" onClick={onGoToGoalSettings}>
                    계좌 목표 설정하기
                  </button>
                )}
              </div>
            ) : (
              <>
              <div className="asset-progress-list goal-progress-list">
                {goalProgressItems.map((goal) => (
                  <div key={goal.accountId} className="asset-progress-item">
                    <div className="asset-progress-header">
                      <div className="goal-progress-title-row">
                        <span className="asset-progress-name">{goal.name}</span>
                        <span className="goal-role-badge">{goal.roleLabel}</span>
                      </div>
                      <span className="asset-progress-val goal-progress-percent">
                        {goal.progressPercent}%
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.max(goal.progressPercent, goal.balance > 0 ? 4 : 0)}%`,
                          backgroundColor: goal.color
                        }}
                      />
                    </div>
                    <div className="goal-progress-meta">
                      <span>
                        {formatKRW(goal.balance)}원 / {formatKRW(goal.goalAmount)}원
                      </span>
                      {goal.goalDate && (
                        <span>
                          목표일 {formatGoalDateLabel(goal.goalDate)}
                          {goal.dDay != null && (
                            <span className={goal.dDay >= 0 ? 'goal-dday' : 'goal-dday overdue'}>
                              {goal.dDay >= 0 ? ` · D-${goal.dDay}` : ` · ${Math.abs(goal.dDay)}일 초과`}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {onGoToGoalSettings && (
                <button type="button" className="btn-goal-settings-link subtle" onClick={onGoToGoalSettings}>
                  계좌 목표 관리
                </button>
              )}
              </>
            )}
          </div>

          <div className="card">
            <div className="card-header-row">
              <span className="card-title">자산 현황</span>
              <span className="stat-label">계좌별 구성</span>
            </div>

            <div className="asset-summary-total">
              <div className="asset-summary-row">
                <span className="asset-summary-label">총 자산</span>
                <span className="asset-summary-value">{formatKRW(totalAsset)}원</span>
              </div>
              <span className="asset-summary-sub">등록 계좌 {accounts.length}개 기준</span>
            </div>

            {accounts.length === 0 ? (
              <div style={{ padding: '24px 0 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                등록된 계좌가 없습니다. 자산 메뉴에서 계좌를 추가해 주세요.
              </div>
            ) : (
              <div className="asset-progress-list asset-breakdown-list">
                {accountBreakdown.map((account) => (
                  <div key={account.id} className="asset-progress-item">
                    <div className="asset-progress-header">
                      <span className="asset-progress-name">{account.name}</span>
                      <span className="asset-progress-val">
                        {formatKRW(account.balance)}원 ({account.percent}%)
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.max(account.percent, account.balance > 0 ? 4 : 0)}%`,
                          backgroundColor: account.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card dashboard-section dashboard-section--groupbuy dashboard-groupbuy-card">
        <div className="card-header-row">
          <div className="dashboard-groupbuy-title-wrap">
            <div className="dashboard-groupbuy-icon">
              <ShoppingBag size={18} />
            </div>
            <span className="card-title">동네 공동구매 현황</span>
          </div>
          <button
            type="button"
            onClick={onViewAllGroupBuys}
            className="dashboard-groupbuy-more-btn"
          >
            <span>전체보기</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {groupBuyLoading ? (
          <div className="dashboard-empty-inline">
            공동구매 현황을 불러오는 중…
          </div>
        ) : groupBuys.length === 0 ? (
          <div className="dashboard-empty-inline">
            진행 중인 동네 공동구매가 없습니다.
          </div>
        ) : (
        <div className="group-buy-grid">
          {groupBuys.map((item) => (
            <div key={item.id} className="group-buy-card">
              <div className="group-buy-header">
                <span className="group-buy-category">{item.category}</span>
                <span className={`group-buy-status-badge ${item.statusType}`}>{item.status}</span>
              </div>
              <div className="group-buy-title">{item.title}</div>
              <div>
                <div className="group-buy-progress-row">
                  <span>목표 달성률</span>
                  <span className="percent">{item.progress}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, item.progress)}%`, backgroundColor: item.progressBarColor }} />
                </div>
              </div>
              <div className="group-buy-price-row">
                <span className="group-buy-price-lbl">공구 가격</span>
                <div className="group-buy-price-val">
                  {formatKRW(item.price)}
                  <span>원</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
      </div>
    </div>
  );
};
