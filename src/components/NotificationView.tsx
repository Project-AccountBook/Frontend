import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PiggyBank,
  ShoppingBag,
  Trash2,
  Info
} from 'lucide-react';

export type NotificationType = 'BUDGET' | 'INTEREST_CATEGORY' | 'SYSTEM';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  redirectUrl: string | null;
  referenceId: number | null;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: '식비 예산 80% 초과',
    message: '이번 달 식비 예산 40만원 중 32만원을 사용했어요. 남은 기간 동안 지출을 조절해 보세요.',
    redirectUrl: '/analysis',
    referenceId: 101,
    type: 'BUDGET',
    isRead: false,
    createdAt: '2026-06-24T09:15:00'
  },
  {
    id: 2,
    title: '관심 카테고리 공동구매 오픈',
    message: '관심 등록하신 "생활용품" 카테고리에 새 공동구매가 등록됐어요. 마감 전에 참여해 보세요!',
    redirectUrl: '/groupbuy/42',
    referenceId: 42,
    type: 'INTEREST_CATEGORY',
    isRead: false,
    createdAt: '2026-06-24T08:40:00'
  },
  {
    id: 3,
    title: 'Q&A 질문에 답변이 달렸어요',
    message: '"가계부 앱 추천해주세요" 질문에 새로운 답변이 2개 등록됐습니다.',
    redirectUrl: '/qa/2',
    referenceId: 2,
    type: 'SYSTEM',
    isRead: false,
    createdAt: '2026-06-23T21:30:00'
  },
  {
    id: 4,
    title: '육아비 예산 한도 도달',
    message: '육아비 카테고리 예산 한도에 도달했습니다. 추가 지출 시 알림을 보내드릴게요.',
    redirectUrl: '/analysis',
    referenceId: 102,
    type: 'BUDGET',
    isRead: true,
    createdAt: '2026-06-23T14:20:00'
  },
  {
    id: 5,
    title: '공동구매 참여 확정',
    message: '참여하신 "친환경 세제 3종 세트" 공동구매가 최소 인원을 달성해 진행이 확정됐어요.',
    redirectUrl: '/groupbuy/38',
    referenceId: 38,
    type: 'INTEREST_CATEGORY',
    isRead: true,
    createdAt: '2026-06-22T18:05:00'
  },
  {
    id: 6,
    title: '서비스 점검 안내',
    message: '6월 25일(수) 새벽 2시~4시 시스템 점검이 예정되어 있습니다. 이용에 참고해 주세요.',
    redirectUrl: null,
    referenceId: null,
    type: 'SYSTEM',
    isRead: true,
    createdAt: '2026-06-22T10:00:00'
  },
  {
    id: 7,
    title: '교통비 예산 50% 사용',
    message: '교통비 예산의 절반을 사용했어요. 이번 달 교통 지출 추이를 확인해 보세요.',
    redirectUrl: '/analysis',
    referenceId: 103,
    type: 'BUDGET',
    isRead: true,
    createdAt: '2026-06-21T16:45:00'
  },
  {
    id: 8,
    title: '노하우 게시글 좋아요 알림',
    message: '작성하신 "4인 가족 한 달 식비 50만원 관리법" 게시글에 좋아요 10개가 달렸어요.',
    redirectUrl: '/knowhow/5',
    referenceId: 5,
    type: 'SYSTEM',
    isRead: true,
    createdAt: '2026-06-20T11:30:00'
  },
  {
    id: 9,
    title: '관심 카테고리 공동구매 마감 임박',
    message: '"유아용품" 공동구매가 24시간 후 마감됩니다. 아직 참여하지 않으셨다면 확인해 보세요.',
    redirectUrl: '/groupbuy/35',
    referenceId: 35,
    type: 'INTEREST_CATEGORY',
    isRead: true,
    createdAt: '2026-06-19T09:00:00'
  },
  {
    id: 10,
    title: '월간 소비 리포트 준비 완료',
    message: '5월 소비 분석 리포트가 준비됐어요. 지난달과 비교한 절약 포인트를 확인해 보세요.',
    redirectUrl: '/analysis',
    referenceId: null,
    type: 'SYSTEM',
    isRead: true,
    createdAt: '2026-06-01T08:00:00'
  },
  {
    id: 11,
    title: '문화생활비 예산 90% 초과',
    message: '문화생활비 예산이 거의 소진됐어요. 남은 10%로 이번 달을 마무리해 보세요.',
    redirectUrl: '/analysis',
    referenceId: 104,
    type: 'BUDGET',
    isRead: true,
    createdAt: '2026-05-28T19:20:00'
  },
  {
    id: 12,
    title: '신규 기능: 이웃 자산 비교',
    message: '비슷한 가구와 자산·소비 패턴을 비교할 수 있는 "이웃 자산 비교" 기능이 추가됐어요.',
    redirectUrl: '/comparison',
    referenceId: null,
    type: 'SYSTEM',
    isRead: true,
    createdAt: '2026-05-25T12:00:00'
  }
];

