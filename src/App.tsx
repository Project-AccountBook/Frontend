import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AnalysisView } from './components/AnalysisView';
import { KnowhowListView } from './components/KnowhowListView';
import { KnowhowDetailView } from './components/KnowhowDetailView';
import { KnowhowWriteView } from './components/KnowhowWriteView';
import { Construction } from 'lucide-react';

type KnowhowMode = 'list' | 'detail' | 'write';

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [knowhowMode, setKnowhowMode] = useState<KnowhowMode>('list');
  const [knowhowPostId, setKnowhowPostId] = useState<number | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setKnowhowMode('list');
    setKnowhowPostId(null);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'analysis':
        return <AnalysisView />;
      case 'knowhow':
        return renderKnowhow();
      default:
        // Render a premium looking placeholder card for unfinished pages
        return (
          <div className="card fade-in" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '80px 24px',
            textAlign: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--blue-bg)',
              color: 'var(--blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Construction size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                준비 중인 페이지입니다
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '320px', margin: '0 auto' }}>
                선택하신 서비스는 현재 준비 중입니다. 더 나은 서비스를 제공하기 위해 개발 작업을 진행하고 있습니다.
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

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Container */}
      <div className="main-container">
        {/* Top Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
