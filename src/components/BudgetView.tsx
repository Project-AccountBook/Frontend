import React, { useEffect, useMemo, useState } from 'react';
import {
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  Search,
  Wallet,
  AlertTriangle,
  TrendingDown,
  Coins,
  Tag,
  X,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { MonthYearNavigator } from './MonthYearNavigator';

interface BudgetItem {
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

interface BudgetFormPayload {
  categoryId: number;
  totalBudget: number;
  expectedExpense: number;
}

type BudgetsByMonth = Record<string, BudgetItem[]>;

interface ExpenseCategory {
  id: number;
  name: string;
  isCustom: boolean;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 1, name: '식비', isCustom: false },
  { id: 2, name: '주거비', isCustom: false },
  { id: 3, name: '육아용품', isCustom: false },
  { id: 4, name: '교통/통신', isCustom: false },
  { id: 5, name: '의료/건강', isCustom: false },
  { id: 6, name: '기타/예비비', isCustom: false },
  { id: 7, name: '아이간식', isCustom: true },
  { id: 8, name: '학원비', isCustom: true }
];

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

const STATUS_TABS = [
  { id: 'all', label: '전체' },
  { id: 'normal', label: '정상' },
  { id: 'over', label: '초과' }
] as const;

const JUNE_2026_BUDGETS: BudgetItem[] = [
  {
    id: 1,
    categoryId: 1,
    categoryName: '식비',
    totalBudget: 2000000,
    expectedExpense: 500000,
    totalPlannedBudget: 2500000,
    actualExpense: 1850000,
    remainingBudget: 650000,
    progress: 74
  },
  {
    id: 2,
    categoryId: 2,
    categoryName: '주거비',
    totalBudget: 1500000,
    expectedExpense: 0,
    totalPlannedBudget: 1500000,
    actualExpense: 1500000,
    remainingBudget: 0,
    progress: 100
  },
  {
    id: 3,
    categoryId: 3,
    categoryName: '육아용품',
    totalBudget: 1000000,
    expectedExpense: 200000,
    totalPlannedBudget: 1200000,
    actualExpense: 1300000,
    remainingBudget: -100000,
    progress: 108
  },
  {
    id: 4,
    categoryId: 4,
    categoryName: '교통/통신',
    totalBudget: 600000,
    expectedExpense: 200000,
    totalPlannedBudget: 800000,
    actualExpense: 620000,
    remainingBudget: 180000,
    progress: 78
  },
  {
    id: 7,
    categoryId: 7,
    categoryName: '아이간식',
    totalBudget: 300000,
    expectedExpense: 50000,
    totalPlannedBudget: 350000,
    actualExpense: 280000,
    remainingBudget: 70000,
    progress: 80
  }
];

const INITIAL_BUDGETS_BY_MONTH: BudgetsByMonth = {
  '2026-04': [
    {
      id: 101,
      categoryId: 1,
      categoryName: '식비',
      totalBudget: 2200000,
      expectedExpense: 300000,
      totalPlannedBudget: 2500000,
      actualExpense: 2100000,
      remainingBudget: 400000,
      progress: 84
    },
    {
      id: 102,
      categoryId: 2,
      categoryName: '주거비',
      totalBudget: 1500000,
      expectedExpense: 0,
      totalPlannedBudget: 1500000,
      actualExpense: 1500000,
      remainingBudget: 0,
      progress: 100
    },
    {
      id: 103,
      categoryId: 3,
      categoryName: '육아용품',
      totalBudget: 900000,
      expectedExpense: 100000,
      totalPlannedBudget: 1000000,
      actualExpense: 850000,
      remainingBudget: 150000,
      progress: 85
    }
  ],
  '2026-05': [
    {
      id: 201,
      categoryId: 1,
      categoryName: '식비',
      totalBudget: 2100000,
      expectedExpense: 400000,
      totalPlannedBudget: 2500000,
      actualExpense: 1920000,
      remainingBudget: 580000,
      progress: 77
    },
    {
      id: 202,
      categoryId: 2,
      categoryName: '주거비',
      totalBudget: 1500000,
      expectedExpense: 0,
      totalPlannedBudget: 1500000,
      actualExpense: 1500000,
      remainingBudget: 0,
      progress: 100
    },
    {
      id: 203,
      categoryId: 4,
      categoryName: '교통/통신',
      totalBudget: 550000,
      expectedExpense: 150000,
      totalPlannedBudget: 700000,
      actualExpense: 510000,
      remainingBudget: 190000,
      progress: 73
    },
    {
      id: 204,
      categoryId: 8,
      categoryName: '학원비',
      totalBudget: 400000,
      expectedExpense: 0,
      totalPlannedBudget: 400000,
      actualExpense: 400000,
      remainingBudget: 0,
      progress: 100
    }
  ],
  '2026-06': JUNE_2026_BUDGETS
};

const formatKRW = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

const parseAmount = (value: string) => Number(value.replace(/[^\d]/g, '')) || 0;

const formatYearMonth = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const formatYearMonthLabel = (yearMonth: string) => {
  const [y, m] = yearMonth.split('-');
  return `${y}년 ${Number(m)}월`;
};

const parseYearMonthToDate = (yearMonth: string) => {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m - 1, 1);
};