const PAGE_SIZE = 10;

const FILTER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'unread', label: '읽지 않음' },
  { id: 'read', label: '읽음' }
] as const;

type FilterTab = (typeof FILTER_TABS)[number]['id'];

const CATEGORY_TABS: { id: 'all' | NotificationType; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'BUDGET', label: '예산' },
  { id: 'INTEREST_CATEGORY', label: '공동구매' },
  { id: 'SYSTEM', label: '시스템' }
];

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  BUDGET: { label: '예산', icon: PiggyBank, color: 'var(--red)', bg: 'var(--red-bg)' },
  INTEREST_CATEGORY: {
    label: '공동구매',
    icon: ShoppingBag,
    color: 'var(--purple)',
    bg: 'var(--purple-bg)'
  },
  SYSTEM: { label: '시스템', icon: Info, color: 'var(--blue)', bg: 'var(--blue-bg)' }
};

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date('2026-06-24T12:00:00');
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

interface NotificationViewProps {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

export const NotificationView: React.FC<NotificationViewProps> = ({
  notifications,
  setNotifications
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | NotificationType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sorted.filter((n) => {
      const matchRead =
        activeFilter === 'all' ||
        (activeFilter === 'unread' && !n.isRead) ||
        (activeFilter === 'read' && n.isRead);
      const matchCategory = activeCategory === 'all' || n.type === activeCategory;
      return matchRead && matchCategory;
    });
  }, [notifications, activeFilter, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter);
    setSelectedIds(new Set());
    setPage(1);
  };

