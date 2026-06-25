import React, { useState } from 'react';
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
  PieChart
} from 'lucide-react';

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
  ageGroup: string;
  region: string;
  categories: CategoryItem[];
}

interface MetricConfig {
  key: MetricKey;
  label: string; // "예산" / "지출" / "수입"
  // 카드 노출 시 사용할 동사 (예: "책정", "지출", "벌었")
  verbPositive: string;
  verbNegative: string;
  // 색상 테마: 예산-blue, 지출-red, 수입-green
  themeClass: 'blue-theme' | 'red-theme' | 'purple-theme' | 'navy-theme';
  accentColor: string;
  my: MyMetric;
  publicUsers: PublicUserMetric[];
  categoryAverages: Record<number, number>;
}

interface PairCompareResult {
  type: CompareType;
  yearMonth: string;
  myLabel: string;
  myAmount: number;
  targetLabel: string;
  targetAmount: number;
  difference: number;
}

interface CompareResult {
  type: CompareType;
  yearMonth: string;
  myAmount: number;
  averageAmount: number;
  sampleSize: number;
  difference: number;
  label: string;
}

const formatKRW = (value: number) => new Intl.NumberFormat('ko-KR').format(value);
const formatMan = (value: number) =>
  `${Math.round(value / 10000).toLocaleString('ko-KR')}만`;

const mainTabs: { id: MainTab; label: string }[] = [
  { id: 'budget', label: '예산' },
  { id: 'expense', label: '지출' },
  { id: 'income', label: '수입' },
  { id: 'overall', label: '종합 비교' }
];

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4'];

// === Budget mock (GET /api/v1/budgets/me, /compare/users, ...) ===
const budgetCategories: CategoryItem[] = [
  { categoryId: 1, categoryName: '식비', amount: 2800000, color: CATEGORY_COLORS[0] },
  { categoryId: 2, categoryName: '주거비', amount: 1800000, color: CATEGORY_COLORS[1] },
  { categoryId: 3, categoryName: '육아용품', amount: 1500000, color: CATEGORY_COLORS[2] },
  { categoryId: 4, categoryName: '교통/통신', amount: 900000, color: CATEGORY_COLORS[3] },
  { categoryId: 5, categoryName: '문화/여가', amount: 1000000, color: CATEGORY_COLORS[4] },
  { categoryId: 6, categoryName: '기타/예비비', amount: 2000000, color: CATEGORY_COLORS[5] }
];

// === Expense mock (GET /api/v1/expenses/me, /compare/users, ...) ===
const expenseCategories: CategoryItem[] = [
  { categoryId: 1, categoryName: '식비', amount: 2500000, color: CATEGORY_COLORS[0] },
  { categoryId: 2, categoryName: '주거비', amount: 1500000, color: CATEGORY_COLORS[1] },
  { categoryId: 3, categoryName: '육아용품', amount: 1200000, color: CATEGORY_COLORS[2] },
  { categoryId: 4, categoryName: '교통/통신', amount: 859106, color: CATEGORY_COLORS[3] },
  { categoryId: 5, categoryName: '문화/여가', amount: 800000, color: CATEGORY_COLORS[4] },
  { categoryId: 6, categoryName: '기타/예비비', amount: 0, color: CATEGORY_COLORS[5] }
];

// === Income mock (GET /api/v1/incomes/me, /compare/users, ...) ===
const incomeCategories: CategoryItem[] = [
  { categoryId: 11, categoryName: '근로소득', amount: 9500000, color: CATEGORY_COLORS[0] },
  { categoryId: 12, categoryName: '사업소득', amount: 3000000, color: CATEGORY_COLORS[1] },
  { categoryId: 13, categoryName: '금융소득', amount: 1200000, color: CATEGORY_COLORS[2] },
  { categoryId: 14, categoryName: '기타수입', amount: 846049, color: CATEGORY_COLORS[3] }
];

const sumCategories = (cats: CategoryItem[]) => cats.reduce((s, c) => s + c.amount, 0);

// 공개 사용자 8명을 한 번 정의하고 메트릭별로 분포 비율을 다르게 적용
const publicUserBase = [
  { userId: 101, username: '알뜰살림민지', yearMonth: '2026-06', ageGroup: '30대', region: '서울 강남구' },
  { userId: 102, username: '꼼꼼한엄마', yearMonth: '2026-06', ageGroup: '30대', region: '서울 강남구' },
  { userId: 103, username: '주부9단', yearMonth: '2026-06', ageGroup: '40대', region: '서울 서초구' },
  { userId: 104, username: '슬기로운가계부', yearMonth: '2026-06', ageGroup: '30대', region: '경기 성남시' },
  { userId: 105, username: '두아이맘', yearMonth: '2026-06', ageGroup: '40대', region: '서울 강남구' },
  { userId: 106, username: '미니멀리스트', yearMonth: '2026-06', ageGroup: '20대', region: '서울 마포구' },
  { userId: 107, username: '워킹맘이정', yearMonth: '2026-06', ageGroup: '30대', region: '서울 송파구' },
  { userId: 108, username: '알찬소비', yearMonth: '2026-06', ageGroup: '30대', region: '경기 용인시' }
];

