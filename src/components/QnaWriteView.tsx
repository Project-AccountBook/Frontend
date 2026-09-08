import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  PenSquare,
  Type,
  AlignLeft,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Image as ImageIcon
} from 'lucide-react';
import type { BoardCategory } from '../lib/boardApi';
import { createBoard, listBoardCategories, uploadFile } from '../lib/boardApi';

const TITLE_MAX = 80;
const CONTENT_MAX = 2000;

interface QnaWriteViewProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export const QnaWriteView: React.FC<QnaWriteViewProps> = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => (prev + snippet).slice(0, CONTENT_MAX));
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = (content.slice(0, start) + snippet + content.slice(end)).slice(0, CONTENT_MAX);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = Math.min(start + snippet.length, CONTENT_MAX);
      el.setSelectionRange(pos, pos);
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      insertAtCursor(`\n<img src="${url}" alt="" style="max-width:100%;" />\n`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const v = tagInput.trim().replace(/^#/, '');
    if (!v || tags.includes(v) || tags.length >= 5) {
      setTagInput('');
      return;
    }
    setTags([...tags, v]);
    setTagInput('');
  };

  useEffect(() => {
    let cancelled = false;
    listBoardCategories('QNA')
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit =
    !!categoryId && title.trim().length > 0 && content.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !categoryId) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBoard({
        categoryId,
        title: title.trim(),
        content: content.trim(),
        type: 'QNA',
        tags,
      });
      onSubmit();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="dashboard-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'white',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
            aria-label="목록으로"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <HelpCircle size={20} color="var(--purple)" />
              질문 작성
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              궁금한 점을 다른 엄마들과 함께 해결해보세요
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCancel}
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
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="header-btn-primary"
            style={{
              background: canSubmit ? 'var(--purple)' : '#cbd5e1',
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            <PenSquare size={14} />
            <span>{submitting ? '등록 중...' : '질문 등록'}</span>
          </button>
        </div>
      </div>

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
          <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: '24px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          <div className="card" style={{ padding: '28px' }}>
            {categories.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: '10px'
                  }}
                >
                  <HelpCircle size={14} color="var(--purple)" />
                  카테고리 <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`dashboard-tab-btn ${categoryId === c.id ? 'active' : ''}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '10px'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Type size={14} color="var(--purple)" />
                  질문 제목 <span style={{ color: 'var(--red)' }}>*</span>
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: title.length > TITLE_MAX ? 'var(--red)' : 'var(--text-muted)',
                    fontWeight: '500'
                  }}
                >
                  {title.length} / {TITLE_MAX}
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                placeholder="구체적인 질문일수록 좋은 답변을 받을 수 있어요"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '28px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '10px'
              }}
            >
              태그 <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>(최대 5개)</span>
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
                marginBottom: '16px',
                alignItems: 'center'
              }}
            >
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--purple)',
                    background: 'var(--purple-bg)',
                    padding: '3px 10px',
                    borderRadius: '14px'
                  }}
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    style={{ marginLeft: '4px', color: 'var(--purple)' }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? '태그 입력 후 Enter' : ''}
                disabled={tags.length >= 5}
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

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '10px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlignLeft size={14} color="var(--purple)" />
                질문 내용 <span style={{ color: 'var(--red)' }}>*</span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: content.length > CONTENT_MAX ? 'var(--red)' : 'var(--text-muted)',
                  fontWeight: '500'
                }}
              >
                {content.length.toLocaleString()} / {CONTENT_MAX.toLocaleString()}
              </span>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
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
                  color: 'var(--purple)',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1
                }}
              >
                <ImageIcon size={14} />
                사진
              </button>
              {uploading && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  업로드 중...
                </span>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                  e.target.value = '';
                }}
              />
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
              placeholder={`상황을 자세히 적을수록 더 정확한 답변을 받을 수 있어요.\n\n예시)\n· 현재 어떤 상황인가요?\n· 무엇이 고민되시나요?\n· 어떤 답변을 기대하시나요?`}
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
                lineHeight: '1.7'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div className="card-header-row" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={16} color="#f59e0b" />
                <span className="card-title" style={{ fontSize: '14px' }}>
                  좋은 질문 팁
                </span>
              </div>
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {[
                '상황을 구체적으로 설명해주세요',
                '관련 숫자(금액·기간)를 함께 적어주세요',
                '원하는 답변의 방향을 명시해주세요'
              ].map((tip, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5'
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'var(--purple-bg)',
                      color: 'var(--purple)',
                      fontSize: '10px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '1px'
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