  const handleCategoryChange = (category: 'all' | NotificationType) => {
    setActiveCategory(category);
    setSelectedIds(new Set());
    setPage(1);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = paginated.map((n) => n.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkMarkAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (selectedIds.has(n.id) ? { ...n, isRead: true } : n))
    );
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
  };

  const selectedCount = selectedIds.size;
  const pageIds = paginated.map((n) => n.id);
  const isAllPageSelected =
    paginated.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const isSomePageSelected =
    paginated.some((n) => selectedIds.has(n.id)) && !isAllPageSelected;

  return (
    <div className="fade-in">
      <div className="dashboard-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--blue-bg)',
              color: 'var(--blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  borderRadius: '999px',
                  background: 'var(--red)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px'
              }}
            >
              알림
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              예산, 공동구매, 서비스 소식을 한곳에서 확인하세요
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="header-btn-primary"
            style={{ background: 'var(--blue)' }}
          >
            <CheckCheck size={16} />
            <span>전체 읽음 처리</span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            전체 알림
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginTop: '6px'
            }}
          >
            {notifications.length}
            <span
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                marginLeft: '4px'
              }}
            >
              개
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            읽지 않음
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: unreadCount > 0 ? 'var(--red)' : 'var(--text-primary)',
              marginTop: '6px'
            }}
          >
            {unreadCount}
            <span
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                marginLeft: '4px'
              }}
            >
              개
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            읽음
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginTop: '6px'
            }}
          >
            {notifications.length - unreadCount}
            <span
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                marginLeft: '4px'
              }}
            >
              개
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`sub-tab-btn ${activeFilter === tab.id ? 'active' : ''}`}
              >
                {tab.label}
                {tab.id === 'unread' && unreadCount > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      color: 'var(--red)'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {filtered.length}개 알림
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginRight: '4px'
            }}
          >
            카테고리
          </span>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleCategoryChange(tab.id)}
              className={`dashboard-tab-btn ${activeCategory === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {selectedCount > 0 && (
        <div
          className="card"
          style={{
            marginBottom: '16px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--blue-bg)',
            border: '1px solid var(--blue-border)'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--blue)' }}>
            {selectedCount}개 선택됨
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleBulkMarkAsRead}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--blue)',
                background: 'white',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid var(--blue-border)'
              }}
            >
              <CheckCheck size={13} />
              선택 읽음
            </button>
            <button
              onClick={handleBulkDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--red)',
                background: 'white',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid var(--red-border)'
              }}
            >
              <Trash2 size={13} />
              선택 삭제
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                padding: '7px 14px',
                borderRadius: '8px',
                background: 'white',
                border: '1px solid var(--border)'
              }}
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {paginated.length === 0 ? (
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--blue-bg)',
              color: 'var(--blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BellOff size={24} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '6px'
              }}
            >
              {activeFilter === 'unread'
                ? '읽지 않은 알림이 없어요'
                : activeCategory !== 'all'
                  ? `${CATEGORY_TABS.find((t) => t.id === activeCategory)?.label} 알림이 없어요`
                  : '알림이 없어요'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {activeFilter === 'unread'
                ? '모든 알림을 확인하셨습니다.'
                : activeCategory !== 'all' || activeFilter !== 'all'
                  ? '다른 필터를 선택해 보세요.'
                  : '새로운 소식이 오면 여기에 표시됩니다.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            className="card"
            style={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#f8fafc'
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}
            >
              <input
                type="checkbox"
                checked={isAllPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isSomePageSelected;
                }}
                onChange={toggleSelectAllOnPage}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--blue)',
                  cursor: 'pointer'
                }}
              />
              현재 페이지 전체 선택
            </label>
          </div>

          {paginated.map((notification) => {
            const typeConfig = TYPE_CONFIG[notification.type];
            const TypeIcon = typeConfig.icon;
            const isSelected = selectedIds.has(notification.id);

            return (
              <div
                key={notification.id}
                className="card"
                style={{
                  padding: '18px 24px',
                  background: isSelected
                    ? '#dbeafe'
                    : notification.isRead
                      ? 'var(--bg-card)'
                      : 'var(--blue-bg)',
                  border: isSelected
                    ? '1px solid var(--blue)'
                    : !notification.isRead
                      ? '1px solid var(--blue-border)'
                      : '1px solid transparent',
                  boxShadow: !notification.isRead && !isSelected
                    ? '0 2px 8px -2px rgba(59, 130, 246, 0.12)'
                    : undefined
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      paddingTop: '12px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(notification.id)}
                      aria-label={`${notification.title} 선택`}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--blue)',
                        cursor: 'pointer'
                      }}
                    />
                  </label>

                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: typeConfig.bg,
                      color: typeConfig.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <TypeIcon size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: typeConfig.color,
                          background: typeConfig.bg,
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {typeConfig.label}
                      </span>
                      {!notification.isRead && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: 'white',
                            background: 'var(--blue)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            letterSpacing: '0.02em'
                          }}
                        >
                          NEW
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginLeft: 'auto'
                        }}
                      >
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: notification.isRead ? '600' : '700',
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                        lineHeight: '1.4'
                      }}
                    >
                      {notification.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                        marginBottom: '14px'
                      }}
                    >
                      {notification.message}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--blue)',
                              background: 'var(--blue-bg)',
                              padding: '6px 12px',
                              borderRadius: '8px'
                            }}
                          >
                            <CheckCheck size={13} />
                            읽음 처리
                          </button>
                        )}
                        {notification.redirectUrl && (
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'var(--text-secondary)',
                              background: '#f8fafc',
                              border: '1px solid var(--border)',
                              padding: '6px 12px',
                              borderRadius: '8px'
                            }}
                          >
                            <ExternalLink size={13} />
                            바로가기
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(notification.id)}
                        aria-label="알림 삭제"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-muted)',
                          padding: '6px 10px',
                          borderRadius: '8px'
                        }}
                      >
                        <Trash2 size={13} />
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            marginTop: '32px'
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              width: '36px',
              height: '36px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              opacity: currentPage === 1 ? 0.4 : 1
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                background: currentPage === p ? 'var(--navy)' : 'white',
                color: currentPage === p ? 'white' : 'var(--text-secondary)',
                border: currentPage === p ? '1px solid var(--navy)' : '1px solid var(--border)'
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              width: '36px',
              height: '36px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              opacity: currentPage === totalPages ? 0.4 : 1
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
