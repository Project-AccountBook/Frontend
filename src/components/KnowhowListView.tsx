import React, { useEffect, useState } from 'react';
import {
  Search,
  PenSquare,
  Eye,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Heart,
  Flame,
  Hash,
  User,
} from 'lucide-react';
import type { BoardHotResponse, BoardResponse } from '../lib/boardApi';
import {
  authorColorForUser,
  authorInitialForUser,
  formatRelativeKo,
  listBoards,
  listHotBoards,
  searchBoards,
} from '../lib/boardApi';
import { extractFirstImageUrl, stripMediaForPreview } from '../lib/renderPostContent';

export interface KnowhowPost {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorNickname: string;
  createdAt: string;
  views: number;
  likeCount: number;
  tags: string[];
  thumbnail?: string;
}

const PAGE_SIZE = 8;

const SORT_TABS = [
  { id: 'latest', label: '최신순', icon: Clock },
  { id: 'views', label: '조회순', icon: TrendingUp }
];

interface KnowhowListViewProps {
  onSelectPost: (id: number) => void;
  onWrite: () => void;
  onViewMyPosts: () => void;
}

export const KnowhowListView: React.FC<KnowhowListViewProps> = ({ onSelectPost, onWrite, onViewMyPosts }) => {
  const [activeSort, setActiveSort] = useState('latest');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [posts, setPosts] = useState<KnowhowPost[]>([]);
  const [hotPosts, setHotPosts] = useState<BoardHotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listHotBoards('KNOWHOW', 7, 3).then(setHotPosts).catch(() => setHotPosts([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (submittedSearch.trim()) {
          const data = await searchBoards(submittedSearch.trim(), page, PAGE_SIZE);
          if (cancelled) return;
          const knowhowOnly = data.content.filter((b) => b.type === 'KNOWHOW');
          setPosts(
            knowhowOnly.map<KnowhowPost>((b) => ({
              id: b.id,
              title: b.title,
              content: b.content,
              authorId: b.userId,
              authorNickname: `사용자 ${b.userId}`,
              createdAt: b.createdAt,
              views: 0,
              likeCount: 0,
              tags: b.tags ?? [],
            }))
          );
          setTotalPages(data.totalPages);
          setTotalElements(knowhowOnly.length);
        } else {
          const data = await listBoards('KNOWHOW', page, PAGE_SIZE, tagFilter || null);
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
              likeCount: b.likeCount,
              tags: b.tags ?? [],
              thumbnail:
                extractFirstImageUrl(b.content) ??
                (b.imageUrls && b.imageUrls.length > 0 ? b.imageUrls[0] : undefined),
            }))
          );
          setTotalPages(Math.max(1, data.totalPages));
          setTotalElements(data.totalElements);
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
  }, [submittedSearch, page, tagFilter]);

  const sorted =
    activeSort === 'views' ? [...posts].sort((a, b) => b.views - a.views) : posts;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSubmittedSearch(search);
  };

  return (
    <div className="fade-in">
      <div className="dashboard-view-header">
        <div style={{ textAlign: 'center', width: '100%' }}>
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={onViewMyPosts} className="header-btn-secondary">
            <User size={16} />
            <span>내 글</span>
          </button>
          <button
            onClick={onWrite}
            className="header-btn-primary"
            style={{ background: 'var(--blue)' }}
          >
            <PenSquare size={16} />
            <span>글쓰기</span>
          </button>
        </div>
      </div>

      {hotPosts.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
          <div className="card-header-row" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#f43f5e" />
              <span className="card-title">HOT 노하우</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>최근 7일</span>
          </div>
          <div
            className="hot-post-grid"
            style={{
              display: 'grid',
              gap: '12px'
            }}
          >
            {hotPosts.map((post, idx) => (
              <button
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#fafbfc',
                  textAlign: 'left'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: idx === 0 ? '#f43f5e' : idx === 1 ? '#fb923c' : '#fbbf24',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '4px'
                    }}
                  >
                    {post.title}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Heart size={11} />
                      {post.likeCount}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Eye size={11} />
                      {post.views}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
              minWidth: '200px',
              flex: '0 1 220px'
            }}
          >
            <Hash size={14} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="태그로 필터 (Enter)"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setPage(0);
                }
              }}
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              padding: '8px 14px',
              borderRadius: '10px',
              minWidth: '220px',
              flex: '0 1 280px'
            }}
          >
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="제목·내용 검색 (Enter)"
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
            전체 <strong style={{ color: 'var(--text-primary)' }}>{totalElements}</strong>개
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
      ) : sorted.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          등록된 글이 없습니다.
        </div>
      ) : (
        <div
          className="board-card-grid"
          style={{
            display: 'grid',
            gap: '20px'
          }}
        >
          {sorted.map((post) => (
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
              {post.thumbnail && (
                <div
                  style={{
                    width: '100%',
                    height: '180px',
                    backgroundImage: `url(${post.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              )}
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
                  {stripMediaForPreview(post.content)}
                </p>

                {post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: 'var(--blue)',
                          background: 'var(--blue-bg)',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

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
                      <Heart size={13} />
                      {post.likeCount}
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
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            opacity: page === 0 ? 0.4 : 1
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page + 1 >= totalPages}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            opacity: page + 1 >= totalPages ? 0.4 : 1
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