const getCategoryById = (id: number) => EXPENSE_CATEGORIES.find((c) => c.id === id);

const getCategoryColor = (categoryId: number) => {
  const idx = EXPENSE_CATEGORIES.findIndex((c) => c.id === categoryId);
  return CATEGORY_COLORS[idx >= 0 ? idx % CATEGORY_COLORS.length : 0];
};

const buildBudgetItem = (
  id: number,
  categoryId: number,
  totalBudget: number,
  expectedExpense: number,
  actualExpense: number
): BudgetItem => {
  const category = getCategoryById(categoryId);
  const totalPlannedBudget = totalBudget + expectedExpense;
  const remainingBudget = totalPlannedBudget - actualExpense;
  const progress =
    totalPlannedBudget > 0 ? Math.round((actualExpense / totalPlannedBudget) * 100) : 0;

  return {
    id,
    categoryId,
    categoryName: category?.name ?? '기타',
    totalBudget,
    expectedExpense,
    totalPlannedBudget,
    actualExpense,
    remainingBudget,
    progress
  };
};

const computeSummary = (budgets: BudgetItem[], yearMonth: string) => {
  const totalPlannedBudgetSum = budgets.reduce((sum, b) => sum + b.totalPlannedBudget, 0);
  const totalActualExpenseSum = budgets.reduce((sum, b) => sum + b.actualExpense, 0);
  const totalRemainingBudget = totalPlannedBudgetSum - totalActualExpenseSum;
  return { yearMonth, totalPlannedBudgetSum, totalActualExpenseSum, totalRemainingBudget };
};

const buildFilterTabs = (categoryNames: string[]) => ['전체', ...categoryNames];

interface CircularRingProps {
  percent: number;
  color: string;
  size?: number;
  stroke?: number;
}

