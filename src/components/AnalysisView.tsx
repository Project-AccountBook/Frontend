import React, { useState } from 'react';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

interface SubCategoryItem {
  name: string;
  percent: number;
  value: number;
  color: string;
}

export const AnalysisView: React.FC = () => {
  const [hoveredSubSlice, setHoveredSubSlice] = useState<number | null>(null);

  const subCategories: SubCategoryItem[] = [
    { name: '식비 > 외식', percent: 17, value: 1200000, color: '#3b82f6' },
    { name: '식비 > 식자재 (공구)', percent: 19, value: 1300000, color: '#10b981' },
    { name: '주거비 > 대출이자', percent: 15, value: 1000000, color: '#059669' },
    { name: '주거비 > 관리비', percent: 7, value: 500000, color: '#f43f5e' },
    { name: '육아용품 > 기저귀/분유', percent: 17, value: 1200000, color: '#06b6d4' }
  ];

  // Calculate angles for rendering a complete visual donut chart
  const totalVal = subCategories.reduce((acc, curr) => acc + curr.value, 0);
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ~219.91
  let accumulatedPercent = 0;

  const tableData = [
    { month: '1월', income: '2,820', expense: '663', savings: '300', rate: '10.6%' },
    { month: '2월', income: '1,390', expense: '704', savings: '300', rate: '21.6%' },
    { month: '3월', income: '1,388', expense: '691', savings: '300', rate: '21.6%' },
    { month: '4월', income: '1,392', expense: '651', savings: '300', rate: '21.6%' },
    { month: '5월', income: '1,393', expense: '682', savings: '300', rate: '21.5%' },
    { month: '6월', income: '1,455', expense: '660', savings: '300', rate: '20.6%' }
  ];

  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

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

  return (
    <div className="fade-in">
      {/* 3-Column Top Grid */}
      <div className="dashboard-grid-3">
        {/* Column 1: Sub-category Donut */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title">하위 카테고리 상세</span>
          </div>

          <div className="donut-chart-container">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              {subCategories.map((slice, index) => {
                // Determine slice size using its value ratio to render full 100% circle
                const sliceRatio = slice.value / totalVal;
                const strokeDashoffset = circumference - (accumulatedPercent / 100) * circumference;
                const strokeDasharray = `${sliceRatio * circumference} ${circumference}`;
                const isHovered = hoveredSubSlice === index;
                accumulatedPercent += sliceRatio * 100;

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

        {/* Column 2: Monthly breakdown table */}
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
                {tableData.map((row) => (
                  <tr key={row.month}>
                    <td style={{ fontWeight: '700' }}>{row.month}</td>
                    <td>{row.income}</td>
                    <td>{row.expense}</td>
                    {/* Highlight savings column values in green with custom styles */}
                    <td style={{ color: '#10b981', fontWeight: '700' }}>{row.savings}</td>
                    <td>{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 3: Detailed Metrics & composition */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title">상세 내역</span>
          </div>

          {/* KPI Indicators */}
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

          {/* Asset ratios */}
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

      {/* Bottom Layout Panel: 동네 공동구매 현황 */}
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
