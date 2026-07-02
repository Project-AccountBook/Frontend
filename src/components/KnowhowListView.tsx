import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  PenSquare,
  Eye,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import type { BoardResponse } from '../lib/boardApi';
import {
  authorColorForUser,
  authorInitialForUser,
  formatRelativeKo,
  listBoards,
  searchBoards,
} from '../lib/boardApi';

export interface KnowhowPost {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorNickname: string;
  createdAt: string;
  views: number;
}

const PAGE_SIZE = 10;

const SORT_TABS = [
  { id: 'latest', label: '최신순', icon: Clock },
  { id: 'views', label: '조회순', icon: TrendingUp }
];

interface KnowhowListViewProps {
  onSelectPost: (id: number) => void;
  onWrite: () => void;
}

export const KnowhowListView: React.FC<KnowhowListViewProps> = ({ onSelectPost, onWrite }) => {
  const [activeSort, setActiveSort] = useState('latest');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<KnowhowPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (submittedSearch.trim()) {
          const data = await searchBoards(submittedSearch.trim(), 0, 100);
          if (cancelled) return;
          setPosts(
            data.content
              .filter((b) => b.type === 'KNOWHOW')
              .map<KnowhowPost>((b) => ({
                id: b.id,
                title: b.title,
                content: b.content,
                authorId: b.userId,
                authorNickname: `사용자 ${b.userId}`,
                createdAt: b.createdAt,
                views: 0,
              }))
          );
        } else {
          const data = await listBoards('KNOWHOW', 0, 100);
          if (cancelled) return;
          setPosts(
            data.content.map<KnowhowPost>((b: BoardResponse) => ({
              id: b.id,
              title: b.title,
              content: b.content,
              authorId: b.userId,
              authorNickname: b.authorNickname,
              createdAt: b.createdAt,
              views: b.views,
            }))
          );
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [submittedSearch]);

  const sorted = useMemo(() => {
    const arr = [...posts];
    if (activeSort === 'views') arr.sort((a, b) => b.views - a.views);
    else arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return arr;
  }, [posts, activeSort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagedPosts = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedSearch(search);
  };

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
              justifyContent: 'center'
            }}
          >
            <Lightbulb size={20} />
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
              노하우 공유
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              엄마들의 살림·재테크·육아 노하우를 나눠보세요
            </p>
          </div>
        </div>

        <button
          onClick={onWrite}
          className="header-btn-primary"
          style={{ background: 'var(--blue)' }}
        >
          <PenSquare size={16} />
          <span>글쓰기</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
            {SORT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSort(tab.id)}
                  className={`sub-tab-btn ${activeSort === tab.id ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              padding: '8px 14px',
              borderRadius: '10px',
              minWidth: '260px',
              flex: '0 1 360px'
            }}
          >
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="제목, 내용으로 검색 (Enter)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                fontFamily: 'inherit',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            전체 <strong style={{ color: 'var(--text-primary)' }}>{sorted.length}</strong>개 글
          </span>
        </form>
      </div>

      {error && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            border: '1px solid var(--red-border)',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            fontSize: '13px'
          }}
        >
          <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          불러오는 중...
        </div>
      ) : pagedPosts.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          등록된 글이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '20px'
          }}
        >
          {pagedPosts.map((post) => (
            <button
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {formatRelativeKo(post.createdAt)}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {post.title}
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {post.content}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: authorColorForUser(post.authorId),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      {authorInitialForUser(post.authorId)}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {post.authorNickname}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '14px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={13} />
                      {post.views.toLocaleString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={13} />
                      댓글
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

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
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="dashboard-date-arrow"
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            opacity: page === 1 ? 0.4 : 1
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
              background: page === p ? 'var(--navy)' : 'white',
              color: page === p ? 'white' : 'var(--text-secondary)',
              border: page === p ? '1px solid var(--navy)' : '1px solid var(--border)'
            }}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="dashboard-date-arrow"
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            opacity: page === totalPages ? 0.4 : 1
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
