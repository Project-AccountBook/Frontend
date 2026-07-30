import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import type { BoardResponse, BoardType } from '../lib/boardApi';
import { formatRelativeKo, listMyBoards } from '../lib/boardApi';
import { stripMediaForPreview } from '../lib/renderPostContent';

const PAGE_SIZE = 10;

interface MyBoardsListViewProps {
  type: BoardType;
  onSelectPost: (id: number) => void;
  onBack: () => void;
}

export const MyBoardsListView: React.FC<MyBoardsListViewProps> = ({ type, onSelectPost, onBack }) => {
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [posts, setPosts] = useState<BoardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listMyBoards(type, page, PAGE_SIZE);
        if (cancelled) return;
        setPosts(data.content);
        setTotalPages(Math.max(1, data.totalPages));
        setTotalElements(data.totalElements);
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
  }, [type, page]);

  const isQna = type === 'QNA';
  const accent = isQna ? 'var(--purple)' : 'var(--blue)';
  const accentBg = isQna ? 'var(--purple-bg)' : 'var(--blue-bg)';
  const Icon = isQna ? HelpCircle : Lightbulb;
  const titleText = isQna ? '내가 쓴 Q&A' : '내가 쓴 노하우';
  const subText = isQna ? '내가 작성한 질문 목록입니다' : '내가 작성한 노하우 목록입니다';

  return (
    <div className="fade-in">
      <div className="dashboard-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: accentBg,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
              }}
            >
              {titleText}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{subText}</p>
          </div>
        </div>

        <button onClick={onBack} className="header-btn-secondary">
          <ArrowLeft size={16} />
          <span>목록으로</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          전체 <strong style={{ color: 'var(--text-primary)' }}>{totalElements}</strong>개
        </span>
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
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          아직 작성한 글이 없습니다.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {posts.map((post, idx) => (
            <button
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                padding: '16px 20px',
                textAlign: 'left',
                background: 'white',
                borderBottom: idx === posts.length - 1 ? 'none' : '1px solid var(--border)',
                cursor: 'pointer',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {isQna && post.resolved && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
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
                {isQna && post.urgent && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
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
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {isQna ? `Q. ${post.title}` : post.title}
              </h3>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {stripMediaForPreview(post.content)}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
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
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: accent,
                          background: accentBg,
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
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