const totalsPerMetric: Record<MetricKey, Record<number, number>> = {
  budget: {
    101: 7500000, 102: 8200000, 103: 9100000, 104: 11200000,
    105: 12500000, 106: 5400000, 107: 9800000, 108: 6800000
  },
  expense: {
    101: 5800000, 102: 6400000, 103: 7100000, 104: 9500000,
    105: 10300000, 106: 4100000, 107: 7800000, 108: 5300000
  },
  income: {
    101: 12000000, 102: 14500000, 103: 13000000, 104: 18500000,
    105: 16000000, 106: 8500000, 107: 15800000, 108: 11200000
  }
};

const distributionPresets: Record<number, number[]> = {
  101: [0.30, 0.20, 0.13, 0.10, 0.07, 0.20],
  102: [0.28, 0.22, 0.15, 0.09, 0.08, 0.18],
  103: [0.32, 0.18, 0.18, 0.11, 0.06, 0.15],
  104: [0.26, 0.25, 0.16, 0.10, 0.10, 0.13],
  105: [0.24, 0.20, 0.22, 0.09, 0.09, 0.16],
  106: [0.35, 0.18, 0.05, 0.12, 0.15, 0.15],
  107: [0.29, 0.21, 0.17, 0.11, 0.08, 0.14],
  108: [0.33, 0.19, 0.14, 0.10, 0.08, 0.16]
};

const incomeDistributionPresets: Record<number, number[]> = {
  101: [0.70, 0.15, 0.10, 0.05],
  102: [0.65, 0.20, 0.10, 0.05],
  103: [0.60, 0.25, 0.10, 0.05],
  104: [0.55, 0.30, 0.10, 0.05],
  105: [0.50, 0.35, 0.10, 0.05],
  106: [0.75, 0.10, 0.10, 0.05],
  107: [0.60, 0.25, 0.10, 0.05],
  108: [0.68, 0.18, 0.09, 0.05]
};

const buildPublicCategories = (
  userId: number,
  total: number,
  template: CategoryItem[],
  metric: MetricKey
): CategoryItem[] => {
  const ratios =
    metric === 'income'
      ? incomeDistributionPresets[userId] ?? []
      : distributionPresets[userId] ?? [];
  return template.map((cat, i) => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    color: cat.color,
    amount: Math.round(total * (ratios[i] ?? 1 / template.length))
  }));
};

const buildPublicUsers = (
  template: CategoryItem[],
  metric: MetricKey
): PublicUserMetric[] =>
  publicUserBase.map((u) => {
    const total = totalsPerMetric[metric][u.userId];
    return {
      ...u,
      total,
      categories: buildPublicCategories(u.userId, total, template, metric)
    };
  });

// 카테고리별 평균 = 공개 사용자들의 평균
const buildCategoryAverages = (users: PublicUserMetric[]): Record<number, number> => {
  if (users.length === 0) return {};
  const sums: Record<number, number> = {};
  users.forEach((u) =>
    u.categories.forEach((c) => {
      sums[c.categoryId] = (sums[c.categoryId] ?? 0) + c.amount;
    })
  );
  const avgs: Record<number, number> = {};
  Object.entries(sums).forEach(([id, s]) => {
    avgs[Number(id)] = Math.round(s / users.length);
  });
  return avgs;
};

const budgetPublicUsers = buildPublicUsers(budgetCategories, 'budget');
const expensePublicUsers = buildPublicUsers(expenseCategories, 'expense');
const incomePublicUsers = buildPublicUsers(incomeCategories, 'income');

const metricConfigs: Record<MetricKey, MetricConfig> = {
  budget: {
    key: 'budget',
    label: '예산',
    verbPositive: '많이 책정',
    verbNegative: '적게 책정',
    themeClass: 'blue-theme',
    accentColor: '#3b82f6',
    my: {
      yearMonth: '2026-06',
      total: sumCategories(budgetCategories),
      categories: budgetCategories
    },
    publicUsers: budgetPublicUsers,
    categoryAverages: buildCategoryAverages(budgetPublicUsers)
  },
  expense: {
    key: 'expense',
    label: '지출',
    verbPositive: '많이 지출',
    verbNegative: '적게 지출',
    themeClass: 'red-theme',
    accentColor: '#f43f5e',
    my: {
      yearMonth: '2026-06',
      total: sumCategories(expenseCategories),
      categories: expenseCategories
    },
    publicUsers: expensePublicUsers,
    categoryAverages: buildCategoryAverages(expensePublicUsers)
  },
  income: {
    key: 'income',
    label: '수입',
    verbPositive: '많이 벌었어요',
    verbNegative: '적게 벌었어요',
    themeClass: 'purple-theme',
    accentColor: '#10b981',
    my: {
      yearMonth: '2026-06',
      total: sumCategories(incomeCategories),
      categories: incomeCategories
    },
    publicUsers: incomePublicUsers,
    categoryAverages: buildCategoryAverages(incomePublicUsers)
  }
};

