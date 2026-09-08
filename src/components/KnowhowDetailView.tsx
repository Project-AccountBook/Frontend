import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Send,
  Trash2,
  Pencil,
  Lightbulb,
  AlertCircle,
  Heart,
  Bookmark,
  UserPlus,
  UserCheck,
  Image as ImageIcon
} from 'lucide-react';
import type { BoardResponse, CommentResponse, UserStatsResponse } from '../lib/boardApi';
import {
  authorColorForUser,
  authorInitialForUser,
  createComment,
  deleteBoard,
  deleteComment,
  formatRelativeKo,
  getBoard,
  getMyUserId,
  getUserStats,
  listComments,
  replyComment,
  toggleBoardBookmark,
  toggleBoardLike,
  toggleCommentLike,
  toggleFollow,
  updateBoard,
  updateComment,
  uploadFile,
} from '../lib/boardApi';
import { renderPostContent } from '../lib/renderPostContent';

interface KnowhowDetailViewProps {
  postId: number;
  onBack: () => void;
}

export const KnowhowDetailView: React.FC<KnowhowDetailViewProps> = ({ postId, onBack }) => {
  const [post, setPost] = useState<BoardResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [comment, setComment] = useState('');
  const [replyTarget, setReplyTarget] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [editUploading, setEditUploading] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [authorStats, setAuthorStats] = useState<UserStatsResponse | null>(null);
  const [myUserId, setMyUserId] = useState<number | null>(null);

  useEffect(() => {
    getMyUserId().then(setMyUserId).catch(() => setMyUserId(null));
  }, []);

  useEffect(() => {
    if (!post) return;
    getUserStats(post.userId).then(setAuthorStats).catch(() => setAuthorStats(null));
  }, [post?.userId]);

  const handleToggleFollow = async () => {
    if (!post || !authorStats) return;
    try {
      const r = await toggleFollow(post.userId);
      setAuthorStats({ ...authorStats, following: r.following, followerCount: r.followerCount });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const refreshComments = async () => {
    try {
      const data = await listComments(postId, 'KNOWHOW');
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
        const [b, c] = await Promise.all([getBoard(postId), listComments(postId, 'KNOWHOW')]);
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

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await createComment(postId, comment.trim(), 'KNOWHOW');
      setComment('');
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
      await replyComment(postId, parentId, replyContent.trim(), 'KNOWHOW');
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
    setEditTags(post.tags ?? []);
    setEditTagInput('');
    setEditing(true);
  };

  const insertAtEditCursor = (snippet: string) => {
    const el = editTextareaRef.current;
    if (!el) {
      setEditContent((prev) => prev + snippet);
      return;
    }
    const start = el.selectionStart ?? editContent.length;
    const end = el.selectionEnd ?? editContent.length;
    const next = editContent.slice(0, start) + snippet + editContent.slice(end);
    setEditContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleEditUpload = async (file: File) => {
    setEditUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      insertAtEditCursor(`\n<img src="${url}" alt="" style="max-width:100%;" />\n`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEditUploading(false);
    }
  };

  const handleAddEditTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const v = editTagInput.trim().replace(/^#/, '');
    if (!v || editTags.includes(v) || editTags.length >= 5) {
      setEditTagInput('');
      return;
    }
    setEditTags([...editTags, v]);
    setEditTagInput('');
  };

  const handleUpdatePost = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setSubmitting(true);
    try {
      await updateBoard(postId, {
        title: editTitle.trim(),
        content: editContent.trim(),
        type: 'KNOWHOW',
        tags: editTags,
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

  const handleToggleLike = async () => {
    if (!post) return;
    try {
      const r = await toggleBoardLike(postId);
      setPost({ ...post, liked: r.liked, likeCount: r.likeCount });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleToggleBookmark = async () => {
    if (!post) return;
    try {
      const r = await toggleBoardBookmark(postId);
      setPost({ ...post, bookmarked: r.bookmarked });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    try {
      const r = await toggleCommentLike(commentId);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, liked: r.liked, likeCount: r.likeCount } : c))
      );
    } catch (e) {
      setError((e as Error).message);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '700',
              background: 'var(--blue-bg)',
              color: 'var(--blue)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--blue-border)'
            }}
          >
            <Lightbulb size={12} />
            노하우
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
              fontSize: '20px',
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
              fontSize: '26px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              lineHeight: '1.35',
              letterSpacing: '-0.5px',
              marginBottom: '20px'
            }}
          >
            {post.title}
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
            {myUserId === post.userId && !editing && (
              <button
                onClick={startEditPost}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--blue)',
                  fontWeight: '600'
                }}
                aria-label="수정"
              >
                <Pencil size={14} />
                수정
              </button>
            )}
            {myUserId === post.userId && (
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
            )}
          </div>
        </div>

        {post.imageUrls && post.imageUrls.length > 0 && !editing && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              margin: '24px 0'
            }}
          >
            {post.imageUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '12px'
                }}
              />
            ))}
          </div>
        )}

        {post.tags && post.tags.length > 0 && !editing && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '20px' }}>
            {post.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--blue)',
                  background: 'var(--blue-bg)',
                  padding: '4px 10px',
                  borderRadius: '14px'
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {authorStats && !editing && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              marginTop: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ flex: 1, display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>게시글 <strong style={{ color: 'var(--text-primary)' }}>{authorStats.postCount}</strong></span>
              <span>팔로워 <strong style={{ color: 'var(--text-primary)' }}>{authorStats.followerCount}</strong></span>
              <span>팔로잉 <strong style={{ color: 'var(--text-primary)' }}>{authorStats.followingCount}</strong></span>
            </div>
            <button
              onClick={handleToggleFollow}
              disabled={myUserId === post.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                background: authorStats.following ? 'white' : 'var(--blue)',
                color: authorStats.following ? 'var(--blue)' : 'white',
                border: `1px solid ${authorStats.following ? 'var(--blue-border)' : 'var(--blue)'}`,
                opacity: myUserId === post.userId ? 0.4 : 1,
                cursor: myUserId === post.userId ? 'not-allowed' : 'pointer'
              }}
            >
              {authorStats.following ? <UserCheck size={12} /> : <UserPlus size={12} />}
              {authorStats.following ? '팔로잉' : '팔로우'}
            </button>
          </div>
        )}

        {editing ? (
          <>
            <div style={{ display: 'flex', gap: '8px', margin: '24px 0 8px' }}>
              <button
                type="button"
                onClick={() => editImageInputRef.current?.click()}
                disabled={editUploading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--blue)',
                  cursor: editUploading ? 'not-allowed' : 'pointer',
                  opacity: editUploading ? 0.6 : 1
                }}
              >
                <ImageIcon size={14} />
                사진 삽입
              </button>
              {editUploading && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  업로드 중...
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 'auto' }}>
                사진 삭제는 본문에서 &lt;img&gt; 태그를 지우면 됩니다
              </span>
              <input
                ref={editImageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleEditUpload(f);
                  e.target.value = '';
                }}
              />
            </div>
            <textarea
              ref={editTextareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={14}
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
                marginBottom: '24px'
              }}
            />
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}
              >
                태그{' '}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  (최대 5개)
                </span>
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  minHeight: '44px',
                  alignItems: 'center'
                }}
              >
                {editTags.map((t) => (
                  <span
                    key={t}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--blue)',
                      background: 'var(--blue-bg)',
                      padding: '3px 10px',
                      borderRadius: '14px'
                    }}
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => setEditTags(editTags.filter((x) => x !== t))}
                      style={{ marginLeft: '4px', color: 'var(--blue)' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={handleAddEditTag}
                  placeholder={editTags.length === 0 ? '태그 입력 후 Enter' : ''}
                  disabled={editTags.length >= 5}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
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
                  background: 'var(--blue)',
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
            {renderPostContent(post.content)}
          </div>
        )}

        {!editing && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              onClick={handleToggleLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                background: post.liked ? 'var(--red-bg)' : 'white',
                color: post.liked ? 'var(--red)' : 'var(--text-secondary)',
                border: `1px solid ${post.liked ? 'var(--red-border)' : 'var(--border)'}`
              }}
            >
              <Heart size={14} fill={post.liked ? 'var(--red)' : 'none'} />
              좋아요 {post.likeCount}
            </button>
            <button
              onClick={handleToggleBookmark}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                background: post.bookmarked ? 'var(--blue-bg)' : 'white',
                color: post.bookmarked ? 'var(--blue)' : 'var(--text-secondary)',
                border: `1px solid ${post.bookmarked ? 'var(--blue-border)' : 'var(--border)'}`
              }}
            >
              <Bookmark size={14} fill={post.bookmarked ? 'var(--blue)' : 'none'} />
              {post.bookmarked ? '저장됨' : '저장'}
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '28px' }}>
        <div className="card-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--text-primary)" />
            <span className="card-title">
              댓글 <span style={{ color: 'var(--blue)' }}>{comments.length}</span>
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
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="따뜻한 댓글을 남겨주세요"
            rows={2}
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
            onClick={handleSubmitComment}
            disabled={!comment.trim() || submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: comment.trim() ? 'var(--navy)' : '#cbd5e1',
              color: 'white',
              padding: '0 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              alignSelf: 'flex-end',
              height: '36px',
              cursor: comment.trim() && !submitting ? 'pointer' : 'not-allowed'
            }}
          >
            <Send size={13} />
            등록
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topLevel.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              아직 댓글이 없습니다.
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
              onToggleLike={() => handleToggleCommentLike(c.id)}
              myUserId={myUserId}
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
  onToggleLike: () => void;
  myUserId: number | null;
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
  onToggleLike,
  myUserId,
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
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: authorColorForUser(comment.userId),
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
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
              marginBottom: '6px'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {comment.authorNickname}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatRelativeKo(comment.createdAt)}
            </span>
          </div>
          {isEditing ? (
            <div style={{ marginBottom: '10px' }}>
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
                    background: 'var(--blue)'
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
                lineHeight: '1.6',
                marginBottom: '10px',
                whiteSpace: 'pre-wrap',
                fontStyle: comment.deleted ? 'italic' : 'normal'
              }}
            >
              {comment.content}
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {!comment.deleted && (
              <button
                onClick={onToggleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: comment.liked ? 'var(--blue)' : 'var(--text-secondary)'
                }}
              >
                <Heart size={12} fill={comment.liked ? 'var(--blue)' : 'none'} />
                {comment.likeCount}
              </button>
            )}
            <button
              onClick={onReply}
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}
            >
              {replyOpen ? '취소' : '답글'}
            </button>
            {!comment.deleted && !isEditing && myUserId === comment.userId && (
              <>
                <button
                  onClick={() => onStartEdit(comment)}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--blue)',
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
                  background: replyContent.trim() ? 'var(--navy)' : '#cbd5e1',
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
                    {!r.deleted && myUserId === r.userId && (
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
