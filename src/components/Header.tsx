import React from 'react';
import { Bell } from 'lucide-react';
import modiLogo from '../assets/modi-logo.png';

interface HeaderProps {
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unreadCount = 0,
  onOpenNotifications,
  onOpenDrawer,
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="header-logo-btn"
          aria-label="메뉴 열기"
          onClick={onOpenDrawer}
        >
          <img src={modiLogo} alt="MODI" />
        </button>
        <div className="header-status-badge">
          <span className="pulsing-dot"></span>
          <span>가계부 접속중</span>
        </div>
      </div>

      <div className="header-right">
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
      </div>
    </header>
  );
};
