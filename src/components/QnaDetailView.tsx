import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Send,
  HelpCircle,
  Trash2,
  Pencil,
  AlertCircle
} from 'lucide-react';
import type { BoardResponse, CommentResponse } from '../lib/boardApi';
import {
  authorColorForUser,
  authorInitialForUser,
  createComment,
  deleteBoard,
  deleteComment,
  formatRelativeKo,
  getBoard,
  listComments,
  replyComment,
  updateBoard,
  updateComment,
} from '../lib/boardApi';

interface QnaDetailViewProps {
  postId: number;
  onBack: () => void;
}

export const QnaDetailView: React.FC<QnaDetailViewProps> = ({ postId, onBack }) => {
  const [post, setPost] = useState<BoardResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [answer, setAnswer] = useState('');
  const [replyTarget, setReplyTarget] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const refreshComments = async () => {
    try {
      const data = await listComments(postId, 'QNA');
      setComments(data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [b, c] = await Promise.all([getBoard(postId), listComments(postId, 'QNA')]);
        if (cancelled) return;
        setPost(b);
        setComments(c);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const topLevel = useMemo(() => comments.filter((c) => c.parentId === null), [comments]);
  const repliesByParent = useMemo(() => {
    const m: Record<number, CommentResponse[]> = {};
    comments.forEach((c) => {
      if (c.parentId !== null) {
        m[c.parentId] = m[c.parentId] ?? [];
        m[c.parentId].push(c);
      }
    });
    return m;
  }, [comments]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await createComment(postId, answer.trim(), 'QNA');
      setAnswer('');
      await refreshComments();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await replyComment(postId, parentId, replyContent.trim(), 'QNA');
      setReplyContent('');
      setReplyTarget(null);
      await refreshComments();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(commentId);
      await refreshComments();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('게시물을 삭제하시겠습니까?')) return;
    try {
      await deleteBoard(postId);
      onBack();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const startEditPost = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditing(true);
  };

  const handleUpdatePost = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setSubmitting(true);
    try {
      await updateBoard(postId, {
        title: editTitle.trim(),
        content: editContent.trim(),
        type: 'QNA',
      });
      const refreshed = await getBoard(postId);
      setPost(refreshed);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditComment = (c: CommentResponse) => {
    setEditingCommentId(c.id);
    setEditingCommentContent(c.content);
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingCommentContent.trim()) return;
    setSubmitting(true);
    try {
      await updateComment(commentId, editingCommentContent.trim());
      setEditingCommentId(null);
      setEditingCommentContent('');
      await refreshComments();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        불러오는 중...
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>
        <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        {error}
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="fade-in">
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--text-secondary)',
          padding: '8px 14px',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
      >
        <ArrowLeft size={14} />
        목록으로
      </button>

      {error && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            border: '1px solid var(--red-border)',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            fontSize: '13px'
          }}
        >
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '700',
              background: 'var(--purple-bg)',
              color: 'var(--purple)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--purple-border)'
            }}
          >
            <HelpCircle size={12} />
            Q&A
          </span>
        </div>

        {editing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: '700',
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
              outline: 'none',
              marginBottom: '20px'
            }}
          />
        ) : (
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              lineHeight: '1.4',
              letterSpacing: '-0.5px',
              marginBottom: '20px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <span style={{ color: 'var(--purple)' }}>Q.</span>
            <span>{post.title}</span>
          </h1>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: authorColorForUser(post.userId),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              {authorInitialForUser(post.userId)}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {post.authorNickname}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {formatRelativeKo(post.createdAt)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={14} />
              {post.views.toLocaleString()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MessageSquare size={14} />
              {comments.length}
            </span>
            {!editing && (
              <button
                onClick={startEditPost}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--purple)',
                  fontWeight: '600'
                }}
                aria-label="수정"
              >
                <Pencil size={14} />
                수정
              </button>
            )}
            <button
              onClick={handleDeletePost}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--red)',
                fontWeight: '600'
              }}
              aria-label="삭제"
            >
              <Trash2 size={14} />
              삭제
            </button>
          </div>
        </div>

        {editing ? (
          <>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                lineHeight: '1.7',
                margin: '24px 0'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                취소
              </button>
              <button
                onClick={handleUpdatePost}
                disabled={submitting || !editTitle.trim() || !editContent.trim()}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'var(--purple)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                저장
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: '15px',
              lineHeight: '1.8',
              color: 'var(--text-primary)',
              margin: '24px 0',
              whiteSpace: 'pre-wrap'
            }}
          >
            {post.content}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '28px' }}>
        <div className="card-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--text-primary)" />
            <span className="card-title">
              답변 <span style={{ color: 'var(--purple)' }}>{comments.length}</span>
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            margin: '16px 0 24px',
            border: '1px solid var(--border)'
          }}
        >
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="도움이 되는 답변을 남겨주세요."
            rows={3}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              color: 'var(--text-primary)',
              lineHeight: '1.5'
            }}
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={!answer.trim() || submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: answer.trim() ? 'var(--purple)' : '#cbd5e1',
              color: 'white',
              padding: '0 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              alignSelf: 'flex-end',
              height: '36px',
              cursor: answer.trim() && !submitting ? 'pointer' : 'not-allowed'
            }}
          >
            <Send size={13} />
            답변 등록
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topLevel.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              아직 답변이 없습니다.
            </div>
          )}
          {topLevel.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesByParent[c.id] ?? []}
              onReply={() => {
                setReplyTarget(replyTarget === c.id ? null : c.id);
                setReplyContent('');
              }}
              onDelete={() => handleDeleteComment(c.id)}
              replyOpen={replyTarget === c.id}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={() => handleSubmitReply(c.id)}
              onDeleteReply={handleDeleteComment}
              submitting={submitting}
              editingCommentId={editingCommentId}
              editingCommentContent={editingCommentContent}
              onStartEdit={startEditComment}
              onEditChange={setEditingCommentContent}
              onSubmitEdit={handleUpdateComment}
              onCancelEdit={() => {
                setEditingCommentId(null);
                setEditingCommentContent('');
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CommentItemProps {
  comment: CommentResponse;
  replies: CommentResponse[];
  onReply: () => void;
  onDelete: () => void;
  replyOpen: boolean;
  replyContent: string;
  setReplyContent: (v: string) => void;
  onSubmitReply: () => void;
  onDeleteReply: (id: number) => void;
  submitting: boolean;
  editingCommentId: number | null;
  editingCommentContent: string;
  onStartEdit: (c: CommentResponse) => void;
  onEditChange: (v: string) => void;
  onSubmitEdit: (id: number) => void;
  onCancelEdit: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  replies,
  onReply,
  onDelete,
  replyOpen,
  replyContent,
  setReplyContent,
  onSubmitReply,
  onDeleteReply,
  submitting,
  editingCommentId,
  editingCommentContent,
  onStartEdit,
  onEditChange,
  onSubmitEdit,
  onCancelEdit,
}) => {
  const isEditing = editingCommentId === comment.id;
  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'white'
      }}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: authorColorForUser(comment.userId),
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '700',
            flexShrink: 0
          }}
        >
          {authorInitialForUser(comment.userId)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {comment.authorNickname}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatRelativeKo(comment.createdAt)}
            </span>
          </div>

          {isEditing ? (
            <div style={{ marginBottom: '14px' }}>
              <textarea
                value={editingCommentContent}
                onChange={(e) => onEditChange(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={onCancelEdit}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    padding: '6px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'white'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => onSubmitEdit(comment.id)}
                  disabled={submitting || !editingCommentContent.trim()}
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'var(--purple)'
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <p
              style={{
                fontSize: '14px',
                color: comment.deleted ? 'var(--text-muted)' : 'var(--text-primary)',
                lineHeight: '1.7',
                marginBottom: '14px',
                whiteSpace: 'pre-wrap',
                fontStyle: comment.deleted ? 'italic' : 'normal'
              }}
            >
              {comment.content}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={onReply}
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                padding: '6px 8px'
              }}
            >
              {replyOpen ? '취소' : '답글'}
            </button>
            {!comment.deleted && !isEditing && (
              <>
                <button
                  onClick={() => onStartEdit(comment)}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--purple)',
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Pencil size={11} />
                  수정
                </button>
                <button
                  onClick={onDelete}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--red)',
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={11} />
                  삭제
                </button>
              </>
            )}
          </div>

          {replyOpen && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 남겨주세요"
                rows={2}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={onSubmitReply}
                disabled={!replyContent.trim() || submitting}
                style={{
                  background: replyContent.trim() ? 'var(--purple)' : '#cbd5e1',
                  color: 'white',
                  padding: '0 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  alignSelf: 'flex-end',
                  height: '32px',
                  cursor: replyContent.trim() && !submitting ? 'pointer' : 'not-allowed'
                }}
              >
                등록
              </button>
            </div>
          )}

          {replies.length > 0 && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {replies.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '12px',
                    background: '#fafbfc',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    marginLeft: '16px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: authorColorForUser(r.userId),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}
                    >
                      {authorInitialForUser(r.userId)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {r.authorNickname}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatRelativeKo(r.createdAt)}
                    </span>
                    {!r.deleted && (
                      <button
                        onClick={() => onDeleteReply(r.id)}
                        style={{
                          fontSize: '11px',
                          color: 'var(--red)',
                          marginLeft: 'auto'
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: r.deleted ? 'var(--text-muted)' : 'var(--text-primary)',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      fontStyle: r.deleted ? 'italic' : 'normal'
                    }}
                  >
                    {r.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
