import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  Construction,
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  MapPin,
} from 'lucide-react';
import {
  budgetCompareApi,
  expenseCompareApi,
  incomeCompareApi,
  locationApi,
  portfolioApi,
  portfolioCompareApi,
  userApi,
} from '../api';
import type {
  BudgetCompareResponse,
  CategoryAmountResponse,
  CategoryBudgetResponse,
  ExpenseCompareResponse,
  IncomeCompareResponse,
  MyBudgetResponse,
  MyExpenseResponse,
  MyIncomeResponse,
  MyPortfolioResponse,
  NearbyUserResponse,
  PairBudgetDetailResponse,
  PairExpenseDetailResponse,
  PairIncomeDetailResponse,
  PairPortfolioDetailResponse,
  PublicMonthlyBudgetResponse,
  PublicMonthlyExpenseResponse,
  PublicMonthlyIncomeResponse,
  PublicMonthlyPortfolioResponse,
} from '../api/types';
import type { CompareType as ApiCompareType } from '../api/types';

type MetricKey = 'budget' | 'expense' | 'income';
type MainTab = MetricKey | 'overall';
type CompareType = 'AGE' | 'AMOUNT' | 'CATEGORY';

interface CategoryItem {
  categoryId: number;
  categoryName: string;
  amount: number;
  color: string;
}

interface MyMetric {
  yearMonth: string;
  total: number;
  categories: CategoryItem[];
}

interface PublicUserMetric {
  userId: number;
  username: string;
  yearMonth: string;
  total: number;
  distanceKm?: number;
}

interface MetricConfig {
  key: MetricKey;
  label: string;
  verbPositive: string;
  verbNegative: string;
  themeClass: 'blue-theme' | 'red-theme' | 'purple-theme' | 'navy-theme';
  accentColor: string;
}

const formatKRW = (value: number) => new Intl.NumberFormat('ko-KR').format(value);
const formatMan = (value: number) =>
  `${Math.round(value / 10000).toLocaleString('ko-KR')}만`;

const mainTabs: { id: MainTab; label: string }[] = [
  { id: 'budget', label: '예산' },
  { id: 'expense', label: '지출' },
  { id: 'income', label: '수입' },
  { id: 'overall', label: '종합 비교' },
];

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4'];
const colorFor = (idx: number) => CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

const METRIC_CONFIGS: Record<MetricKey, MetricConfig> = {
  budget: {
    key: 'budget',
    label: '예산',
    verbPositive: '많이 책정',
    verbNegative: '적게 책정',
    themeClass: 'blue-theme',
    accentColor: '#3b82f6',
  },
  expense: {
    key: 'expense',
    label: '지출',
    verbPositive: '많이 지출',
    verbNegative: '적게 지출',
    themeClass: 'red-theme',
    accentColor: '#f43f5e',
  },
  income: {
    key: 'income',
    label: '수입',
    verbPositive: '많이 벌었어요',
    verbNegative: '적게 벌었어요',
    themeClass: 'purple-theme',
    accentColor: '#10b981',
  },
};

const metricIcon: Record<MetricKey, React.ReactNode> = {
  budget: <Wallet size={20} />,
  expense: <ArrowDownRight size={20} />,
  income: <ArrowUpRight size={20} />,
};

const budgetToMy = (r: MyBudgetResponse): MyMetric => ({
  yearMonth: r.yearMonth,
  total: r.totalBudget,
  categories: r.categoryBudgets.map((c, i) => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    amount: c.totalBudget,
    color: colorFor(i),
  })),
});

const expenseToMy = (r: MyExpenseResponse): MyMetric => {
  const items: CategoryAmountResponse[] = [
    ...r.fixedCategoryExpenses,
    ...r.variableCategoryExpenses,
  ];
  return {
    yearMonth: r.yearMonth,
    total: r.totalExpense,
    categories: items.map((c, i) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      amount: c.amount,
      color: colorFor(i),
    })),
  };
};

const incomeToMy = (r: MyIncomeResponse): MyMetric => {
  const items: CategoryAmountResponse[] = [
    ...r.fixedCategoryIncomes,
    ...r.variableCategoryIncomes,
  ];
  return {
    yearMonth: r.yearMonth,
    total: r.totalIncome,
    categories: items.map((c, i) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      amount: c.amount,
      color: colorFor(i),
    })),
  };
};

const toPublicUserMetric = <
  T extends { userId: number; username: string; yearMonth: string }
>(
  list: T[],
  totalOf: (r: T) => number,
  distanceMap: Map<number, number> | null
): PublicUserMetric[] => {
  const base = list.map((u) => ({
    userId: u.userId,
    username: u.username,
    yearMonth: u.yearMonth,
    total: totalOf(u),
    distanceKm: distanceMap?.get(u.userId),
  }));
  return distanceMap
    ? base.filter((u) => u.distanceKm !== undefined)
    : base;
};

const budgetDetailToCategories = (
  categoryBudgets: CategoryBudgetResponse[]
): CategoryItem[] =>
  categoryBudgets.map((c, i) => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    amount: c.totalBudget,
    color: colorFor(i),
  }));

const flatDetailToCategories = (
  fixed: CategoryAmountResponse[],
  variable: CategoryAmountResponse[]
): CategoryItem[] =>
  [...fixed, ...variable].map((c, i) => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    amount: c.amount,
    color: colorFor(i),
  }));

