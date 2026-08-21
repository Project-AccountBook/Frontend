import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomTabBar, COMMUNITY_TAB_IDS } from './components/BottomTabBar';
import { CommunityHubView } from './components/CommunityHubView';
import { DashboardView } from './components/DashboardView';
import { ComparisonView } from './components/ComparisonView';
import { GroupBuyView } from './components/GroupBuyView';
import { KnowhowListView } from './components/KnowhowListView';
import { KnowhowDetailView } from './components/KnowhowDetailView';
import { KnowhowWriteView } from './components/KnowhowWriteView';
import { QnaListView } from './components/QnaListView';
import { QnaDetailView } from './components/QnaDetailView';
import { QnaWriteView } from './components/QnaWriteView';
import { MyBoardsListView } from './components/MyBoardsListView';
import { NotificationView } from './components/NotificationView';
import { BudgetView } from './components/BudgetView';
import { AssetView, type AssetActiveSection } from './components/AssetView';
import { LoginView } from './components/LoginView';
import { SocialSignupCompleteView } from './components/SocialSignupCompleteView';
import { MyPageView } from './components/MyPageView';
import { authApi, notificationApi, setAuthExpiredHandler, tokenStorage, userApi } from './api';
import { useNotificationSync } from './hooks/useNotificationSync';
import { clearMyUserIdCache } from './lib/boardApi';
import { NATIVE_OAUTH_SCHEME } from './lib/oauth';
import { useBackHandler } from './lib/nativeBack';
import { Construction } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

type BoardMode = 'list' | 'detail' | 'write' | 'my';

const APP_TABS = new Set([
  'dashboard',
  'history',
  'budget',
  'analysis',
  'community',
  'comparison',
  'locationComparison',
  'groupbuy',
  'knowhow',
  'qa',
  'notifications',
  'settings',
]);

function readTabFromUrl(): string {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return APP_TABS.has(hash) ? hash : 'dashboard';
}

