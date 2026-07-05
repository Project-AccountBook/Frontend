import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ReceiptText,
  Calendar as CalendarIcon,
  Wallet,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  X,
  Info,
  Sparkles,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  type AccountResponse
} from '../api/accountApi';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryResponse,
  type TransactionType
} from '../api/categoryApi';
import {
  getTransactionsForAccounts,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
  type TransactionResponse
} from '../api/transactionApi';
import {
  getFixedTransactions,
  createFixedTransaction,
  updateFixedTransaction,
  toggleFixedTransactionActive,
  deleteFixedTransaction,
  type FixedTransactionResponse,
  type FrequencyType
} from '../api/fixedTransactionApi';

// ──────────────────────────────────────────────
// Enums & Types
// ──────────────────────────────────────────────
export type AssetActiveSection = 'transactions' | 'fixed' | 'accounts' | 'categories';
type ActiveSection = 'transactions' | 'fixed' | 'accounts' | 'categories';
type ViewMode = 'calendar' | 'list';

type Account = AccountResponse;
type Category = CategoryResponse;
type Transaction = TransactionResponse;
type FixedTransaction = FixedTransactionResponse;

const getMonthRange = (year: number, month: number) => {
  const mm = String(month + 1).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
};

const ACCOUNT_COLOR_PALETTE = [
  { dot: '#6366f1', bg: 'rgba(99, 102, 241, 0.14)' },
  { dot: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.14)' },
  { dot: '#10b981', bg: 'rgba(16, 185, 129, 0.14)' },
  { dot: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
  { dot: '#ec4899', bg: 'rgba(236, 72, 153, 0.14)' },
  { dot: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.14)' },
];

type DayAccountSummary = {
  accountId: number;
  accountName: string;
  income: number;
  expense: number;
  transfer: number;
  transferAmount: number;
};

interface AssetViewProps {
  initialSection?: AssetActiveSection;
}

export const AssetView: React.FC<AssetViewProps> = ({ initialSection }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>(initialSection ?? 'transactions');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-based
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    if (!showMonthPicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthPicker]);

  const initialMonthRange = getMonthRange(today.getFullYear(), today.getMonth());

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const [fixedTransactions, setFixedTransactions] = useState<FixedTransaction[]>([]);
  const [fixedLoading, setFixedLoading] = useState(true);
  const [fixedError, setFixedError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [filterAccount, setFilterAccount] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [startDate, setStartDate] = useState(initialMonthRange.start);
  const [endDate, setEndDate] = useState(initialMonthRange.end);
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formAccount, setFormAccount] = useState<string>('1');
  const [formTargetAccount, setFormTargetAccount] = useState<string>('2');
  const [formCategory, setFormCategory] = useState<string>('3');
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState<string>('');

  const [formFrequency, setFormFrequency] = useState<FrequencyType>('MONTHLY');
  const [formRepeatDay, setFormRepeatDay] = useState<string>('20');
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState<string>('');

  const [formAccountName, setFormAccountName] = useState<string>('');
  const [formInitialBalance, setFormInitialBalance] = useState<string>('');

  const [formCategoryName, setFormCategoryName] = useState<string>('');
  const [formCategoryType, setFormCategoryType] = useState<TransactionType>('EXPENSE');

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setAccountsError(err instanceof Error ? err.message : '계좌 목록을 불러오는 데 실패했습니다.');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setCategoriesError(err instanceof Error ? err.message : '카테고리 목록을 불러오는 데 실패했습니다.');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchFixedTransactions = useCallback(async () => {
    setFixedLoading(true);
    setFixedError(null);
    try {
      const data = await getFixedTransactions();
      setFixedTransactions(data);
    } catch (err) {
      setFixedError(err instanceof Error ? err.message : '고정 수입/지출 목록을 불러오는 데 실패했습니다.');
    } finally {
      setFixedLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (accounts.length === 0) {
      setTransactions([]);
      return;
    }

    const range = viewMode === 'calendar'
      ? getMonthRange(calendarYear, calendarMonth)
      : { start: startDate, end: endDate };

    const accountIds = filterAccount === 'all'
      ? accounts.map((a) => a.id)
      : [filterAccount];

    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const data = await getTransactionsForAccounts(accountIds, range.start, range.end);
      setTransactions(data);
    } catch (err) {
      setTransactionsError(err instanceof Error ? err.message : '거래 내역을 불러오는 데 실패했습니다.');
    } finally {
      setTransactionsLoading(false);
    }
  }, [accounts, viewMode, calendarYear, calendarMonth, startDate, endDate, filterAccount]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchFixedTransactions();
  }, [fetchAccounts, fetchCategories, fetchFixedTransactions]);

  useEffect(() => {
    if (!accountsLoading) {
      fetchTransactions();
    }
  }, [fetchTransactions, accountsLoading]);

  useEffect(() => {
    if (!showModal || (activeSection !== 'transactions' && activeSection !== 'fixed')) return;
    const matching = categories.filter((c) => c.type === formType);
    if (matching.length === 0) return;
    if (!matching.some((c) => c.id.toString() === formCategory)) {
      setFormCategory(matching[0].id.toString());
    }
  }, [formType, categories, showModal, activeSection, formCategory]);

  const findAccountIdByName = (name: string) =>
    accounts.find((a) => a.accountName === name)?.id;

  const findCategoryIdByName = (name: string, type: TransactionType) =>
    categories.find((c) => c.name === name && c.type === type)?.id;

  const resetFormFields = () => {
    const defaultAccountId = accounts[0]?.id?.toString() ?? '';
    const defaultTargetId = accounts[1]?.id?.toString() ?? accounts[0]?.id?.toString() ?? '';
    const defaultCategoryId = categories.find((c) => c.type === 'EXPENSE')?.id?.toString() ?? '';

    setFormAccount(defaultAccountId);
    setFormTargetAccount(defaultTargetId);
    setFormCategory(defaultCategoryId);
    setFormType('EXPENSE');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormFrequency('MONTHLY');
    setFormRepeatDay('20');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormAccountName('');
    setFormInitialBalance('');
    setFormCategoryName('');
    setFormCategoryType('EXPENSE');
  };

  const handleOpenAddModal = (options?: { categoryType?: TransactionType; transactionDate?: string }) => {
    setModalMode('create');
    resetFormFields();
    if (options?.categoryType) setFormCategoryType(options.categoryType);
    if (options?.transactionDate) setFormDate(options.transactionDate);
    setShowModal(true);
  };

  const handleCalendarDayAdd = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCalendarDay(dateStr);
    handleOpenAddModal({ transactionDate: dateStr });
  };

  const handleOpenEditModal = (id: number) => {
    setModalMode('edit');
    setSelectedId(id);
    if (activeSection === 'transactions') {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        setFormAccount(tx.accountId.toString());
        setFormCategory(tx.categoryId.toString());
        setFormType(tx.type);
        setFormAmount(tx.amount.toString());
        setFormDate(tx.transactionDate);
        setFormDescription(tx.description ?? '');
      }
    } else if (activeSection === 'fixed') {
      const fx = fixedTransactions.find(f => f.id === id);
      if (fx) {
        const accountId = findAccountIdByName(fx.accountName);
        const categoryId = findCategoryIdByName(fx.categoryName, fx.type);
        if (accountId) setFormAccount(accountId.toString());
        if (categoryId) setFormCategory(categoryId.toString());
        setFormType(fx.type);
        setFormAmount(fx.amount.toString());
        setFormFrequency(fx.frequency);
        setFormRepeatDay(fx.repeatDay.toString());
        setFormStartDate(fx.startDate);
        if (fx.endDate) setFormEndDate(fx.endDate);
        setFormDescription(fx.description ?? '');
      }
    } else if (activeSection === 'accounts') {
      const acc = accounts.find(a => a.id === id);
      if (acc) {
        setFormAccountName(acc.accountName);
        setFormInitialBalance(acc.initialBalance.toString());
      }
    } else if (activeSection === 'categories') {
      const cat = categories.find(c => c.id === id);
      if (cat) {
        setFormCategoryName(cat.name);
        setFormCategoryType(cat.type);
      }
    }
    setShowModal(true);
  };

  const handleDeleteItem = async (id: number): Promise<boolean> => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return false;

    try {
      if (activeSection === 'accounts') {
        await deleteAccount(id);
        await fetchAccounts();
      } else if (activeSection === 'transactions') {
        await deleteTransaction(id);
        await fetchTransactions();
        await fetchAccounts();
      } else if (activeSection === 'fixed') {
        await deleteFixedTransaction(id);
        await fetchFixedTransactions();
      } else if (activeSection === 'categories') {
        await deleteCategory(id);
        await fetchCategories();
      }
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      return false;
    }
  };

  const handleModalDelete = async () => {
    if (selectedId === null) return;
    const deleted = await handleDeleteItem(selectedId);
    if (deleted) {
      setShowModal(false);
      resetFormFields();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetFormFields();
  };

  const handleToggleFixedActive = async (id: number) => {
    try {
      await toggleFixedTransactionActive(id);
      await fetchFixedTransactions();
    } catch (err) {
      alert(err instanceof Error ? err.message : '활성 상태 변경에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (activeSection === 'accounts') {
        if (modalMode === 'create') {
          await createAccount({
            accountName: formAccountName,
            initialBalance: parseFloat(formInitialBalance) || 0,
          });
        } else if (selectedId !== null) {
          await updateAccount(selectedId, {
            accountName: formAccountName,
            initialBalance: parseFloat(formInitialBalance) || 0,
          });
        }
        await fetchAccounts();
        setShowModal(false);
        resetFormFields();
        return;
      }

      if (activeSection === 'transactions') {
        const request = {
          accountId: parseInt(formAccount),
          categoryId: parseInt(formCategory),
          type: formType,
          amount: parseFloat(formAmount) || 0,
          transactionDate: formDate,
          description: formDescription,
          ...(formType === 'TRANSFER' ? { targetAccountId: parseInt(formTargetAccount) } : {}),
        };

        if (modalMode === 'create') {
          await createTransaction(request);
        } else if (selectedId !== null) {
          await updateTransaction(selectedId, request);
        }
        await fetchTransactions();
        await fetchAccounts();
      } else if (activeSection === 'fixed') {
        const request = {
          accountId: parseInt(formAccount),
          categoryId: parseInt(formCategory),
          type: formType,
          amount: parseFloat(formAmount) || 0,
          frequency: formFrequency,
          repeatDay: parseInt(formRepeatDay) || 1,
          startDate: formStartDate,
          endDate: formEndDate || undefined,
          description: formDescription,
        };

        if (modalMode === 'create') {
          await createFixedTransaction(request);
        } else if (selectedId !== null) {
          await updateFixedTransaction(selectedId, request);
        }
        await fetchFixedTransactions();
      } else if (activeSection === 'categories') {
        const request = {
          name: formCategoryName,
          type: formCategoryType,
        };

        if (modalMode === 'create') {
          await createCategory(request);
        } else if (selectedId !== null) {
          await updateCategory(selectedId, request);
        }
        await fetchCategories();
      }

      setShowModal(false);
      resetFormFields();
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await exportTransactions(startDate, endDate);
    } catch (err) {
      alert(err instanceof Error ? err.message : '거래 내역 내보내기에 실패했습니다.');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filterAccount !== 'all' && tx.accountId !== filterAccount) return false;
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (viewMode === 'list' && (tx.transactionDate < startDate || tx.transactionDate > endDate)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = (tx.description ?? '').toLowerCase().includes(q);
      const matchCat = tx.categoryName.toLowerCase().includes(q);
      const matchAcc = tx.accountName.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchAcc) return false;
    }
    return true;
  });

  const getTxTypeBadgeClass = (type: TransactionType) => {
    switch (type) {
      case 'INCOME': return 'tx-type-income';
      case 'EXPENSE': return 'tx-type-expense';
      case 'TRANSFER': return 'tx-type-transfer';
      default: return '';
    }
  };

  const getTxTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'INCOME': return '수입';
      case 'EXPENSE': return '지출';
      case 'TRANSFER': return '이체';
      default: return '';
    }
  };

  const getFreqLabel = (freq: FrequencyType) => {
    switch (freq) {
      case 'WEEKLY': return '매주';
      case 'MONTHLY': return '매월';
      case 'YEARLY': return '매년';
      default: return '';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
  };

  const formatCalAmt = (val: number) => val.toLocaleString('ko-KR');

  const getAccountColor = (accountId: number) => {
    const idx = accounts.findIndex((a) => a.id === accountId);
    return ACCOUNT_COLOR_PALETTE[(idx >= 0 ? idx : 0) % ACCOUNT_COLOR_PALETTE.length];
  };

  const getAccountShortName = (name: string, maxLen = 4) =>
    name.length <= maxLen ? name : `${name.slice(0, maxLen)}…`;

  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const prevCalendarMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(y => y - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(m => m - 1);
    }
    setSelectedCalendarDay(null);
  };

  const nextCalendarMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(y => y + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(m => m + 1);
    }
    setSelectedCalendarDay(null);
  };

  const openMonthPicker = () => {
    setPickerYear(calendarYear);
    setShowMonthPicker(true);
  };

  const selectPickerMonth = (m: number) => {
    setCalendarYear(pickerYear);
    setCalendarMonth(m);
    setSelectedCalendarDay(null);
    setShowMonthPicker(false);
  };

  const buildCalendarGrid = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const getDateString = (day: number) => {
    const mm = String(calendarMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${calendarYear}-${mm}-${dd}`;
  };

  const txByDate = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.transactionDate]) acc[tx.transactionDate] = [];
    acc[tx.transactionDate].push(tx);
    return acc;
  }, {});

  const getDayAccountSummaries = (dateStr: string): DayAccountSummary[] => {
    const txs = txByDate[dateStr] || [];
    const byAccount = new Map<number, DayAccountSummary>();

    for (const tx of txs) {
      let entry = byAccount.get(tx.accountId);
      if (!entry) {
        entry = {
          accountId: tx.accountId,
          accountName: tx.accountName,
          income: 0,
          expense: 0,
          transfer: 0,
          transferAmount: 0,
        };
        byAccount.set(tx.accountId, entry);
      }
      if (tx.type === 'INCOME') entry.income += tx.amount;
      else if (tx.type === 'EXPENSE') entry.expense += tx.amount;
      else if (tx.type === 'TRANSFER') {
        entry.transfer += 1;
        entry.transferAmount += tx.amount;
      }
    }

    return Array.from(byAccount.values());
  };

  const getDaySummary = (dateStr: string) => {
    const txs = txByDate[dateStr] || [];
    const income = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const transferTxs = txs.filter(t => t.type === 'TRANSFER');
    const transfer = transferTxs.length;
    const transferAmount = transferTxs.reduce((s, t) => s + t.amount, 0);
    return { txs, income, expense, transfer, transferAmount };
  };

  const selectedDayTxs = selectedCalendarDay ? (txByDate[selectedCalendarDay] || []) : [];
  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="asset-management-wrapper fade-in">

      {/* Title & Navigation */}
      <div className="dashboard-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Wallet size={20} />
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
              내역 및 자산 관리
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              거래내역 등록, 정기 예약 수입/지출 관리, 계좌 및 카테고리를 한번에 관리하세요
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="asset-tabs-container">
        <button
          className={`asset-tab-btn ${activeSection === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveSection('transactions')}
        >
          <ReceiptText size={16} />
          <span>거래 내역</span>
        </button>
        <button
          className={`asset-tab-btn ${activeSection === 'fixed' ? 'active' : ''}`}
          onClick={() => setActiveSection('fixed')}
        >
          <CalendarIcon size={16} />
          <span>고정 수입/지출</span>
        </button>
        <button
          className={`asset-tab-btn ${activeSection === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveSection('accounts')}
        >
          <Wallet size={16} />
          <span>계좌 관리</span>
        </button>
        <button
          className={`asset-tab-btn ${activeSection === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveSection('categories')}
        >
          <Tag size={16} />
          <span>카테고리 관리</span>
        </button>
      </div>

      {/* Main Panel */}
      <div className="asset-panel">

        {/* ─── SECTION 1: TRANSACTIONS ─── */}
        {activeSection === 'transactions' && (
          <div className="section-content fade-in">

            {/* View Mode Toggle + List Filters */}
            <div className="tx-toolbar">
              {transactionsLoading && (
                <div className="table-empty-row" style={{ padding: '16px 0' }}>
                  <Loader2 size={20} className="spin-animation" />
                  <p>거래 내역을 불러오는 중...</p>
                </div>
              )}

              {!transactionsLoading && transactionsError && (
                <div className="table-empty-row" style={{ padding: '16px 0' }}>
                  <AlertCircle size={20} />
                  <p>{transactionsError}</p>
                  <button className="btn-section-add" onClick={fetchTransactions} style={{ marginTop: '8px' }}>
                    다시 시도
                  </button>
                </div>
              )}

              <div className="tx-toolbar-top">
                <div className="view-mode-toggle">
                  <button
                    className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                    onClick={() => setViewMode('calendar')}
                    title="달력 뷰"
                  >
                    <CalendarIcon size={15} />
                    <span>달력</span>
                  </button>
                  <button
                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="목록 뷰"
                  >
                    <List size={15} />
                    <span>목록</span>
                  </button>
                </div>
                {viewMode === 'list' && (
                  <button className="btn-section-add" onClick={() => handleOpenAddModal()}>
                    <Plus size={14} />
                    거래내역 등록
                  </button>
                )}
              </div>

              {viewMode === 'list' && (
                <div className="filters-wrapper">
                  <div className="filter-row">
                    <div className="filter-group">
                      <label>계좌 필터</label>
                      <select
                        value={filterAccount}
                        onChange={(e) => setFilterAccount(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="filter-select"
                      >
                        <option value="all">전체 계좌</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>거래 유형</label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="filter-select"
                      >
                        <option value="all">전체 유형</option>
                        <option value="INCOME">수입</option>
                        <option value="EXPENSE">지출</option>
                        <option value="TRANSFER">이체</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>시작일</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="filter-input-date"
                      />
                    </div>

                    <div className="filter-group">
                      <label>종료일</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="filter-input-date"
                      />
                    </div>
                  </div>

                  <div className="filter-search-row">
                    <div className="search-input-wrapper">
                      <Search size={16} className="search-icon" />
                      <input
                        type="text"
                        placeholder="내용, 카테고리, 계좌 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                      />
                      {searchQuery && (
                        <button className="btn-clear-search" onClick={() => setSearchQuery('')}>
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <button className="btn-export" onClick={handleExportCsv} title="엑셀로 내보내기">
                      <Download size={16} />
                      <span>내보내기</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── CALENDAR VIEW ── */}
            {viewMode === 'calendar' && (
              <div className="calendar-wrapper fade-in">
                {/* 달력 필터: 계좌 칩 */}
                {accounts.length > 0 && (
                  <div className="cal-account-filter-bar">
                    <span className="cal-filter-label">계좌</span>
                    <div className="cal-account-chips">
                      <button
                        type="button"
                        className={`cal-account-chip-btn${filterAccount === 'all' ? ' active' : ''}`}
                        onClick={() => setFilterAccount('all')}
                      >
                        전체
                      </button>
                      {accounts.map((acc) => {
                        const color = getAccountColor(acc.id);
                        const isActive = filterAccount === acc.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            className={`cal-account-chip-btn${isActive ? ' active' : ''}`}
                            onClick={() => setFilterAccount(acc.id)}
                            style={isActive ? { borderColor: color.dot, background: color.bg, color: color.dot } : undefined}
                          >
                            <span className="cal-account-dot" style={{ background: color.dot }} />
                            {acc.accountName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 달력 헤더: 월 이동 */}
                <div className="calendar-header">
                  <button className="cal-nav-btn" onClick={prevCalendarMonth}>
                    <ChevronLeft size={18} />
                  </button>
                  <div className="cal-month-dropdown" ref={monthPickerRef}>
                    <button className="cal-month-label" onClick={openMonthPicker} title="년월 선택">
                      {calendarYear}년 {calendarMonth + 1}월
                    </button>
                    {showMonthPicker && (
                      <div className="cal-month-picker">
                        <div className="cal-picker-year-row">
                          <button className="cal-picker-year-btn" onClick={() => setPickerYear(y => y - 1)}>
                            <ChevronLeft size={15} />
                          </button>
                          <span className="cal-picker-year-label">{pickerYear}년</span>
                          <button className="cal-picker-year-btn" onClick={() => setPickerYear(y => y + 1)}>
                            <ChevronRight size={15} />
                          </button>
                          <button className="cal-picker-close" onClick={() => setShowMonthPicker(false)}>
                            <X size={14} />
                          </button>
                        </div>
                        <div className="cal-picker-months">
                          {MONTHS.map((label, i) => (
                            <button
                              key={i}
                              className={`cal-picker-month-btn${pickerYear === calendarYear && i === calendarMonth ? ' active' : ''}`}
                              onClick={() => selectPickerMonth(i)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="cal-nav-btn" onClick={nextCalendarMonth}>
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* 요일 헤더 */}
                <div className="calendar-grid">
                  {WEEKDAYS.map((wd, i) => (
                    <div key={wd} className={`cal-weekday ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}>
                      {wd}
                    </div>
                  ))}

                  {/* 날짜 셀 */}
                  {buildCalendarGrid().map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="cal-day-cell empty" />;
                    }
                    const dateStr = getDateString(day);
                    const { txs, income, expense, transferAmount } = getDaySummary(dateStr);
                    const accountSummaries = filterAccount === 'all' ? getDayAccountSummaries(dateStr) : [];
                    const visibleSummaries = accountSummaries.slice(0, 2);
                    const hiddenSummaryCount = Math.max(0, accountSummaries.length - visibleSummaries.length);
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedCalendarDay;
                    const isSunday = (idx % 7 === 0);
                    const isSaturday = (idx % 7 === 6);

                    return (
                      <div
                        key={dateStr}
                        className={`cal-day-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${txs.length > 0 ? ' has-tx' : ''}`}
                        onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                      >
                        <button
                          type="button"
                          className="cal-day-add-btn"
                          title={`${dateStr} 거래 등록`}
                          onClick={(e) => handleCalendarDayAdd(dateStr, e)}
                        >
                          <Plus size={12} />
                        </button>
                        <span className={`cal-day-num${isSunday ? ' sunday' : isSaturday ? ' saturday' : ''}`}>
                          {day}
                        </span>
                        <div className="cal-tx-summary">
                          {filterAccount === 'all' && accountSummaries.length > 0 ? (
                            <>
                              {visibleSummaries.map((summary) => {
                                const color = getAccountColor(summary.accountId);
                                return (
                                  <span
                                    key={summary.accountId}
                                    className="cal-account-chip"
                                    style={{ background: color.bg, color: color.dot }}
                                    title={summary.accountName}
                                  >
                                    <span className="cal-account-dot" style={{ background: color.dot }} />
                                    {getAccountShortName(summary.accountName)}
                                    {summary.income > 0 && ` +${formatCalAmt(summary.income)}`}
                                    {summary.expense > 0 && ` -${formatCalAmt(summary.expense)}`}
                                    {summary.transferAmount > 0 && ` ↔${formatCalAmt(summary.transferAmount)}`}
                                  </span>
                                );
                              })}
                              {hiddenSummaryCount > 0 && (
                                <span className="cal-more-chip">+{hiddenSummaryCount}</span>
                              )}
                            </>
                          ) : (
                            <>
                              {income > 0 && (
                                <span className="cal-income-dot">+{formatCalAmt(income)}</span>
                              )}
                              {expense > 0 && (
                                <span className="cal-expense-dot">-{formatCalAmt(expense)}</span>
                              )}
                              {transferAmount > 0 && (
                                <span className="cal-transfer-dot">↔{formatCalAmt(transferAmount)}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 선택된 날짜 상세 패널 */}
                {selectedCalendarDay && (
                  <div className="cal-day-detail fade-in">
                    <div className="cal-detail-header">
                      <h4 className="cal-detail-title">
                        <CalendarIcon size={15} />
                        {selectedCalendarDay} 거래 내역
                      </h4>
                      <div className="cal-detail-header-actions">
                        {selectedDayTxs.length > 0 && (
                          <button
                            className="btn-section-add btn-cal-add"
                            onClick={() => handleOpenAddModal({ transactionDate: selectedCalendarDay })}
                          >
                            <Plus size={13} />
                            거래 등록
                          </button>
                        )}
                        <button className="btn-clear-search" onClick={() => setSelectedCalendarDay(null)}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {selectedDayTxs.length === 0 ? (
                      <div className="cal-detail-empty">
                        <button
                          className="btn-section-add btn-cal-add-empty"
                          onClick={() => handleOpenAddModal({ transactionDate: selectedCalendarDay })}
                        >
                          <Plus size={13} />
                          {selectedCalendarDay} 거래 등록
                        </button>
                      </div>
                    ) : (
                      <div className="cal-detail-list">
                        {selectedDayTxs.map(tx => {
                          const accountColor = getAccountColor(tx.accountId);
                          return (
                          <div
                            key={tx.id}
                            className="cal-detail-item cal-detail-item-clickable"
                            onClick={() => handleOpenEditModal(tx.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenEditModal(tx.id);
                              }
                            }}
                          >
                            <div className="cal-detail-left">
                              <span className={`type-badge ${getTxTypeBadgeClass(tx.type)}`}>
                                {getTxTypeLabel(tx.type)}
                              </span>
                              <div className="cal-detail-info">
                                <span className="cal-detail-desc">{tx.description || '—'}</span>
                                <span className="cal-detail-meta">
                                  <span
                                    className="cal-account-badge"
                                    style={{ background: accountColor.bg, color: accountColor.dot }}
                                  >
                                    <span className="cal-account-dot" style={{ background: accountColor.dot }} />
                                    {tx.accountName}
                                  </span>
                                  · <span className="category-tag">{tx.categoryName}</span>
                                </span>
                              </div>
                            </div>
                            <div className="cal-detail-right">
                              <span className={`cal-detail-amount ${tx.type === 'INCOME' ? 'color-income' : tx.type === 'EXPENSE' ? 'color-expense' : 'color-transfer'}`}>
                                {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '↔'}
                                {formatCurrency(tx.amount)}
                              </span>
                              <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="btn-action-icon delete"
                                  onClick={() => handleDeleteItem(tx.id)}
                                  title="삭제"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!selectedCalendarDay && (
                  <p className="cal-select-hint">날짜를 클릭해 거래를 확인하고, 항목을 클릭하면 수정·삭제할 수 있습니다.</p>
                )}
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {viewMode === 'list' && (
              <div className="table-responsive fade-in">
                <table className="asset-table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>계좌</th>
                      <th>카테고리</th>
                      <th>유형</th>
                      <th>내용</th>
                      <th>금액</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="table-empty-row">
                          <Info size={20} />
                          <p>검색 조건에 맞는 거래 내역이 존재하지 않습니다.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(tx => (
                        <tr
                          key={tx.id}
                          className="hover-row tx-row-clickable"
                          onClick={() => handleOpenEditModal(tx.id)}
                        >
                          <td>{tx.transactionDate}</td>
                          <td className="font-semibold text-primary-dark">{tx.accountName}</td>
                          <td>
                            <span className="category-tag">{tx.categoryName}</span>
                          </td>
                          <td>
                            <span className={`type-badge ${getTxTypeBadgeClass(tx.type)}`}>
                              {getTxTypeLabel(tx.type)}
                            </span>
                          </td>
                          <td>
                            <div className="tx-description-cell">
                              <span>{tx.description || '—'}</span>
                            </div>
                          </td>
                          <td className={`font-bold ${tx.type === 'INCOME' ? 'color-income' : tx.type === 'EXPENSE' ? 'color-expense' : 'color-transfer'}`}>
                            {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '↔'}
                            {formatCurrency(tx.amount)}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="btn-action-icon delete"
                                onClick={() => handleDeleteItem(tx.id)}
                                title="삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── SECTION 2: FIXED TRANSACTIONS ─── */}
        {activeSection === 'fixed' && (
          <div className="section-content fade-in">
            <div className="section-action-bar">
              <div className="fixed-intro-card">
                <Sparkles size={18} className="intro-icon" />
                <span>매주·매월 반복되는 수입/지출을 예약하고 자동 정합하세요.</span>
              </div>
              <button className="btn-section-add" onClick={() => handleOpenAddModal()}>
                <Plus size={14} />
                정기내역 등록
              </button>
            </div>

            <div className="table-responsive" style={{ marginTop: '20px' }}>
              {fixedLoading && (
                <div className="table-empty-row" style={{ padding: '40px 0' }}>
                  <Loader2 size={24} className="spin-animation" />
                  <p>고정 수입/지출 목록을 불러오는 중...</p>
                </div>
              )}

              {!fixedLoading && fixedError && (
                <div className="table-empty-row" style={{ padding: '40px 0' }}>
                  <AlertCircle size={24} />
                  <p>{fixedError}</p>
                  <button className="btn-section-add" onClick={fetchFixedTransactions} style={{ marginTop: '12px' }}>
                    다시 시도
                  </button>
                </div>
              )}

              {!fixedLoading && !fixedError && (
              <table className="asset-table">
                <thead>
                  <tr>
                    <th>예약 상태</th>
                    <th>계좌</th>
                    <th>카테고리</th>
                    <th>유형</th>
                    <th>반복 주기</th>
                    <th>반복일</th>
                    <th>시작/종료일</th>
                    <th>내용</th>
                    <th>금액</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="table-empty-row">
                        <Info size={20} />
                        <p>등록된 고정 예약 내역이 없습니다.</p>
                      </td>
                    </tr>
                  ) : (
                    fixedTransactions.map(fx => (
                      <tr key={fx.id} className={`hover-row ${!fx.isActive ? 'row-disabled' : ''}`}>
                        <td>
                          <button
                            className={`toggle-status-btn ${fx.isActive ? 'active' : ''}`}
                            onClick={() => handleToggleFixedActive(fx.id)}
                            title={fx.isActive ? '비활성화' : '활성화'}
                          >
                            <span className="toggle-slider"></span>
                            <span className="toggle-label-text">{fx.isActive ? '활성' : '비활성'}</span>
                          </button>
                        </td>
                        <td className="font-semibold">{fx.accountName}</td>
                        <td>
                          <span className="category-tag">{fx.categoryName}</span>
                        </td>
                        <td>
                          <span className={`type-badge ${getTxTypeBadgeClass(fx.type)}`}>
                            {getTxTypeLabel(fx.type)}
                          </span>
                        </td>
                        <td className="font-semibold">{getFreqLabel(fx.frequency)}</td>
                        <td className="font-semibold">{fx.repeatDay}일</td>
                        <td className="text-muted" style={{ fontSize: '12px' }}>
                          <div>시작: {fx.startDate}</div>
                          {fx.endDate && <div>종료: {fx.endDate}</div>}
                        </td>
                        <td>{fx.description || '—'}</td>
                        <td className={`font-bold ${fx.type === 'INCOME' ? 'color-income' : 'color-expense'}`}>
                          {formatCurrency(fx.amount)}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-action-icon edit" onClick={() => handleOpenEditModal(fx.id)} title="수정">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn-action-icon delete" onClick={() => handleDeleteItem(fx.id)} title="삭제">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              )}
            </div>
          </div>
        )}

        {/* ─── SECTION 3: ACCOUNTS ─── */}
        {activeSection === 'accounts' && (
          <div className="section-content fade-in">
            <div className="section-action-bar">
              <span className="section-action-bar-title">등록된 계좌 {accounts.length}개</span>
              <button className="btn-section-add" onClick={() => handleOpenAddModal()} disabled={accountsLoading}>
                <Plus size={14} />
                자산계좌 추가
              </button>
            </div>

            {accountsLoading && (
              <div className="table-empty-row" style={{ padding: '40px 0' }}>
                <Loader2 size={24} className="spin-animation" />
                <p>계좌 목록을 불러오는 중...</p>
              </div>
            )}

            {!accountsLoading && accountsError && (
              <div className="table-empty-row" style={{ padding: '40px 0' }}>
                <AlertCircle size={24} />
                <p>{accountsError}</p>
                <button className="btn-section-add" onClick={fetchAccounts} style={{ marginTop: '12px' }}>
                  다시 시도
                </button>
              </div>
            )}

            {!accountsLoading && !accountsError && accounts.length === 0 && (
              <div className="table-empty-row" style={{ padding: '40px 0' }}>
                <Info size={20} />
                <p>등록된 계좌가 없습니다. 자산계좌를 추가해 주세요.</p>
              </div>
            )}

            {!accountsLoading && !accountsError && accounts.length > 0 && (
              <div className="accounts-grid">
                {accounts.map(acc => (
                  <div key={acc.id} className="account-card">
                    <div className="account-card-header">
                      <div className="icon-circle">
                        <Wallet size={20} />
                      </div>
                      <div className="card-actions">
                        <button className="btn-action-icon edit" onClick={() => handleOpenEditModal(acc.id)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn-action-icon delete" onClick={() => handleDeleteItem(acc.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="account-card-body">
                      <h3 className="account-title">{acc.accountName}</h3>
                      <div className="balance-info-row">
                        <span className="balance-label">초기 잔고</span>
                        <span className="balance-value balance-value-muted">{formatCurrency(acc.initialBalance)}</span>
                      </div>
                      <div className="balance-info-row">
                        <span className="balance-label">현재 잔고</span>
                        <span className="balance-value">{formatCurrency(acc.currentBalance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── SECTION 4: CATEGORIES ─── */}
        {activeSection === 'categories' && (
          <div className="section-content fade-in">
            {categoriesLoading && (
              <div className="table-empty-row" style={{ padding: '40px 0' }}>
                <Loader2 size={24} className="spin-animation" />
                <p>카테고리 목록을 불러오는 중...</p>
              </div>
            )}

            {!categoriesLoading && categoriesError && (
              <div className="table-empty-row" style={{ padding: '40px 0' }}>
                <AlertCircle size={24} />
                <p>{categoriesError}</p>
                <button className="btn-section-add" onClick={fetchCategories} style={{ marginTop: '12px' }}>
                  다시 시도
                </button>
              </div>
            )}

            {!categoriesLoading && !categoriesError && (
            <div className="categories-grid-columns">

              {/* Income Categories */}
              <div className="category-column">
                <div className="category-column-header">
                  <h3 className="column-title income">수입 카테고리</h3>
                  <button className="btn-cat-add" onClick={() => handleOpenAddModal({ categoryType: 'INCOME' })}>
                    <Plus size={11} /> 추가
                  </button>
                </div>
                <div className="category-list">
                  {categories.filter(c => c.type === 'INCOME').map(cat => (
                    <div key={cat.id} className="category-item-row">
                      <span className="cat-name">{cat.name}</span>
                      <div className="cat-badges-actions">
                        <span className={`cat-system-badge ${cat.isCustom ? 'custom' : 'default'}`}>
                          {cat.isCustom ? '사용자정의' : '기본'}
                        </span>
                        {cat.isCustom && (
                          <div className="cat-actions">
                            <button className="btn-cat-action" onClick={() => handleOpenEditModal(cat.id)}>
                              <Edit2 size={12} />
                            </button>
                            <button className="btn-cat-action delete" onClick={() => handleDeleteItem(cat.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="category-column">
                <div className="category-column-header">
                  <h3 className="column-title expense">지출 카테고리</h3>
                  <button className="btn-cat-add" onClick={() => handleOpenAddModal({ categoryType: 'EXPENSE' })}>
                    <Plus size={11} /> 추가
                  </button>
                </div>
                <div className="category-list">
                  {categories.filter(c => c.type === 'EXPENSE').map(cat => (
                    <div key={cat.id} className="category-item-row">
                      <span className="cat-name">{cat.name}</span>
                      <div className="cat-badges-actions">
                        <span className={`cat-system-badge ${cat.isCustom ? 'custom' : 'default'}`}>
                          {cat.isCustom ? '사용자정의' : '기본'}
                        </span>
                        {cat.isCustom && (
                          <div className="cat-actions">
                            <button className="btn-cat-action" onClick={() => handleOpenEditModal(cat.id)}>
                              <Edit2 size={12} />
                            </button>
                            <button className="btn-cat-action delete" onClick={() => handleDeleteItem(cat.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer Categories */}
              <div className="category-column">
                <div className="category-column-header">
                  <h3 className="column-title transfer">이체 카테고리</h3>
                  <button className="btn-cat-add" onClick={() => handleOpenAddModal({ categoryType: 'TRANSFER' })}>
                    <Plus size={11} /> 추가
                  </button>
                </div>
                <div className="category-list">
                  {categories.filter(c => c.type === 'TRANSFER').map(cat => (
                    <div key={cat.id} className="category-item-row">
                      <span className="cat-name">{cat.name}</span>
                      <div className="cat-badges-actions">
                        <span className={`cat-system-badge ${cat.isCustom ? 'custom' : 'default'}`}>
                          {cat.isCustom ? '사용자정의' : '기본'}
                        </span>
                        {cat.isCustom && (
                          <div className="cat-actions">
                            <button className="btn-cat-action" onClick={() => handleOpenEditModal(cat.id)}>
                              <Edit2 size={12} />
                            </button>
                            <button className="btn-cat-action delete" onClick={() => handleDeleteItem(cat.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            )}
          </div>
        )}

      </div>

      {/* ──────────────────────────────────────────────
         MODAL DIALOG (CRUD form)
      ────────────────────────────────────────────── */}
      {showModal && (
        <div className="asset-modal-overlay" onClick={handleCloseModal}>
          <div className="asset-modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={handleCloseModal}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <div className="modal-header">
              <h3>
                {modalMode === 'create' ? '새로운 ' : '선택한 '}
                {activeSection === 'transactions' && '거래 내역 등록'}
                {activeSection === 'fixed' && '고정 수입/지출 등록'}
                {activeSection === 'accounts' && '자산 계좌 정보'}
                {activeSection === 'categories' && '카테고리 정보'}
                {modalMode === 'edit' && ' 수정'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">

              {/* --- 1. Form for Transactions --- */}
              {activeSection === 'transactions' && (
                <>
                  <div className="form-group-grid">
                    <div className="form-item">
                      <label className="form-label">거래 유형</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as TransactionType)}
                        className="modal-select"
                      >
                        <option value="EXPENSE">지출</option>
                        <option value="INCOME">수입</option>
                        <option value="TRANSFER">이체</option>
                      </select>
                    </div>

                    <div className="form-item">
                      <label className="form-label">출금 계좌</label>
                      <select
                        value={formAccount}
                        onChange={(e) => setFormAccount(e.target.value)}
                        className="modal-select"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                        ))}
                      </select>
                    </div>

                    {formType === 'TRANSFER' && (
                      <div className="form-item">
                        <label className="form-label">입금 대상 계좌 (이체 대상)</label>
                        <select
                          value={formTargetAccount}
                          onChange={(e) => setFormTargetAccount(e.target.value)}
                          className="modal-select"
                        >
                          {accounts.filter(a => a.id !== parseInt(formAccount)).map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-item">
                      <label className="form-label">카테고리 분류</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="modal-select"
                      >
                        {categories.filter(c => c.type === formType).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        {categories.filter(c => c.type === formType).length === 0 && (
                          <option value="" disabled>카테고리를 먼저 등록하세요</option>
                        )}
                      </select>
                    </div>

                    <div className="form-item">
                      <label className="form-label">금액 (원)</label>
                      <input
                        type="number"
                        required
                        placeholder="숫자만 입력하세요"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-item">
                      <label className="form-label">거래 일자</label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="modal-input"
                      />
                    </div>
                  </div>

                  <div className="form-item span-full" style={{ marginTop: '15px' }}>
                    <label className="form-label">메모/내용</label>
                    <input
                      type="text"
                      placeholder="상세 내용을 적어주세요"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                </>
              )}

              {/* --- 2. Form for Fixed Transactions --- */}
              {activeSection === 'fixed' && (
                <>
                  <div className="form-group-grid">
                    <div className="form-item">
                      <label className="form-label">유형</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as TransactionType)}
                        className="modal-select"
                      >
                        <option value="EXPENSE">지출</option>
                        <option value="INCOME">수입</option>
                      </select>
                    </div>

                    <div className="form-item">
                      <label className="form-label">연동 계좌</label>
                      <select
                        value={formAccount}
                        onChange={(e) => setFormAccount(e.target.value)}
                        className="modal-select"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label className="form-label">카테고리</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="modal-select"
                      >
                        {categories.filter(c => c.type === formType).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label className="form-label">반복 주기</label>
                      <select
                        value={formFrequency}
                        onChange={(e) => setFormFrequency(e.target.value as FrequencyType)}
                        className="modal-select"
                      >
                        <option value="WEEKLY">매주</option>
                        <option value="MONTHLY">매월</option>
                        <option value="YEARLY">매년</option>
                      </select>
                    </div>

                    <div className="form-item">
                      <label className="form-label">반복 실행일 (일 단위: 1~31일)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={formRepeatDay}
                        onChange={(e) => setFormRepeatDay(e.target.value)}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-item">
                      <label className="form-label">금액 (원)</label>
                      <input
                        type="number"
                        required
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-item">
                      <label className="form-label">자동이체 시작일</label>
                      <input
                        type="date"
                        required
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-item">
                      <label className="form-label">만기/종료일 (선택사항)</label>
                      <input
                        type="date"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="modal-input"
                      />
                    </div>
                  </div>

                  <div className="form-item span-full" style={{ marginTop: '15px' }}>
                    <label className="form-label">정기 내역 메모</label>
                    <input
                      type="text"
                      placeholder="구독명, 혹은 자동이체 식별 내용 입력"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                </>
              )}

              {/* --- 3. Form for Accounts --- */}
              {activeSection === 'accounts' && (
                <div className="form-group-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="form-item">
                    <label className="form-label">계좌 명칭</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 신한 급여통장, 카카오 비상금 등"
                      value={formAccountName}
                      onChange={(e) => setFormAccountName(e.target.value)}
                      className="modal-input"
                    />
                  </div>

                  {modalMode === 'edit' && selectedId !== null && (
                    <div className="form-item">
                      <label className="form-label">현재 잔고</label>
                      <div className="modal-readonly-value">
                        {formatCurrency(accounts.find((a) => a.id === selectedId)?.currentBalance ?? 0)}
                      </div>
                      <p className="form-hint">거래 내역에 따라 자동 계산됩니다. 직접 수정할 수 없습니다.</p>
                    </div>
                  )}

                  <div className="form-item">
                    <label className="form-label">초기 설정 잔고 (원)</label>
                    <input
                      type="number"
                      required
                      placeholder="초기 가입/등록 잔액 입력"
                      value={formInitialBalance}
                      onChange={(e) => setFormInitialBalance(e.target.value)}
                      className="modal-input"
                    />
                    {modalMode === 'edit' && (
                      <p className="form-hint">
                        초기 잔고만 수정할 수 있으며, 변경 시 현재 잔고도 같은 금액만큼 함께 조정됩니다.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* --- 4. Form for Categories --- */}
              {activeSection === 'categories' && (
                <div className="form-group-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="form-item">
                    <label className="form-label">분류 이름</label>
                    <input
                      type="text"
                      required
                      placeholder="새로운 카테고리 이름을 입력하세요"
                      value={formCategoryName}
                      onChange={(e) => setFormCategoryName(e.target.value)}
                      className="modal-input"
                    />
                  </div>

                  <div className="form-item">
                    <label className="form-label">유형</label>
                    <select
                      value={formCategoryType}
                      onChange={(e) => setFormCategoryType(e.target.value as TransactionType)}
                      className="modal-select"
                    >
                      <option value="EXPENSE">지출</option>
                      <option value="INCOME">수입</option>
                      <option value="TRANSFER">이체</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="modal-footer">
                {modalMode === 'edit' && selectedId !== null ? (
                  <button
                    type="button"
                    className="btn-modal-delete"
                    onClick={handleModalDelete}
                    disabled={submitting}
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                ) : (
                  <span />
                )}
                <div className="modal-footer-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    취소
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="spin-animation" />
                        저장 중...
                      </>
                    ) : (
                      modalMode === 'edit' ? '저장' : '등록'
                    )}
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
