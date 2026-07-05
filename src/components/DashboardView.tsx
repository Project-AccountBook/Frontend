import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Coins,
  ShoppingBag
} from 'lucide-react';
import { getAccounts } from '../api/accountApi';
import { budgetApi, dashboardApi, portfolioApi } from '../api';
import type {
  BudgetSummaryResponse,
  CategoryAmountResponse,
  DashboardResponse,
  MyPortfolioResponse
} from '../api';
import { MonthYearNavigator } from './MonthYearNavigator';

interface CategoryData {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface SubCategoryItem {
  name: string;
  percent: number;
  value: number;
  color: string;
}

interface MonthlyFlowRow {
  month: string;
  yearMonth: string;
  income: number;
  expense: number;
  savings: number;
  rate: string;
}

interface GroupBuyItem {
  id: number;
  category: string;
  status: string;
  statusType: 'blue' | 'red' | 'grey';
  title: string;
  progress: number;
  progressBarColor: string;
  price: number;
}

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

const SAVINGS_KEYWORDS = ['저축', '적금', '연금', '청약'];

/** 동네 공동구매 — 별도 도메인, 목업 유지 */
const GROUP_BUYS: GroupBuyItem[] = [
  {
    id: 1,
    category: '생활용품',
    status: '모집중 (D-2)',
    statusType: 'blue',
    title: '친환경 세탁세제 대용량 공구',
    progress: 125,
    progressBarColor: '#10b981',
    price: 15000
  },
  {
    id: 2,
    category: '식품',
    status: '마감임박 (D-1)',
    statusType: 'red',
    title: '제주 유기농 흑돼지 1kg',
    progress: 85,
    progressBarColor: '#3b82f6',
    price: 28000
  },
  {
    id: 3,
    category: '육아용품',
    status: '진행완료 (마감)',
    statusType: 'grey',
    title: '프리미엄 기저귀 박스떼기',
    progress: 100,
    progressBarColor: '#10b981',
    price: 45000
  }
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

function formatYearMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 소비분석표`;
}

function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value));
}

function formatCompactM(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return formatKRW(value);
}

function formatDiffLabel(diff: number): string {
  const sign = diff >= 0 ? '+' : '';
  return `전월 대비 ${sign}${formatKRW(diff)}원`;
}

function formatPercentChange(current: number, previous: number): string | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
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

function buildSavingsCategories(
  expenseItems: { name: string; value: number }[],
  netSavings: number
): CategoryData[] {
  const savingsItems = expenseItems.filter((item) =>
    SAVINGS_KEYWORDS.some((keyword) => item.name.includes(keyword))
  );
  if (savingsItems.length > 0) return mapToCategoryData(savingsItems);
  if (netSavings > 0) {
    return [{ name: '순저축', value: netSavings, percent: 100, color: '#10b981' }];
  }
  return [];
}

function buildMonthlyFlowRows(trends: DashboardResponse['trends']): MonthlyFlowRow[] {
  return trends.map((trend) => {
    const income = toNumber(trend.income);
    const expense = toNumber(trend.expense);
    const savings = Math.max(0, income - expense);
    const rate = income > 0 ? `${((savings / income) * 100).toFixed(1)}%` : '0%';
    return {
      month: formatMonthLabel(trend.yearMonth),
      yearMonth: trend.yearMonth,
      income,
      expense,
      savings,
      rate
    };
  });
}

function buildTrendPath(values: number[], width = 120, height = 40, padding = 10): string {
  if (values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = padding + (height - padding * 2) * (1 - (value - min) / range);
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ');
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

  return {
    categoryExpenses,
    trends: [],
    budgetStatus: {
      totalPlanned: toNumber(summary.totalPlannedBudgetSum),
      actualExpense: toNumber(summary.totalActualExpenseSum),
      remaining: toNumber(summary.totalRemainingBudget)
    },
    summary: { totalExpense: toNumber(summary.totalActualExpenseSum) }
  };
}

export const DashboardView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('대시보드');
  const [activeCategoryTab, setActiveCategoryTab] = useState('지출');
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState<number | null>(null);
  const [hoveredSubSlice, setHoveredSubSlice] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [portfolio, setPortfolio] = useState<MyPortfolioResponse | null>(null);
  const [prevPortfolio, setPrevPortfolio] = useState<MyPortfolioResponse | null>(null);
  const [totalAsset, setTotalAsset] = useState(0);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);

  const yearMonth = formatYearMonth(selectedDate);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setLoadWarning(null);

      const prevYm = shiftYearMonth(yearMonth, -1);

      try {
        const [dashboardRes, portfolioRes, prevPortfolioRes, accounts] = await Promise.all([
          dashboardApi.getDashboard(yearMonth),
          portfolioApi.getMyPortfolio(yearMonth),
          portfolioApi.getMyPortfolio(prevYm),
          getAccounts().catch(() => [])
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

        const assetSum = accounts.reduce(
          (acc, account) => acc + toNumber(account.currentBalance),
          0
        );
        setTotalAsset(assetSum);
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

  const totalIncome = toNumber(portfolio?.totalIncome);
  const totalExpense = toNumber(portfolio?.totalExpense);
  const prevIncome = toNumber(prevPortfolio?.totalIncome);
  const prevExpense = toNumber(prevPortfolio?.totalExpense);
  const incomeDiff = totalIncome - prevIncome;
  const expenseDiff = totalExpense - prevExpense;
  const netSavings = Math.max(0, totalIncome - totalExpense);

  const budgetRemaining = toNumber(dashboard?.budgetStatus.remaining);
  const budgetPlanned = toNumber(dashboard?.budgetStatus.totalPlanned);

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

  const categoryData = useMemo<Record<string, CategoryData[]>>(() => {
    const expenseFromDashboard = dashboard
      ? mapExpensesToCategoryData(dashboard.categoryExpenses)
      : mapToCategoryData(expenseCategoryItems);

    return {
      지출: expenseFromDashboard.length > 0 ? expenseFromDashboard : mapToCategoryData(expenseCategoryItems),
      수입: mapToCategoryData(incomeCategoryItems),
      저축: buildSavingsCategories(expenseCategoryItems, netSavings)
    };
  }, [dashboard, expenseCategoryItems, incomeCategoryItems, netSavings]);

  const subCategories: SubCategoryItem[] = useMemo(() => {
    const topFive = dashboard?.categoryExpenses
      ? Object.entries(dashboard.categoryExpenses)
          .map(([name, value]) => ({ name, value: Math.abs(toNumber(value)) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      : expenseCategoryItems.slice(0, 5);

    const total = topFive.reduce((acc, item) => acc + item.value, 0);
    if (total <= 0) return [];

    return topFive.map((item, index) => ({
      name: item.name,
      percent: Math.round((item.value / total) * 100),
      value: item.value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));
  }, [dashboard, expenseCategoryItems]);

  const monthlyFlowData = useMemo(
    () => buildMonthlyFlowRows(dashboard?.trends ?? []),
    [dashboard]
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

  const trendIncomePath = buildTrendPath(monthlyFlowData.map((row) => row.income));
  const trendSavingsPath = buildTrendPath(monthlyFlowData.map((row) => row.savings));
  const trendExpensePath = buildTrendPath(monthlyFlowData.map((row) => row.expense));

  const currentCategoryData = categoryData[activeCategoryTab] ?? [];
  const totalAmount = currentCategoryData.reduce((acc, curr) => acc + curr.value, 0);

  let accumulatedPercent = 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  const totalSubVal = subCategories.reduce((acc, curr) => acc + curr.value, 0);
  let accumulatedSubPercent = 0;

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
    <div className="fade-in">
      <div className="dashboard-view-header">
        <div className="dashboard-view-tabs">
          {['대시보드', '소비 분석', '예산 관리', '자산 포트폴리오', '이웃 자산 비교'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`dashboard-tab-btn ${activeSubTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <MonthYearNavigator date={selectedDate} onDateChange={setSelectedDate} />
      </div>

      <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>
        {formatYearMonthLabel(selectedDate)}
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

      <div className="dashboard-grid-3">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">카테고리 비율</span>
              <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
                {['수입', '지출', '저축'].map((tab) => (
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
              <span className="card-title">지출 카테고리 상세 (상위 5개)</span>
            </div>

            {subCategories.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                지출 카테고리 데이터가 없습니다.
              </div>
            ) : (
              <>
                <div className="donut-chart-container">
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    {subCategories.map((slice, index) => {
                      const sliceRatio = slice.value / totalSubVal;
                      const strokeDashoffset = circumference - (accumulatedSubPercent / 100) * circumference;
                      const strokeDasharray = `${sliceRatio * circumference} ${circumference}`;
                      const isHovered = hoveredSubSlice === index;
                      accumulatedSubPercent += sliceRatio * 100;

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
                          onMouseEnter={() => setHoveredSubSlice(index)}
                          onMouseLeave={() => setHoveredSubSlice(null)}
                        />
                      );
                    })}
                  </svg>
                  <div className="donut-center-text">
                    <span className="donut-center-val" style={{ fontSize: '18px' }}>
                      {hoveredSubSlice !== null ? `${subCategories[hoveredSubSlice].percent}%` : '카테고리'}
                    </span>
                    <span className="donut-center-lbl" style={{ fontSize: '10px' }}>
                      {hoveredSubSlice !== null ? subCategories[hoveredSubSlice].name : '상위 5개 항목'}
                    </span>
                  </div>
                </div>

                <div className="chart-legend" style={{ marginTop: '16px' }}>
                  {subCategories.map((slice, index) => (
                    <div
                      key={slice.name}
                      className="legend-item"
                      style={{
                        backgroundColor: hoveredSubSlice === index ? '#f1f5f9' : 'transparent',
                        padding: '6px 10px'
                      }}
                      onMouseEnter={() => setHoveredSubSlice(index)}
                      onMouseLeave={() => setHoveredSubSlice(null)}
                    >
                      <div className="legend-dot-label">
                        <div className="legend-dot" style={{ backgroundColor: slice.color }} />
                        <span className="legend-name" style={{ fontSize: '12px' }}>{slice.name}</span>
                        <span className="legend-percent" style={{ fontSize: '12px' }}>{slice.percent}%</span>
                      </div>
                      <span className="legend-val" style={{ fontSize: '12px' }}>{formatKRW(slice.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

                <div className="svg-bar-chart-container">
                  {monthlyFlowData.map((data) => {
                    const incHeight = Math.max(5, (data.income / barChartMax) * 100);
                    const expHeight = Math.max(5, (data.expense / barChartMax) * 100);
                    const savHeight = Math.max(5, (data.savings / barChartMax) * 100);

                    return (
                      <div key={data.yearMonth} className="svg-bar-group">
                        <div className="svg-bar-bars">
                          <div className="svg-bar blue" style={{ height: `${incHeight}%` }} title={`수입: ${formatKRW(data.income)}원`} />
                          <div className="svg-bar green" style={{ height: `${savHeight}%` }} title={`저축: ${formatKRW(data.savings)}원`} />
                          <div className="svg-bar red" style={{ height: `${expHeight}%` }} title={`지출: ${formatKRW(data.expense)}원`} />
                        </div>
                        <span className="svg-bar-label">{data.month}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="svg-bar-legend">
                  <div className="svg-bar-legend-item">
                    <div className="legend-dot" style={{ backgroundColor: '#3b82f6' }} />
                    <span>수입</span>
                  </div>
                  <div className="svg-bar-legend-item">
                    <div className="legend-dot" style={{ backgroundColor: '#10b981' }} />
                    <span>저축</span>
                  </div>
                  <div className="svg-bar-legend-item">
                    <div className="legend-dot" style={{ backgroundColor: '#f43f5e' }} />
                    <span>지출</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header-row">
              <span className="card-title">월별 내역 상세</span>
            </div>
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>월</th>
                    <th>수입</th>
                    <th>지출</th>
                    <th>저축</th>
                    <th>저축률</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyFlowData.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>데이터 없음</td>
                    </tr>
                  ) : (
                    monthlyFlowData.map((row) => (
                      <tr key={row.yearMonth}>
                        <td style={{ fontWeight: '700' }}>{row.month}</td>
                        <td>{formatKRW(row.income)}</td>
                        <td>{formatKRW(row.expense)}</td>
                        <td style={{ color: '#10b981', fontWeight: '700' }}>{formatKRW(row.savings)}</td>
                        <td>{row.rate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">월흐름 추세</span>
              <span className="stat-label">최근 {monthlyFlowData.length}개월</span>
            </div>

            {monthlyFlowData.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                추세 데이터가 없습니다.
              </div>
            ) : (
              <>
                <div className="trend-line-container">
                  <svg viewBox="0 0 120 40" width="100%" height="100%">
                    <line x1="0" y1="10" x2="120" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
                    <line x1="0" y1="20" x2="120" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                    <line x1="0" y1="30" x2="120" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
                    {trendIncomePath && <path d={trendIncomePath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />}
                    {trendSavingsPath && <path d={trendSavingsPath} fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />}
                    {trendExpensePath && <path d={trendExpensePath} fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2,2" />}
                  </svg>
                </div>
                <div className="trend-info-grid">
                  <div className="trend-info-card">
                    <span className="trend-info-lbl">총 자산</span>
                    <div className="trend-info-val">{formatKRW(totalAsset)}원</div>
                  </div>
                  <div className="trend-info-card">
                    <span className="trend-info-lbl">이달 저축</span>
                    <div className="trend-info-val">{formatKRW(netSavings)}원</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-header-row">
              <span className="card-title">상세 내역</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>전월 대비 수입</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: incomeDiff >= 0 ? '#10b981' : '#ef4444', background: incomeDiff >= 0 ? '#ecfdf5' : '#fef2f2', padding: '4px 10px', borderRadius: '20px' }}>
                  {formatPercentChange(totalIncome, prevIncome) ?? '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>전월 대비 지출</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: expenseDiff <= 0 ? '#10b981' : '#ef4444', background: expenseDiff <= 0 ? '#ecfdf5' : '#fef2f2', padding: '4px 10px', borderRadius: '20px' }}>
                  {formatPercentChange(totalExpense, prevExpense) ?? '—'}
                </span>
              </div>
            </div>

            <span className="card-title" style={{ fontSize: '14px', display: 'block', marginBottom: '16px' }}>자산 현황</span>
            <div className="asset-progress-list" style={{ marginTop: 0 }}>
              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">총 자산 (계좌 합계)</span>
                  <span className="asset-progress-val">{formatCompactM(totalAsset)} (100%)</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: '100%', backgroundColor: '#3b82f6' }} />
                </div>
              </div>
              {totalAsset === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  등록된 계좌가 없습니다. 자산 메뉴에서 계좌를 추가해 주세요.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
            </div>
            <span className="card-title">동네 공동구매 현황</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', background: '#f8fafc', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px' }}>
            <span>전체보기</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="group-buy-grid">
          {GROUP_BUYS.map((item) => (
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
      </div>
    </div>
  );
};
