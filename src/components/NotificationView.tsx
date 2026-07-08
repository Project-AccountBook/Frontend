import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { notificationApi } from '../api';
import type { NotificationResponse, NotificationType } from '../api/types';

export type { NotificationType };
export type NotificationItem = NotificationResponse;

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

const KNOWN_APP_TABS = new Set([
  'dashboard',
  'history',
  'budget',
  'analysis',
  'comparison',
  'locationComparison',
  'groupbuy',
  'knowhow',
  'qa',
  'groupbuyAdmin',
  'notifications',
  'settings',
  'admin'
]);

function resolveNotificationTab(
  redirectUrl: string | null,
  type: NotificationType
): string | null {
  if (redirectUrl) {
    const url = redirectUrl.trim();
    const bareTab = url.replace(/^#\/?/, '').replace(/^\//, '');

    if (KNOWN_APP_TABS.has(bareTab)) return bareTab;
    if (bareTab === 'budget-page') return 'budget';
    if (url.includes('budget-page') || /\/budget\/?$/.test(url)) return 'budget';
    if (url.includes('group-purchase')) return 'groupbuy';
  }

  if (type === 'BUDGET') return 'budget';
  if (type === 'INTEREST_CATEGORY') return 'groupbuy';
  return null;
}

function resolveGroupPurchaseId(
  redirectUrl: string | null,
  referenceId: number | null,
  type: NotificationType
): number | undefined {
  if (type !== 'INTEREST_CATEGORY') return undefined;
  if (referenceId !== null) return referenceId;

  if (redirectUrl) {
    const match = redirectUrl.match(/group-purchase\/(\d+)/);
    if (match) return Number(match[1]);
  }

  return undefined;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
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
  onUnreadCountChange?: (count: number) => void;
  onNavigate?: (tab: string, options?: { groupPurchaseId?: number }) => void;
}

export const NotificationView: React.FC<NotificationViewProps> = ({
  onUnreadCountChange,
  onNavigate
}) => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | NotificationType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);

  useEffect(() => {
    onUnreadCountChangeRef.current = onUnreadCountChange;
  }, [onUnreadCountChange]);

  const updateUnreadCount = async (items?: NotificationResponse[]) => {
    const result = await notificationApi.getUnreadCount();
    if (result.ok && result.data !== null) {
      setUnreadCount(result.data);
      onUnreadCountChangeRef.current?.(result.data);
      return;
    }

    if (items) {
      const count = items.filter((n) => !n.isRead).length;
      setUnreadCount(count);
      onUnreadCountChangeRef.current?.(count);
    }
  };

  const reloadNotifications = useCallback(async () => {
    const { items, error: fetchError } = await notificationApi.fetchAll();
    if (fetchError && items.length === 0) {
      setError(fetchError);
      setNotifications([]);
      return;
    }

    setNotifications(items);
    await updateUnreadCount(items);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);

      const { items, error: fetchError } = await notificationApi.fetchAll();
      if (cancelled) return;

      if (fetchError && items.length === 0) {
        setError(fetchError);
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      setNotifications(items);
      await updateUnreadCount(items);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const readCount = notifications.length - unreadCount;

  const handleMarkAsRead = async (id: number) => {
    setActionLoading(true);
    const result = await notificationApi.markAsRead(id);
    if (result.ok && result.data) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await updateUnreadCount();
    } else {
      setError(result.error ?? '읽음 처리에 실패했습니다.');
    }
    setActionLoading(false);
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    const result = await notificationApi.markAllAsRead();
    if (result.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await updateUnreadCount();
    } else {
      setError(result.error ?? '전체 읽음 처리에 실패했습니다.');
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: number) => {
    setActionLoading(true);
    const result = await notificationApi.deleteNotification(id);
    if (result.ok) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await updateUnreadCount();
    } else {
      setError(result.error ?? '알림 삭제에 실패했습니다.');
    }
    setActionLoading(false);
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

  const handleBulkMarkAsRead = async () => {
    const ids = [...selectedIds].filter((id) => {
      const item = notifications.find((n) => n.id === id);
      return item && !item.isRead;
    });
    if (ids.length === 0) {
      setSelectedIds(new Set());
      return;
    }

    setActionLoading(true);
    const results = await Promise.all(ids.map((id) => notificationApi.markAsRead(id)));
    const failed = results.some((r) => !r.ok);

    if (failed) {
      setError('일부 알림 읽음 처리에 실패했습니다.');
      await reloadNotifications();
    } else {
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, isRead: true } : n))
      );
      await updateUnreadCount();
    }
    setSelectedIds(new Set());
    setActionLoading(false);
  };

  const handleGoToTarget = async (notification: NotificationResponse) => {
    const tab = resolveNotificationTab(notification.redirectUrl, notification.type);
    if (!tab || !onNavigate) return;

    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    const groupPurchaseId = resolveGroupPurchaseId(
      notification.redirectUrl,
      notification.referenceId,
      notification.type
    );

    onNavigate(
      tab,
      groupPurchaseId !== undefined ? { groupPurchaseId } : undefined
    );
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setActionLoading(true);
    const results = await Promise.all(ids.map((id) => notificationApi.deleteNotification(id)));
    const failed = results.some((r) => !r.ok);

    if (failed) {
      setError('일부 알림 삭제에 실패했습니다.');
      await reloadNotifications();
    } else {
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      await updateUnreadCount();
    }
    setSelectedIds(new Set());
    setActionLoading(false);
  };

  const selectedCount = selectedIds.size;
  const pageIds = paginated.map((n) => n.id);
  const isAllPageSelected =
    paginated.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const isSomePageSelected =
    paginated.some((n) => selectedIds.has(n.id)) && !isAllPageSelected;

  if (isLoading) {
    return (
      <div className="fade-in card" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>알림을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {error && (
        <div
          className="card"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            color: 'var(--red)',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          {error}
        </div>
      )}

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
            disabled={actionLoading}
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
            {readCount}
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
              disabled={actionLoading}
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
              disabled={actionLoading}
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
                            disabled={actionLoading}
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
                        {resolveNotificationTab(notification.redirectUrl, notification.type) && (
                          <button
                            type="button"
                            onClick={() => void handleGoToTarget(notification)}
                            disabled={actionLoading}
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
                              borderRadius: '8px',
                              cursor: actionLoading ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <ExternalLink size={13} />
                            바로가기
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(notification.id)}
                        disabled={actionLoading}
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
