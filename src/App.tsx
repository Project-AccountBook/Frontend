import { useMemo, useState } from 'react';
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AnalysisView } from './components/AnalysisView';
import { ComparisonView } from './components/ComparisonView';
import { GroupBuyView } from './components/GroupBuyView';
import { KnowhowListView } from './components/KnowhowListView';
import { KnowhowDetailView } from './components/KnowhowDetailView';
import { KnowhowWriteView } from './components/KnowhowWriteView';
import { QnaListView } from './components/QnaListView';
import { QnaDetailView } from './components/QnaDetailView';
import { QnaWriteView } from './components/QnaWriteView';
import { NotificationView, MOCK_NOTIFICATIONS } from './components/NotificationView';
import { BudgetView } from './components/BudgetView';
import { AssetView } from './components/AssetView';
import { BudgetView } from './components/BudgetView';
import { LoginView } from './components/LoginView';
import { MyPageView } from './components/MyPageView';
import { Construction } from 'lucide-react';

type BoardMode = 'list' | 'detail' | 'write';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('accessToken'));
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [knowhowMode, setKnowhowMode] = useState<BoardMode>('list');
  const [knowhowPostId, setKnowhowPostId] = useState<number | null>(null);
  const [qnaMode, setQnaMode] = useState<BoardMode>('list');
  const [qnaPostId, setQnaPostId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  useEffect(() => {
    if (window.location.pathname === '/oauth2/redirect') {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      if (accessToken && refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userEmail', 'social-login');
        setIsLoggedIn(true);
      }
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Logout API error:', err);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setKnowhowMode('list');
    setKnowhowPostId(null);
    setQnaMode('list');
    setQnaPostId(null);
  };

  const renderKnowhow = () => {
    if (knowhowMode === 'write') {
      return (
        <KnowhowWriteView
          onCancel={() => setKnowhowMode('list')}
          onSubmit={() => setKnowhowMode('list')}
        />
      );
    }
    if (knowhowMode === 'detail' && knowhowPostId !== null) {
      return (
        <KnowhowDetailView
          postId={knowhowPostId}
          onBack={() => {
            setKnowhowMode('list');
            setKnowhowPostId(null);
          }}
        />
      );
    }
    return (
      <KnowhowListView
        onSelectPost={(id) => {
          setKnowhowPostId(id);
          setKnowhowMode('detail');
        }}
        onWrite={() => setKnowhowMode('write')}
      />
    );
  };

  const renderQna = () => {
    if (qnaMode === 'write') {
      return (
        <QnaWriteView
          onCancel={() => setQnaMode('list')}
          onSubmit={() => setQnaMode('list')}
        />
      );
    }
    if (qnaMode === 'detail' && qnaPostId !== null) {
      return (
        <QnaDetailView
          postId={qnaPostId}
          onBack={() => {
            setQnaMode('list');
            setQnaPostId(null);
          }}
        />
      );
    }
    return (
      <QnaListView
        onSelectPost={(id) => {
          setQnaPostId(id);
          setQnaMode('detail');
        }}
        onWrite={() => setQnaMode('write')}
      />
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'history':
        return <AssetView />;
      case 'budget':
        return <BudgetView />;
      case 'analysis':
        return <AnalysisView />;
      case 'comparison':
        return <ComparisonView />;
      case 'budget':
        return <BudgetView />;
      case 'groupbuy':
        return <GroupBuyView />;
      case 'knowhow':
        return renderKnowhow();
      case 'qa':
        return renderQna();
      case 'notifications':
        return (
          <NotificationView
            notifications={notifications}
            setNotifications={setNotifications}
          />
        );
      case 'settings':
        return <MyPageView />;
      default:
        return (
          <div
            className="card fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 24px',
              textAlign: 'center',
              gap: '20px'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--blue-bg)',
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Construction size={32} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}
              >
                준비 중인 페이지입니다
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  maxWidth: '320px',
                  margin: '0 auto'
                }}
              >
                선택하신 서비스는 현재 준비 중입니다. 더 나은 서비스를 제공하기 위해 개발 작업을
                진행하고 있습니다.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                background: 'var(--navy)',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                marginTop: '12px'
              }}
            >
              대시보드로 돌아가기
            </button>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} />

      {/* Main Container */}
      <div className="main-container">
        {/* Top Header */}
        <Header
          unreadCount={unreadNotificationCount}
          onOpenNotifications={() => handleTabChange('notifications')}
        />

        {/* Dashboard Content */}
        <main className="dashboard-content">
          {renderContent()}
        </main>
        <Header />
        <main className="dashboard-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;
