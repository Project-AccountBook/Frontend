import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Target, Edit2, Plus, Wallet, Loader2, AlertCircle, X, Trash2 } from 'lucide-react';
import {
  updateAccount,
  updateAccountGoal,
  clearAccountGoal,
  type AccountResponse
} from '../api/accountApi';
import { allocationApi } from '../api';
import {
  ACCOUNT_ROLE_LABELS,
  ACCOUNT_ROLE_OPTIONS,
  mapGoalProgressFromAccounts,
  formatGoalDateLabel,
  isGoalEligibleRole,
  mapDashboardAllocation,
  normalizeAccountRole,
  type AccountRole
} from '../lib/accountGoalStorage';

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

interface GoalSettingsSectionProps {
  accounts: AccountResponse[];
  accountsLoading: boolean;
  accountsError: string | null;
  onGoToAccounts: () => void;
  onRefreshAccounts: () => void;
}

function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value));
}

export const GoalSettingsSection: React.FC<GoalSettingsSectionProps> = ({
  accounts,
  accountsLoading,
  accountsError,
  onGoToAccounts,
  onRefreshAccounts
}) => {
  const [allocationSummary, setAllocationSummary] = useState({
    savings: { net: 0, rate: 0, inflow: 0, outflow: 0 },
    investment: { net: 0, rate: 0, inflow: 0, outflow: 0 }
  });
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [formRole, setFormRole] = useState<AccountRole>('CHECKING');
  const [formGoalAmount, setFormGoalAmount] = useState('');
  const [formGoalDate, setFormGoalDate] = useState('');
  const [editingHasGoal, setEditingHasGoal] = useState(false);

  const yearMonth = formatYearMonth(new Date());
  const assetAccounts = useMemo(
    () => accounts.filter((account) => (account.kind ?? 'ASSET') === 'ASSET'),
    [accounts]
  );
  const loanAccounts = useMemo(
    () => accounts.filter((account) => account.kind === 'LOAN'),
    [accounts]
  );
  const goalAccounts = useMemo(
    () => [...assetAccounts, ...loanAccounts],
    [assetAccounts, loanAccounts]
  );

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const allocationRes = await allocationApi.getMonthly(yearMonth);
      if (allocationRes.ok && allocationRes.data) {
        setAllocationSummary(mapDashboardAllocation(allocationRes.data));
      }
    } finally {
      setMetricsLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    if (!accountsLoading) {
      loadMetrics();
    }
  }, [accountsLoading, loadMetrics]);

  const goalProgressItems = useMemo(
    () => mapGoalProgressFromAccounts(goalAccounts, CATEGORY_COLORS),
    [goalAccounts]
  );

  const accountsWithGoalSet = goalProgressItems.length;
  const avgProgress =
    goalProgressItems.length > 0
      ? Math.round(
          goalProgressItems.reduce((sum, item) => sum + item.progressPercent, 0) /
            goalProgressItems.length
        )
      : 0;

  const openGoalModal = (accountId: number) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account || account.kind === 'CREDIT_CARD') return;
    const isLoan = account.kind === 'LOAN';

    setEditingAccountId(accountId);
    setFormRole(normalizeAccountRole(account.role));
    setFormGoalAmount(account.goalAmount != null ? String(account.goalAmount) : isLoan ? '0' : '');
    setFormGoalDate(account.goalDate ?? '');
    setEditingHasGoal(account.goalAmount != null && (isLoan || Number(account.goalAmount) > 0));
    setShowGoalModal(true);
  };

  const closeGoalModal = () => {
    setShowGoalModal(false);
    setEditingAccountId(null);
    setEditingHasGoal(false);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccountId == null) return;

    const account = accounts.find((acc) => acc.id === editingAccountId);
    if (!account) return;

    const parsedGoal = formGoalAmount.trim() ? parseFloat(formGoalAmount) : null;
    const isLoan = account.kind === 'LOAN';
    const hasValidGoal =
      parsedGoal != null && !Number.isNaN(parsedGoal) && (isLoan ? parsedGoal >= 0 : parsedGoal > 0);

    setSavingGoal(true);
    try {
      await updateAccount(editingAccountId, {
        accountName: account.accountName,
        initialBalance: Number(account.initialBalance),
        currentBalance: Number(account.currentBalance),
        kind: account.kind ?? 'ASSET',
        creditLimit: account.creditLimit ?? null,
        role: formRole
      });

      if (hasValidGoal) {
        await updateAccountGoal(editingAccountId, {
          goalAmount: parsedGoal,
          goalDate: formGoalDate.trim() || null
        });
      } else if (editingHasGoal) {
        await clearAccountGoal(editingAccountId);
      }

      closeGoalModal();
      await onRefreshAccounts();
      await loadMetrics();
    } catch (err) {
      alert(err instanceof Error ? err.message : '목표 저장에 실패했습니다.');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (editingAccountId == null) return;
    if (!window.confirm('이 목표를 삭제하시겠습니까?')) {
      return;
    }

    const account = accounts.find((acc) => acc.id === editingAccountId);
    if (!account) return;

    setSavingGoal(true);
    try {
      await updateAccount(editingAccountId, {
        accountName: account.accountName,
        initialBalance: Number(account.initialBalance),
        currentBalance: Number(account.currentBalance),
        kind: account.kind ?? 'ASSET',
        creditLimit: account.creditLimit ?? null,
        role: formRole
      });
      await clearAccountGoal(editingAccountId);
      closeGoalModal();
      await onRefreshAccounts();
      await loadMetrics();
    } catch (err) {
      alert(err instanceof Error ? err.message : '목표 삭제에 실패했습니다.');
    } finally {
      setSavingGoal(false);
    }
  };

  const editingAccount = editingAccountId != null
    ? accounts.find((acc) => acc.id === editingAccountId)
    : null;

  if (accountsLoading) {
    return (
      <div className="table-empty-row" style={{ padding: '48px 0' }}>
        <Loader2 size={24} className="spin-animation" />
        <p>목표 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (accountsError) {
    return (
      <div className="table-empty-row" style={{ padding: '48px 0' }}>
        <AlertCircle size={24} />
        <p>{accountsError}</p>
        <button className="btn-section-add" onClick={onRefreshAccounts} style={{ marginTop: '12px' }}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="section-content fade-in goal-settings-section">
      <div className="goal-settings-intro">
        <p>
          자산 목표와 대출 상환 목표를 한곳에서 관리하고 달성률을 확인할 수 있습니다.
        </p>
      </div>

      <div className="goal-settings-summary-grid four-cols">
        <div className="goal-settings-stat-card">
          <span className="goal-settings-stat-label">목표 설정 항목</span>
          <span className="goal-settings-stat-value">
            {accountsWithGoalSet} / {goalAccounts.length}
          </span>
        </div>
        <div className="goal-settings-stat-card">
          <span className="goal-settings-stat-label">목표 평균 달성률</span>
          <span className="goal-settings-stat-value">{avgProgress}%</span>
        </div>
        <div className="goal-settings-stat-card">
          <span className="goal-settings-stat-label">이번 달 저축률</span>
          <span className="goal-settings-stat-value accent">
            {metricsLoading ? '…' : `${allocationSummary.savings.rate.toFixed(1)}%`}
          </span>
          {!metricsLoading && (
            <span className="goal-settings-stat-sub">
              순저축 {formatKRW(allocationSummary.savings.net)}원
            </span>
          )}
        </div>
        <div className="goal-settings-stat-card">
          <span className="goal-settings-stat-label">이번 달 투자율</span>
          <span className="goal-settings-stat-value investment">
            {metricsLoading ? '…' : `${allocationSummary.investment.rate.toFixed(1)}%`}
          </span>
          {!metricsLoading && (
            <span className="goal-settings-stat-sub">
              순투자 {formatKRW(allocationSummary.investment.net)}원
            </span>
          )}
        </div>
      </div>

      {goalAccounts.length === 0 ? (
        <div className="goal-empty-state card" style={{ marginTop: '16px' }}>
          <p>목표를 설정할 수 있는 자산계좌나 대출이 없습니다.</p>
          <button type="button" className="btn-section-add" onClick={onGoToAccounts}>
            <Wallet size={14} />
            계좌 등록하러 가기
          </button>
        </div>
      ) : (
        <div className="goal-account-list">
          {goalAccounts.map((account, index) => {
            const isLoan = account.kind === 'LOAN';
            const role = normalizeAccountRole(account.role);
            const goalAmount = account.goalAmount != null ? Number(account.goalAmount) : null;
            const hasGoal = goalAmount != null && (isLoan || goalAmount > 0);
            const initialDebt = Math.max(0, Number(account.disbursedAmount) || 0);
            const currentDebt = Math.abs(Number(account.currentBalance));
            const debtProgress = goalAmount != null && initialDebt > goalAmount
              ? Math.min(100, Math.max(0, Math.round(
                  ((initialDebt - currentDebt) / (initialDebt - goalAmount)) * 100
                )))
              : goalAmount != null && currentDebt <= goalAmount ? 100 : 0;
            const progress = hasGoal
              ? account.progressPercent ??
                (isLoan
                  ? debtProgress
                  : Math.min(100, Math.round((account.currentBalance / goalAmount!) * 100)))
              : null;
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
            const isChecking = !isLoan && role === 'CHECKING';

            return (
              <div key={account.id} className={`card goal-account-card${isChecking ? ' is-checking' : ''}`}>
                <div className="goal-account-card-header">
                  <div>
                    <div className="goal-progress-title-row">
                      <h3 className="goal-account-name">{account.accountName}</h3>
                      <span className="goal-role-badge">
                        {isLoan ? '대출 상환' : ACCOUNT_ROLE_LABELS[role]}
                      </span>
                    </div>
                    <span className="goal-account-balance">
                      {isLoan ? `남은 대출 ${formatKRW(currentDebt)}원` : `현재 ${formatKRW(account.currentBalance)}원`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-action-icon edit"
                    onClick={() => openGoalModal(account.id)}
                    title={hasGoal ? '목표 수정' : '목표 설정'}
                  >
                    {hasGoal ? <Edit2 size={14} /> : <Plus size={14} />}
                  </button>
                </div>

                {hasGoal && progress != null && goalAmount != null ? (
                  <>
                    <div className="goal-account-progress-row">
                      <span>목표 달성</span>
                      <span className="goal-progress-percent">{progress}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.max(progress, account.currentBalance > 0 ? 4 : 0)}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                    <div className="goal-progress-meta">
                      <span>
                        {isLoan
                          ? `남은 대출 ${formatKRW(currentDebt)}원 / 목표 잔액 ${formatKRW(goalAmount)}원`
                          : `${formatKRW(account.currentBalance)} / ${formatKRW(goalAmount)}원`}
                      </span>
                      {account.goalDate && (
                        <span>목표일 {formatGoalDateLabel(account.goalDate)}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="goal-account-empty">
                    <span>
                      {isLoan
                        ? '대출 상환 목표가 설정되지 않았습니다.'
                        : isChecking
                        ? '생활 계좌는 목표 설정이 선택 사항입니다.'
                        : '목표가 설정되지 않았습니다.'}
                    </span>
                    <button type="button" className="goal-inline-link" onClick={() => openGoalModal(account.id)}>
                      {isLoan || isChecking ? '목표 설정' : '목표 추가'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {assetAccounts.some((acc) => isGoalEligibleRole(normalizeAccountRole(acc.role))) && (
        <div className="card goal-savings-note" style={{ marginTop: '16px' }}>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} style={{ color: '#10b981' }} />
              <span className="card-title" style={{ fontSize: '14px' }}>저축률 · 투자율 계산 안내</span>
            </div>
          </div>
          <p className="goal-savings-note-text">
            <strong>저축률</strong> = 저축 역할 계좌의 월간 순유입(이체 유입−유출) ÷ 월 수입 ·{' '}
            <strong>투자율</strong> = 투자 역할 계좌의 월간 순유입(이체 유입−유출) ÷ 월 수입
            {!metricsLoading && (
              <>
                <br />
                순저축 {formatKRW(allocationSummary.savings.net)}원
                (유입 {formatKRW(allocationSummary.savings.inflow)} / 유출 {formatKRW(allocationSummary.savings.outflow)})
                · 순투자 {formatKRW(allocationSummary.investment.net)}원
                (유입 {formatKRW(allocationSummary.investment.inflow)} / 유출 {formatKRW(allocationSummary.investment.outflow)})
              </>
            )}
          </p>
        </div>
      )}

      {showGoalModal && editingAccount && (
        <div className="asset-modal-overlay" onClick={closeGoalModal}>
          <div className="asset-modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={closeGoalModal}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <div className="modal-header">
              <h3>
                {editingHasGoal ? '목표 수정' : '새로운 목표 등록'}
              </h3>
            </div>

            <form onSubmit={handleSaveGoal} className="modal-form">
              <div className="form-group-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-item">
                  <label className="form-label">{editingAccount.kind === 'LOAN' ? '대출 명칭' : '계좌 명칭'}</label>
                  <div className="modal-readonly-value">{editingAccount.accountName}</div>
                  <p className="form-hint">이름은 자산 메뉴에서 수정할 수 있습니다.</p>
                </div>

                <div className="form-item">
                  <label className="form-label">{editingAccount.kind === 'LOAN' ? '현재 남은 대출' : '현재 잔고'}</label>
                  <div className="modal-readonly-value">
                    {formatKRW(editingAccount.kind === 'LOAN'
                      ? Math.abs(editingAccount.currentBalance)
                      : editingAccount.currentBalance)}원
                  </div>
                  <p className="form-hint">거래 내역에 따라 자동 계산되며 목표 달성률의 기준이 됩니다.</p>
                </div>

                {editingAccount.kind !== 'LOAN' && (
                <div className="form-item">
                  <label className="form-label">계좌 역할</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AccountRole)}
                    className="modal-select"
                  >
                    {ACCOUNT_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">
                    저축·투자 역할 계좌로 들어오고 나간 이체의 차액이 각각 저축률·투자율에 반영됩니다.
                  </p>
                </div>
                )}

                <div className="form-item">
                  <label className="form-label">
                    {editingAccount.kind === 'LOAN' ? '목표 대출 잔액 (원)' : '목표 금액 (원)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={editingAccount.kind === 'LOAN' ? '전액 상환은 0원' : '목표 금액 입력'}
                    value={formGoalAmount}
                    onChange={(e) => setFormGoalAmount(e.target.value)}
                    className="modal-input"
                  />
                </div>

                <div className="form-item">
                  <label className="form-label">목표일 (선택)</label>
                  <input
                    type="date"
                    value={formGoalDate}
                    onChange={(e) => setFormGoalDate(e.target.value)}
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                {editingHasGoal ? (
                  <button
                    type="button"
                    className="btn-modal-delete"
                    onClick={handleDeleteGoal}
                    disabled={savingGoal}
                  >
                    <Trash2 size={14} />
                    목표 삭제
                  </button>
                ) : (
                  <span />
                )}
                <div className="modal-footer-actions">
                  <button type="button" className="btn-secondary" onClick={closeGoalModal}>
                    취소
                  </button>
                  <button type="submit" className="btn-primary" disabled={savingGoal}>
                    {editingHasGoal ? '저장' : '등록'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
