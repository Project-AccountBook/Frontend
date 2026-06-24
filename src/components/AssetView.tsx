import React, { useState } from 'react';
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
  ArrowRight,
  Sparkles,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// ──────────────────────────────────────────────
// Enums & Types
// ──────────────────────────────────────────────
type ActiveSection = 'transactions' | 'fixed' | 'accounts' | 'categories';
type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
type FrequencyType = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type ViewMode = 'calendar' | 'list';

interface Account {
  id: number;
  accountName: string;
  currentBalance: number;
  initialBalance: number;
}

interface Category {
  id: number;
  name: string;
  type: TransactionType;
  isCustom: boolean;
}

interface FixedTransaction {
  id: number;
  accountId: number;
  accountName: string;
  categoryId: number;
  categoryName: string;
  type: TransactionType;
  amount: number;
  frequency: FrequencyType;
  repeatDay: number;
  startDate: string;
  endDate?: string;
  description: string;
  isActive: boolean;
}

interface Transaction {
  id: number;
  accountId: number;
  accountName: string;
  categoryId: number;
  categoryName: string;
  targetAccountId?: number;
  targetAccountName?: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  description: string;
}

export const AssetView: React.FC = () => {
  // ──────────────────────────────────────────────
  // States
  // ──────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<ActiveSection>('transactions');

  // Calendar view states
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-based
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());

  // --- Mock Data ---
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, accountName: '신한 주거래 우대통장', currentBalance: 3450000, initialBalance: 2000000 },
    { id: 2, accountName: '국민 생활비 통장', currentBalance: 1250000, initialBalance: 1000000 },
    { id: 3, accountName: '카카오 26주 적금', currentBalance: 5200000, initialBalance: 0 },
    { id: 4, accountName: '우리카드 (결제대금 계좌)', currentBalance: 450000, initialBalance: 500000 }
  ]);

  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: '월급/급여', type: 'INCOME', isCustom: false },
    { id: 2, name: '부업/용돈', type: 'INCOME', isCustom: false },
    { id: 3, name: '식비', type: 'EXPENSE', isCustom: false },
    { id: 4, name: '교통비', type: 'EXPENSE', isCustom: false },
    { id: 5, name: '쇼핑/생필품', type: 'EXPENSE', isCustom: false },
    { id: 6, name: '경조사/기부', type: 'EXPENSE', isCustom: false },
    { id: 7, name: '관리비/세금', type: 'EXPENSE', isCustom: false },
    { id: 8, name: '계좌간 이체', type: 'TRANSFER', isCustom: false },
    { id: 9, name: '배당금 수익', type: 'INCOME', isCustom: true },
    { id: 10, name: '반려동물 용품', type: 'EXPENSE', isCustom: true }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, accountId: 1, accountName: '신한 주거래 우대통장', categoryId: 1, categoryName: '월급/급여', type: 'INCOME', amount: 3200000, transactionDate: '2026-06-21', description: '6월 월급' },
    { id: 2, accountId: 1, accountName: '신한 주거래 우대통장', categoryId: 8, categoryName: '계좌간 이체', targetAccountId: 2, targetAccountName: '국민 생활비 통장', type: 'TRANSFER', amount: 1500000, transactionDate: '2026-06-22', description: '생활비 통장으로 이체' },
    { id: 3, accountId: 2, accountName: '국민 생활비 통장', categoryId: 3, categoryName: '식비', type: 'EXPENSE', amount: 45000, transactionDate: '2026-06-23', description: '이마트 장보기' },
    { id: 4, accountId: 2, accountName: '국민 생활비 통장', categoryId: 5, categoryName: '쇼핑/생필품', type: 'EXPENSE', amount: 28000, transactionDate: '2026-06-23', description: '올리브영 생필품' },
    { id: 5, accountId: 1, accountName: '신한 주거래 우대통장', categoryId: 7, categoryName: '관리비/세금', type: 'EXPENSE', amount: 185000, transactionDate: '2026-06-20', description: '6월 아파트 관리비' },
    { id: 6, accountId: 2, accountName: '국민 생활비 통장', categoryId: 4, categoryName: '교통비', type: 'EXPENSE', amount: 62000, transactionDate: '2026-06-18', description: '지하철/버스 카드대금' }
  ]);

  const [fixedTransactions, setFixedTransactions] = useState<FixedTransaction[]>([
    { id: 1, accountId: 1, accountName: '신한 주거래 우대통장', categoryId: 1, categoryName: '월급/급여', type: 'INCOME', amount: 3200000, frequency: 'MONTHLY', repeatDay: 21, startDate: '2026-01-21', description: '정기 월급', isActive: true },
    { id: 2, accountId: 1, accountName: '신한 주거래 우대통장', categoryId: 7, categoryName: '관리비/세금', type: 'EXPENSE', amount: 185000, frequency: 'MONTHLY', repeatDay: 20, startDate: '2026-01-20', description: '아파트 관리비 자동이체', isActive: true },
    { id: 3, accountId: 2, accountName: '국민 생활비 통장', categoryId: 10, categoryName: '반려동물 용품', type: 'EXPENSE', amount: 49000, frequency: 'MONTHLY', repeatDay: 5, startDate: '2026-03-05', description: '사료 정기배송 구독', isActive: false }
  ]);

  // --- Filter states ---
  const [filterAccount, setFilterAccount] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Modals state ---
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields State
  const [formAccount, setFormAccount] = useState<string>('1');
  const [formTargetAccount, setFormTargetAccount] = useState<string>('2');
  const [formCategory, setFormCategory] = useState<string>('3');
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState<string>('');

  // Fixed Transaction specific fields
  const [formFrequency, setFormFrequency] = useState<FrequencyType>('MONTHLY');
  const [formRepeatDay, setFormRepeatDay] = useState<string>('20');
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState<string>('');

  // Account specific fields
  const [formAccountName, setFormAccountName] = useState<string>('');
  const [formInitialBalance, setFormInitialBalance] = useState<string>('');

  // Category specific fields
  const [formCategoryName, setFormCategoryName] = useState<string>('');
  const [formCategoryType, setFormCategoryType] = useState<TransactionType>('EXPENSE');

  // ──────────────────────────────────────────────
  // CRUD Handlers (Local state modification)
  // ──────────────────────────────────────────────

  const resetFormFields = () => {
    setFormAccount('1');
    setFormTargetAccount('2');
    setFormCategory('3');
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
        if (tx.targetAccountId) setFormTargetAccount(tx.targetAccountId.toString());
        setFormCategory(tx.categoryId.toString());
        setFormType(tx.type);
        setFormAmount(tx.amount.toString());
        setFormDate(tx.transactionDate);
        setFormDescription(tx.description);
      }
    } else if (activeSection === 'fixed') {
      const fx = fixedTransactions.find(f => f.id === id);
      if (fx) {
        setFormAccount(fx.accountId.toString());
        setFormCategory(fx.categoryId.toString());
        setFormType(fx.type);
        setFormAmount(fx.amount.toString());
        setFormFrequency(fx.frequency);
        setFormRepeatDay(fx.repeatDay.toString());
        setFormStartDate(fx.startDate);
        if (fx.endDate) setFormEndDate(fx.endDate);
        setFormDescription(fx.description);
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

  const handleDeleteItem = (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      if (activeSection === 'transactions') {
        setTransactions(transactions.filter(t => t.id !== id));
      } else if (activeSection === 'fixed') {
        setFixedTransactions(fixedTransactions.filter(f => f.id !== id));
      } else if (activeSection === 'accounts') {
        setAccounts(accounts.filter(a => a.id !== id));
      } else if (activeSection === 'categories') {
        setCategories(categories.filter(c => c.id !== id));
      }
    }
  };

  const handleToggleFixedActive = (id: number) => {
    setFixedTransactions(fixedTransactions.map(f => {
      if (f.id === id) {
        return { ...f, isActive: !f.isActive };
      }
      return f;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeSection === 'transactions') {
      const accObj = accounts.find(a => a.id === parseInt(formAccount));
      const catObj = categories.find(c => c.id === parseInt(formCategory));
      const targetAccObj = accounts.find(a => a.id === parseInt(formTargetAccount));

      if (modalMode === 'create') {
        const newTx: Transaction = {
          id: transactions.length ? Math.max(...transactions.map(t => t.id)) + 1 : 1,
          accountId: accObj ? accObj.id : 1,
          accountName: accObj ? accObj.accountName : '알 수 없음 계좌',
          categoryId: catObj ? catObj.id : 3,
          categoryName: catObj ? catObj.name : '기타',
          type: formType,
          amount: parseFloat(formAmount) || 0,
          transactionDate: formDate,
          description: formDescription,
          targetAccountId: formType === 'TRANSFER' && targetAccObj ? targetAccObj.id : undefined,
          targetAccountName: formType === 'TRANSFER' && targetAccObj ? targetAccObj.accountName : undefined
        };
        setTransactions([newTx, ...transactions]);
      } else {
        setTransactions(transactions.map(t => {
          if (t.id === selectedId) {
            return {
              ...t,
              accountId: accObj ? accObj.id : t.accountId,
              accountName: accObj ? accObj.accountName : t.accountName,
              categoryId: catObj ? catObj.id : t.categoryId,
              categoryName: catObj ? catObj.name : t.categoryName,
              type: formType,
              amount: parseFloat(formAmount) || 0,
              transactionDate: formDate,
              description: formDescription,
              targetAccountId: formType === 'TRANSFER' && targetAccObj ? targetAccObj.id : undefined,
              targetAccountName: formType === 'TRANSFER' && targetAccObj ? targetAccObj.accountName : undefined
            };
          }
          return t;
        }));
      }
    } else if (activeSection === 'fixed') {
      const accObj = accounts.find(a => a.id === parseInt(formAccount));
      const catObj = categories.find(c => c.id === parseInt(formCategory));

      if (modalMode === 'create') {
        const newFx: FixedTransaction = {
          id: fixedTransactions.length ? Math.max(...fixedTransactions.map(f => f.id)) + 1 : 1,
          accountId: accObj ? accObj.id : 1,
          accountName: accObj ? accObj.accountName : '알 수 없음 계좌',
          categoryId: catObj ? catObj.id : 3,
          categoryName: catObj ? catObj.name : '기타',
          type: formType,
          amount: parseFloat(formAmount) || 0,
          frequency: formFrequency,
          repeatDay: parseInt(formRepeatDay) || 1,
          startDate: formStartDate,
          endDate: formEndDate || undefined,
          description: formDescription,
          isActive: true
        };
        setFixedTransactions([newFx, ...fixedTransactions]);
      } else {
        setFixedTransactions(fixedTransactions.map(f => {
          if (f.id === selectedId) {
            return {
              ...f,
              accountId: accObj ? accObj.id : f.accountId,
              accountName: accObj ? accObj.accountName : f.accountName,
              categoryId: catObj ? catObj.id : f.categoryId,
              categoryName: catObj ? catObj.name : f.categoryName,
              type: formType,
              amount: parseFloat(formAmount) || 0,
              frequency: formFrequency,
              repeatDay: parseInt(formRepeatDay) || 1,
              startDate: formStartDate,
              endDate: formEndDate || undefined,
              description: formDescription
            };
          }
          return f;
        }));
      }
    } else if (activeSection === 'accounts') {
      if (modalMode === 'create') {
        const newAcc: Account = {
          id: accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
          accountName: formAccountName,
          initialBalance: parseFloat(formInitialBalance) || 0,
          currentBalance: parseFloat(formInitialBalance) || 0
        };
        setAccounts([...accounts, newAcc]);
      } else {
        setAccounts(accounts.map(a => {
          if (a.id === selectedId) {
            return {
              ...a,
              accountName: formAccountName,
              initialBalance: parseFloat(formInitialBalance) || 0,
              currentBalance: parseFloat(formInitialBalance) || 0
            };
          }
          return a;
        }));
      }
    } else if (activeSection === 'categories') {
      if (modalMode === 'create') {
        const newCat: Category = {
          id: categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1,
          name: formCategoryName,
          type: formCategoryType,
          isCustom: true
        };
        setCategories([...categories, newCat]);
      } else {
        setCategories(categories.map(c => {
          if (c.id === selectedId) {
            return {
              ...c,
              name: formCategoryName,
              type: formCategoryType
            };
          }
          return c;
        }));
      }
    }

    setShowModal(false);
    resetFormFields();
  };

  // --- CSV Export Simulator ---
  const handleExportCsv = () => {
    alert(`[CSV Export] ${startDate} 부터 ${endDate} 까지의 거래 내역 파일 다운로드를 준비합니다.`);
  };

  // ──────────────────────────────────────────────
  // Filter Logic
  // ──────────────────────────────────────────────
  const filteredTransactions = transactions.filter(tx => {
    if (filterAccount !== 'all' && tx.accountId !== filterAccount) return false;
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (tx.transactionDate < startDate || tx.transactionDate > endDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
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

  // 캘린더 셀용 숫자 표시 (쉼표 구분, 원 단위 생략)
  const formatCalAmt = (val: number) => val.toLocaleString('ko-KR');

  // ──────────────────────────────────────────────
  // Calendar Logic
  // ──────────────────────────────────────────────
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

  const getDaySummary = (dateStr: string) => {
    const txs = txByDate[dateStr] || [];
    const income = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const transfer = txs.filter(t => t.type === 'TRANSFER').length;
    return { txs, income, expense, transfer };
  };

  const selectedDayTxs = selectedCalendarDay ? (txByDate[selectedCalendarDay] || []) : [];
  const todayStr = today.toISOString().split('T')[0];

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div className="asset-management-wrapper fade-in">

      {/* Title & Navigation */}
      <div className="asset-header">
        <div>
          <h1 className="asset-page-title">내역 및 자산 관리</h1>
          <p className="asset-page-subtitle">거래내역 등록, 정기 예약 수입/지출 관리, 계좌 및 카테고리를 한번에 관리하세요</p>
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
                {/* 달력 헤더: 월 이동 */}
                <div className="calendar-header">
                  <button className="cal-nav-btn" onClick={prevCalendarMonth}>
                    <ChevronLeft size={18} />
                  </button>
                  <button className="cal-month-label" onClick={openMonthPicker} title="년월 선택">
                    {calendarYear}년 {calendarMonth + 1}월
                  </button>
                  <button className="cal-nav-btn" onClick={nextCalendarMonth}>
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* 년월 선택 피커 */}
                {showMonthPicker && (
                  <div className="cal-month-picker fade-in">
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
                    const { txs, income, expense, transfer } = getDaySummary(dateStr);
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
                          {income > 0 && (
                            <span className="cal-income-dot">+{formatCalAmt(income)}</span>
                          )}
                          {expense > 0 && (
                            <span className="cal-expense-dot">-{formatCalAmt(expense)}</span>
                          )}
                          {transfer > 0 && (
                            <span className="cal-transfer-dot">이체</span>
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
                        {selectedDayTxs.map(tx => (
                          <div key={tx.id} className="cal-detail-item">
                            <div className="cal-detail-left">
                              <span className={`type-badge ${getTxTypeBadgeClass(tx.type)}`}>
                                {getTxTypeLabel(tx.type)}
                              </span>
                              <div className="cal-detail-info">
                                <span className="cal-detail-desc">{tx.description || '—'}</span>
                                <span className="cal-detail-meta">
                                  {tx.accountName} · <span className="category-tag">{tx.categoryName}</span>
                                  {tx.type === 'TRANSFER' && tx.targetAccountName && (
                                    <> <ArrowRight size={11} /> {tx.targetAccountName}</>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="cal-detail-right">
                              <span className={`cal-detail-amount ${tx.type === 'INCOME' ? 'color-income' : tx.type === 'EXPENSE' ? 'color-expense' : 'color-transfer'}`}>
                                {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                                {formatCurrency(tx.amount)}
                              </span>
                              <div className="table-actions">
                                <button className="btn-action-icon edit" onClick={() => handleOpenEditModal(tx.id)} title="수정">
                                  <Edit2 size={13} />
                                </button>
                                <button className="btn-action-icon delete" onClick={() => handleDeleteItem(tx.id)} title="삭제">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!selectedCalendarDay && (
                  <p className="cal-select-hint">날짜를 클릭하면 해당 날짜의 거래를 확인하고 등록할 수 있습니다.</p>
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
                      <th>분류</th>
                      <th>유형</th>
                      <th>내용</th>
                      <th className="text-right">금액</th>
                      <th className="text-center">관리</th>
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
                        <tr key={tx.id} className="hover-row">
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
                              {tx.type === 'TRANSFER' && tx.targetAccountName && (
                                <span className="transfer-target-desc">
                                  <ArrowRight size={12} /> {tx.targetAccountName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`text-right font-bold ${tx.type === 'INCOME' ? 'color-income' : tx.type === 'EXPENSE' ? 'color-expense' : 'color-transfer'}`}>
                            {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                            {formatCurrency(tx.amount)}
                          </td>
                          <td>
                            <div className="table-actions">
                              <button className="btn-action-icon edit" onClick={() => handleOpenEditModal(tx.id)} title="수정">
                                <Edit2 size={14} />
                              </button>
                              <button className="btn-action-icon delete" onClick={() => handleDeleteItem(tx.id)} title="삭제">
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
              <button className="btn-section-add" onClick={handleOpenAddModal}>
                <Plus size={14} />
                정기내역 등록
              </button>
            </div>

            <div className="table-responsive" style={{ marginTop: '20px' }}>
              <table className="asset-table">
                <thead>
                  <tr>
                    <th>예약 상태</th>
                    <th>계좌</th>
                    <th>분류</th>
                    <th>유형</th>
                    <th>반복 주기</th>
                    <th>반복일</th>
                    <th>시작/종료일</th>
                    <th>내용</th>
                    <th className="text-right">금액</th>
                    <th className="text-center">관리</th>
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
                        <td className="font-semibold text-center">{fx.repeatDay}일</td>
                        <td className="text-muted" style={{ fontSize: '12px' }}>
                          <div>시작: {fx.startDate}</div>
                          {fx.endDate && <div>종료: {fx.endDate}</div>}
                        </td>
                        <td>{fx.description || '—'}</td>
                        <td className={`text-right font-bold ${fx.type === 'INCOME' ? 'color-income' : 'color-expense'}`}>
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
            </div>
          </div>
        )}

        {/* ─── SECTION 3: ACCOUNTS ─── */}
        {activeSection === 'accounts' && (
          <div className="section-content fade-in">
            <div className="section-action-bar">
              <span className="section-action-bar-title">등록된 계좌 {accounts.length}개</span>
              <button className="btn-section-add" onClick={handleOpenAddModal}>
                <Plus size={14} />
                자산계좌 추가
              </button>
            </div>
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
                      <span className="balance-label">현재 잔고</span>
                      <span className="balance-value">{formatCurrency(acc.currentBalance)}</span>
                    </div>
                    <div className="balance-info-row secondary">
                      <span className="balance-label">초기 잔고</span>
                      <span className="balance-value">{formatCurrency(acc.initialBalance)}</span>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* ─── SECTION 4: CATEGORIES ─── */}
        {activeSection === 'categories' && (
          <div className="section-content fade-in">
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
          </div>
        )}

      </div>

      {/* ──────────────────────────────────────────────
         MODAL DIALOG (CRUD form)
      ────────────────────────────────────────────── */}
      {showModal && (
        <div className="asset-modal-overlay">
          <div className="asset-modal-content fade-in">
            <div className="modal-header">
              <h3>
                {modalMode === 'create' ? '새로운 ' : '선택한 '}
                {activeSection === 'transactions' && '거래 내역 등록'}
                {activeSection === 'fixed' && '고정 수입/지출 등록'}
                {activeSection === 'accounts' && '자산 계좌 정보'}
                {activeSection === 'categories' && '카테고리 정보'}
                {modalMode === 'edit' && ' 수정'}
              </h3>
              <button className="modal-close-btn" onClick={() => { setShowModal(false); resetFormFields(); }}>
                <X size={18} />
              </button>
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
                          <option value="8">기타</option>
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
                      placeholder="상세 내용을 적어주세요 (예: 이마트 홈플러스 구입 등)"
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
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetFormFields(); }}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  등록/저장 완료
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
