import React from 'react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  unreadCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ unreadCount = 0, onOpenNotifications }) => {
  return (
    <header className="header">
      <div className="header-left">
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
