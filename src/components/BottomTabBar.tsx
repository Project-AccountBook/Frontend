import React from 'react';
import { Home, ReceiptText, PiggyBank, Users, User } from 'lucide-react';

export const COMMUNITY_TAB_IDS = new Set([
  'community',
  'qa',
  'knowhow',
  'groupbuy',
  'comparison',
  'locationComparison',
]);

const TABS = [
  { id: 'dashboard', label: '홈', icon: Home },
  { id: 'history', label: '내역', icon: ReceiptText },
  { id: 'budget', label: '예산', icon: PiggyBank },
  { id: 'community', label: '커뮤니티', icon: Users },
  { id: 'settings', label: '마이', icon: User },
] as const;

export function resolveBottomTab(activeTab: string): string | null {
  if (activeTab === 'dashboard' || activeTab === 'history' || activeTab === 'budget' || activeTab === 'settings') {
    return activeTab;
  }
  if (COMMUNITY_TAB_IDS.has(activeTab)) return 'community';
  return null;
}

interface BottomTabBarProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onChange }) => {
  const current = resolveBottomTab(activeTab);

  return (
    <nav className="bottom-tab-bar" aria-label="주요 메뉴">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-tab-btn ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
