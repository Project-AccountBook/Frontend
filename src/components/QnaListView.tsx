import React, { useEffect, useState } from 'react';
import {
  Search,
  PenSquare,
  Eye,
  Clock,
  Flame,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  CheckCircle2,
  Hash,
  TrendingUp,
  User,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
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
  tags: string[];
  thumbnail?: string;
}

const PAGE_SIZE = 8;

const SORT_TABS = [
  { id: 'latest', label: '최신순', icon: Clock },
  { id: 'views', label: '조회순', icon: TrendingUp },
];

type ViewMode = 'card' | 'list';

const VIEW_TABS: { id: ViewMode; icon: typeof LayoutGrid; title: string }[] = [
  { id: 'list', icon: List, title: '목록 보기' },
  { id: 'card', icon: LayoutGrid, title: '카드 보기' },
];

interface QnaListViewProps {
  onSelectPost: (id: number) => void;
  onWrite: () => void;
  onViewMyPosts: () => void;
}

export const QnaListView: React.FC<QnaListViewProps> = ({ onSelectPost, onWrite, onViewMyPosts }) => {
  const [activeSort, setActiveSort] = useState('latest');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [posts, setPosts] = useState<QnaPost[]>([]);
  const [hotPosts, setHotPosts] = useState<BoardHotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    listHotBoards('QNA', 7, 3).then(setHotPosts).catch(() => setHotPosts([]));
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
          const qnaOnly = data.content.filter((b) => b.type === 'QNA');
          setPosts(
            qnaOnly.map<QnaPost>((b) => ({
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
              tags: b.tags ?? [],
              thumbnail: extractFirstImageUrl(b.content),
            }))
          );
          setTotalPages(data.totalPages);
          setTotalElements(qnaOnly.length);
        } else {
          const data = await listBoards('QNA', page, PAGE_SIZE, tagFilter || null);
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

  if (!isNative) {
    return (
      <div className="fade-in">
        <div className="dashboard-view-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
              }}
            >
              Q&A 게시판
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              살림·재테크 궁금증을 다른 엄마들과 함께 해결해요
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button type="button" onClick={onViewMyPosts} className="header-btn-secondary">
              <User size={16} />
              <span>내 글</span>
            </button>
            <button
              type="button"
              onClick={onWrite}
              className="header-btn-primary"
              style={{ background: 'var(--purple)' }}
            >
              <PenSquare size={16} />
              <span>질문하기</span>
            </button>
          </div>
        </div>

        {hotPosts.length > 0 && (
          <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
            <div className="card-header-row" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} color="#f43f5e" />
                <span className="card-title">HOT 질문</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>최근 7일</span>
            </div>
            <div className="hot-post-grid" style={{ display: 'grid', gap: '12px' }}>
              {hotPosts.map((post, idx) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onSelectPost(post.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: '#fafbfc',
                    textAlign: 'left',
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
                      fontWeight: '800',
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
                        marginBottom: '4px',
                      }}
                    >
                      {post.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <ThumbsUp size={11} />
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
              flexWrap: 'wrap',
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
                flex: '0 1 220px',
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
                  color: 'var(--text-primary)',
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
                flex: '0 1 280px',
              }}
            >
              <Search size={16} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="질문 제목·내용 검색 (Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100%',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)',
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
              fontSize: '13px',
            }}
          >
            <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {error}
          </div>
        )}

        {loading ? (
          <div
            className="card"
            style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            불러오는 중...
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="card"
            style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            등록된 질문이 없습니다.
          </div>
        ) : (
          <div className="board-card-grid" style={{ display: 'grid', gap: '20px' }}>
            {sorted.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelectPost(post.id)}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {post.thumbnail && (
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      backgroundImage: `url(${post.thumbnail})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                          borderRadius: '4px',
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
                          border: '1px solid var(--red-border)',
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
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
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
                            color: 'var(--purple)',
                            background: 'var(--purple-bg)',
                            padding: '2px 8px',
                            borderRadius: '10px',
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
                      borderTop: '1px solid var(--border)',
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
                          fontWeight: '700',
                        }}
                      >
                        {authorInitialForUser(post.authorId)}
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
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
                        fontWeight: '500',
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            marginTop: '32px',
          }}
        >
          <button
            type="button"
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
              opacity: page === 0 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
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
              opacity: page + 1 >= totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qna-page fade-in">
      <div className="dashboard-view-header qna-page-head">
        <div className="qna-page-head-copy">
          <h1>Q&A 게시판</h1>
          <p>살림·재테크 궁금증을 다른 엄마들과 함께 해결해요</p>
        </div>
      </div>

      <div className="qna-page-toolbar">
        <div className="view-mode-toggle qna-view-toggle">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`view-toggle-btn ${viewMode === tab.id ? 'active' : ''}`}
                title={tab.title}
                aria-label={tab.title}
                aria-pressed={viewMode === tab.id}
                onClick={() => setViewMode(tab.id)}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <div className="qna-page-toolbar-actions">
          <button type="button" onClick={onViewMyPosts} className="header-btn-secondary">
            <User size={16} />
            <span>내 글</span>
          </button>
          <button type="button" onClick={onWrite} className="header-btn-primary qna-write-btn">
            <PenSquare size={16} />
            <span>질문하기</span>
          </button>
        </div>
      </div>

      {hotPosts.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
          <div className="card-header-row" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#f43f5e" />
              <span className="card-title">HOT 질문</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>최근 7일</span>
          </div>
          <div className="hot-post-grid" style={{ display: 'grid', gap: '12px' }}>
            {hotPosts.map((post, idx) => (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelectPost(post.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#fafbfc',
                  textAlign: 'left',
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
                    fontWeight: '800',
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
                      marginBottom: '4px',
                    }}
                  >
                    {post.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <ThumbsUp size={11} />
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

      <div className="card qna-filter">
        <div className="qna-filter-top">
          <div className="qna-filter-seg" role="tablist" aria-label="정렬">
            {SORT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeSort === tab.id}
                  className={activeSort === tab.id ? 'active' : ''}
                  onClick={() => setActiveSort(tab.id)}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <span className="qna-filter-count">
            전체 <strong>{totalElements}</strong>개
          </span>
        </div>

        <form className="qna-filter-fields" onSubmit={handleSearchSubmit}>
          <label className="qna-filter-field">
            <Hash size={14} />
            <input
              type="text"
              placeholder="태그 필터"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setPage(0);
                }
              }}
            />
          </label>
          <label className="qna-filter-field">
            <Search size={16} />
            <input
              type="search"
              placeholder="제목·내용 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
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
            fontSize: '13px',
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
          등록된 질문이 없습니다.
        </div>
      ) : viewMode === 'list' ? (
        <div className="qna-list-board">
          {sorted.map((post) => (
            <button
              key={post.id}
              type="button"
              className="qna-list-row"
              onClick={() => onSelectPost(post.id)}
            >
              {post.thumbnail && (
                <span
                  className="qna-list-thumb"
                  style={{ backgroundImage: `url(${post.thumbnail})` }}
                  aria-hidden="true"
                />
              )}
              <span className="qna-list-body">
                <span className="qna-list-row-top">
                  <span className="qna-list-badges">
                    {post.resolved && (
                      <span className="qna-list-badge qna-list-badge--resolved">
                        <CheckCircle2 size={10} />
                        해결
                      </span>
                    )}
                    {post.urgent && <span className="qna-list-badge qna-list-badge--urgent">급해요</span>}
                  </span>
                  <span className="qna-list-time">{formatRelativeKo(post.createdAt)}</span>
                </span>
                <span className="qna-list-title">{post.title}</span>
                <span className="qna-list-preview">{stripMediaForPreview(post.content)}</span>
                <span className="qna-list-meta">
                  <span>{post.authorNickname}</span>
                  <span>
                    <Eye size={12} />
                    {post.views.toLocaleString()}
                  </span>
                  <span>
                    <ThumbsUp size={12} />
                    {post.likeCount}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="board-card-grid qna-card-grid">
          {sorted.map((post) => (
            <button
              key={post.id}
              type="button"
              className="card qna-card-compact"
              onClick={() => onSelectPost(post.id)}
            >
              {post.thumbnail ? (
                <div
                  className="qna-card-compact-thumb"
                  style={{ backgroundImage: `url(${post.thumbnail})` }}
                />
              ) : (
                <div className="qna-card-compact-placeholder">Q</div>
              )}
              <div className="qna-card-compact-body">
                {(post.resolved || post.urgent) && (
                  <div className="qna-card-compact-badges">
                    {post.resolved && (
                      <span className="qna-list-badge qna-list-badge--resolved">
                        <CheckCircle2 size={10} />
                        해결
                      </span>
                    )}
                    {post.urgent && <span className="qna-list-badge qna-list-badge--urgent">급해요</span>}
                  </div>
                )}
                <p className="qna-card-compact-title">{post.title}</p>
                <div className="qna-card-compact-meta">
                  <span>
                    <Eye size={12} />
                    {post.views.toLocaleString()}
                  </span>
                  <span>
                    <ThumbsUp size={12} />
                    {post.likeCount}
                  </span>
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
          marginTop: '32px',
        }}
      >
        <button
          type="button"
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
            opacity: page === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
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
            opacity: page + 1 >= totalPages ? 0.4 : 1,
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
