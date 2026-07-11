import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Target, Edit2, Plus, Wallet, Loader2, AlertCircle, X, Trash2 } from 'lucide-react';
import type { AccountResponse } from '../api/accountApi';
import { getAllUserTransactions } from '../api/transactionApi';
import { portfolioApi } from '../api';
import {
  ACCOUNT_ROLE_LABELS,
  ACCOUNT_ROLE_OPTIONS,
  buildGoalProgressItems,
  computeMonthlyAllocationSummary,
  formatGoalDateLabel,
  getAccountGoalConfig,
  isGoalEligibleRole,
  saveAccountGoalConfig,
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
  const [settingsVersion, setSettingsVersion] = useState(0);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [formRole, setFormRole] = useState<AccountRole>('CHECKING');
  const [formGoalAmount, setFormGoalAmount] = useState('');
  const [formGoalDate, setFormGoalDate] = useState('');
  const [editingHasGoal, setEditingHasGoal] = useState(false);

  const yearMonth = formatYearMonth(new Date());

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const [y, m] = yearMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const monthStart = `${yearMonth}-01`;
      const monthEnd = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

      const [portfolioRes, txPage] = await Promise.all([
        portfolioApi.getMyPortfolio(yearMonth),
        getAllUserTransactions(monthStart, monthEnd).catch(() => ({ content: [] }))
      ]);

      const income = portfolioRes.ok && portfolioRes.data ? Number(portfolioRes.data.totalIncome) : 0;
      const txs = txPage.content.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        description: tx.description ?? ''
      }));

      setAllocationSummary(computeMonthlyAllocationSummary(txs, accounts, income));
    } finally {
      setMetricsLoading(false);
    }
  }, [accounts, yearMonth]);

  useEffect(() => {
    if (!accountsLoading) {
      loadMetrics();
    }
  }, [accountsLoading, loadMetrics]);

  const goalProgressItems = useMemo(
    () => buildGoalProgressItems(accounts, CATEGORY_COLORS),
    [accounts, settingsVersion]
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
    if (!account) return;

    const config = getAccountGoalConfig(account.id, account.accountName);
    setEditingAccountId(accountId);
    setFormRole(config.role);
    setFormGoalAmount(config.goalAmount != null ? String(config.goalAmount) : '');
    setFormGoalDate(config.goalDate ?? '');
    setEditingHasGoal(config.goalAmount != null && config.goalAmount > 0);
    setShowGoalModal(true);
  };

  const closeGoalModal = () => {
    setShowGoalModal(false);
    setEditingAccountId(null);
    setEditingHasGoal(false);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccountId == null) return;

    const parsedGoal = formGoalAmount.trim() ? parseFloat(formGoalAmount) : null;
    saveAccountGoalConfig(editingAccountId, {
      role: formRole,
      goalAmount:
        parsedGoal != null && !Number.isNaN(parsedGoal) && parsedGoal > 0 ? parsedGoal : null,
      goalDate: formGoalDate.trim() || null
    });

    closeGoalModal();
    setSettingsVersion((version) => version + 1);
    onRefreshAccounts();
    loadMetrics();
  };

  const handleDeleteGoal = () => {
    if (editingAccountId == null) return;
    if (!window.confirm('이 계좌의 목표를 삭제하시겠습니까?\n\n계좌 역할 설정은 유지됩니다.')) {
      return;
    }

    saveAccountGoalConfig(editingAccountId, {
      role: formRole,
      goalAmount: null,
      goalDate: null
    });

    closeGoalModal();
    setSettingsVersion((version) => version + 1);
    onRefreshAccounts();
    loadMetrics();
  };

  const editingAccount = editingAccountId != null
    ? accounts.find((acc) => acc.id === editingAccountId)
    : null;

  if (accountsLoading) {
    return (
      <div className="table-empty-row" style={{ padding: '48px 0' }}>
        <Loader2 size={24} className="spin-animation" />
        <p>계좌 목표 정보를 불러오는 중...</p>
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
          계좌별 목표 금액·역할을 설정하면 대시보드에서 달성률, 저축률, 투자율을 확인할 수 있습니다.
        </p>
      </div>

      <div className="goal-settings-summary-grid four-cols">
        <div className="goal-settings-stat-card">
          <span className="goal-settings-stat-label">목표 설정 계좌</span>
          <span className="goal-settings-stat-value">
            {accountsWithGoalSet} / {accounts.length}
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

      {accounts.length === 0 ? (
        <div className="goal-empty-state card" style={{ marginTop: '16px' }}>
          <p>등록된 계좌가 없습니다.</p>
          <button type="button" className="btn-section-add" onClick={onGoToAccounts}>
            <Wallet size={14} />
            계좌 등록하러 가기
          </button>
        </div>
      ) : (
        <div className="goal-account-list" key={settingsVersion}>
          {accounts.map((account, index) => {
            const config = getAccountGoalConfig(account.id, account.accountName);
            const hasGoal = config.goalAmount != null && config.goalAmount > 0;
            const progress = hasGoal
              ? Math.min(100, Math.round((account.currentBalance / config.goalAmount!) * 100))
              : null;
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

            const isChecking = config.role === 'CHECKING';

            return (
              <div key={account.id} className={`card goal-account-card${isChecking ? ' is-checking' : ''}`}>
                <div className="goal-account-card-header">
                  <div>
                    <div className="goal-progress-title-row">
                      <h3 className="goal-account-name">{account.accountName}</h3>
                      <span className="goal-role-badge">{ACCOUNT_ROLE_LABELS[config.role]}</span>
                    </div>
                    <span className="goal-account-balance">현재 {formatKRW(account.currentBalance)}원</span>
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

                {hasGoal && progress != null && config.goalAmount != null ? (
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
                        {formatKRW(account.currentBalance)} / {formatKRW(config.goalAmount)}원
                      </span>
                      {config.goalDate && (
                        <span>목표일 {formatGoalDateLabel(config.goalDate)}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="goal-account-empty">
                    <span>
                      {isChecking
                        ? '생활 계좌는 목표 설정이 선택 사항입니다.'
                        : '목표가 설정되지 않았습니다.'}
                    </span>
                    <button type="button" className="goal-inline-link" onClick={() => openGoalModal(account.id)}>
                      {isChecking ? '목표 설정' : '목표 추가'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {accounts.some((acc) => isGoalEligibleRole(getAccountGoalConfig(acc.id, acc.accountName).role)) && (
        <div className="card goal-savings-note" style={{ marginTop: '16px' }}>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} style={{ color: '#10b981' }} />
              <span className="card-title" style={{ fontSize: '14px' }}>저축률 · 투자율 계산 안내</span>
            </div>
          </div>
          <p className="goal-savings-note-text">
            <strong>저축률</strong> = 저축 역할 계좌 순이체 ÷ 월 수입 ·{' '}
            <strong>투자율</strong> = 투자 역할 계좌 순이체 ÷ 월 수입
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
                {editingHasGoal ? '선택한 계좌 목표 수정' : '새로운 계좌 목표 등록'}
              </h3>
            </div>

            <form onSubmit={handleSaveGoal} className="modal-form">
              <div className="form-group-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-item">
                  <label className="form-label">계좌 명칭</label>
                  <div className="modal-readonly-value">{editingAccount.accountName}</div>
                  <p className="form-hint">계좌 이름은 계좌 관리에서 수정할 수 있습니다.</p>
                </div>

                <div className="form-item">
                  <label className="form-label">현재 잔고</label>
                  <div className="modal-readonly-value">{formatKRW(editingAccount.currentBalance)}원</div>
                  <p className="form-hint">거래 내역에 따라 자동 계산됩니다. 목표 달성률의 기준이 됩니다.</p>
                </div>

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
                    저축·투자 역할은 각각 저축률·투자율 계산에 사용됩니다. 비상금 등은 저축 역할로 설정하세요.
                  </p>
                </div>

                <div className="form-item">
                  <label className="form-label">목표 금액 (원)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="목표 금액 입력"
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
                  <button type="submit" className="btn-primary">
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