interface ComparisonViewProps {
  initialLocationMode?: boolean;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  initialLocationMode = false,
}) => {
  const [locationMode, setLocationMode] = useState<boolean>(initialLocationMode);
  const [mainTab, setMainTab] = useState<MainTab>('budget');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(20000000);
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [compareType, setCompareType] = useState<CompareType>('AGE');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pairCompareType, setPairCompareType] = useState<CompareType>('AGE');
  const [pairCategoryId, setPairCategoryId] = useState<number | null>(null);
  const [overallFilterMetric, setOverallFilterMetric] = useState<MetricKey>('budget');

  const [myPortfolio, setMyPortfolio] = useState<MyPortfolioResponse | null>(null);
  const [publicBudget, setPublicBudget] = useState<PublicMonthlyBudgetResponse[]>([]);
  const [publicExpense, setPublicExpense] = useState<PublicMonthlyExpenseResponse[]>([]);
  const [publicIncome, setPublicIncome] = useState<PublicMonthlyIncomeResponse[]>([]);
  const [publicPortfolio, setPublicPortfolio] = useState<PublicMonthlyPortfolioResponse[]>(
    []
  );
  const [nearby, setNearby] = useState<NearbyUserResponse[]>([]);
  const [locationMissing, setLocationMissing] = useState<boolean>(false);
  const [compareBudget, setCompareBudget] = useState<BudgetCompareResponse | null>(null);
  const [compareExpense, setCompareExpense] = useState<ExpenseCompareResponse | null>(null);
  const [compareIncome, setCompareIncome] = useState<IncomeCompareResponse | null>(null);
  const [pairBudget, setPairBudget] = useState<PairBudgetDetailResponse | null>(null);
  const [pairExpense, setPairExpense] = useState<PairExpenseDetailResponse | null>(null);
  const [pairIncome, setPairIncome] = useState<PairIncomeDetailResponse | null>(null);
  const [pairPortfolio, setPairPortfolio] = useState<PairPortfolioDetailResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    userApi.getMyProfile().then((res) => {
      if (!cancelled && res.ok && res.data) setMyUserId(res.data.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  const activeMetric: MetricKey | null =
    mainTab === 'overall' ? null : (mainTab as MetricKey);

  const myBudget = useMemo<MyMetric | null>(
    () => (myPortfolio ? budgetToMy(myPortfolio.budget) : null),
    [myPortfolio]
  );
  const myExpense = useMemo<MyMetric | null>(
    () => (myPortfolio ? expenseToMy(myPortfolio.expense) : null),
    [myPortfolio]
  );
  const myIncome = useMemo<MyMetric | null>(
    () => (myPortfolio ? incomeToMy(myPortfolio.income) : null),
    [myPortfolio]
  );
  const myByKey = useCallback(
    (key: MetricKey): MyMetric | null =>
      key === 'budget' ? myBudget : key === 'expense' ? myExpense : myIncome,
    [myBudget, myExpense, myIncome]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    portfolioApi.getMyPortfolio(yearMonth).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        setMyPortfolio(res.data);
      } else {
        setMyPortfolio(null);
        setError(res.error ?? '내 포트폴리오를 불러올 수 없습니다.');
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [yearMonth]);

  useEffect(() => {
    if (!locationMode) {
      setNearby([]);
      setLocationMissing(false);
      return;
    }
    let cancelled = false;
    locationApi.nearby(radiusKm).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        setNearby(res.data);
        setLocationMissing(false);
      } else {
        setNearby([]);
        setLocationMissing(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locationMode, radiusKm]);

  useEffect(() => {
    let cancelled = false;
    const amountFilter = locationMode
      ? { year, month }
      : { year, month, minAmount, maxAmount };
    const portfolioFilter = locationMode
      ? { year, month }
      : { year, month, minBudget: minAmount, maxBudget: maxAmount };
    Promise.all([
      budgetCompareApi.users(amountFilter),
      expenseCompareApi.users(amountFilter),
      incomeCompareApi.users(amountFilter),
      portfolioCompareApi.users(portfolioFilter),
    ]).then(([b, e, i, p]) => {
      if (cancelled) return;
      setPublicBudget(b.data ?? []);
      setPublicExpense(e.data ?? []);
      setPublicIncome(i.data ?? []);
      setPublicPortfolio(p.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [year, month, minAmount, maxAmount, locationMode]);

  const distanceMap = useMemo(() => {
    if (!locationMode) return null;
    const map = new Map<number, number>();
    nearby.forEach((n) => map.set(n.userId, n.distanceKm));
    return map;
  }, [locationMode, nearby]);

  const budgetUsers = useMemo(
    () => toPublicUserMetric(publicBudget, (r) => r.totalBudget, distanceMap),
    [publicBudget, distanceMap]
  );
  const expenseUsers = useMemo(
    () => toPublicUserMetric(publicExpense, (r) => r.totalExpense, distanceMap),
    [publicExpense, distanceMap]
  );
  const incomeUsers = useMemo(
    () => toPublicUserMetric(publicIncome, (r) => r.totalIncome, distanceMap),
    [publicIncome, distanceMap]
  );
  const overallUsers = useMemo(() => {
    if (!distanceMap) {
      return publicPortfolio.map((u) => ({ ...u, distanceKm: undefined as number | undefined }));
    }
    return publicPortfolio
      .filter((u) => distanceMap.has(u.userId))
      .map((u) => ({ ...u, distanceKm: distanceMap.get(u.userId) }));
  }, [publicPortfolio, distanceMap]);

  useEffect(() => {
    if (!activeMetric) return;
    let cancelled = false;
    const categoryId =
      compareType === 'CATEGORY' && selectedCategoryId != null
        ? selectedCategoryId
        : undefined;
    const effectiveType: ApiCompareType =
      locationMode && compareType === 'AMOUNT' ? 'LOCATION' : compareType;
    const compareFilter = locationMode
      ? {
          type: effectiveType,
          yearMonth,
          categoryId,
          radiusKm,
        }
      : {
          type: compareType,
          yearMonth,
          categoryId,
          minAmount,
          maxAmount,
        };
    const run = async () => {
      if (activeMetric === 'budget') {
        const res = await budgetCompareApi.compare(compareFilter);
        if (!cancelled) setCompareBudget(res.data);
      } else if (activeMetric === 'expense') {
        const res = await expenseCompareApi.compare(compareFilter);
        if (!cancelled) setCompareExpense(res.data);
      } else {
        const res = await incomeCompareApi.compare(compareFilter);
        if (!cancelled) setCompareIncome(res.data);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    activeMetric,
    compareType,
    selectedCategoryId,
    yearMonth,
    minAmount,
    maxAmount,
    locationMode,
    radiusKm,
  ]);

  useEffect(() => {
    if (selectedUserId == null) {
      setPairBudget(null);
      setPairExpense(null);
      setPairIncome(null);
      setPairPortfolio(null);
      return;
    }
    let cancelled = false;
    if (mainTab === 'overall') {
      portfolioCompareApi.userDetails(selectedUserId, yearMonth).then((res) => {
        if (!cancelled) setPairPortfolio(res.data);
      });
    } else if (mainTab === 'budget') {
      budgetCompareApi.userDetails(selectedUserId, yearMonth).then((res) => {
        if (!cancelled) setPairBudget(res.data);
      });
    } else if (mainTab === 'expense') {
      expenseCompareApi.userDetails(selectedUserId, yearMonth).then((res) => {
        if (!cancelled) setPairExpense(res.data);
      });
    } else if (mainTab === 'income') {
      incomeCompareApi.userDetails(selectedUserId, yearMonth).then((res) => {
        if (!cancelled) setPairIncome(res.data);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [selectedUserId, mainTab, yearMonth]);

  useEffect(() => {
    if (!activeMetric) return;
    const my = myByKey(activeMetric);
    if (!my) return;
    if (my.categories.length === 0) {
      setSelectedCategoryId(null);
      setPairCategoryId(null);
      return;
    }
    if (
      selectedCategoryId == null ||
      !my.categories.find((c) => c.categoryId === selectedCategoryId)
    ) {
      setSelectedCategoryId(my.categories[0].categoryId);
    }
    if (
      pairCategoryId == null ||
      !my.categories.find((c) => c.categoryId === pairCategoryId)
    ) {
      setPairCategoryId(my.categories[0].categoryId);
    }
  }, [activeMetric, myByKey, selectedCategoryId, pairCategoryId]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const usersFor = (key: MetricKey): PublicUserMetric[] =>
    key === 'budget' ? budgetUsers : key === 'expense' ? expenseUsers : incomeUsers;

  const compareFor = (
    key: MetricKey
  ): BudgetCompareResponse | ExpenseCompareResponse | IncomeCompareResponse | null =>
    key === 'budget'
      ? compareBudget
      : key === 'expense'
      ? compareExpense
      : compareIncome;

  const renderMetricTab = (config: MetricConfig) => {
    const my = myByKey(config.key);
    if (!my) return null;
    const publicUsers = usersFor(config.key);
    const compare = compareFor(config.key);

    const filteredPublicUsers = publicUsers.filter(
      (b) =>
        b.yearMonth === yearMonth &&
        b.userId !== myUserId &&
        (!locationMode || (b.distanceKm !== undefined && b.distanceKm <= radiusKm))
    );
    const sumPublic = filteredPublicUsers.reduce((s, b) => s + b.total, 0);
    const avgPublic = filteredPublicUsers.length
      ? Math.round(sumPublic / filteredPublicUsers.length)
      : 0;

    const compareLabel = (() => {
      if (compareType === 'AGE')
        return locationMode ? '동일 나이대 이웃 평균' : '동일 나이대 평균';
      if (compareType === 'AMOUNT')
        return locationMode
          ? `반경 ${radiusKm}km 이웃 평균`
          : `${formatMan(minAmount)}~${formatMan(maxAmount)}원 구간 평균`;
      const cat = my.categories.find((c) => c.categoryId === selectedCategoryId);
      return locationMode
        ? `${cat?.categoryName ?? ''} 이웃 평균`
        : `${cat?.categoryName ?? ''} 카테고리 평균`;
    })();

    const myAmount = compare?.myAmount ?? my.total;
    const averageAmount = compare?.averageAmount ?? 0;
    const difference = compare?.difference ?? myAmount - averageAmount;
    const sampleSize = compare?.sampleSize ?? filteredPublicUsers.length;
    const isMyLess = difference < 0;
    const totalAmt = my.total;

    return (
      <>
        <div className="comparison-summary-grid">
          <div className={`card stat-card ${config.themeClass}`}>
            <div className="card-header-row">
              <span className="card-title">내 월 총 {config.label}</span>
              <div className="icon-wrapper">{metricIcon[config.key]}</div>
            </div>
            <div className="stat-value">{formatKRW(totalAmt)}</div>
            <div className="stat-label">{yearMonth} 기준</div>
          </div>

          <div className="card stat-card purple-theme">
            <div className="card-header-row">
              <span className="card-title">
                {locationMode ? '반경 이웃 수' : '카테고리 수'}
              </span>
              <div className="icon-wrapper">
                {locationMode ? <MapPin size={20} /> : <Filter size={20} />}
              </div>
            </div>
            <div className="stat-value">
              {locationMode
                ? `${filteredPublicUsers.length}명`
                : `${my.categories.length}개`}
            </div>
            <div className="stat-label">
              {locationMode ? `${radiusKm}km 반경` : `${config.label} 카테고리`}
            </div>
          </div>

          <div className="card stat-card navy-theme">
            <div className="card-header-row">
              <span className="card-title">평균 대비</span>
              <div className="icon-wrapper">
                {isMyLess ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
              </div>
            </div>
            <div className="stat-value">
              {isMyLess ? '-' : '+'}
              {formatKRW(Math.abs(difference))}
            </div>
            <div className="stat-label">{compareLabel}</div>
          </div>
        </div>

        <div className="dashboard-grid-3">
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header-row">
              <span className="card-title">내 카테고리별 {config.label}</span>
              <span className="stat-label" style={{ marginTop: 0 }}>
                총 {formatKRW(totalAmt)}원
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {my.categories.map((cat) => {
                const pct = totalAmt > 0 ? (cat.amount / totalAmt) * 100 : 0;
                return (
                  <div key={cat.categoryId}>
                    <div
                      className="asset-progress-header"
                      style={{ marginBottom: '6px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className="legend-dot"
                          style={{ backgroundColor: cat.color }}
                        ></div>
                        <span className="asset-progress-name">{cat.categoryName}</span>
                      </div>
                      <span className="asset-progress-val">
                        {formatKRW(cat.amount)}원 ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card comparison-avg-card">
            <div className="card-header-row">
              <span className="card-title">평균 {config.label} 비교</span>
            </div>

            <div className="sub-tabs-container" style={{ width: '100%' }}>
              {(
                [
                  { id: 'AGE', label: '나이대' },
                  { id: 'AMOUNT', label: locationMode ? '이웃' : '금액' },
                  { id: 'CATEGORY', label: '카테고리' },
                ] as { id: CompareType; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCompareType(tab.id)}
                  className={`sub-tab-btn ${compareType === tab.id ? 'active' : ''}`}
                  style={{ flex: 1 }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {compareType === 'CATEGORY' && (
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  비교 카테고리
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {my.categories.map((cat) => {
                    const isActive = selectedCategoryId === cat.categoryId;
                    return (
                      <button
                        key={cat.categoryId}
                        onClick={() => setSelectedCategoryId(cat.categoryId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isActive ? cat.color : 'var(--border)'}`,
                          background: isActive ? `${cat.color}14` : '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isActive ? cat.color : 'var(--text-secondary)',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: cat.color,
                          }}
                        ></span>
                        {cat.categoryName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                {compareLabel}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {formatKRW(averageAmount)}원
              </div>
              {compareType !== 'CATEGORY' && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  표본 {sampleSize}명
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">내 {config.label}</span>
                  <span className="asset-progress-val">{formatKRW(myAmount)}원</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (myAmount / Math.max(myAmount, averageAmount, 1)) * 100
                      )}%`,
                      backgroundColor: config.accentColor,
                    }}
                  ></div>
                </div>
              </div>

              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">
                    {locationMode ? '이웃 평균' : '평균'}
                  </span>
                  <span className="asset-progress-val">{formatKRW(averageAmount)}원</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (averageAmount / Math.max(myAmount, averageAmount, 1)) * 100
                      )}%`,
                      backgroundColor: '#94a3b8',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                border: `1px solid ${isMyLess ? 'var(--green-border)' : 'var(--red-border)'}`,
                background: isMyLess ? 'var(--green-bg)' : 'var(--red-bg)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                color: isMyLess ? 'var(--green)' : 'var(--red)',
              }}
            >
              {(() => {
                const prefix = locationMode ? '이웃보다' : '평균보다';
                const verb = isMyLess ? config.verbNegative : config.verbPositive;
                return `${prefix} ${formatKRW(Math.abs(difference))}원 ${verb}`;
              })()}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--blue-bg)',
                  color: 'var(--blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Filter size={18} />
              </div>
              <span className="card-title">
                {locationMode ? '위치 기반' : '공개'} {config.label} 필터
              </span>
            </div>
            {locationMode && (
              <span className="stat-label" style={{ marginTop: 0 }}>
                내 위치로부터 반경 내 공개 사용자만 조회
              </span>
            )}
          </div>

          <div className="filter-grid filter-grid-3">
            <div>
              <label className="filter-label">연도</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="filter-select"
              >
                {[year - 2, year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="filter-label">월</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="filter-select"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            {locationMode ? (
              <div className="filter-grid-amount">
                <label className="filter-label">
                  반경:{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {radiusKm}km
                  </span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={50}
                  step={0.5}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  style={{ width: '100%', accentColor: config.accentColor }}
                />
              </div>
            ) : (
              <div className="filter-grid-amount">
                <label className="filter-label">
                  월 총 {config.label} 금액 구간:{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {formatKRW(minAmount)}원 ~ {formatKRW(maxAmount)}원
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                  <input
                    type="range"
                    min={0}
                    max={20000000}
                    step={500000}
                    value={minAmount}
                    onChange={(e) =>
                      setMinAmount(Math.min(Number(e.target.value), maxAmount))
                    }
                    style={{ flex: 1, minWidth: 0, width: '100%', accentColor: config.accentColor }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={20000000}
                    step={500000}
                    value={maxAmount}
                    onChange={(e) =>
                      setMaxAmount(Math.max(Number(e.target.value), minAmount))
                    }
                    style={{ flex: 1, minWidth: 0, width: '100%', accentColor: config.accentColor }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card public-users-card" style={{ marginTop: '24px' }}>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--purple-bg)',
                  color: 'var(--purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={18} />
              </div>
              <span className="card-title">
                {locationMode ? '반경 내 이웃' : '공개 사용자'} 월 총 {config.label}
              </span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              {locationMode
                ? `${filteredPublicUsers.length}명 · 평균 ${formatKRW(avgPublic)}원`
                : `필터링 결과 ${filteredPublicUsers.length}건 · 평균 ${formatKRW(avgPublic)}원`}
            </span>
          </div>

          {locationMode && locationMissing ? (
            <div className="empty-state">
              내 위치 정보가 등록되지 않았습니다. 위치를 먼저 등록해 주세요.
            </div>
          ) : filteredPublicUsers.length === 0 ? (
            <div className="empty-state">
              {locationMode
                ? '반경 내에 공개 사용자가 없습니다. 반경을 넓혀 보세요.'
                : '필터 조건에 맞는 공개 사용자가 없습니다. 금액 구간을 조정해 보세요.'}
            </div>
          ) : (
            <div className="public-user-grid">
              {filteredPublicUsers.map((u) => {
                const diff = u.total - totalAmt;
                const isLess = diff < 0;
                const initial = u.username.charAt(0);
                return (
                  <div
                    key={u.userId}
                    className="public-user-card clickable"
                    onClick={() => setSelectedUserId(u.userId)}
                  >
                    <div className="public-user-card-header">
                      <div className="public-user-avatar">{initial}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="public-user-name">{u.username}</div>
                        <div className="public-user-meta">
                          {locationMode && u.distanceKm !== undefined && (
                            <>
                              <MapPin size={11} style={{ marginRight: '4px' }} />
                              {u.distanceKm.toFixed(1)}km ·{' '}
                            </>
                          )}
                          {u.yearMonth}
                        </div>
                      </div>
                      <span
                        className={`public-user-diff-badge ${isLess ? 'less' : 'more'}`}
                      >
                        {isLess ? '-' : '+'}
                        {formatKRW(Math.abs(diff))}
                      </span>
                    </div>

                    <div className="public-user-budget-row">
                      <span className="public-user-budget-lbl">
                        {u.yearMonth} 월 총 {config.label}
                      </span>
                      <div className="public-user-budget-val">
                        {formatKRW(u.total)}
                        <span>원</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderCategoryPair = (
    label: string,
    myCategories: CategoryItem[],
    targetCategories: CategoryItem[],
    targetName: string
  ) => {
    const maxCatAmount = Math.max(
      ...myCategories.map((c) => c.amount),
      ...targetCategories.map((c) => c.amount),
      1
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {myCategories.map((myCat) => {
          const tCat = targetCategories.find((c) => c.categoryId === myCat.categoryId);
          const tAmount = tCat?.amount ?? 0;
          const catDiff = myCat.amount - tAmount;
          const isLess = catDiff < 0;
          const myW = (myCat.amount / maxCatAmount) * 100;
          const tW = (tAmount / maxCatAmount) * 100;
          return (
            <div key={myCat.categoryId}>
              <div className="cat-pair-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="legend-dot" style={{ backgroundColor: myCat.color }}></div>
                  <span className="cat-pair-name">{myCat.categoryName}</span>
                </div>
                <span className={`public-user-diff-badge ${isLess ? 'less' : 'more'}`}>
                  {isLess ? '-' : '+'}
                  {formatKRW(Math.abs(catDiff))}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="cat-pair-row">
                  <span className="cat-pair-row-lbl">내 {label}</span>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar-container" style={{ height: '14px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${myW}%`, backgroundColor: myCat.color }}
                      ></div>
                    </div>
                  </div>
                  <span className="cat-pair-row-val">{formatKRW(myCat.amount)}</span>
                </div>
                <div className="cat-pair-row">
                  <span className="cat-pair-row-lbl">{targetName}</span>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar-container" style={{ height: '14px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${tW}%`, backgroundColor: '#cbd5e1' }}
                      ></div>
                    </div>
                  </div>
                  <span className="cat-pair-row-val muted">{formatKRW(tAmount)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderUserDetailView = (config: MetricConfig) => {
    const my = myByKey(config.key);
    if (!my) return null;

    const targetDistance =
      locationMode && selectedUserId != null ? distanceMap?.get(selectedUserId) : undefined;

    let targetUsername = '';
    let targetYearMonth = yearMonth;
    let targetTotal = 0;
    let targetCategories: CategoryItem[] = [];

    if (config.key === 'budget' && pairBudget) {
      targetUsername = pairBudget.target.username;
      targetYearMonth = pairBudget.target.yearMonth;
      targetTotal = pairBudget.target.totalBudget;
      targetCategories = budgetDetailToCategories(pairBudget.target.categoryBudgets);
    } else if (config.key === 'expense' && pairExpense) {
      targetUsername = pairExpense.target.username;
      targetYearMonth = pairExpense.target.yearMonth;
      targetTotal = pairExpense.target.totalExpense;
      targetCategories = flatDetailToCategories(
        pairExpense.target.fixedCategoryExpenses,
        pairExpense.target.variableCategoryExpenses
      );
    } else if (config.key === 'income' && pairIncome) {
      targetUsername = pairIncome.target.username;
      targetYearMonth = pairIncome.target.yearMonth;
      targetTotal = pairIncome.target.totalIncome;
      targetCategories = flatDetailToCategories(
        pairIncome.target.fixedCategoryIncomes,
        pairIncome.target.variableCategoryIncomes
      );
    } else {
      return <div className="loading-state">불러오는 중…</div>;
    }

    const totalDiff = my.total - targetTotal;
    const isMyLess = totalDiff < 0;

    let pairMyAmount = my.total;
    let pairTargetAmount = targetTotal;
    let pairMyLabel = `내 월 총 ${config.label}`;
    let pairTargetLabel = `${targetUsername} 월 총 ${config.label}`;
    if (pairCompareType === 'CATEGORY' && pairCategoryId != null) {
      const myCat = my.categories.find((c) => c.categoryId === pairCategoryId);
      const tCat = targetCategories.find((c) => c.categoryId === pairCategoryId);
      pairMyAmount = myCat?.amount ?? 0;
      pairTargetAmount = tCat?.amount ?? 0;
      pairMyLabel = `내 ${myCat?.categoryName ?? ''}`;
      pairTargetLabel = `${targetUsername} ${tCat?.categoryName ?? ''}`;
    }
    const pairDiff = pairMyAmount - pairTargetAmount;
    const pairIsMyLess = pairDiff < 0;
    const maxPairAmount = Math.max(pairMyAmount, pairTargetAmount, 1);

    return (
      <>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <button onClick={() => setSelectedUserId(null)} className="back-btn">
              <ArrowLeft size={14} />
              <span>목록으로</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                className="public-user-avatar"
                style={{ width: '44px', height: '44px' }}
              >
                {targetUsername.charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  {targetUsername}와(과)의 {config.label} 비교
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    marginTop: '2px',
                  }}
                >
                  {targetDistance != null && (
                    <>
                      <MapPin size={11} style={{ marginRight: '4px' }} />
                      {targetDistance.toFixed(1)}km ·{' '}
                    </>
                  )}
                  {targetYearMonth}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-summary-grid" style={{ marginTop: 0 }}>
          <div className={`card stat-card ${config.themeClass}`}>
            <div className="card-header-row">
              <span className="card-title">내 월 총 {config.label}</span>
              <div className="icon-wrapper">{metricIcon[config.key]}</div>
            </div>
            <div className="stat-value">{formatKRW(my.total)}</div>
            <div className="stat-label">{yearMonth} 기준</div>
          </div>

          <div className="card stat-card purple-theme">
            <div className="card-header-row">
              <span className="card-title">
                {targetUsername} 월 총 {config.label}
              </span>
              <div className="icon-wrapper">{metricIcon[config.key]}</div>
            </div>
            <div className="stat-value">{formatKRW(targetTotal)}</div>
            <div className="stat-label">{targetYearMonth} 기준</div>
          </div>

          <div className="card stat-card navy-theme">
            <div className="card-header-row">
              <span className="card-title">총 {config.label} 차이</span>
              <div className="icon-wrapper">
                {isMyLess ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
              </div>
            </div>
            <div className="stat-value">
              {isMyLess ? '-' : '+'}
              {formatKRW(Math.abs(totalDiff))}
            </div>
            <div className="stat-label">
              내 {config.label} - 상대 {config.label}
            </div>
          </div>
        </div>

        <div className="dashboard-grid-3" style={{ marginTop: '24px' }}>
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header-row">
              <span className="card-title">카테고리별 {config.label} 상세</span>
              <span className="stat-label" style={{ marginTop: 0 }}>
                나 vs {targetUsername}
              </span>
            </div>
            {renderCategoryPair(
              config.label,
              my.categories,
              targetCategories,
              targetUsername
            )}
          </div>

          <div className="card">
            <div className="card-header-row">
              <span className="card-title">{targetUsername}와 비교</span>
            </div>

            <div className="sub-tabs-container" style={{ width: '100%' }}>
              {(
                [
                  { id: 'AGE', label: '나이대' },
                  { id: 'AMOUNT', label: locationMode ? '이웃' : '금액' },
                  { id: 'CATEGORY', label: '카테고리' },
                ] as { id: CompareType; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPairCompareType(tab.id)}
                  className={`sub-tab-btn ${pairCompareType === tab.id ? 'active' : ''}`}
                  style={{ flex: 1 }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {pairCompareType === 'CATEGORY' && (
              <div style={{ marginBottom: '16px' }}>
                <label className="filter-label">비교 카테고리</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {my.categories.map((cat) => {
                    const isActive = pairCategoryId === cat.categoryId;
                    return (
                      <button
                        key={cat.categoryId}
                        onClick={() => setPairCategoryId(cat.categoryId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isActive ? cat.color : 'var(--border)'}`,
                          background: isActive ? `${cat.color}14` : '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isActive ? cat.color : 'var(--text-secondary)',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: cat.color,
                          }}
                        ></span>
                        {cat.categoryName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {pairCompareType === 'AMOUNT' && (
              <div className="hint-box">
                {locationMode
                  ? `반경 ${radiusKm}km 이웃 기준 비교`
                  : `${formatMan(minAmount)}~${formatMan(maxAmount)}원 구간 기준 비교`}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">{pairMyLabel}</span>
                  <span className="asset-progress-val">{formatKRW(pairMyAmount)}원</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${(pairMyAmount / maxPairAmount) * 100}%`,
                      backgroundColor: config.accentColor,
                    }}
                  ></div>
                </div>
              </div>

              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">{pairTargetLabel}</span>
                  <span className="asset-progress-val">
                    {formatKRW(pairTargetAmount)}원
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${(pairTargetAmount / maxPairAmount) * 100}%`,
                      backgroundColor: '#8b5cf6',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                border: `1px solid ${pairIsMyLess ? 'var(--green-border)' : 'var(--red-border)'}`,
                background: pairIsMyLess ? 'var(--green-bg)' : 'var(--red-bg)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                color: pairIsMyLess ? 'var(--green)' : 'var(--red)',
              }}
            >
              {pairIsMyLess
                ? `상대보다 ${formatKRW(Math.abs(pairDiff))}원 ${config.verbNegative}`
                : `상대보다 ${formatKRW(Math.abs(pairDiff))}원 ${config.verbPositive}`}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderOverallTab = () => {
    if (!myBudget || !myExpense || !myIncome) return null;
    const filteredOverall = overallUsers.filter(
      (u) =>
        u.yearMonth === yearMonth &&
        u.userId !== myUserId &&
        (!locationMode || (u.distanceKm !== undefined && u.distanceKm <= radiusKm))
    );
    const avgOf = (arr: number[]) =>
      arr.length === 0 ? 0 : Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    const avgBudget = avgOf(filteredOverall.map((u) => u.totalBudget));
    const avgExpense = avgOf(filteredOverall.map((u) => u.totalExpense));
    const avgIncome = avgOf(filteredOverall.map((u) => u.totalIncome));

    const rows: {
      key: MetricKey;
      label: string;
      my: number;
      avg: number;
      color: string;
      icon: React.ReactNode;
      themeClass: 'blue-theme' | 'red-theme' | 'purple-theme';
    }[] = [
      {
        key: 'budget',
        label: '예산',
        my: myBudget.total,
        avg: avgBudget,
        color: '#3b82f6',
        icon: <Wallet size={20} />,
        themeClass: 'blue-theme',
      },
      {
        key: 'expense',
        label: '지출',
        my: myExpense.total,
        avg: avgExpense,
        color: '#f43f5e',
        icon: <ArrowDownRight size={20} />,
        themeClass: 'red-theme',
      },
      {
        key: 'income',
        label: '수입',
        my: myIncome.total,
        avg: avgIncome,
        color: '#10b981',
        icon: <ArrowUpRight size={20} />,
        themeClass: 'purple-theme',
      },
    ];

    return (
      <>
        <div className="comparison-summary-grid">
          {rows.map((row) => {
            const diff = row.my - row.avg;
            const isLess = diff < 0;
            return (
              <div key={row.key} className={`card stat-card ${row.themeClass}`}>
                <div className="card-header-row">
                  <span className="card-title">{row.label}</span>
                  <div className="icon-wrapper">{row.icon}</div>
                </div>
                <div className="stat-value">{formatKRW(row.my)}</div>
                <div className="stat-label">
                  {locationMode ? '이웃 평균 대비 ' : '평균 대비 '}
                  {isLess ? '-' : '+'}
                  {formatKRW(Math.abs(diff))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--blue-bg)',
                  color: 'var(--blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PieChart size={18} />
              </div>
              <span className="card-title">예산 · 지출 · 수입 종합</span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              {yearMonth} ·{' '}
              {locationMode
                ? `반경 ${radiusKm}km 이웃 평균과 비교`
                : '공개 사용자 평균과 비교'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {rows.map((row) => {
              const maxVal = Math.max(row.my, row.avg, 1);
              const diff = row.my - row.avg;
              const isLess = diff < 0;
              return (
                <div key={row.key}>
                  <div className="cat-pair-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        className="legend-dot"
                        style={{ backgroundColor: row.color }}
                      ></div>
                      <span className="cat-pair-name">{row.label}</span>
                    </div>
                    <span
                      className={`public-user-diff-badge ${isLess ? 'less' : 'more'}`}
                    >
                      {isLess ? '-' : '+'}
                      {formatKRW(Math.abs(diff))}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="cat-pair-row">
                      <span className="cat-pair-row-lbl">나</span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar-container" style={{ height: '14px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(row.my / maxVal) * 100}%`,
                              backgroundColor: row.color,
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="cat-pair-row-val">{formatKRW(row.my)}</span>
                    </div>
                    <div className="cat-pair-row">
                      <span className="cat-pair-row-lbl">이웃 평균</span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar-container" style={{ height: '14px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(row.avg / maxVal) * 100}%`,
                              backgroundColor: '#cbd5e1',
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="cat-pair-row-val muted">{formatKRW(row.avg)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--blue-bg)',
                  color: 'var(--blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Filter size={18} />
              </div>
              <span className="card-title">
                {locationMode ? '위치 기반 이웃 필터' : '공개 사용자 필터'}
              </span>
            </div>
            {locationMode && (
              <span className="stat-label" style={{ marginTop: 0 }}>
                내 위치로부터 반경 내 공개 사용자만 조회
              </span>
            )}
          </div>

          <div
            className={`filter-grid ${locationMode ? 'filter-grid-3' : 'filter-grid-4'}`}
          >
            <div>
              <label className="filter-label">연도</label>
              <select
                value={year}
                onChange={(ev) => setYear(Number(ev.target.value))}
                className="filter-select"
              >
                {[year - 2, year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="filter-label">월</label>
              <select
                value={month}
                onChange={(ev) => setMonth(Number(ev.target.value))}
                className="filter-select"
              >
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            {locationMode ? (
              <div className="filter-grid-amount">
                <label className="filter-label">
                  반경:{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {radiusKm}km
                  </span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={50}
                  step={0.5}
                  value={radiusKm}
                  onChange={(ev) => setRadiusKm(Number(ev.target.value))}
                  style={{
                    width: '100%',
                    accentColor: METRIC_CONFIGS[overallFilterMetric].accentColor,
                  }}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="filter-label">금액 기준</label>
                  <select
                    value={overallFilterMetric}
                    onChange={(ev) => setOverallFilterMetric(ev.target.value as MetricKey)}
                    className="filter-select"
                  >
                    <option value="budget">예산</option>
                    <option value="expense">지출</option>
                    <option value="income">수입</option>
                  </select>
                </div>

                <div className="filter-grid-amount">
                  <label className="filter-label">
                    월 총 {METRIC_CONFIGS[overallFilterMetric].label} 금액 구간:{' '}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {formatKRW(minAmount)}원 ~ {formatKRW(maxAmount)}원
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="range"
                      min={0}
                      max={20000000}
                      step={500000}
                      value={minAmount}
                      onChange={(ev) =>
                        setMinAmount(Math.min(Number(ev.target.value), maxAmount))
                      }
                      style={{
                        flex: 1,
                        accentColor: METRIC_CONFIGS[overallFilterMetric].accentColor,
                      }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={20000000}
                      step={500000}
                      value={maxAmount}
                      onChange={(ev) =>
                        setMaxAmount(Math.max(Number(ev.target.value), minAmount))
                      }
                      style={{
                        flex: 1,
                        accentColor: METRIC_CONFIGS[overallFilterMetric].accentColor,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--purple-bg)',
                  color: 'var(--purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} />
              </div>
              <span className="card-title">
                {locationMode ? '반경 내 이웃 종합 현황' : '공개 사용자 종합 현황'}
              </span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              {filteredOverall.length}명 · 사용자를 선택하면 상세 비교가 열려요
            </span>
          </div>

          {locationMode && locationMissing ? (
            <div className="empty-state">
              내 위치 정보가 등록되지 않았습니다. 위치를 먼저 등록해 주세요.
            </div>
          ) : filteredOverall.length === 0 ? (
            <div className="empty-state">
              {locationMode
                ? '반경 내에 공개된 이웃이 없습니다.'
                : '해당 기간에 공개된 사용자가 없습니다.'}
            </div>
          ) : (
            <div className="public-user-grid">
              {filteredOverall.map((u) => {
                const initial = u.username.charAt(0);
                return (
                  <div
                    key={u.userId}
                    className="public-user-card clickable"
                    onClick={() => setSelectedUserId(u.userId)}
                  >
                    <div className="public-user-card-header">
                      <div className="public-user-avatar">{initial}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="public-user-name">{u.username}</div>
                        <div className="public-user-meta">
                          {locationMode && u.distanceKm !== undefined && (
                            <>
                              <MapPin size={11} style={{ marginRight: '4px' }} />
                              {u.distanceKm.toFixed(1)}km ·{' '}
                            </>
                          )}
                          {u.yearMonth}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      {(
                        [
                          { label: '예산', value: u.totalBudget, color: '#3b82f6' },
                          { label: '지출', value: u.totalExpense, color: '#f43f5e' },
                          { label: '수입', value: u.totalIncome, color: '#10b981' },
                        ] as const
                      ).map((m) => (
                        <div key={m.label} className="overall-row">
                          <span className="overall-row-lbl">
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: m.color,
                              }}
                            ></span>
                            {m.label}
                          </span>
                          <span className="overall-row-val">{formatKRW(m.value)}원</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderOverallDetailView = () => {
    if (!pairPortfolio || !myBudget || !myExpense || !myIncome) {
      return <div className="loading-state">불러오는 중…</div>;
    }
    const t = pairPortfolio.target;
    const targetBudgetCats = budgetDetailToCategories(t.budget.categoryBudgets);
    const targetExpenseCats = flatDetailToCategories(
      t.expense.fixedCategoryExpenses,
      t.expense.variableCategoryExpenses
    );
    const targetIncomeCats = flatDetailToCategories(
      t.income.fixedCategoryIncomes,
      t.income.variableCategoryIncomes
    );

    const targetDistance =
      locationMode && selectedUserId != null ? distanceMap?.get(selectedUserId) : undefined;

    const sections: {
      key: MetricKey;
      label: string;
      my: number;
      target: number;
      myCategories: CategoryItem[];
      targetCategories: CategoryItem[];
      color: string;
      themeClass: 'blue-theme' | 'red-theme' | 'purple-theme';
      icon: React.ReactNode;
    }[] = [
      {
        key: 'budget',
        label: '예산',
        my: myBudget.total,
        target: t.totalBudget,
        myCategories: myBudget.categories,
        targetCategories: targetBudgetCats,
        color: '#3b82f6',
        themeClass: 'blue-theme',
        icon: <Wallet size={20} />,
      },
      {
        key: 'expense',
        label: '지출',
        my: myExpense.total,
        target: t.totalExpense,
        myCategories: myExpense.categories,
        targetCategories: targetExpenseCats,
        color: '#f43f5e',
        themeClass: 'red-theme',
        icon: <ArrowDownRight size={20} />,
      },
      {
        key: 'income',
        label: '수입',
        my: myIncome.total,
        target: t.totalIncome,
        myCategories: myIncome.categories,
        targetCategories: targetIncomeCats,
        color: '#10b981',
        themeClass: 'purple-theme',
        icon: <ArrowUpRight size={20} />,
      },
    ];

    return (
      <>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <button onClick={() => setSelectedUserId(null)} className="back-btn">
              <ArrowLeft size={14} />
              <span>목록으로</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                className="public-user-avatar"
                style={{ width: '44px', height: '44px' }}
              >
                {t.username.charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  {t.username}와(과)의 종합 비교
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    marginTop: '2px',
                  }}
                >
                  {targetDistance != null && (
                    <>
                      <MapPin size={11} style={{ marginRight: '4px' }} />
                      {targetDistance.toFixed(1)}km ·{' '}
                    </>
                  )}
                  {t.yearMonth}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-summary-grid">
          {sections.map((sec) => {
            const diff = sec.my - sec.target;
            const isLess = diff < 0;
            return (
              <div key={sec.key} className={`card stat-card ${sec.themeClass}`}>
                <div className="card-header-row">
                  <span className="card-title">{sec.label} 차이</span>
                  <div className="icon-wrapper">
                    {isLess ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                  </div>
                </div>
                <div className="stat-value">
                  {isLess ? '-' : '+'}
                  {formatKRW(Math.abs(diff))}
                </div>
                <div className="stat-label">
                  내 {sec.label} - 상대 {sec.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--blue-bg)',
                  color: 'var(--blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PieChart size={18} />
              </div>
              <span className="card-title">예산 · 지출 · 수입 1:1 비교</span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              나 vs {t.username}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {sections.map((sec) => {
              const maxVal = Math.max(sec.my, sec.target, 1);
              const diff = sec.my - sec.target;
              const isLess = diff < 0;
              return (
                <div key={sec.key}>
                  <div className="cat-pair-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        className="legend-dot"
                        style={{ backgroundColor: sec.color }}
                      ></div>
                      <span className="cat-pair-name">{sec.label}</span>
                    </div>
                    <span
                      className={`public-user-diff-badge ${isLess ? 'less' : 'more'}`}
                    >
                      {isLess ? '-' : '+'}
                      {formatKRW(Math.abs(diff))}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="cat-pair-row">
                      <span className="cat-pair-row-lbl">내 {sec.label}</span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar-container" style={{ height: '14px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(sec.my / maxVal) * 100}%`,
                              backgroundColor: sec.color,
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="cat-pair-row-val">{formatKRW(sec.my)}</span>
                    </div>
                    <div className="cat-pair-row">
                      <span className="cat-pair-row-lbl">{t.username}</span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar-container" style={{ height: '14px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(sec.target / maxVal) * 100}%`,
                              backgroundColor: '#cbd5e1',
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="cat-pair-row-val muted">
                        {formatKRW(sec.target)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {sections.map((sec) => (
          <div key={sec.key} className="card" style={{ marginTop: '24px' }}>
            <div className="card-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${sec.color}1f`,
                    color: sec.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {sec.icon}
                </div>
                <span className="card-title">{sec.label} 카테고리별 비교</span>
              </div>
              <span className="stat-label" style={{ marginTop: 0 }}>
                나 vs {t.username}
              </span>
            </div>
            {renderCategoryPair(sec.label, sec.myCategories, sec.targetCategories, t.username)}
          </div>
        ))}
      </>
    );
  };

  const renderPlaceholder = (label: string) => (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
        gap: '20px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--blue-bg)',
          color: 'var(--blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Construction size={32} />
      </div>
      <div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          {label} 비교는 준비 중입니다
        </h2>
      </div>
    </div>
  );

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    setSelectedUserId(null);
  };

  return (
    <div className="fade-in">
      <div className="dashboard-view-header">
        <div className="dashboard-view-tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleMainTabChange(tab.id)}
              className={`dashboard-tab-btn ${mainTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => {
              setLocationMode((prev) => !prev);
              setSelectedUserId(null);
            }}
            aria-pressed={locationMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              border: `1px solid ${locationMode ? 'var(--blue)' : 'var(--border)'}`,
              background: locationMode ? 'var(--blue)' : '#fff',
              color: locationMode ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title={locationMode ? '위치 기반 비교 켜짐 · 클릭하여 끄기' : '위치 기반 비교 꺼짐 · 클릭하여 켜기'}
          >
            <MapPin size={14} />
            <span>위치 기반</span>
          </button>
          <div className="dashboard-date-selector">
            <button
              className="dashboard-date-arrow"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {year}년 {month}월
            </span>
            <button
              className="dashboard-date-arrow"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading && !myPortfolio && (
        <div className="loading-state">내 포트폴리오를 불러오는 중…</div>
      )}
      {error && !loading && <div className="empty-state">{error}</div>}

      {!loading &&
        !error &&
        activeMetric &&
        (selectedUserId !== null
          ? renderUserDetailView(METRIC_CONFIGS[activeMetric])
          : renderMetricTab(METRIC_CONFIGS[activeMetric]))}

      {!loading &&
        !error &&
        mainTab === 'overall' &&
        (selectedUserId !== null ? renderOverallDetailView() : renderOverallTab())}

      {!loading && !error && !activeMetric && mainTab !== 'overall' && renderPlaceholder('해당')}
    </div>
  );
};
