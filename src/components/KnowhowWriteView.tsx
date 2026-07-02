import React, { useState } from 'react';
import {
  ArrowLeft,
  PenSquare,
  Type,
  AlignLeft,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { createBoard } from '../lib/boardApi';

const TITLE_MAX = 60;
const CONTENT_MAX = 3000;

const DEFAULT_CATEGORY_ID = 1;

interface KnowhowWriteViewProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export const KnowhowWriteView: React.FC<KnowhowWriteViewProps> = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBoard({
        categoryId: DEFAULT_CATEGORY_ID,
        title: title.trim(),
        content: content.trim(),
        type: 'KNOWHOW',
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
              <PenSquare size={20} color="var(--blue)" />
              노하우 작성
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              나만의 살림·재테크·육아 노하우를 공유해보세요
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
              background: canSubmit ? 'var(--blue)' : '#cbd5e1',
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            <PenSquare size={14} />
            <span>{submitting ? '등록 중...' : '등록하기'}</span>
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
                  <Type size={14} color="var(--blue)" />
                  제목 <span style={{ color: 'var(--red)' }}>*</span>
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
                placeholder="다른 엄마들의 시선을 끌 만한 제목을 적어주세요"
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
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '10px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlignLeft size={14} color="var(--blue)" />
                내용 <span style={{ color: 'var(--red)' }}>*</span>
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
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
              placeholder={`실제로 도움이 된 경험을 구체적으로 적어주세요.\n\n예시)\n· 어떤 상황이었는지\n· 어떻게 해결/실천했는지\n· 결과는 어땠는지`}
              rows={16}
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
                  좋은 글 작성 팁
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
                '구체적인 숫자·경험을 함께 적어주세요',
                '단계별로 정리하면 가독성이 좋아져요',
                '결과까지 함께 공유하면 좋아요'
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
                      background: 'var(--blue-bg)',
                      color: 'var(--blue)',
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
