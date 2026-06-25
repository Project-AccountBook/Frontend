import React from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  LineChart, 
  TrendingUp, 
  MessageSquare, 
  Lightbulb, 
  ShoppingBag, 
  Settings,
  Wallet,
  Shield,
  PiggyBank,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'history', label: '내역 및 자산 관리', icon: ReceiptText },
    { id: 'budget', label: '예산 관리', icon: PiggyBank },
    { id: 'analysis', label: '소비/예산 분석', icon: LineChart },
    { id: 'comparison', label: '이웃 자산 비교', icon: TrendingUp },
    { id: 'qa', label: 'Q&A 게시판', icon: MessageSquare },
    { id: 'knowhow', label: '노하우 공유', icon: Lightbulb },
    { id: 'groupbuy', label: '동네 공동구매', icon: ShoppingBag, isHot: true },
    { id: 'groupbuyAdmin', label: '공동구매 어드민', icon: Shield },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Wallet size={18} />
        </div>
        <span className="sidebar-logo-text">Joint Living</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <IconComponent size={18} />
              <span>{item.label}</span>
              {item.isHot && <span className="sidebar-item-hot">HOT</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
          style={{ width: '100%' }}
        >
          <Settings size={18} />
          <span>설정 및 프로필</span>
        </button>
        <button 
          onClick={onLogout}
          className="sidebar-item logout-btn"
          style={{ width: '100%' }}
        >
          <LogOut size={18} />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
};
