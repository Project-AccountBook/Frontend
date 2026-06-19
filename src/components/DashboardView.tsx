import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Coins, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

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

export const DashboardView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('대시보드');
  const [activeCategoryTab, setActiveCategoryTab] = useState('지출');
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState<number | null>(null);
  const [hoveredSubSlice, setHoveredSubSlice] = useState<number | null>(null);

  // Donut chart mock data for different categories
  const categoryData: Record<string, CategoryData[]> = {
    지출: [
      { name: '식비', value: 2500000, percent: 36, color: '#3b82f6' },
      { name: '주거비', value: 1500000, percent: 22, color: '#10b981' },
      { name: '육아용품', value: 1200000, percent: 17, color: '#f43f5e' },
      { name: '교통/통신', value: 859106, percent: 13, color: '#8b5cf6' },
      { name: '기타/예비비', value: 800000, percent: 12, color: '#f59e0b' }
    ],
    수입: [
      { name: '근로소득', value: 9500000, percent: 65, color: '#3b82f6' },
      { name: '사업소득', value: 3000000, percent: 21, color: '#10b981' },
      { name: '금융소득', value: 1200000, percent: 8, color: '#8b5cf6' },
      { name: '기타수입', value: 846049, percent: 6, color: '#f59e0b' }
    ],
    저축: [
      { name: '청약저축', value: 1500000, percent: 50, color: '#10b981' },
      { name: '정기적금', value: 1000000, percent: 33, color: '#3b82f6' },
      { name: '연금저축', value: 500000, percent: 17, color: '#8b5cf6' }
    ]
  };

  const subCategories: SubCategoryItem[] = [
    { name: '식비 > 외식', percent: 17, value: 1200000, color: '#3b82f6' },
    { name: '식비 > 식자재 (공구)', percent: 19, value: 1300000, color: '#10b981' },
    { name: '주거비 > 대출이자', percent: 15, value: 1000000, color: '#059669' },
    { name: '주거비 > 관리비', percent: 7, value: 500000, color: '#f43f5e' },
    { name: '육아용품 > 기저귀/분유', percent: 17, value: 1200000, color: '#06b6d4' }
  ];

  const currentCategoryData = categoryData[activeCategoryTab] || [];
  const totalAmount = currentCategoryData.reduce((acc, curr) => acc + curr.value, 0);

  // SVG Donut slice calculation helpers
  let accumulatedPercent = 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ~219.91

  // SVG Subcategory Donut slice calculation helpers
  const totalSubVal = subCategories.reduce((acc, curr) => acc + curr.value, 0);
  let accumulatedSubPercent = 0;

  // Bar chart data (income, savings, expense for months 1-6)
  const monthlyFlowData = [
    { month: '1월', income: 2820, expense: 663, savings: 300, rate: '10.6%' },
    { month: '2월', income: 1390, expense: 704, savings: 300, rate: '21.6%' },
    { month: '3월', income: 1388, expense: 691, savings: 300, rate: '21.6%' },
    { month: '4월', income: 1392, expense: 651, savings: 300, rate: '21.6%' },
    { month: '5월', income: 1393, expense: 682, savings: 300, rate: '21.5%' },
    { month: '6월', income: 1455, expense: 660, savings: 300, rate: '20.6%' }
  ];

  const groupBuys = [
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

  // Helper to format currency
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  return (
    <div className="fade-in">
      {/* Sub Header tabs & date picker */}
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
        <div className="dashboard-date-selector">
          <button className="dashboard-date-arrow" aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span>2026년 6월 소비분석표</span>
          <button className="dashboard-date-arrow" aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="dashboard-grid-4">
        {/* Card 1: Income */}
        <div className="card stat-card blue-theme">
          <div className="card-header-row">
            <span className="card-title">월 총 수입</span>
            <div className="icon-wrapper">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="stat-value">+{formatKRW(14546049)}</div>
          <div className="stat-sub up">
            <span>전월 대비 +620,883원</span>
          </div>
        </div>

        {/* Card 2: Expense */}
        <div className="card stat-card red-theme">
          <div className="card-header-row">
            <span className="card-title">월 총 지출</span>
            <div className="icon-wrapper">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="stat-value">-{formatKRW(6859106)}</div>
          <div className="stat-sub down">
            <span>전월 대비 +44,056원</span>
          </div>
        </div>

        {/* Card 3: Budget */}
        <div className="card stat-card purple-theme">
          <div className="card-header-row">
            <span className="card-title">가계부 예산 잔액</span>
            <div className="icon-wrapper">
              <Wallet size={20} />
            </div>
          </div>
          <div className="stat-value">{formatKRW(3140894)}</div>
          <div className="stat-label">월 예산: {formatKRW(10000000)}원</div>
        </div>

        {/* Card 4: Navy Asset Card */}
        <div className="card stat-card navy-theme">
          <div className="card-header-row">
            <span className="card-title">현재 종합 자산</span>
            <div className="icon-wrapper">
              <Coins size={20} />
            </div>
          </div>
          <div className="stat-value">{formatKRW(663000000)}</div>
          <div className="stat-label" style={{ display: 'flex', gap: '12px' }}>
            <span>유동: 28.5M</span>
            <span>투자: 64.5M</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Charts Grid */}
      <div className="dashboard-grid-3">
        
        {/* Column 1: Category Donut Charts (Main & Sub) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Category Donut */}
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
                    : activeCategoryTab
                  }
                </span>
                <span className="donut-center-lbl">
                  {hoveredDonutSlice !== null 
                    ? currentCategoryData[hoveredDonutSlice].name
                    : `${formatKRW(totalAmount)}원`
                  }
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
                    <div className="legend-dot" style={{ backgroundColor: slice.color }}></div>
                    <span className="legend-name">{slice.name}</span>
                    <span className="legend-percent">{slice.percent}%</span>
                  </div>
                  <span className="legend-val">{formatKRW(slice.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sub Category Donut */}
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">하위 카테고리 상세</span>
            </div>

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
                  {hoveredSubSlice !== null 
                    ? `${subCategories[hoveredSubSlice].percent}%`
                    : '카테고리'
                  }
                </span>
                <span className="donut-center-lbl" style={{ fontSize: '10px' }}>
                  {hoveredSubSlice !== null 
                    ? subCategories[hoveredSubSlice].name.split(' > ')[1]
                    : '상위 5개 항목'
                  }
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
                    <div className="legend-dot" style={{ backgroundColor: slice.color }}></div>
                    <span className="legend-name" style={{ fontSize: '12px' }}>{slice.name}</span>
                    <span className="legend-percent" style={{ fontSize: '12px' }}>{slice.percent}%</span>
                  </div>
                  <span className="legend-val" style={{ fontSize: '12px' }}>{formatKRW(slice.value)}</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Column 2: Flow Charts (Bar & Table) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Bar Chart */}
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">월별 현금흐름 분석</span>
            </div>

            <div className="bar-chart-card-content">
              <div className="bar-chart-stats">
                <div className="bar-chart-stat-item">
                  <span className="bar-chart-stat-lbl">평균 수입금액</span>
                  <span className="bar-chart-stat-val blue-text">16,400,000원</span>
                  <span className="stat-label" style={{ fontSize: '10px' }}>최근 6개월 평균</span>
                </div>
                <div className="bar-chart-stat-item">
                  <span className="bar-chart-stat-lbl">평균 지출금액</span>
                  <span className="bar-chart-stat-val red-text">6,750,000원</span>
                  <span className="stat-label" style={{ fontSize: '10px' }}>최근 6개월 평균</span>
                </div>
              </div>

              <div className="svg-bar-chart-container">
                {monthlyFlowData.map((data) => {
                  const maxVal = 3000;
                  const incHeight = Math.max(5, (data.income / maxVal) * 100);
                  const expHeight = Math.max(5, (data.expense / maxVal) * 100);
                  const savHeight = Math.max(5, (data.savings / maxVal) * 100);

                  return (
                    <div key={data.month} className="svg-bar-group">
                      <div className="svg-bar-bars">
                        <div 
                          className="svg-bar blue" 
                          style={{ height: `${incHeight}%` }} 
                          title={`수입: ${data.income * 10000}원`}
                        />
                        <div 
                          className="svg-bar green" 
                          style={{ height: `${savHeight}%` }} 
                          title={`저축: ${data.savings * 10000}원`}
                        />
                        <div 
                          className="svg-bar red" 
                          style={{ height: `${expHeight}%` }} 
                          title={`지출: ${data.expense * 10000}원`}
                        />
                      </div>
                      <span className="svg-bar-label">{data.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="svg-bar-legend">
                <div className="svg-bar-legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span>수입</span>
                </div>
                <div className="svg-bar-legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#10b981' }}></div>
                  <span>저축</span>
                </div>
                <div className="svg-bar-legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#f43f5e' }}></div>
                  <span>지출</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
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
                  {monthlyFlowData.map((row) => (
                    <tr key={row.month}>
                      <td style={{ fontWeight: '700' }}>{row.month}</td>
                      <td>{formatKRW(row.income * 10000)}</td>
                      <td>{formatKRW(row.expense * 10000)}</td>
                      <td style={{ color: '#10b981', fontWeight: '700' }}>{formatKRW(row.savings * 10000)}</td>
                      <td>{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* Column 3: Trend & Detailed Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Trend Line Chart */}
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">월흐름 추세</span>
              <span className="stat-label">2026년 반기</span>
            </div>

            <div className="trend-line-container">
              <svg viewBox="0 0 120 40" width="100%" height="100%">
                <line x1="0" y1="10" x2="120" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
                <line x1="0" y1="20" x2="120" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                <line x1="0" y1="30" x2="120" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
                
                <path 
                  d="M 10,12 L 30,28 L 50,29 L 70,27 L 90,28 L 110,24" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="1.5" 
                />
                <circle cx="10" cy="12" r="1.5" fill="#3b82f6" />
                <circle cx="30" cy="28" r="1.5" fill="#3b82f6" />
                <circle cx="50" cy="29" r="1.5" fill="#3b82f6" />
                <circle cx="70" cy="27" r="1.5" fill="#3b82f6" />
                <circle cx="90" cy="28" r="1.5" fill="#3b82f6" />
                <circle cx="110" cy="24" r="1.5" fill="#3b82f6" />

                <path 
                  d="M 10,25 L 30,25 L 50,25 L 70,25 L 90,25 L 110,25" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="1" 
                  strokeDasharray="2,2"
                />

                <path 
                  d="M 10,22 L 30,22 L 50,22 L 70,22 L 90,22 L 110,22" 
                  fill="none" 
                  stroke="#f43f5e" 
                  strokeWidth="1" 
                  strokeDasharray="2,2"
                />
              </svg>
            </div>

            <div className="trend-info-grid">
              <div className="trend-info-card">
                <span className="trend-info-lbl">총 자산</span>
                <div className="trend-info-val">{formatKRW(663000000)}원</div>
              </div>
              <div className="trend-info-card">
                <span className="trend-info-lbl">이달 저축</span>
                <div className="trend-info-val">{formatKRW(3000000)}원</div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics & Asset Ratios */}
          <div className="card">
            <div className="card-header-row">
              <span className="card-title">상세 내역</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border)',
                padding: '14px 16px',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>전월 대비</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#10b981',
                  background: '#ecfdf5',
                  padding: '4px 10px',
                  borderRadius: '20px'
                }}>+ 4.5%</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border)',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>연초 대비</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#10b981',
                  background: '#ecfdf5',
                  padding: '4px 10px',
                  borderRadius: '20px'
                }}>+ 8.2%</span>
              </div>
            </div>

            <span className="card-title" style={{ fontSize: '14px', display: 'block', marginBottom: '16px' }}>자산 구성 비율</span>
            <div className="asset-progress-list" style={{ marginTop: 0 }}>
              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">유동자산</span>
                  <span className="asset-progress-val">28.5M (4.3%)</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: '4.3%', backgroundColor: '#3b82f6' }}></div>
                </div>
              </div>

              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">투자자산</span>
                  <span className="asset-progress-val">64.5M (9.7%)</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: '9.7%', backgroundColor: '#10b981' }}></div>
                </div>
              </div>

              <div className="asset-progress-item">
                <div className="asset-progress-header">
                  <span className="asset-progress-name">비유동자산</span>
                  <span className="asset-progress-val">570.0M (86.0%)</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: '86%', backgroundColor: '#8b5cf6' }}></div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

      </div>

      {/* Bottom Full-width Row: 동네 공동구매 현황 */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={18} />
            </div>
            <span className="card-title">동네 공동구매 현황</span>
          </div>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            background: '#f8fafc',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: '8px'
          }}>
            <span>전체보기</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Group buy cards list */}
        <div className="group-buy-grid">
          {groupBuys.map((item) => (
            <div key={item.id} className="group-buy-card">
              <div className="group-buy-header">
                <span className="group-buy-category">{item.category}</span>
                <span className={`group-buy-status-badge ${item.statusType}`}>
                  {item.status}
                </span>
              </div>

              <div className="group-buy-title">{item.title}</div>

              <div>
                <div className="group-buy-progress-row">
                  <span>목표 달성률</span>
                  <span className="percent">{item.progress}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, item.progress)}%`, 
                      backgroundColor: item.progressBarColor 
                    }}
                  ></div>
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