const CircularRing: React.FC<CircularRingProps> = ({
  percent,
  color,
  size = 64,
  stroke = 5
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={percent > 100 ? 'var(--red)' : color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
};

const CompactStat: React.FC<{
  label: string;
  value: string;
  sub?: string;
  iconColor?: string;
  valueColor?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, iconColor = 'var(--text-secondary)', valueColor, icon }) => (
  <div
    style={{
      padding: '16px 18px',
      borderRadius: '12px',
      background: '#fff',
      border: '1px solid var(--border)',
      minWidth: 0,
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px'
      }}
    >
      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span style={{ color: iconColor, display: 'flex' }}>{icon}</span>
    </div>
    <div
      style={{
        fontSize: '20px',
        fontWeight: '800',
        color: valueColor ?? 'var(--text-primary)',
        letterSpacing: '-0.4px',
        lineHeight: 1.2
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginTop: '6px',
          fontWeight: '500'
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const CategoryProgressCard: React.FC<{ item: BudgetItem }> = ({ item }) => {
  const color = getCategoryColor(item.categoryId);
  const isOver = item.remainingBudget < 0;
  const isWarning = !isOver && item.progress >= 85;

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: `1px solid ${isOver ? 'var(--red-border)' : 'var(--border)'}`,
        background: isOver ? '#fffafa' : '#fff',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <CircularRing percent={item.progress} color={color} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '800',
              color: isOver ? 'var(--red)' : 'var(--text-primary)'
            }}
          >
            {item.progress}%
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '10px'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {item.categoryName}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '20px',
                flexShrink: 0,
                background: isOver ? 'var(--red-bg)' : isWarning ? '#fff7ed' : '#ecfdf5',
                color: isOver ? 'var(--red)' : isWarning ? '#ea580c' : '#10b981',
                border: `1px solid ${isOver ? 'var(--red-border)' : isWarning ? '#fed7aa' : '#a7f3d0'}`
              }}
            >
              {isOver ? '초과' : isWarning ? '주의' : '정상'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
            <AmountCell label="지출" value={item.actualExpense} />
            <AmountCell label="예산" value={item.totalPlannedBudget} />
            <AmountCell
              label="잔액"
              value={Math.abs(item.remainingBudget)}
              prefix={isOver ? '-' : ''}
              color={isOver ? 'var(--red)' : '#10b981'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const AmountCell: React.FC<{
  label: string;
  value: number;
  prefix?: string;
  color?: string;
}> = ({ label, value, prefix = '', color }) => (
  <div style={{ padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', minWidth: 0 }}>
    <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '2px' }}>
      {label}
    </div>
    <div
      style={{
        fontSize: '11px',
        fontWeight: '700',
        color: color ?? 'var(--text-primary)',
        lineHeight: 1.3,
        wordBreak: 'break-all'
      }}
    >
      {prefix}
      {formatKRW(value)}
    </div>
  </div>
);

interface BudgetModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  modalDate: Date;
  onModalDateChange: (date: Date) => void;
  budgets: BudgetItem[];
  editItem?: BudgetItem | null;
  onClose: () => void;
  onSubmit: (yearMonth: string, payload: BudgetFormPayload, editId?: number) => void;
  onGoToCategorySettings?: () => void;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  open,
  mode,
  modalDate,
  onModalDateChange,
  budgets,
  editItem,
  onClose,
  onSubmit,
  onGoToCategorySettings
}) => {
  const isEdit = mode === 'edit';
  const yearMonth = formatYearMonth(modalDate);
  const yearMonthLabel = formatYearMonthLabel(yearMonth);

  const usedCategoryIds = new Set(
    budgets.filter((b) => b.id !== editItem?.id).map((b) => b.categoryId)
  );

  const availableCategories =
    isEdit && editItem
      ? EXPENSE_CATEGORIES.filter((c) => c.id === editItem.categoryId)
      : EXPENSE_CATEGORIES.filter((c) => !usedCategoryIds.has(c.id));

  const [categoryId, setCategoryId] = useState(
    editItem?.categoryId ?? availableCategories[0]?.id ?? 1
  );
  const [totalBudget, setTotalBudget] = useState(
    editItem ? formatKRW(editItem.totalBudget) : ''
  );
  const [expectedExpense, setExpectedExpense] = useState(
    editItem ? formatKRW(editItem.expectedExpense) : ''
  );

  useEffect(() => {
    if (!open) return;
    const used = new Set(
      budgets.filter((b) => b.id !== editItem?.id).map((b) => b.categoryId)
    );
    const available =
      isEdit && editItem
        ? EXPENSE_CATEGORIES.filter((c) => c.id === editItem.categoryId)
        : EXPENSE_CATEGORIES.filter((c) => !used.has(c.id));
    setCategoryId(editItem?.categoryId ?? available[0]?.id ?? 1);
    setTotalBudget(editItem ? formatKRW(editItem.totalBudget) : '');
    setExpectedExpense(editItem ? formatKRW(editItem.expectedExpense) : '');
  }, [open, editItem, budgets, isEdit, yearMonth]);

  if (!open) return null;

  const totalBudgetNum = parseAmount(totalBudget);
  const expectedExpenseNum = parseAmount(expectedExpense);
  const canSubmit =
    totalBudgetNum > 0 &&
    ((isEdit && editItem) || (!isEdit && availableCategories.length > 0));

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: '#f8fafc',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    outline: 'none'
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(
      yearMonth,
      { categoryId, totalBudget: totalBudgetNum, expectedExpense: expectedExpenseNum },
      editItem?.id
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        className="card fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <h2
            style={{
              fontSize: '17px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <PiggyBank size={18} color="var(--blue)" />
            {isEdit ? '예산 수정' : '예산 등록'}
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'white',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '10px'
            }}
          >
            <Calendar size={14} color="var(--blue)" />
            기준 월 {!isEdit && <span style={{ color: 'var(--red)' }}>*</span>}
          </label>
          <MonthYearNavigator
            date={modalDate}
            onDateChange={onModalDateChange}
            disabled={isEdit}
            compact
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '10px 14px',
              opacity: isEdit ? 0.7 : 1
            }}
          />
          {!isEdit && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              선택한 월에 예산이 등록됩니다
            </p>
          )}
        </div>

        <div style={{ marginBottom: '18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '10px'
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}
            >
              <Tag size={14} color="var(--blue)" />
              카테고리 <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            {onGoToCategorySettings && (
              <button
                type="button"
                onClick={onGoToCategorySettings}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--blue)',
                  cursor: 'pointer'
                }}
              >
                카테고리 관리
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {!isEdit && availableCategories.length === 0 ? (
            <div
              style={{
                padding: '14px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid var(--red-border)',
                textAlign: 'center'
              }}
            >
              <p style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '10px' }}>
                {yearMonthLabel}에 등록 가능한 카테고리가 없습니다.
              </p>
              {onGoToCategorySettings && (
                <button
                  type="button"
                  onClick={onGoToCategorySettings}
                  className="header-btn-primary"
                  style={{
                    background: 'var(--blue)',
                    margin: '0 auto',
                    fontSize: '12px',
                    padding: '8px 14px'
                  }}
                >
                  <Tag size={13} />
                  카테고리 추가하러 가기
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {availableCategories.map((cat) => {
                const selected = categoryId === cat.id;
                const color = getCategoryColor(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    disabled={isEdit}
                    className={`dashboard-tab-btn ${selected ? 'active' : ''}`}
                    style={
                      selected
                        ? { background: color, borderColor: color, color: 'white' }
                        : undefined
                    }
                  >
                    {cat.name}
                    {cat.isCustom && (
                      <span style={{ marginLeft: '4px', opacity: 0.8, fontSize: '10px' }}>
                        커스텀
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px',
              display: 'block'
            }}
          >
            총 예산 <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="예: 2,000,000"
            value={totalBudget}
            onChange={(e) => setTotalBudget(formatKRW(parseAmount(e.target.value)))}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px',
              display: 'block'
            }}
          >
            예상 지출
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="예: 500,000"
            value={expectedExpense}
            onChange={(e) =>
              setExpectedExpense(formatKRW(parseAmount(e.target.value)))
            }
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'white',
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--text-secondary)'
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="header-btn-primary"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: canSubmit ? 'var(--blue)' : '#cbd5e1',
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
            disabled={!canSubmit}
          >
            {isEdit ? '수정하기' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const BudgetView: React.FC<{ onGoToCategorySettings?: () => void }> = ({
  onGoToCategorySettings
}) => {
  const [budgetsByMonth, setBudgetsByMonth] = useState(INITIAL_BUDGETS_BY_MONTH);
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 5, 1));
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [modalDate, setModalDate] = useState(currentDate);

  const yearMonth = formatYearMonth(currentDate);
  const budgets = budgetsByMonth[yearMonth] ?? [];

  const getBudgetsForMonth = (ym: string) => budgetsByMonth[ym] ?? [];

  const onBudgetsChange = (next: React.SetStateAction<BudgetItem[]>) => {
    setBudgetsByMonth((prev) => ({
      ...prev,
      [yearMonth]: typeof next === 'function' ? next(prev[yearMonth] ?? []) : next
    }));
  };

  const handleSaveBudget = (
    targetYearMonth: string,
    payload: BudgetFormPayload,
    editId?: number
  ) => {
    setBudgetsByMonth((prev) => {
      const monthBudgets = prev[targetYearMonth] ?? [];
      if (editId !== undefined) {
        return {
          ...prev,
          [targetYearMonth]: monthBudgets.map((b) =>
            b.id === editId
              ? buildBudgetItem(
                  b.id,
                  payload.categoryId,
                  payload.totalBudget,
                  payload.expectedExpense,
                  b.actualExpense
                )
              : b
          )
        };
      }
      const allIds = Object.values(prev).flat().map((b) => b.id);
      const nextId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
      return {
        ...prev,
        [targetYearMonth]: [
          ...monthBudgets,
          buildBudgetItem(
            nextId,
            payload.categoryId,
            payload.totalBudget,
            payload.expectedExpense,
            0
          )
        ]
      };
    });
  };

  const yearMonthLabel = formatYearMonthLabel(yearMonth);
  const filterTabs = buildFilterTabs(EXPENSE_CATEGORIES.map((c) => c.name));

  useEffect(() => {
    setActiveCategory('전체');
    setSearch('');
  }, [yearMonth]);

  const summary = useMemo(() => computeSummary(budgets, yearMonth), [budgets, yearMonth]);

  const usagePercent =
    summary.totalPlannedBudgetSum > 0
      ? Math.round((summary.totalActualExpenseSum / summary.totalPlannedBudgetSum) * 100)
      : 0;

  const overBudgetItems = budgets.filter((b) => b.remainingBudget < 0);

  const filtered = budgets.filter((b) => {
    const matchCategory = activeCategory === '전체' || b.categoryName === activeCategory;
    const matchSearch =
      !search || b.categoryName.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      activeStatus === 'all' ||
      (activeStatus === 'over' && b.remainingBudget < 0) ||
      (activeStatus === 'normal' && b.remainingBudget >= 0);
    return matchCategory && matchSearch && matchStatus;
  });

  const modalYearMonth = formatYearMonth(modalDate);
  const modalBudgets = getBudgetsForMonth(modalYearMonth);

  const openCreateModal = () => {
    setEditItem(null);
    setModalMode('create');
    setModalDate(currentDate);
    setModalOpen(true);
  };

  const openEditModal = (item: BudgetItem) => {
    setEditItem(item);
    setModalMode('edit');
    setModalDate(currentDate);
    setModalOpen(true);
  };

  const handleModalSubmit = (
    targetYearMonth: string,
    payload: BudgetFormPayload,
    editId?: number
  ) => {
    handleSaveBudget(targetYearMonth, payload, editId);
    setCurrentDate(parseYearMonthToDate(targetYearMonth));
    setModalOpen(false);
    setEditItem(null);
    setModalMode('create');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    onBudgetsChange((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleGoToCategorySettings = () => {
    setModalOpen(false);
    setEditItem(null);
    setModalMode('create');
    onGoToCategorySettings?.();
  };

  return (
    <div className="fade-in">
      <div className="dashboard-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--blue-bg)',
              color: 'var(--blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PiggyBank size={20} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px'
              }}
            >
              예산 관리
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              월별 예산을 설정하고 카테고리별 지출 현황을 확인하세요
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <MonthYearNavigator
            date={currentDate}
            onDateChange={setCurrentDate}
            compact
          />
          {onGoToCategorySettings && (
            <button
              type="button"
              onClick={handleGoToCategorySettings}
              className="header-btn-secondary"
            >
              <Tag size={16} />
              <span>카테고리 관리</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="header-btn-primary"
            style={{ background: 'var(--blue)' }}
          >
            <Plus size={16} />
            <span>예산 등록</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px'
          }}
        >
          <Wallet size={16} color="var(--blue)" />
          <span className="card-title" style={{ fontSize: '15px' }}>
            {yearMonthLabel} 예산 요약
          </span>
          {budgets.length === 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              등록된 예산이 없습니다
            </span>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '12px'
          }}
        >
          <CompactStat
            label="총 예산"
            value={`${formatKRW(summary.totalPlannedBudgetSum)}원`}
            sub={`카테고리 ${budgets.length}개 설정`}
            icon={<PiggyBank size={18} />}
          />
          <CompactStat
            label="실제 지출"
            value={`${formatKRW(summary.totalActualExpenseSum)}원`}
            sub={`예산 대비 ${usagePercent}% 사용`}
            icon={<TrendingDown size={18} />}
          />
          <CompactStat
            label="잔액"
            value={`${summary.totalRemainingBudget < 0 ? '-' : ''}${formatKRW(Math.abs(summary.totalRemainingBudget))}원`}
            sub={summary.totalRemainingBudget >= 0 ? '남은 예산' : '예산 초과'}
            valueColor={summary.totalRemainingBudget < 0 ? 'var(--red)' : undefined}
            icon={<Coins size={18} />}
          />
        </div>
      </div>

      {overBudgetItems.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px 18px' }}>
          <div className="card-header-row" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#f43f5e" />
              <span className="card-title" style={{ fontSize: '14px' }}>
                예산 초과 알림
              </span>
            </div>
            <span className="stat-label">{overBudgetItems.length}개</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {overBudgetItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--red-border)',
                  background: 'var(--red-bg)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--red)'
                }}
              >
                {item.categoryName} · {formatKRW(Math.abs(item.remainingBudget))}원 초과
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px', padding: '16px 18px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {filterTabs.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`dashboard-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              padding: '6px 12px',
              borderRadius: '8px',
              minWidth: '200px'
            }}
          >
            <Search size={14} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="카테고리 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12px',
                width: '100%',
                fontFamily: 'inherit',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={`sub-tab-btn ${activeStatus === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {filtered.length}개 항목
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}
        >
          <span className="card-title">카테고리별 예산 진행률</span>
          {budgets.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#fff',
                color: usagePercent > 90 ? 'var(--red)' : 'var(--blue)',
                border: `1px solid ${usagePercent > 90 ? 'var(--red-border)' : 'var(--blue-border)'}`
              }}
            >
              전체 {usagePercent}%
            </span>
          )}
        </div>

        {filtered.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '12px'
            }}
          >
            {filtered.map((item) => (
              <CategoryProgressCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {yearMonthLabel}에 등록된 예산이 없습니다.
            </p>
            <button
              onClick={openCreateModal}
              className="header-btn-primary"
              style={{ background: 'var(--blue)', margin: '0 auto' }}
            >
              <Plus size={14} />
              <span>예산 등록하기</span>
            </button>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="card">
          <div className="card-header-row">
            <span className="card-title">예산 설정 내역</span>
          </div>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>총 예산</th>
                  <th>예상 지출</th>
                  <th>계획 합계</th>
                  <th>실제 지출</th>
                  <th>잔액</th>
                  <th>진척도</th>
                  <th>상태</th>
                  <th style={{ textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isOver = item.remainingBudget < 0;
                  const color = getCategoryColor(item.categoryId);

                  return (
                    <tr key={item.id}>
                      <td>
                        <span
                          className="group-buy-category"
                          style={{ borderColor: `${color}33`, color }}
                        >
                          {item.categoryName}
                        </span>
                      </td>
                      <td>{formatKRW(item.totalBudget)}원</td>
                      <td>{formatKRW(item.expectedExpense)}원</td>
                      <td style={{ fontWeight: '700' }}>{formatKRW(item.totalPlannedBudget)}원</td>
                      <td>{formatKRW(item.actualExpense)}원</td>
                      <td style={{ color: isOver ? 'var(--red)' : '#10b981', fontWeight: 700 }}>
                        {isOver ? '-' : ''}
                        {formatKRW(Math.abs(item.remainingBudget))}원
                      </td>
                      <td>{item.progress}%</td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isOver ? 'var(--red-bg)' : '#ecfdf5',
                            color: isOver ? 'var(--red)' : '#10b981'
                          }}
                        >
                          {isOver ? '초과' : '정상'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(item)}
                            aria-label="예산 수정"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              border: '1px solid var(--border)',
                              background: 'white',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            aria-label="예산 삭제"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              border: '1px solid var(--red-border)',
                              background: 'var(--red-bg)',
                              color: 'var(--red)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BudgetModal
        open={modalOpen}
        mode={modalMode}
        modalDate={modalDate}
        onModalDateChange={setModalDate}
        budgets={modalBudgets}
        editItem={editItem}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
          setModalMode('create');
        }}
        onSubmit={handleModalSubmit}
        onGoToCategorySettings={handleGoToCategorySettings}
      />

      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="card fade-in"
            style={{ width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>
              예산을 삭제할까요?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <strong>{deleteTarget.categoryName}</strong> ·{' '}
              {formatKRW(deleteTarget.totalPlannedBudget)}원
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'white',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'var(--red)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
