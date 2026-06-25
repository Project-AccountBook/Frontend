import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Users, 
  ShoppingBag, 
  Package, 
  AlertCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

// Interfaces
interface GroupBuyPost {
  id: number;
  category: string;
  title: string;
  owner: string;
  price: number;
  currentCount: number;
  targetCount: number;
  createdAt: string;
  status: '모집중' | '성공' | '무산' | '신고됨';
}

interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

interface Report {
  id: number;
  type: '글' | '댓글';
  targetId: number;
  content: string;
  reporter: string;
  reason: string;
  status: '대기중' | '경고처리' | '삭제처리' | '반려됨';
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  createdAt: string;
}

export const GroupBuyAdminView: React.FC = () => {
  // --- Active Tab State ---
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'dashboard' | 'posts' | 'categories' | 'reports' | 'products'>('dashboard');

  // --- Search & Filters State ---
  const [postFilterStatus, setPostFilterStatus] = useState<string>('전체');
  const [postSearchQuery, setPostSearchQuery] = useState<string>('');
  
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');

  // --- Modal / Form State ---
  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit'>('add');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'add' | 'edit'>('add');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '식품',
    price: 0,
    stock: 0,
    description: ''
  });

  // --- MOCK DATABASE ---
  
  // 1. Group Buying Posts Mock Data
  const [posts, setPosts] = useState<GroupBuyPost[]>([
    { id: 1, category: '생활용품', title: '친환경 세탁세제 대용량 공구', owner: '이웃지기', price: 15000, currentCount: 15, targetCount: 12, createdAt: '2026-06-24 10:30', status: '성공' },
    { id: 2, category: '식품', title: '제주 유기농 흑돼지 삼겹살 1kg', owner: '푸드마스터', price: 23000, currentCount: 8, targetCount: 10, createdAt: '2026-06-24 11:15', status: '모집중' },
    { id: 3, category: '육아용품', title: '친환경 대나무 유아 식기 세트', owner: '튼튼엄마', price: 19800, currentCount: 3, targetCount: 15, createdAt: '2026-06-23 15:40', status: '모집중' },
    { id: 4, category: '패션/잡화', title: '여름 린넨 반팔 티셔츠 (5개 묶음)', owner: '스타일리스트', price: 29900, currentCount: 2, targetCount: 10, createdAt: '2026-06-22 09:00', status: '무산' },
    { id: 5, category: '식품', title: '[산지직송] 성주 꿀참외 5kg 내외', owner: '참외농장', price: 18500, currentCount: 25, targetCount: 20, createdAt: '2026-06-24 08:20', status: '성공' },
    { id: 6, category: '반려동물', title: '프리미엄 고양이 모래 6kg x 3개', owner: '야옹이아빠', price: 24000, currentCount: 11, targetCount: 10, createdAt: '2026-06-24 12:00', status: '신고됨' },
    { id: 7, category: '생활용품', title: '미세먼지 차단 황사마스크 100매', owner: '클린라이프', price: 17500, currentCount: 5, targetCount: 30, createdAt: '2026-06-23 14:10', status: '모집중' },
    { id: 8, category: '가전/디지털', title: '휴대용 미니 손풍기 1+1 기획', owner: '테크홀릭', price: 12900, currentCount: 4, targetCount: 10, createdAt: '2026-06-24 07:45', status: '모집중' }
  ]);

  // 2. Categories Mock Data
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: '식품', description: '과일, 채소, 육류, 가공식품 등 신선한 먹거리 공구', createdAt: '2026-05-01' },
    { id: 2, name: '생활용품', description: '세제, 화장지, 청소용품 등 일상생활 필수품', createdAt: '2026-05-01' },
    { id: 3, name: '육아용품', description: '기저귀, 물티슈, 장난감, 아동의류 등 육아 관련 제품', createdAt: '2026-05-05' },
    { id: 4, name: '반려동물', description: '사료, 간식, 모래, 장난감 등 반려동물용품', createdAt: '2026-05-10' },
    { id: 5, name: '가전/디지털', description: '소형 가전, 디지털 악세사리, 스마트폰 주변기기', createdAt: '2026-05-15' },
    { id: 6, name: '패션/잡화', description: '남녀 의류, 신발, 양말, 패션 소품 공구', createdAt: '2026-05-20' }
  ]);

  // 3. Reports Mock Data
  const [reports, setReports] = useState<Report[]>([
    { id: 1, type: '글', targetId: 6, content: '프리미엄 고양이 모래 6kg x 3개', reporter: '러블리냥', reason: '실제 인터넷 최저가보다 2배 이상 비싸게 공동구매 진행하여 기만 행위 의심', status: '대기중', createdAt: '2026-06-24 14:05' },
    { id: 2, type: '댓글', targetId: 2, content: '이거 유통기한 거의 임박한 제품 덤핑해서 파는 거 같은데요? 절대 사지 마세요.', reporter: '푸드마스터', reason: '사실무근인 내용으로 공구 진행 방해 및 영업 방해 악성 루머 유포', status: '대기중', createdAt: '2026-06-24 15:30' },
    { id: 3, type: '글', targetId: 4, content: '여름 린넨 반팔 티셔츠 (5개 묶음)', reporter: '클린패션', reason: '의류 카탈로그 도용 및 짝퉁 제품 판매 혐의', status: '반려됨', createdAt: '2026-06-23 11:20' },
    { id: 4, type: '댓글', targetId: 3, content: '판매자 진짜 사기꾼임 연락도 안됨 조심하셈', reporter: '이웃사랑', reason: '욕설 및 비방글', status: '경고처리', createdAt: '2026-06-22 18:10' }
  ]);

  // 4. Products Mock Data
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: '영양만점 해남 꿀고구마 5kg', category: '식품', price: 14500, stock: 120, description: '제보 접수: 당도가 높고 가성비 최고인 해남 고구마 산지 직송 공구 상품', createdAt: '2026-06-20' },
    { id: 2, name: '저자극 엠보싱 물티슈 70매 x 10팩', category: '생활용품', price: 11900, stock: 350, description: '요청 반영: 성분이 안전하고 가성비가 높은 생활 필수품 대량 패키지', createdAt: '2026-06-21' },
    { id: 3, name: '유기농 무설탕 아기 퓨레 세트', category: '육아용품', price: 21000, stock: 80, description: '제보 접수: 인공 첨가물이 없는 아기 이유식 보조용 퓨레 제품', createdAt: '2026-06-22' },
    { id: 4, name: '가정용 미니 제습기 1.2L', category: '가전/디지털', price: 49000, stock: 45, description: '요청 반영: 원룸 및 소형 평수 맞춤형 초소형 가성비 제습기', createdAt: '2026-06-23' }
  ]);

  // --- Real-time statistics (calculated dynamically based on state) ---
  const stats = useMemo(() => {
    // Total posts opened today (mock: let's filter created date on 2026-06-24)
    const openedToday = posts.filter(p => p.createdAt.startsWith('2026-06-24')).length;
    
    // Real-time total participants (sum of currentCount)
    const totalParticipants = posts.reduce((sum, p) => sum + p.currentCount, 0);

    // Ratios
    const total = posts.length;
    const recruiting = posts.filter(p => p.status === '모집중').length;
    const success = posts.filter(p => p.status === '성공').length;
    const failed = posts.filter(p => p.status === '무산').length;
    const reported = posts.filter(p => p.status === '신고됨').length;

    const recruitingRate = total > 0 ? Math.round((recruiting / total) * 100) : 0;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    const failedRate = total > 0 ? Math.round((failed / total) * 100) : 0;
    const reportedRate = total > 0 ? Math.round((reported / total) * 100) : 0;

    return {
      openedToday,
      totalParticipants,
      recruiting,
      success,
      failed,
      reported,
      recruitingRate,
      successRate,
      failedRate,
      reportedRate,
      total
    };
  }, [posts]);

  // --- Handlers for Post Management ---
  const handleUpdatePostStatus = (postId: number, newStatus: '모집중' | '성공' | '무산' | '신고됨') => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
  };

  const handleDeletePost = (postId: number) => {
    if (window.confirm('이 공동구매 글을 삭제하시겠습니까? 삭제 시 다시 복구할 수 없습니다.')) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      // Also update any reports related to this post
      setReports(prev => prev.map(r => r.type === '글' && r.targetId === postId ? { ...r, status: '삭제처리' } : r));
    }
  };

  // --- Handlers for Category Management ---
  const handleOpenCategoryModal = (mode: 'add' | 'edit', cat?: Category) => {
    setCategoryModalMode(mode);
    if (mode === 'edit' && cat) {
      setSelectedCategoryId(cat.id);
      setCategoryForm({ name: cat.name, description: cat.description });
    } else {
      setSelectedCategoryId(null);
      setCategoryForm({ name: '', description: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    if (categoryModalMode === 'add') {
      const newCat: Category = {
        id: Date.now(),
        name: categoryForm.name,
        description: categoryForm.description,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCategories(prev => [...prev, newCat]);
    } else if (categoryModalMode === 'edit' && selectedCategoryId !== null) {
      setCategories(prev => prev.map(cat => 
        cat.id === selectedCategoryId 
          ? { ...cat, name: categoryForm.name, description: categoryForm.description } 
          : cat
      ));
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (catId: number, catName: string) => {
    if (window.confirm(`'${catName}' 카테고리를 삭제하시겠습니까?`)) {
      setCategories(prev => prev.filter(cat => cat.id !== catId));
    }
  };

  // --- Handlers for Report Management ---
  const handleResolveReport = (reportId: number, targetId: number, type: '글' | '댓글', action: '경고' | '삭제' | '반려') => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        if (action === '경고') return { ...r, status: '경고처리' };
        if (action === '삭제') return { ...r, status: '삭제처리' };
        return { ...r, status: '반려됨' };
      }
      return r;
    }));

    if (action === '삭제') {
      if (type === '글') {
        // Change associated post status or remove it
        setPosts(prev => prev.filter(p => p.id !== targetId));
      } else {
        alert('신고된 댓글이 삭제처리 되었습니다. (모의 DB 적용)');
      }
    } else if (action === '경고') {
      alert(`해당 ${type} 작성자에게 경고 조치가 알림으로 발송되었습니다.`);
    }
  };

  // --- Handlers for Product Management ---
  const handleOpenProductModal = (mode: 'add' | 'edit', prod?: Product) => {
    setProductModalMode(mode);
    if (mode === 'edit' && prod) {
      setSelectedProductId(prod.id);
      setProductForm({
        name: prod.name,
        category: prod.category,
        price: prod.price,
        stock: prod.stock,
        description: prod.description
      });
    } else {
      setSelectedProductId(null);
      setProductForm({
        name: '',
        category: categories[0]?.name || '식품',
        price: 10000,
        stock: 100,
        description: ''
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    if (productModalMode === 'add') {
      const newProd: Product = {
        id: Date.now(),
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        description: productForm.description,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setProducts(prev => [newProd, ...prev]);
    } else if (productModalMode === 'edit' && selectedProductId !== null) {
      setProducts(prev => prev.map(prod => 
        prod.id === selectedProductId 
          ? { 
              ...prod, 
              name: productForm.name, 
              category: productForm.category, 
              price: Number(productForm.price), 
              stock: Number(productForm.stock), 
              description: productForm.description 
            } 
          : prod
      ));
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (prodId: number, prodName: string) => {
    if (window.confirm(`'${prodName}' 상품을 카탈로그에서 삭제하시겠습니까?`)) {
      setProducts(prev => prev.filter(prod => prod.id !== prodId));
    }
  };

  // --- Filtered lists for rendering ---
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchesStatus = postFilterStatus === '전체' || p.status === postFilterStatus;
      const matchesSearch = p.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
                            p.owner.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(postSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [posts, postFilterStatus, postSearchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                            p.description.toLowerCase().includes(productSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [products, productSearchQuery]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-table-action-btn {
          padding: 6px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          cursor: pointer;
          color: var(--text-secondary);
        }
        .admin-table-action-btn:hover {
          background-color: var(--border-hover);
          color: var(--text-primary);
        }
        .admin-table-delete-btn {
          padding: 6px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--red);
          transition: all var(--transition-fast);
          cursor: pointer;
        }
        .admin-table-delete-btn:hover {
          background-color: var(--red-bg);
          color: var(--red);
        }
        .admin-card-hover {
          transition: all var(--transition-normal);
        }
        .admin-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border-hover) !important;
        }
      `}} />
      
      {/* 🚀 Top Dashboard Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract background graphics */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'var(--blue)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={10} /> 어드민 시스템
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>v1.2.0</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff' }}>
            공동구매 관리 제어센터
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '6px' }}>
            동네 공동구매 현황 요약, 카테고리 관리, 상품 등록 및 사용자 신고를 효율적으로 조율합니다.
          </p>
        </div>

        {/* System Pulsing Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 20px',
            borderRadius: '12px',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>서버 상태</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: '700', fontSize: '14px' }}>
              <span className="pulsing-dot"></span>
              <span>정상 운영중</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 Admin Sub Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '2px',
        gap: '8px'
      }}>
        {[
          { id: 'dashboard', label: '📊 실시간 대시보드' },
          { id: 'posts', label: '📝 공구 글 관리' },
          { id: 'categories', label: '📁 카테고리 관리' },
          { id: 'reports', label: `🚨 신고 접수 (${reports.filter(r=>r.status==='대기중').length})` },
          { id: 'products', label: '📦 등록 상품 CRUD' }
        ].map(tab => {
          const isActive = activeAdminSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminSubTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
                marginBottom: '-3px'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          VIEW 1: DASHBOARD
          ========================================================================= */}
      {activeAdminSubTab === 'dashboard' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Stat Cards Grid */}
          <div className="dashboard-grid-4">
            
            {/* Card 1: Today Opened */}
            <div className="card stat-card blue-theme">
              <div className="icon-wrapper">
                <Calendar size={20} />
              </div>
              <h3 className="card-title">당일 개설 공구</h3>
              <div className="stat-value">{stats.openedToday} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>건</span></div>
              <div className="stat-sub up">
                <TrendingUp size={14} />
                <span>어제 대비 18% 상승</span>
              </div>
            </div>

            {/* Card 2: Realtime Participants */}
            <div className="card stat-card purple-theme">
              <div className="icon-wrapper">
                <Users size={20} />
              </div>
              <h3 className="card-title">실시간 참여 인원</h3>
              <div className="stat-value">{stats.totalParticipants} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>명</span></div>
              <div className="stat-sub up">
                <ArrowUpRight size={14} />
                <span>시간당 평균 24명 유입</span>
              </div>
            </div>

            {/* Card 3: Success Rate */}
            <div className="card stat-card" style={{ borderLeft: '4px solid var(--green)' }}>
              <div className="icon-wrapper" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                <CheckCircle size={20} />
              </div>
              <h3 className="card-title">공동구매 성공율</h3>
              <div className="stat-value">{stats.successRate}%</div>
              <div className="progress-bar-container" style={{ marginTop: '8px' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${stats.successRate}%`, backgroundColor: 'var(--green)' }}
                />
              </div>
            </div>

            {/* Card 4: Report Status */}
            <div className="card stat-card red-theme">
              <div className="icon-wrapper">
                <AlertTriangle size={20} />
              </div>
              <h3 className="card-title">대기 중인 신고</h3>
              <div className="stat-value">{reports.filter(r => r.status === '대기중').length} <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>건</span></div>
              <div className="stat-sub down" style={{ color: 'var(--red)' }}>
                <AlertCircle size={14} />
                <span>즉각적인 검토 필요</span>
              </div>
            </div>

          </div>

          {/* SVG Charts & Analysis Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            
            {/* Left: Interactive Ratio Visualizer */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header-row" style={{ marginBottom: '0' }}>
                <div>
                  <h3 className="card-title">공동구매 상태 비율 분석</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    시스템에 등록된 전체 {stats.total}개 공구 글의 현재 상태 현황입니다.
                  </p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} /> 실시간 연동됨
                </span>
              </div>

              {/* Graphical Visualizer */}
              <div style={{ display: 'flex', gap: '32px', alignItems: 'center', padding: '16px 0' }}>
                
                {/* SVG Donut Chart */}
                <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    
                    {/* Successful slice */}
                    <circle 
                      cx="50" cy="50" r="40" fill="transparent" 
                      stroke="var(--green)" strokeWidth="12" 
                      strokeDasharray={`${stats.successRate * 2.51} 251`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                    
                    {/* Recruiting slice */}
                    <circle 
                      cx="50" cy="50" r="40" fill="transparent" 
                      stroke="var(--blue)" strokeWidth="12" 
                      strokeDasharray={`${stats.recruitingRate * 2.51} 251`}
                      strokeDashoffset={`-${stats.successRate * 2.51}`}
                      transform="rotate(-90 50 50)"
                    />

                    {/* Failed slice */}
                    <circle 
                      cx="50" cy="50" r="40" fill="transparent" 
                      stroke="#94a3b8" strokeWidth="12" 
                      strokeDasharray={`${stats.failedRate * 2.51} 251`}
                      strokeDashoffset={`-${(stats.successRate + stats.recruitingRate) * 2.51}`}
                      transform="rotate(-90 50 50)"
                    />

                    {/* Reported slice */}
                    <circle 
                      cx="50" cy="50" r="40" fill="transparent" 
                      stroke="var(--red)" strokeWidth="12" 
                      strokeDasharray={`${stats.reportedRate * 2.51} 251`}
                      strokeDashoffset={`-${(stats.successRate + stats.recruitingRate + stats.failedRate) * 2.51}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.total}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>총 공구 수</div>
                  </div>
                </div>

                {/* Right: Legend with percents */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: '성공 완료', count: stats.success, percent: stats.successRate, color: 'var(--green)', bg: 'var(--green-bg)' },
                    { label: '모집 진행중', count: stats.recruiting, percent: stats.recruitingRate, color: 'var(--blue)', bg: 'var(--blue-bg)' },
                    { label: '무산/기간 만료', count: stats.failed, percent: stats.failedRate, color: '#94a3b8', bg: '#f1f5f9' },
                    { label: '신고/제제 대기', count: stats.reported, percent: stats.reportedRate, color: 'var(--red)', bg: 'var(--red-bg)' }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: item.bg
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.count}건</span>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{item.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Right: System Notifications / Quick Log */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className="card-title">오늘의 주요 이슈 로그</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '200px' }}>
                
                <div style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--red)', marginTop: '2px' }}><AlertCircle size={16} /></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>신고 대기 건 추가 발생</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>고양이 모래 공구 글에 기만 의심 신고가 접수되었습니다.</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>14:05</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--green)', marginTop: '2px' }}><CheckCircle size={16} /></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>성주 꿀참외 공구 목표 초과 달성</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>참여인원 25명 달성으로 공동구매가 최종 성공 확정되었습니다.</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>08:20</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: 'var(--blue)', marginTop: '2px' }}><ShoppingBag size={16} /></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>신규 공구 글 등록 알림</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>식품 카테고리에 제주 흑돼지 공구 글이 신규 개설되었습니다.</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>11:15</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Quick Action Banner */}
          <div style={{
            background: 'var(--blue-bg)',
            border: '1px solid var(--blue-border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--blue)' }}><Sliders size={20} /></span>
              <div>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>이웃 제보 상품 등록 필요</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>최근 사용자들이 제보한 물품 중 4개의 대량 가성비 상품이 카탈로그 심사를 기다리고 있습니다.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveAdminSubTab('products')}
              style={{
                background: 'var(--navy)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              상품 등록 하러가기
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 2: POSTS MANAGEMENT
          ========================================================================= */}
      {activeAdminSubTab === 'posts' && (
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card-header-row" style={{ marginBottom: '0' }}>
            <div>
              <h3 className="card-title">전체 공동구매 글 리스트 모니터링</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                회원들이 개설한 공동구매의 상태를 강제 조정하거나 관리자 권한으로 조치를 취합니다.
              </p>
            </div>
          </div>

          {/* Filters & Search Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border)'
          }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              {['전체', '모집중', '성공', '무산', '신고됨'].map(status => {
                const isActive = postFilterStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setPostFilterStatus(status)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: isActive ? '700' : '500',
                      borderRadius: '6px',
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{
              position: 'relative',
              width: '280px'
            }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="제목, 작성자, 카테고리 검색..."
                value={postSearchQuery}
                onChange={e => setPostSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>공동구매 제목</th>
                  <th>작성자</th>
                  <th>가격</th>
                  <th>참여 현황</th>
                  <th>개설일시</th>
                  <th>상태</th>
                  <th style={{ textAlign: 'center' }}>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      조건에 부합하는 공동구매 글이 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map(post => {
                    // Badge styles based on status
                    let statusColor = '#94a3b8';
                    let statusBg = '#f1f5f9';
                    if (post.status === '모집중') {
                      statusColor = 'var(--blue)';
                      statusBg = 'var(--blue-bg)';
                    } else if (post.status === '성공') {
                      statusColor = 'var(--green)';
                      statusBg = 'var(--green-bg)';
                    } else if (post.status === '신고됨') {
                      statusColor = 'var(--red)';
                      statusBg = 'var(--red-bg)';
                    }

                    // Progress calculations
                    const progressPercent = Math.min(100, Math.round((post.currentCount / post.targetCount) * 100));

                    return (
                      <tr key={post.id}>
                        <td>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            color: 'var(--text-secondary)'
                          }}>
                            {post.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{post.title}</div>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{post.owner}</td>
                        <td style={{ fontWeight: '600' }}>{post.price.toLocaleString()}원</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600' }}>
                              <span>{post.currentCount}/{post.targetCount}명</span>
                              <span style={{ color: progressPercent >= 100 ? 'var(--green)' : 'var(--text-secondary)' }}>{progressPercent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                                background: progressPercent >= 100 ? 'var(--green)' : 'var(--blue)',
                                borderRadius: '2px'
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{post.createdAt}</td>
                        <td>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            color: statusColor,
                            background: statusBg,
                            border: `1px solid ${statusColor}40`
                          }}>
                            {post.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {post.status === '모집중' && (
                              <>
                                <button 
                                  onClick={() => handleUpdatePostStatus(post.id, '성공')}
                                  title="성공 완료 처리"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: 'var(--green-bg)',
                                    color: 'var(--green)',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    border: '1px solid var(--green-border)'
                                  }}
                                >
                                  성공
                                </button>
                                <button 
                                  onClick={() => handleUpdatePostStatus(post.id, '무산')}
                                  title="무산 처리"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    border: '1px solid #cbd5e1'
                                  }}
                                >
                                  무산
                                </button>
                              </>
                            )}
                            {post.status === '신고됨' && (
                              <button 
                                onClick={() => handleUpdatePostStatus(post.id, '모집중')}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: 'var(--blue-bg)',
                                  color: 'var(--blue)',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  border: '1px solid var(--blue-border)'
                                }}
                              >
                                제제해제
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              title="삭제"
                              className="admin-table-delete-btn"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 3: CATEGORY MANAGEMENT
          ========================================================================= */}
      {activeAdminSubTab === 'categories' && (
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card-header-row" style={{ marginBottom: '0' }}>
            <div>
              <h3 className="card-title">서비스 카테고리 구성 관리</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                공동구매 등록 시 적용되는 카테고리를 설정합니다. 카테고리를 등록, 수정, 삭제할 수 있습니다.
              </p>
            </div>
            
            <button
              onClick={() => handleOpenCategoryModal('add')}
              className="header-btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--navy)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              <Plus size={16} />
              <span>신규 카테고리 추가</span>
            </button>
          </div>

          {/* Table */}
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th style={{ width: '150px' }}>카테고리명</th>
                  <th>설명</th>
                  <th style={{ width: '120px' }}>등록일</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>소속 공구수</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>조치</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  // Count how many posts belong to this category
                  const postCount = posts.filter(p => p.category === cat.name).length;
                  
                  return (
                    <tr key={cat.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>#{cat.id.toString().slice(-4)}</td>
                      <td>
                        <span style={{
                          fontWeight: '700',
                          fontSize: '14px',
                          background: 'var(--blue-bg)',
                          color: 'var(--blue)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {cat.name}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cat.description}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{cat.createdAt}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700' }}>
                        {postCount} 개
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenCategoryModal('edit', cat)}
                            className="admin-table-action-btn"
                            style={{ color: 'var(--blue)' }}
                            title="수정"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="admin-table-delete-btn"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Category CRUD Modal */}
          {isCategoryModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '480px',
                background: '#ffffff',
                boxShadow: 'var(--shadow-lg)',
                padding: '28px',
                borderRadius: '16px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  {categoryModalMode === 'add' ? '📂 신규 카테고리 등록' : '✏️ 카테고리 정보 수정'}
                </h3>
                
                <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      카테고리 이름
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 스포츠/레저, 디지털기기 등"
                      value={categoryForm.name}
                      onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      설명
                    </label>
                    <textarea
                      rows={3}
                      placeholder="이 카테고리에 속하는 공동구매 물품에 대한 설명입니다..."
                      value={categoryForm.description}
                      onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        background: 'var(--navy)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      저장하기
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          VIEW 4: REPORT MANAGEMENT
          ========================================================================= */}
      {activeAdminSubTab === 'reports' && (
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card-header-row" style={{ marginBottom: '0' }}>
            <div>
              <h3 className="card-title">신고 접수 내역 및 경고/삭제 처리</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                사용자가 신고한 공동구매 본문 및 댓글을 검토하고 제제 또는 반려 조치를 행합니다.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>구분</th>
                  <th style={{ width: '220px' }}>신고 대상 내용</th>
                  <th>신고 사유</th>
                  <th style={{ width: '100px' }}>신고자</th>
                  <th style={{ width: '120px' }}>신고일시</th>
                  <th style={{ width: '100px' }}>처리상태</th>
                  <th style={{ width: '200px', textAlign: 'center' }}>처리 Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(rep => {
                  // Badge styles based on report status
                  let badgeBg = '#f1f5f9';
                  let badgeColor = '#64748b';
                  if (rep.status === '대기중') {
                    badgeBg = 'var(--red-bg)';
                    badgeColor = 'var(--red)';
                  } else if (rep.status === '경고처리') {
                    badgeBg = '#fffbeb';
                    badgeColor = '#d97706'; // Amber/warning
                  } else if (rep.status === '삭제처리') {
                    badgeBg = '#f1f5f9';
                    badgeColor = 'var(--text-secondary)';
                  } else if (rep.status === '반려됨') {
                    badgeBg = 'var(--green-bg)';
                    badgeColor = 'var(--green)';
                  }

                  return (
                    <tr key={rep.id}>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          background: rep.type === '글' ? 'var(--blue-bg)' : 'var(--purple-bg)',
                          color: rep.type === '글' ? 'var(--blue)' : 'var(--purple)'
                        }}>
                          {rep.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={rep.content}>
                          {rep.content}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {rep.targetId}</span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        {rep.reason}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{rep.reporter}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rep.createdAt}</td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: badgeBg,
                          color: badgeColor
                        }}>
                          {rep.status}
                        </span>
                      </td>
                      <td>
                        {rep.status === '대기중' ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleResolveReport(rep.id, rep.targetId, rep.type, '경고')}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#fffbeb',
                                color: '#d97706',
                                fontSize: '11px',
                                fontWeight: '700',
                                border: '1px solid #fde68a'
                              }}
                            >
                              경고발송
                            </button>
                            <button
                              onClick={() => handleResolveReport(rep.id, rep.targetId, rep.type, '삭제')}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'var(--red-bg)',
                                color: 'var(--red)',
                                fontSize: '11px',
                                fontWeight: '700',
                                border: '1px solid var(--red-border)'
                              }}
                            >
                              대상삭제
                            </button>
                            <button
                              onClick={() => handleResolveReport(rep.id, rep.targetId, rep.type, '반려')}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '11px',
                                fontWeight: '700',
                                border: '1px solid #cbd5e1'
                              }}
                            >
                              반려
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>
                            조치 완료
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 5: PRODUCT CRUD CATALOG
          ========================================================================= */}
      {activeAdminSubTab === 'products' && (
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card-header-row" style={{ marginBottom: '0' }}>
            <div>
              <h3 className="card-title">공동구매 상품 카탈로그 (CRUD)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                사용자들이 공구 요청이나 제보한 물품을 기반으로 등록한 정식 공동구매 상품 풀을 관리합니다.
              </p>
            </div>
            
            <button
              onClick={() => handleOpenProductModal('add')}
              className="header-btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--navy)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              <Plus size={16} />
              <span>신규 공동구매 상품 등록</span>
            </button>
          </div>

          {/* Search Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="상품명, 카테고리, 내용 검색..."
                value={productSearchQuery}
                onChange={e => setProductSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
            </div>
          </div>

          {/* Product Catalog Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                등록된 상품이 없거나 검색 결과가 없습니다.
              </div>
            ) : (
              filteredProducts.map(prod => (
                <div key={prod.id} className="admin-card-hover" style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}>
                  
                  {/* Category tag & edit actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'var(--purple-bg)',
                      color: 'var(--purple)'
                    }}>
                      {prod.category}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => handleOpenProductModal('edit', prod)}
                        className="admin-table-action-btn"
                        style={{ color: 'var(--blue)' }}
                        title="상품 수정"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="admin-table-delete-btn"
                        title="상품 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Product title & price */}
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{prod.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>공급 단가</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {prod.price.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '500' }}>원</span>
                      </span>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    backgroundColor: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    minHeight: '48px',
                    lineHeight: '1.4'
                  }}>
                    {prod.description}
                  </div>

                  {/* Stock status */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Package size={14} /> 재고 보유량
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: prod.stock < 50 ? 'var(--red)' : 'var(--text-primary)' 
                    }}>
                      {prod.stock} 개 {prod.stock < 50 && '(품절 임박)'}
                    </span>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Product CRUD Modal */}
          {isProductModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '520px',
                background: '#ffffff',
                boxShadow: 'var(--shadow-lg)',
                padding: '28px',
                borderRadius: '16px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  {productModalMode === 'add' ? '📦 신규 공동구매 상품 등록' : '✏️ 상품 정보 및 재고 수정'}
                </h3>
                
                <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Product Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      상품명
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 프리미엄 세탁세제 대용량"
                      value={productForm.name}
                      onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Category & Price */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        카테고리 선택
                      </label>
                      <select
                        value={productForm.category}
                        onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '14px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          outline: 'none',
                          background: '#ffffff'
                        }}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        권장 단가 (원)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="가격을 입력하세요"
                        value={productForm.price}
                        onChange={e => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '14px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Stock */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      초기 공급/재고 수량 (개)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="재고를 입력하세요"
                      value={productForm.stock}
                      onChange={e => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      설명 및 제보 출처 정보
                    </label>
                    <textarea
                      rows={3}
                      placeholder="상품 설명이나 사용자가 제보/요청한 상세 정보를 기록하세요..."
                      value={productForm.description}
                      onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        background: 'var(--navy)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      상품 저장
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
