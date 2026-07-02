import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  PenSquare,
  Eye,
  HelpCircle,
  Clock,
  Flame,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  CheckCircle2
} from 'lucide-react';
import type { BoardResponse } from '../lib/boardApi';
import {
  authorColorForUser,
  authorInitialForUser,
  formatRelativeKo,
  listBoards,
  searchBoards,
} from '../lib/boardApi';

export interface QnaPost {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorNickname: string;
  createdAt: string;
  views: number;
  likeCount: number;
  resolved: boolean;
  urgent: boolean;
}

const PAGE_SIZE = 10;

const SORT_TABS = [
  { id: 'latest', label: '최신순', icon: Clock },
  { id: 'views', label: '조회순', icon: Flame }
];

interface QnaListViewProps {
  onSelectPost: (id: number) => void;
  onWrite: () => void;
}

export const QnaListView: React.FC<QnaListViewProps> = ({ onSelectPost, onWrite }) => {
  const [activeSort, setActiveSort] = useState('latest');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<QnaPost[]>([]);
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
          const filtered = data.content
            .filter((b) => b.type === 'QNA')
            .map<QnaPost>((b) => ({
              id: b.id,
              title: b.title,
              content: b.content,
              authorId: b.userId,
              authorNickname: `사용자 ${b.userId}`,
              createdAt: b.createdAt,
              views: 0,
              likeCount: 0,
              resolved: false,
              urgent: false,
            }));
          setPosts(filtered);
        } else {
          const data = await listBoards('QNA', 0, 100);
          if (cancelled) return;
          setPosts(
            data.content.map<QnaPost>((b: BoardResponse) => ({
              id: b.id,
              title: b.title,
              content: b.content,
              authorId: b.userId,
              authorNickname: b.authorNickname,
              createdAt: b.createdAt,
              views: b.views,
              likeCount: b.likeCount,
              resolved: b.resolved,
              urgent: b.urgent,
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
      {/* Sub Header */}
      <div className="dashboard-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--purple-bg)',
              color: 'var(--purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <HelpCircle size={20} />
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
              Q&A 게시판
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              살림·재테크 궁금증을 다른 엄마들과 함께 해결해요
            </p>
          </div>
        </div>

        <button
          onClick={onWrite}
          className="header-btn-primary"
          style={{ background: 'var(--purple)' }}
        >
          <PenSquare size={16} />
          <span>질문하기</span>
        </button>
      </div>

      {/* Filter Bar */}
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
              placeholder="질문 제목, 내용으로 검색 (Enter)"
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
            전체 <strong style={{ color: 'var(--text-primary)' }}>{sorted.length}</strong>개 질문
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
          등록된 질문이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pagedPosts.map((post) => (
            <button
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className="card"
              style={{
                display: 'flex',
                padding: '20px 24px',
                gap: '20px',
                alignItems: 'flex-start',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {post.resolved && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: '700',
                        background: '#dcfce7',
                        color: '#16a34a',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      <CheckCircle2 size={10} />
                      해결완료
                    </span>
                  )}
                  {post.urgent && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        background: 'var(--red-bg)',
                        color: 'var(--red)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--red-border)'
                      }}
                    >
                      급해요
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {formatRelativeKo(post.createdAt)}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    lineHeight: '1.4',
                    marginBottom: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  Q. {post.title}
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}
                >
                  {post.content}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: authorColorForUser(post.authorId),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
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
                      <ThumbsUp size={13} />
                      {post.likeCount}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
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
