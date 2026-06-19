import React from 'react';
import { Bell, User, Sliders } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-status-badge">
          <span className="pulsing-dot"></span>
          <span>가계부 접속중</span>
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="badge"></span>
        </button>

        <button className="header-profile-btn" aria-label="User profile">
          <User size={18} />
        </button>

        <button className="header-btn-primary">
          <Sliders size={16} />
          <span>예산 설정</span>
        </button>
      </div>
    </header>
  );
};
