import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { budgetApi, categoryApi } from '../api';
import type { BudgetResponse, BudgetSummaryResponse, CategoryResponse } from '../api';
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

type ExpenseCategory = Pick<CategoryResponse, 'id' | 'name' | 'isCustom'>;

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

const mapBudgetResponse = (item: BudgetResponse): BudgetItem => ({
  id: item.id,
  categoryId: item.categoryId,
  categoryName: item.categoryName,
  totalBudget: Number(item.totalBudget),
  expectedExpense: Number(item.expectedExpense),
  totalPlannedBudget: Number(item.totalPlannedBudget),
  actualExpense: Number(item.actualExpense),
  remainingBudget: Number(item.remainingBudget),
  progress: Math.round(Number(item.progress)),
});

const getCategoryColor = (categoryId: number, categories: ExpenseCategory[]) => {
  const idx = categories.findIndex((c) => c.id === categoryId);
  return CATEGORY_COLORS[idx >= 0 ? idx % CATEGORY_COLORS.length : 0];
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

const CategoryProgressCard: React.FC<{
  item: BudgetItem;
  categories: ExpenseCategory[];
  onClick?: () => void;
}> = ({ item, categories, onClick }) => {
  const color = getCategoryColor(item.categoryId, categories);
  const isOver = item.remainingBudget < 0;
  const isWarning = !isOver && item.progress >= 85;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      title={onClick ? '클릭하여 예산 수정' : undefined}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: `1px solid ${isOver ? 'var(--red-border)' : 'var(--border)'}`,
        background: isOver ? '#fffafa' : '#fff',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'box-shadow 0.15s ease, border-color 0.15s ease' : undefined
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
  expenseCategories: ExpenseCategory[];
  editItem?: BudgetItem | null;
  onClose: () => void;
  onSubmit: (yearMonth: string, payload: BudgetFormPayload, editId?: number) => void;
  onDelete?: () => void;
  onGoToCategorySettings?: () => void;
  submitting?: boolean;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  open,
  mode,
  modalDate,
  onModalDateChange,
  budgets,
  expenseCategories,
  editItem,
  onClose,
  onSubmit,
  onDelete,
  onGoToCategorySettings,
  submitting = false
}) => {
  const isEdit = mode === 'edit';
  const yearMonth = formatYearMonth(modalDate);
  const yearMonthLabel = formatYearMonthLabel(yearMonth);

  const usedCategoryIds = new Set(
    budgets.filter((b) => b.id !== editItem?.id).map((b) => b.categoryId)
  );

  const availableCategories =
    isEdit && editItem
      ? expenseCategories.filter((c) => c.id === editItem.categoryId)
      : expenseCategories.filter((c) => !usedCategoryIds.has(c.id));

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
        ? expenseCategories.filter((c) => c.id === editItem.categoryId)
        : expenseCategories.filter((c) => !used.has(c.id));
    setCategoryId(editItem?.categoryId ?? available[0]?.id ?? 1);
    setTotalBudget(editItem ? formatKRW(editItem.totalBudget) : '');
    setExpectedExpense(editItem ? formatKRW(editItem.expectedExpense) : '');
  }, [open, editItem, budgets, isEdit, yearMonth, expenseCategories]);

  if (!open) return null;

  const totalBudgetNum = parseAmount(totalBudget);
  const expectedExpenseNum = parseAmount(expectedExpense);
  const canSubmit =
    !submitting &&
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
                const color = getCategoryColor(cat.id, expenseCategories);
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
              marginBottom: '4px',
              display: 'block'
            }}
          >
            기본 예산 <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
            이 카테고리에 매월 책정하는 기본 한도 금액입니다.
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="기본 예산 금액을 입력하세요"
            value={totalBudget}
            onChange={(e) => setTotalBudget(formatKRW(parseAmount(e.target.value)))}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px',
              display: 'block'
            }}
          >
            추가 예상 지출
          </label>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
            기본 예산 외에, 이번 달 추가로 지출할 것으로 예상되는 금액입니다. 없으면 비워두세요.
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="추가 예상 지출 금액을 입력하세요"
            value={expectedExpense}
            onChange={(e) =>
              setExpectedExpense(formatKRW(parseAmount(e.target.value)))
            }
            style={inputStyle}
          />
        </div>

        {(totalBudgetNum > 0 || expectedExpenseNum > 0) && (
          <div
            style={{
              marginBottom: '24px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--blue-bg)',
              border: '1px solid var(--blue-border)'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              이번 달 계획 합계
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--blue)' }}>
              {formatKRW(totalBudgetNum)}원 + {formatKRW(expectedExpenseNum)}원 ={' '}
              {formatKRW(totalBudgetNum + expectedExpenseNum)}원
            </div>
          </div>
        )}

        {totalBudgetNum <= 0 && expectedExpenseNum <= 0 && <div style={{ marginBottom: '24px' }} />}

        {isEdit && onDelete ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <button
              type="button"
              onClick={onDelete}
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--red-border)',
                background: 'var(--red-bg)',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--red)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1
              }}
            >
              <Trash2 size={14} />
              삭제
            </button>
            <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  maxWidth: '140px',
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
                  minWidth: '100px',
                  maxWidth: '140px',
                  justifyContent: 'center',
                  background: canSubmit ? 'var(--blue)' : '#cbd5e1',
                  cursor: canSubmit ? 'pointer' : 'not-allowed'
                }}
                disabled={!canSubmit}
              >
                수정하기
              </button>
            </div>
          </div>
        ) : (
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
              등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const BudgetView: React.FC<{ onGoToCategorySettings?: () => void }> = ({
  onGoToCategorySettings
}) => {
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [modalBudgets, setModalBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [modalDate, setModalDate] = useState(currentDate);

  const yearMonth = formatYearMonth(currentDate);

  const fetchCategories = useCallback(async () => {
    const result = await categoryApi.getAll();
    if (result.ok && result.data) {
      setExpenseCategories(
        result.data
          .filter((c) => c.type === 'EXPENSE')
          .map((c) => ({ id: c.id, name: c.name, isCustom: c.isCustom }))
      );
    }
  }, []);

  const fetchMonthData = useCallback(async (ym: string) => {
    const [statusResult, summaryResult] = await Promise.all([
      budgetApi.getMonthlyStatus(ym),
      budgetApi.getMonthlySummary(ym),
    ]);

    if (!statusResult.ok) {
      throw new Error(statusResult.error ?? '예산 현황을 불러오지 못했습니다.');
    }
    if (!summaryResult.ok) {
      throw new Error(summaryResult.error ?? '예산 요약을 불러오지 못했습니다.');
    }

    return {
      budgets: (statusResult.data ?? []).map(mapBudgetResponse),
      summary: summaryResult.data,
    };
  }, []);

  const loadCurrentMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMonthData(yearMonth);
      setBudgets(data.budgets);
      setSummary(data.summary);
    } catch (err) {
      setBudgets([]);
      setSummary(null);
      setError(err instanceof Error ? err.message : '예산 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fetchMonthData, yearMonth]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void loadCurrentMonth();
  }, [loadCurrentMonth]);

  useEffect(() => {
    if (!modalOpen) return;

    let cancelled = false;
    const loadModalBudgets = async () => {
      try {
        const data = await fetchMonthData(formatYearMonth(modalDate));
        if (!cancelled) setModalBudgets(data.budgets);
      } catch {
        if (!cancelled) setModalBudgets([]);
      }
    };

    void loadModalBudgets();
    return () => {
      cancelled = true;
    };
  }, [modalOpen, modalDate, fetchMonthData]);

  const handleSaveBudget = async (
    targetYearMonth: string,
    payload: BudgetFormPayload,
    editId?: number
  ) => {
    setSubmitting(true);
    setActionError(null);

    const request = {
      categoryId: payload.categoryId,
      yearMonth: targetYearMonth,
      totalBudget: payload.totalBudget,
      expectedExpense: payload.expectedExpense,
    };

    try {
      if (editId !== undefined) {
        const editTarget = budgets.find((b) => b.id === editId) ?? editItem;
        const result = await budgetApi.update(editId, {
          ...request,
          categoryId: editTarget?.categoryId ?? payload.categoryId,
          yearMonth: targetYearMonth,
        });
        if (!result.ok) {
          throw new Error(result.error ?? '예산 수정에 실패했습니다.');
        }
      } else {
        const result = await budgetApi.create(request);
        if (!result.ok) {
          throw new Error(result.error ?? '예산 등록에 실패했습니다.');
        }
      }

      setCurrentDate(parseYearMonthToDate(targetYearMonth));
      setModalOpen(false);
      setEditItem(null);
      setModalMode('create');
      await loadCurrentMonth();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const yearMonthLabel = formatYearMonthLabel(yearMonth);
  const filterTabs = buildFilterTabs(expenseCategories.map((c) => c.name));

  useEffect(() => {
    setActiveCategory('전체');
    setSearch('');
  }, [yearMonth]);

  const summaryValues = useMemo(() => {
    if (summary) {
      return {
        totalPlannedBudgetSum: Number(summary.totalPlannedBudgetSum),
        totalActualExpenseSum: Number(summary.totalActualExpenseSum),
        totalRemainingBudget: Number(summary.totalRemainingBudget),
      };
    }
    return {
      totalPlannedBudgetSum: 0,
      totalActualExpenseSum: 0,
      totalRemainingBudget: 0,
    };
  }, [summary]);

  const usagePercent =
    summaryValues.totalPlannedBudgetSum > 0
      ? Math.round(
          (summaryValues.totalActualExpenseSum / summaryValues.totalPlannedBudgetSum) * 100
        )
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
    void handleSaveBudget(targetYearMonth, payload, editId);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const result = await budgetApi.delete(deleteTarget.id);
      if (!result.ok) {
        throw new Error(result.error ?? '예산 삭제에 실패했습니다.');
      }
      setDeleteTarget(null);
      await loadCurrentMonth();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '예산 삭제 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToCategorySettings = () => {
    setModalOpen(false);
    setEditItem(null);
    setModalMode('create');

    onGoToCategorySettings?.();
  };

  return (
    <div className="fade-in">
      {(error || actionError) && (
        <div
          className="card"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderColor: 'var(--red-border)',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {error ?? actionError}
        </div>
      )}

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
            label="계획 합계"
            value={`${formatKRW(summaryValues.totalPlannedBudgetSum)}원`}
            sub={`기본 예산 + 추가 예상 · ${budgets.length}개 카테고리`}
            icon={<PiggyBank size={18} />}
          />
          <CompactStat
            label="실제 지출"
            value={`${formatKRW(summaryValues.totalActualExpenseSum)}원`}
            sub={`예산 대비 ${usagePercent}% 사용`}
            icon={<TrendingDown size={18} />}
          />
          <CompactStat
            label="잔액"
            value={`${summaryValues.totalRemainingBudget < 0 ? '-' : ''}${formatKRW(Math.abs(summaryValues.totalRemainingBudget))}원`}
            sub={summaryValues.totalRemainingBudget >= 0 ? '남은 예산' : '예산 초과'}
            valueColor={summaryValues.totalRemainingBudget < 0 ? 'var(--red)' : undefined}
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)' }}>
            예산 데이터를 불러오는 중...
          </div>
        ) : filtered.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '12px'
            }}
          >
            {filtered.map((item) => (
              <CategoryProgressCard
                key={item.id}
                item={item}
                categories={expenseCategories}
                onClick={() => openEditModal(item)}
              />
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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
              행을 클릭하면 수정할 수 있습니다
            </span>
          </div>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>기본 예산</th>
                  <th>추가 예상</th>
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
                  const color = getCategoryColor(item.categoryId, expenseCategories);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      title="클릭하여 예산 수정"
                      style={{ cursor: 'pointer' }}
                    >
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
                      <td onClick={(e) => e.stopPropagation()}>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(item);
                            }}
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
        expenseCategories={expenseCategories}
        editItem={editItem}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
          setModalMode('create');
        }}
        onSubmit={handleModalSubmit}
        onDelete={
          modalMode === 'edit' && editItem
            ? () => {
                setDeleteTarget(editItem);
                setModalOpen(false);
                setEditItem(null);
                setModalMode('create');
              }
            : undefined
        }
        onGoToCategorySettings={handleGoToCategorySettings}
        submitting={submitting}
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
                onClick={() => void handleDelete()}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  background: submitting ? '#fca5a5' : 'var(--red)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