function writeTabToUrl(tab: string) {
  const base = `${window.location.pathname}${window.location.search}`;
  const url = tab === 'dashboard' ? base : `${base}#${tab}`;
  window.history.replaceState({}, document.title, url);
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => tokenStorage.hasToken());
  const [needsSocialProfileSetup, setNeedsSocialProfileSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(readTabFromUrl);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [knowhowMode, setKnowhowMode] = useState<BoardMode>('list');
  const [knowhowPostId, setKnowhowPostId] = useState<number | null>(null);
  const [qnaMode, setQnaMode] = useState<BoardMode>('list');
  const [qnaPostId, setQnaPostId] = useState<number | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [assetInitialSection, setAssetInitialSection] = useState<AssetActiveSection | undefined>();
  const [groupBuyFocusId, setGroupBuyFocusId] = useState<number | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!tokenStorage.hasToken()) {
      setUnreadNotificationCount(0);
      return;
    }
    const result = await notificationApi.getUnreadCount();
    if (result.ok && result.data !== null) {
      setUnreadNotificationCount(result.data);
    }
  }, []);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    document.body.classList.toggle('is-native', native);
    document.body.classList.toggle('is-web', !native);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');
    const onChange = () => {
      if (!mq.matches) setDrawerOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      setIsLoggedIn(false);
      setActiveTab('dashboard');
      writeTabToUrl('dashboard');
    });
    return () => setAuthExpiredHandler(null);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    userApi.getMyProfile().then(() => {
      // Intentionally empty or remove logic if not needed
    }).catch(() => {
      // Handle error if needed
    });
  }, [isLoggedIn]);

  useEffect(() => {
    const syncTabFromUrl = () => {
      setActiveTab(readTabFromUrl());
    };
    window.addEventListener('hashchange', syncTabFromUrl);
    return () => window.removeEventListener('hashchange', syncTabFromUrl);
  }, []);

  const handleOAuthCallback = useCallback(
    (params: URLSearchParams) => {
      const accessToken = params.get('accessToken');

      if (!accessToken) return false;

      const rememberMe = tokenStorage.consumePendingRememberMe() ?? true;
      tokenStorage.setTokens(accessToken, 'social-login', rememberMe);
      setIsLoggedIn(true);
      if (params.get('isNewUser') === 'true') {
        setNeedsSocialProfileSetup(true);
      }
      refreshUnreadCount();
      return true;
    },
    [refreshUnreadCount],
  );

  useEffect(() => {
    if (window.location.pathname === '/oauth2/redirect') {
      handleOAuthCallback(new URLSearchParams(window.location.search));
      window.history.replaceState({}, document.title, '/');
    }
  }, [handleOAuthCallback]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handlePromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      if (!url.startsWith(`${NATIVE_OAUTH_SCHEME}://oauth2/redirect`)) return;

      // 커스텀 스킴은 표준 URL 파서로 host/pathname 이 흔들리므로 쿼리만 잘라낸다.
      const queryIndex = url.indexOf('?');
      const params = new URLSearchParams(queryIndex >= 0 ? url.slice(queryIndex + 1) : '');

      const consumed = handleOAuthCallback(params);
      if (consumed) {
        void Browser.close();
      }
    });

    return () => {
      void handlePromise.then((handle) => handle.remove());
    };
  }, [handleOAuthCallback]);

  useEffect(() => {
    if (isLoggedIn) {
      refreshUnreadCount();
    } else {
      setUnreadNotificationCount(0);
    }
  }, [isLoggedIn, refreshUnreadCount]);

  useNotificationSync(isLoggedIn, refreshUnreadCount);

  const handleLogout = async () => {
    if (tokenStorage.hasToken()) {
      try {
        await authApi.logout();
      } catch (err) {
        console.error('Logout API error:', err);
      }
    }
    tokenStorage.clear();
    clearMyUserIdCache();
    setIsLoggedIn(false);
    setActiveTab('dashboard');
    writeTabToUrl('dashboard');
  };

  const clearGroupBuyFocus = useCallback(() => {
    setGroupBuyFocusId(null);
  }, []);

  const handleTabChange = (
    tab: string,
    options?: { groupPurchaseId?: number; assetSection?: AssetActiveSection }
  ) => {
    setActiveTab(tab);
    writeTabToUrl(tab);
    if (tab === 'notifications') {
      refreshUnreadCount();
    }
    setAssetInitialSection(options?.assetSection);
    setKnowhowMode('list');
    setKnowhowPostId(null);
    setQnaMode('list');
    setQnaPostId(null);
    setGroupBuyFocusId(options?.groupPurchaseId ?? null);
    setDrawerOpen(false);
  };

  useBackHandler(isLoggedIn && !needsSocialProfileSetup, () => {
    if (knowhowMode !== 'list' || knowhowPostId !== null) {
      setKnowhowMode('list');
      setKnowhowPostId(null);
      return true;
    }
    if (qnaMode !== 'list' || qnaPostId !== null) {
      setQnaMode('list');
      setQnaPostId(null);
      return true;
    }
    if (COMMUNITY_TAB_IDS.has(activeTab) && activeTab !== 'community') {
      handleTabChange('community');
      return true;
    }
    if (activeTab === 'notifications') {
      handleTabChange('dashboard');
      return true;
    }
    return false;
  });

  const goToCategorySettings = () => {
    setKnowhowMode('list');
    setKnowhowPostId(null);
    setQnaMode('list');
    setQnaPostId(null);
    setAssetInitialSection('categories');
    setActiveTab('history');
    writeTabToUrl('history');
  };

  const goToGoalSettings = () => {
    setKnowhowMode('list');
    setKnowhowPostId(null);
    setQnaMode('list');
    setQnaPostId(null);
    setAssetInitialSection('goals');
    setActiveTab('history');
    writeTabToUrl('history');
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
    if (knowhowMode === 'my') {
      return (
        <MyBoardsListView
          type="KNOWHOW"
          onSelectPost={(id) => {
            setKnowhowPostId(id);
            setKnowhowMode('detail');
          }}
          onBack={() => setKnowhowMode('list')}
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
        onViewMyPosts={() => setKnowhowMode('my')}
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
    if (qnaMode === 'my') {
      return (
        <MyBoardsListView
          type="QNA"
          onSelectPost={(id) => {
            setQnaPostId(id);
            setQnaMode('detail');
          }}
          onBack={() => setQnaMode('list')}
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
        onViewMyPosts={() => setQnaMode('my')}
      />
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onViewAllGroupBuys={() => handleTabChange('groupbuy')}
            onGoToGoalSettings={goToGoalSettings}
            onGoToBudget={() => handleTabChange('budget')}
          />
        );
      case 'history':
        return <AssetView initialSection={assetInitialSection} />;
      case 'budget':
        return <BudgetView onGoToCategorySettings={goToCategorySettings} />;
      case 'community':
        return <CommunityHubView onSelect={handleTabChange} />;

      case 'comparison':
        return <ComparisonView />;
      case 'locationComparison':
        return <ComparisonView initialLocationMode />;
      case 'groupbuy':
        return (
          <GroupBuyView
            initialGroupPurchaseId={groupBuyFocusId}
            onInitialGroupPurchaseHandled={clearGroupBuyFocus}
          />
        );
      case 'knowhow':
        return renderKnowhow();
      case 'qa':
        return renderQna();
      case 'notifications':
        return (
          <NotificationView
            onUnreadCountChange={setUnreadNotificationCount}
            onNavigate={handleTabChange}
          />
        );
      case 'settings':
        return (
          <MyPageView
            onLogout={handleLogout}
            onOpenBoard={(type, id) => {
              if (type === 'QNA') {
                setQnaPostId(id);
                setQnaMode('detail');
                handleTabChange('qa');
              } else {
                setKnowhowPostId(id);
                setKnowhowMode('detail');
                handleTabChange('knowhow');
              }
            }}
          />
        );
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
              onClick={() => handleTabChange('dashboard')}
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

  if (needsSocialProfileSetup) {
    return (
      <SocialSignupCompleteView
        onComplete={() => setNeedsSocialProfileSetup(false)}
      />
    );
  }

  const isNative = Capacitor.isNativePlatform();

  const handleBottomTabChange = (tab: string) => {
    if (tab === 'community' && COMMUNITY_TAB_IDS.has(activeTab) && activeTab !== 'community') {
      handleTabChange('community');
      return;
    }
    handleTabChange(tab);
  };

  return (
    <div className="app-layout">
      {!isNative && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onLogout={handleLogout}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      <div className="main-container">
        <Header
          unreadCount={unreadNotificationCount}
          onOpenNotifications={() => handleTabChange('notifications')}
          onOpenDrawer={isNative ? undefined : () => setDrawerOpen(true)}
        />

        <main className="dashboard-content">
          {renderContent()}
        </main>

        {isNative && (
          <BottomTabBar activeTab={activeTab} onChange={handleBottomTabChange} />
        )}
      </div>
    </div>
  );
}

export default App;