const metricIcon: Record<MetricKey, React.ReactNode> = {
  budget: <Wallet size={20} />,
  expense: <ArrowDownRight size={20} />,
  income: <ArrowUpRight size={20} />
};

export const ComparisonView: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('budget');
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(6);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(20000000);
  const [compareType, setCompareType] = useState<CompareType>('AGE');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    metricConfigs.budget.my.categories[0].categoryId
  );
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pairCompareType, setPairCompareType] = useState<CompareType>('AGE');
  const [pairCategoryId, setPairCategoryId] = useState<number>(
    metricConfigs.budget.my.categories[0].categoryId
  );
  const [overallFilterMetric, setOverallFilterMetric] = useState<MetricKey>('budget');

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  const activeMetric: MetricKey | null =
    mainTab === 'overall' ? null : (mainTab as MetricKey);

  // 메트릭 전환 시 카테고리 선택 자동 보정
  React.useEffect(() => {
    if (!activeMetric) return;
    const cats = metricConfigs[activeMetric].my.categories;
    if (!cats.find((c) => c.categoryId === selectedCategoryId)) {
      setSelectedCategoryId(cats[0].categoryId);
    }
    if (!cats.find((c) => c.categoryId === pairCategoryId)) {
      setPairCategoryId(cats[0].categoryId);
    }
  }, [activeMetric, selectedCategoryId, pairCategoryId]);

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

  const renderMetricTab = (config: MetricConfig) => {
    const filteredPublicUsers = config.publicUsers.filter(
      (b) =>
        b.yearMonth === yearMonth &&
        b.total >= minAmount &&
        b.total <= maxAmount
    );

    const sumPublic = filteredPublicUsers.reduce((s, b) => s + b.total, 0);
    const avgPublic = filteredPublicUsers.length
      ? Math.round(sumPublic / filteredPublicUsers.length)
      : 0;

    const compareResult: CompareResult = (() => {
      let pool: PublicUserMetric[] = filteredPublicUsers;
      let label = '';
      let my = config.my.total;
      let avg = 0;

      if (compareType === 'AGE') {
        pool = filteredPublicUsers.filter((b) => b.ageGroup === '30대');
        label = '30대 평균';
        avg = pool.length ? pool.reduce((s, b) => s + b.total, 0) / pool.length : 0;
      } else if (compareType === 'AMOUNT') {
        pool = filteredPublicUsers;
        label = `${formatMan(minAmount)}~${formatMan(maxAmount)}원 구간 평균`;
        avg = pool.length ? pool.reduce((s, b) => s + b.total, 0) / pool.length : 0;
      } else {
        const cat = config.my.categories.find(
          (c) => c.categoryId === selectedCategoryId
        );
        pool = filteredPublicUsers;
        my = cat?.amount ?? 0;
        avg = config.categoryAverages[selectedCategoryId] ?? 0;
        label = `${cat?.categoryName ?? ''} 카테고리 평균`;
      }

      return {
        type: compareType,
        yearMonth,
        myAmount: my,
        averageAmount: Math.round(avg),
        sampleSize: pool.length,
        difference: my - Math.round(avg),
        label
      };
    })();

    const isMyLess = compareResult.difference < 0;
    const totalAmt = config.my.total;

    return (
      <>
        {/* Top Stat Cards */}
        <div className="dashboard-grid-3">
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
              <span className="card-title">카테고리 수</span>
              <div className="icon-wrapper">
                <Filter size={20} />
              </div>
            </div>
            <div className="stat-value">{config.my.categories.length}개</div>
            <div className="stat-label">{config.label} 카테고리</div>
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
              {formatKRW(Math.abs(compareResult.difference))}
            </div>
            <div className="stat-label">{compareResult.label}</div>
          </div>
        </div>

        {/* Main 2-Column: 내 카테고리 + 평균 비교 */}
        <div className="dashboard-grid-3">
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header-row">
              <span className="card-title">내 카테고리별 {config.label}</span>
              <span className="stat-label" style={{ marginTop: 0 }}>
                총 {formatKRW(totalAmt)}원
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {config.my.categories.map((cat) => {
                const pct = totalAmt > 0 ? (cat.amount / totalAmt) * 100 : 0;
                return (
                  <div key={cat.categoryId}>
                    <div className="asset-progress-header" style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="legend-dot" style={{ backgroundColor: cat.color }}></div>
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

          <div className="card">
            <div className="card-header-row">
              <span className="card-title">평균 {config.label} 비교</span>
            </div>

            <div className="sub-tabs-container" style={{ width: '100%' }}>
              {(
                [
                  { id: 'AGE', label: '나이대' },
                  { id: 'AMOUNT', label: '금액' },
                  { id: 'CATEGORY', label: '카테고리' }
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
                    marginBottom: '8px'
                  }}
                >
                  비교 카테고리
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {config.my.categories.map((cat) => {
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
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: cat.color
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
                marginBottom: '16px'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '4px'
                }}
              >
                {compareResult.label}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--text-primary)'
                }}
              >
                {formatKRW(compareResult.averageAmount)}원
              </div>
              {compareType !== 'CATEGORY' && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '4px'
                  }}
                >
                  표본 {compareResult.sampleSize}명
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">내 {config.label}</span>
                  <span className="asset-progress-val">
                    {formatKRW(compareResult.myAmount)}원
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (compareResult.myAmount /
                          Math.max(compareResult.myAmount, compareResult.averageAmount, 1)) *
                          100
                      )}%`,
                      backgroundColor: config.accentColor
                    }}
                  ></div>
                </div>
              </div>

              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">평균</span>
                  <span className="asset-progress-val">
                    {formatKRW(compareResult.averageAmount)}원
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (compareResult.averageAmount /
                          Math.max(compareResult.myAmount, compareResult.averageAmount, 1)) *
                          100
                      )}%`,
                      backgroundColor: '#94a3b8'
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
                color: isMyLess ? 'var(--green)' : 'var(--red)'
              }}
            >
              {isMyLess
                ? `평균보다 ${formatKRW(Math.abs(compareResult.difference))}원 ${config.verbNegative}`
                : `평균보다 ${formatKRW(Math.abs(compareResult.difference))}원 ${config.verbPositive}`}
            </div>
          </div>
        </div>

        {/* Filters */}
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
                  justifyContent: 'center'
                }}
              >
                <Filter size={18} />
              </div>
              <span className="card-title">공개 {config.label} 필터</span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              공개 설정한 사용자만 조회 (isPortfolioPublic=true)
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 2fr',
              gap: '16px',
              alignItems: 'end'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}
              >
                연도
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}
              >
                월
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}
              >
                월 총 {config.label} 금액 구간:{' '}
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
                  onChange={(e) =>
                    setMinAmount(Math.min(Number(e.target.value), maxAmount))
                  }
                  style={{ flex: 1, accentColor: config.accentColor }}
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
                  style={{ flex: 1, accentColor: config.accentColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Public users list */}
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
                  justifyContent: 'center'
                }}
              >
                <Users size={18} />
              </div>
              <span className="card-title">공개 사용자 월 총 {config.label}</span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              필터링 결과 {filteredPublicUsers.length}건 · 평균 {formatKRW(avgPublic)}원
            </span>
          </div>

          {filteredPublicUsers.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '13px'
              }}
            >
              필터 조건에 맞는 공개 사용자가 없습니다. 금액 구간을 조정해 보세요.
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
                          {u.ageGroup} · {u.region}
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

  const renderUserDetailView = (config: MetricConfig) => {
    const target = config.publicUsers.find((u) => u.userId === selectedUserId);
    if (!target) return null;

    let pairCompare: PairCompareResult;

    if (pairCompareType === 'AGE' || pairCompareType === 'AMOUNT') {
      pairCompare = {
        type: pairCompareType,
        yearMonth,
        myLabel: `내 월 총 ${config.label}`,
        myAmount: config.my.total,
        targetLabel: `${target.username} 월 총 ${config.label}`,
        targetAmount: target.total,
        difference: config.my.total - target.total
      };
    } else {
      const myCat = config.my.categories.find(
        (c) => c.categoryId === pairCategoryId
      );
      const targetCat = target.categories.find(
        (c) => c.categoryId === pairCategoryId
      );
      pairCompare = {
        type: 'CATEGORY',
        yearMonth,
        myLabel: `내 ${myCat?.categoryName ?? ''}`,
        myAmount: myCat?.amount ?? 0,
        targetLabel: `${target.username} ${targetCat?.categoryName ?? ''}`,
        targetAmount: targetCat?.amount ?? 0,
        difference: (myCat?.amount ?? 0) - (targetCat?.amount ?? 0)
      };
    }

    const isMyLess = pairCompare.difference < 0;
    const maxPairAmount = Math.max(pairCompare.myAmount, pairCompare.targetAmount, 1);
    const maxCatBudget = Math.max(
      ...config.my.categories.map((c) => c.amount),
      ...target.categories.map((c) => c.amount),
      1
    );

    return (
      <>
        {/* Detail header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => setSelectedUserId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}
            >
              <ArrowLeft size={14} />
              <span>목록으로</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="public-user-avatar" style={{ width: '44px', height: '44px' }}>
                {target.username.charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--text-primary)'
                  }}
                >
                  {target.username}와(과)의 {config.label} 비교
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    marginTop: '2px'
                  }}
                >
                  {target.ageGroup} · {target.region} · {target.yearMonth}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-side total cards */}
        <div className="dashboard-grid-3" style={{ marginTop: 0 }}>
          <div className={`card stat-card ${config.themeClass}`}>
            <div className="card-header-row">
              <span className="card-title">내 월 총 {config.label}</span>
              <div className="icon-wrapper">{metricIcon[config.key]}</div>
            </div>
            <div className="stat-value">{formatKRW(config.my.total)}</div>
            <div className="stat-label">{yearMonth} 기준</div>
          </div>

          <div className="card stat-card purple-theme">
            <div className="card-header-row">
              <span className="card-title">{target.username} 월 총 {config.label}</span>
              <div className="icon-wrapper">{metricIcon[config.key]}</div>
            </div>
            <div className="stat-value">{formatKRW(target.total)}</div>
            <div className="stat-label">{target.yearMonth} 기준</div>
          </div>

          <div className="card stat-card navy-theme">
            <div className="card-header-row">
              <span className="card-title">총 {config.label} 차이</span>
              <div className="icon-wrapper">
                {config.my.total < target.total ? (
                  <TrendingDown size={20} />
                ) : (
                  <TrendingUp size={20} />
                )}
              </div>
            </div>
            <div className="stat-value">
              {config.my.total < target.total ? '-' : '+'}
              {formatKRW(Math.abs(config.my.total - target.total))}
            </div>
            <div className="stat-label">내 {config.label} - 상대 {config.label}</div>
          </div>
        </div>

        {/* Category breakdown side-by-side */}
        <div className="dashboard-grid-3" style={{ marginTop: '24px' }}>
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header-row">
              <span className="card-title">카테고리별 {config.label} 상세</span>
              <span className="stat-label" style={{ marginTop: 0 }}>
                나 vs {target.username}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {config.my.categories.map((myCat) => {
                const tCat = target.categories.find(
                  (c) => c.categoryId === myCat.categoryId
                );
                const tAmount = tCat?.amount ?? 0;
                const catDiff = myCat.amount - tAmount;
                const isLess = catDiff < 0;
                const myW = (myCat.amount / maxCatBudget) * 100;
                const tW = (tAmount / maxCatBudget) * 100;

                return (
                  <div key={myCat.categoryId}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="legend-dot" style={{ backgroundColor: myCat.color }}></div>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {myCat.categoryName}
                        </span>
                      </div>
                      <span className={`public-user-diff-badge ${isLess ? 'less' : 'more'}`}>
                        {isLess ? '-' : '+'}
                        {formatKRW(Math.abs(catDiff))}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            width: '64px',
                            flexShrink: 0
                          }}
                        >
                          내 {config.label}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div className="progress-bar-container" style={{ height: '14px' }}>
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${myW}%`, backgroundColor: myCat.color }}
                            ></div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            width: '90px',
                            textAlign: 'right'
                          }}
                        >
                          {formatKRW(myCat.amount)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            width: '64px',
                            flexShrink: 0
                          }}
                        >
                          {target.username}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div className="progress-bar-container" style={{ height: '14px' }}>
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${tW}%`, backgroundColor: '#cbd5e1' }}
                            ></div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            width: '90px',
                            textAlign: 'right'
                          }}
                        >
                          {formatKRW(tAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header-row">
              <span className="card-title">{target.username}와 비교</span>
            </div>

            <div className="sub-tabs-container" style={{ width: '100%' }}>
              {(
                [
                  { id: 'AGE', label: '나이대' },
                  { id: 'AMOUNT', label: '금액' },
                  { id: 'CATEGORY', label: '카테고리' }
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
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}
                >
                  비교 카테고리
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {config.my.categories.map((cat) => {
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
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: cat.color
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
              <div
                style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px'
                }}
              >
                {formatMan(minAmount)}~{formatMan(maxAmount)}원 구간 기준 비교
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">{pairCompare.myLabel}</span>
                  <span className="asset-progress-val">
                    {formatKRW(pairCompare.myAmount)}원
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${(pairCompare.myAmount / maxPairAmount) * 100}%`,
                      backgroundColor: config.accentColor
                    }}
                  ></div>
                </div>
              </div>

              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">{pairCompare.targetLabel}</span>
                  <span className="asset-progress-val">
                    {formatKRW(pairCompare.targetAmount)}원
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${(pairCompare.targetAmount / maxPairAmount) * 100}%`,
                      backgroundColor: '#8b5cf6'
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
                color: isMyLess ? 'var(--green)' : 'var(--red)'
              }}
            >
              {isMyLess
                ? `상대보다 ${formatKRW(Math.abs(pairCompare.difference))}원 ${config.verbNegative}`
                : `상대보다 ${formatKRW(Math.abs(pairCompare.difference))}원 ${config.verbPositive}`}
            </div>
          </div>
        </div>
      </>
    );
  };

  // === 종합 비교: 예산 / 지출 / 수입을 한 화면에서 비교 ===
  const renderOverallTab = () => {
    const b = metricConfigs.budget;
    const e = metricConfigs.expense;
    const i = metricConfigs.income;

    // 필터 기준 메트릭의 공개 사용자에서 [연도/월 + 금액 구간] 통과한 userId 추출
    const filterConfig = metricConfigs[overallFilterMetric];
    const passingUserIds = new Set(
      filterConfig.publicUsers
        .filter(
          (u) =>
            u.yearMonth === yearMonth &&
            u.total >= minAmount &&
            u.total <= maxAmount
        )
        .map((u) => u.userId)
    );

    const filteredUsers = (users: PublicUserMetric[]) =>
      users.filter((u) => passingUserIds.has(u.userId) && u.yearMonth === yearMonth);

    const filteredBudgetUsers = filteredUsers(b.publicUsers);
    const filteredExpenseUsers = filteredUsers(e.publicUsers);
    const filteredIncomeUsers = filteredUsers(i.publicUsers);

    const avgOf = (arr: PublicUserMetric[]) =>
      arr.length === 0 ? 0 : Math.round(arr.reduce((s, u) => s + u.total, 0) / arr.length);

    const avgBudget = avgOf(filteredBudgetUsers);
    const avgExpense = avgOf(filteredExpenseUsers);
    const avgIncome = avgOf(filteredIncomeUsers);

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
        my: b.my.total,
        avg: avgBudget,
        color: '#3b82f6',
        icon: <Wallet size={20} />,
        themeClass: 'blue-theme'
      },
      {
        key: 'expense',
        label: '지출',
        my: e.my.total,
        avg: avgExpense,
        color: '#f43f5e',
        icon: <ArrowDownRight size={20} />,
        themeClass: 'red-theme'
      },
      {
        key: 'income',
        label: '수입',
        my: i.my.total,
        avg: avgIncome,
        color: '#10b981',
        icon: <ArrowUpRight size={20} />,
        themeClass: 'purple-theme'
      }
    ];

    // 공개 사용자 결합 (필터 통과 사용자 + 각 메트릭 total 합산)
    const overallPublicUsers = b.publicUsers
      .filter((u) => passingUserIds.has(u.userId) && u.yearMonth === yearMonth)
      .map((bu) => {
        const eu = e.publicUsers.find((x) => x.userId === bu.userId);
        const iu = i.publicUsers.find((x) => x.userId === bu.userId);
        return {
          userId: bu.userId,
          username: bu.username,
          yearMonth: bu.yearMonth,
          ageGroup: bu.ageGroup,
          region: bu.region,
          budget: bu.total,
          expense: eu?.total ?? 0,
          income: iu?.total ?? 0
        };
      });

    return (
      <>
        {/* 3-stat overview */}
        <div className="dashboard-grid-3">
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
                  평균 대비 {isLess ? '-' : '+'}
                  {formatKRW(Math.abs(diff))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Side-by-side mine vs average bars */}
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
                  justifyContent: 'center'
                }}
              >
                <PieChart size={18} />
              </div>
              <span className="card-title">예산 · 지출 · 수입 종합</span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              {yearMonth} · 공개 사용자 평균과 비교
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {rows.map((row) => {
              const maxVal = Math.max(row.my, row.avg, 1);
              const diff = row.my - row.avg;
              const isLess = diff < 0;
              return (
                <div key={row.key}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="legend-dot" style={{ backgroundColor: row.color }}></div>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {row.label}
                      </span>
                    </div>
                    <span className={`public-user-diff-badge ${isLess ? 'less' : 'more'}`}>
                      {isLess ? '-' : '+'}
                      {formatKRW(Math.abs(diff))}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          width: '64px',
                          flexShrink: 0
                        }}
                      >
                        나
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar-container" style={{ height: '14px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(row.my / maxVal) * 100}%`,
                              backgroundColor: row.color
                            }}
                          ></div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          width: '100px',
                          textAlign: 'right'
                        }}
                      >
                        {formatKRW(row.my)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          width: '64px',
                          flexShrink: 0
                        }}
                      >
                        이웃 평균
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar-container" style={{ height: '14px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(row.avg / maxVal) * 100}%`,
                              backgroundColor: '#cbd5e1'
                            }}
                          ></div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          width: '100px',
                          textAlign: 'right'
                        }}
                      >
                        {formatKRW(row.avg)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
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
                  justifyContent: 'center'
                }}
              >
                <Filter size={18} />
              </div>
              <span className="card-title">공개 사용자 필터</span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              공개 설정한 사용자만 조회 (isPortfolioPublic=true)
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 2fr',
              gap: '16px',
              alignItems: 'end'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}
              >
                연도
              </label>
              <select
                value={year}
                onChange={(ev) => setYear(Number(ev.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}
              >
                월
              </label>
              <select
                value={month}
                onChange={(ev) => setMonth(Number(ev.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}
              >
                금액 기준
              </label>
              <select
                value={overallFilterMetric}
                onChange={(ev) =>
                  setOverallFilterMetric(ev.target.value as MetricKey)
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                <option value="budget">예산</option>
                <option value="expense">지출</option>
                <option value="income">수입</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}
              >
                월 총 {metricConfigs[overallFilterMetric].label} 금액 구간:{' '}
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
                    accentColor: metricConfigs[overallFilterMetric].accentColor
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
                    accentColor: metricConfigs[overallFilterMetric].accentColor
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Public users list */}
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
                  justifyContent: 'center'
                }}
              >
                <Users size={18} />
              </div>
              <span className="card-title">공개 사용자 종합 현황</span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              {overallPublicUsers.length}명 · 사용자를 선택하면 상세 비교가 열려요
            </span>
          </div>

          {overallPublicUsers.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '13px'
              }}
            >
              해당 기간에 공개된 사용자가 없습니다.
            </div>
          ) : (
            <div className="public-user-grid">
              {overallPublicUsers.map((u) => {
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
                          {u.ageGroup} · {u.region}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border)'
                      }}
                    >
                      {([
                        { label: '예산', value: u.budget, color: '#3b82f6' },
                        { label: '지출', value: u.expense, color: '#f43f5e' },
                        { label: '수입', value: u.income, color: '#10b981' }
                      ] as const).map((m) => (
                        <div
                          key={m.label}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px'
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 600,
                              color: 'var(--text-secondary)'
                            }}
                          >
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: m.color
                              }}
                            ></span>
                            {m.label}
                          </span>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {formatKRW(m.value)}원
                          </span>
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

  // === 종합 탭 - 사용자 선택 상세 비교 ===
  const renderOverallDetailView = () => {
    const b = metricConfigs.budget;
    const e = metricConfigs.expense;
    const i = metricConfigs.income;
    const targetBudget = b.publicUsers.find((u) => u.userId === selectedUserId);
    const targetExpense = e.publicUsers.find((u) => u.userId === selectedUserId);
    const targetIncome = i.publicUsers.find((u) => u.userId === selectedUserId);
    if (!targetBudget) return null;

    const sections: {
      key: MetricKey;
      label: string;
      my: number;
      target: number;
      color: string;
      themeClass: 'blue-theme' | 'red-theme' | 'purple-theme';
      icon: React.ReactNode;
    }[] = [
      {
        key: 'budget',
        label: '예산',
        my: b.my.total,
        target: targetBudget.total,
        color: '#3b82f6',
        themeClass: 'blue-theme',
        icon: <Wallet size={20} />
      },
      {
        key: 'expense',
        label: '지출',
        my: e.my.total,
        target: targetExpense?.total ?? 0,
        color: '#f43f5e',
        themeClass: 'red-theme',
        icon: <ArrowDownRight size={20} />
      },
      {
        key: 'income',
        label: '수입',
        my: i.my.total,
        target: targetIncome?.total ?? 0,
        color: '#10b981',
        themeClass: 'purple-theme',
        icon: <ArrowUpRight size={20} />
      }
    ];

    return (
      <>
        {/* Detail header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => setSelectedUserId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}
            >
              <ArrowLeft size={14} />
              <span>목록으로</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="public-user-avatar" style={{ width: '44px', height: '44px' }}>
                {targetBudget.username.charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--text-primary)'
                  }}
                >
                  {targetBudget.username}와(과)의 종합 비교
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    marginTop: '2px'
                  }}
                >
                  {targetBudget.ageGroup} · {targetBudget.region} · {targetBudget.yearMonth}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-stat top: 차이 */}
        <div className="dashboard-grid-3">
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
                <div className="stat-label">내 {sec.label} - 상대 {sec.label}</div>
              </div>
            );
          })}
        </div>

        {/* Side-by-side mine vs target bars */}
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
                  justifyContent: 'center'
                }}
              >
                <PieChart size={18} />
              </div>
              <span className="card-title">예산 · 지출 · 수입 1:1 비교</span>
            </div>
            <span className="stat-label" style={{ marginTop: 0 }}>
              나 vs {targetBudget.username}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {sections.map((sec) => {
              const maxVal = Math.max(sec.my, sec.target, 1);
              const diff = sec.my - sec.target;
              const isLess = diff < 0;
              return (
                <div key={sec.key}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="legend-dot" style={{ backgroundColor: sec.color }}></div>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {sec.label}
                      </span>
                    </div>
                    <span className={`public-user-diff-badge ${isLess ? 'less' : 'more'}`}>
                      {isLess ? '-' : '+'}
                      {formatKRW(Math.abs(diff))}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          width: '64px',
                          flexShrink: 0
                        }}
                      >
                        내 {sec.label}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar-container" style={{ height: '14px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(sec.my / maxVal) * 100}%`,
                              backgroundColor: sec.color
                            }}
                          ></div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          width: '100px',
                          textAlign: 'right'
                        }}
                      >
                        {formatKRW(sec.my)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          width: '64px',
                          flexShrink: 0
                        }}
                      >
                        {targetBudget.username}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar-container" style={{ height: '14px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(sec.target / maxVal) * 100}%`,
                              backgroundColor: '#cbd5e1'
                            }}
                          ></div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          width: '100px',
                          textAlign: 'right'
                        }}
                      >
                        {formatKRW(sec.target)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 카테고리별 비교 (메트릭 3개 섹션 스택) */}
        {sections.map((sec) => {
          const cfg = metricConfigs[sec.key];
          const targetUser =
            sec.key === 'budget'
              ? targetBudget
              : sec.key === 'expense'
              ? targetExpense
              : targetIncome;
          if (!targetUser) return null;

          const maxCatAmount = Math.max(
            ...cfg.my.categories.map((c) => c.amount),
            ...targetUser.categories.map((c) => c.amount),
            1
          );

          return (
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
                      justifyContent: 'center'
                    }}
                  >
                    {sec.icon}
                  </div>
                  <span className="card-title">{sec.label} 카테고리별 비교</span>
                </div>
                <span className="stat-label" style={{ marginTop: 0 }}>
                  나 vs {targetBudget.username}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {cfg.my.categories.map((myCat) => {
                  const tCat = targetUser.categories.find(
                    (c) => c.categoryId === myCat.categoryId
                  );
                  const tAmount = tCat?.amount ?? 0;
                  const catDiff = myCat.amount - tAmount;
                  const isLess = catDiff < 0;
                  const myW = (myCat.amount / maxCatAmount) * 100;
                  const tW = (tAmount / maxCatAmount) * 100;

                  return (
                    <div key={myCat.categoryId}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            className="legend-dot"
                            style={{ backgroundColor: myCat.color }}
                          ></div>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {myCat.categoryName}
                          </span>
                        </div>
                        <span
                          className={`public-user-diff-badge ${isLess ? 'less' : 'more'}`}
                        >
                          {isLess ? '-' : '+'}
                          {formatKRW(Math.abs(catDiff))}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              width: '64px',
                              flexShrink: 0
                            }}
                          >
                            내 {sec.label}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div className="progress-bar-container" style={{ height: '14px' }}>
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${myW}%`,
                                  backgroundColor: myCat.color
                                }}
                              ></div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              width: '90px',
                              textAlign: 'right'
                            }}
                          >
                            {formatKRW(myCat.amount)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              width: '64px',
                              flexShrink: 0
                            }}
                          >
                            {targetBudget.username}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div className="progress-bar-container" style={{ height: '14px' }}>
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${tW}%`,
                                  backgroundColor: '#cbd5e1'
                                }}
                              ></div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              width: '90px',
                              textAlign: 'right'
                            }}
                          >
                            {formatKRW(tAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
        gap: '20px'
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
          justifyContent: 'center'
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
            marginBottom: '8px'
          }}
        >
          {label} 비교는 준비 중입니다
        </h2>
      </div>
    </div>
  );

  // 탭 전환 시 선택 사용자 초기화
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
        <div className="dashboard-date-selector">
          <button className="dashboard-date-arrow" onClick={handlePrevMonth} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span>
            {year}년 {month}월
          </span>
          <button className="dashboard-date-arrow" onClick={handleNextMonth} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {activeMetric &&
        (selectedUserId !== null
          ? renderUserDetailView(metricConfigs[activeMetric])
          : renderMetricTab(metricConfigs[activeMetric]))}

      {mainTab === 'overall' &&
        (selectedUserId !== null ? renderOverallDetailView() : renderOverallTab())}

      {/* Placeholder fallback (안전 가드) */}
      {!activeMetric && mainTab !== 'overall' && renderPlaceholder('해당')}
    </div>
  );
};
