import React from 'react';
import {
  Bell,
  Lightbulb,
  Menu,
  MessageSquare,
  PiggyBank,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import modiLogo from '../assets/modi-logo.png';

type AppHeaderMeta = {
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export function resolveAppHeaderTitle(activeTab: string): AppHeaderMeta | null {
  switch (activeTab) {
    case 'dashboard':
      return null;
    case 'history':
      return { label: '내역 및 자산 관리', icon: Wallet, iconBg: 'var(--primary-light)', iconColor: 'var(--primary)' };
    case 'budget':
      return { label: '예산', icon: PiggyBank, iconBg: 'var(--blue-bg)', iconColor: 'var(--blue)' };
    case 'community':
      return { label: '커뮤니티', icon: Users, iconBg: 'var(--blue-bg)', iconColor: 'var(--blue)' };
    case 'qa':
      return { label: 'Q&A', icon: MessageSquare, iconBg: 'var(--purple-bg)', iconColor: 'var(--purple)' };
    case 'knowhow':
      return { label: '노하우', icon: Lightbulb, iconBg: 'var(--blue-bg)', iconColor: 'var(--blue)' };
    case 'groupbuy':
      return { label: '공동구매', icon: ShoppingBag, iconBg: 'var(--purple-bg)', iconColor: 'var(--purple)' };
    case 'comparison':
    case 'locationComparison':
      return { label: '자산 비교', icon: TrendingUp, iconBg: 'var(--green-bg)', iconColor: 'var(--green)' };
    case 'notifications':
      return { label: '알림', icon: Bell, iconBg: 'var(--blue-bg)', iconColor: 'var(--blue)' };
    case 'settings':
      return { label: '마이', icon: User, iconBg: 'var(--blue-bg)', iconColor: 'var(--blue)' };
    default:
      return null;
  }
}

interface HeaderProps {
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenDrawer?: () => void;
  title?: string | null;
  TitleIcon?: LucideIcon | null;
  iconBg?: string;
  iconColor?: string;
  hideNotificationButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  unreadCount = 0,
  onOpenNotifications,
  onOpenDrawer,
  title = null,
  TitleIcon = null,
  iconBg = 'var(--blue-bg)',
  iconColor = 'var(--blue)',
  hideNotificationButton = false,
}) => {
  return (
    <header className="header">
      <div className="header-left">
        {onOpenDrawer && (
          <button
            type="button"
            className="header-menu-btn"
            aria-label="메뉴 열기"
            onClick={onOpenDrawer}
          >
            <Menu size={22} strokeWidth={2.25} />
          </button>
        )}
        {title ? (
          <div className="header-title-wrap">
            {TitleIcon && (
              <span className="header-title-icon" style={{ background: iconBg, color: iconColor }}>
                <TitleIcon size={18} strokeWidth={2.2} />
              </span>
            )}
            <h1 className={`header-title${title.length > 6 ? ' is-long' : ''}`}>{title}</h1>
          </div>
        ) : null}
      </div>

      {!title && (
        <div className="header-brand" aria-hidden="false">
          <img src={modiLogo} alt="MODI" className="header-brand-logo" />
        </div>
      )}

      <div className="header-right">
        {!hideNotificationButton && (
          <button
            className="header-icon-btn"
            aria-label={`알림 ${unreadCount}개`}
            onClick={onOpenNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
