import React, { useState } from 'react';
import {
  ArrowLeft,
  PenSquare,
  Hash,
  Eye,
  Type,
  AlignLeft,
  HelpCircle,
  Save,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

const CATEGORIES = ['재테크', '가계부', '육아 비용', '절약', '공동구매', '살림'];

const TITLE_MAX = 80;
const CONTENT_MAX = 2000;

interface QnaWriteViewProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export const QnaWriteView: React.FC<QnaWriteViewProps> = ({ onCancel, onSubmit }) => {
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const canSubmit = category && title.trim().length > 0 && content.trim().length > 0;

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

  const handleRemoveTag = (t: string) => setTags(tags.filter((x) => x !== t));

  return (
    <div className="fade-in">
      {/* Header */}
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'white',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '700'
            }}
          >
            <Save size={14} />
            임시저장
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="header-btn-primary"
            style={{
              background: canSubmit ? 'var(--purple)' : '#cbd5e1',
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            <PenSquare size={14} />
            <span>질문 등록</span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: '24px'
        }}
      >
        {/* Editor Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* Category & Title */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
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
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`dashboard-tab-btn ${category === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
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
                  outline: 'none',
                  transition: 'all 0.15s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = 'var(--purple)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              />
            </div>

            {/* Urgent toggle */}
            <button
              onClick={() => setIsUrgent(!isUrgent)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '14px 16px',
                background: isUrgent ? 'var(--red-bg)' : '#f8fafc',
                border: `1px solid ${isUrgent ? 'var(--red-border)' : 'var(--border)'}`,
                borderRadius: '10px',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${isUrgent ? 'var(--red)' : 'var(--border-hover)'}`,
                  background: isUrgent ? 'var(--red)' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isUrgent && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: isUrgent ? 'var(--red)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <AlertCircle size={14} />
                  급해요 표시
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: isUrgent ? '#b91c1c' : 'var(--text-secondary)',
                    marginTop: '2px',
                    fontWeight: '500'
                  }}
                >
                  빠른 답변이 필요한 질문에 표시해주세요
                </div>
              </div>
            </button>
          </div>

          {/* Content */}
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
            <textarea
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
                lineHeight: '1.7',
                transition: 'all 0.15s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = 'var(--purple)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            />
          </div>

          {/* Tags */}
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
                <Hash size={14} color="var(--purple)" />
                태그
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: '500',
                    marginLeft: '4px'
                  }}
                >
                  (최대 5개)
                </span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {tags.length} / 5
              </span>
            </label>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                minHeight: '50px',
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
                    border: '1px solid var(--purple-border)',
                    padding: '4px 4px 4px 10px',
                    borderRadius: '20px'
                  }}
                >
                  #{t}
                  <button
                    onClick={() => handleRemoveTag(t)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      color: 'var(--purple)'
                    }}
                    aria-label={`${t} 태그 제거`}
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
                placeholder={tags.length === 0 ? '태그 입력 후 Enter (예: 청약통장)' : ''}
                disabled={tags.length >= 5}
                style={{
                  flex: 1,
                  minWidth: '160px',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Preview */}
          <div className="card" style={{ padding: '24px' }}>
            <div className="card-header-row" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} color="var(--text-primary)" />
                <span className="card-title" style={{ fontSize: '14px' }}>
                  미리보기
                </span>
              </div>
            </div>

            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                background: '#fafbfc'
              }}
            >
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    background: 'var(--red-bg)',
                    color: 'var(--red)',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}
                >
                  답변대기
                </span>
                {category && (
                  <span className="group-buy-category" style={{ fontSize: '10px' }}>
                    {category}
                  </span>
                )}
                {isUrgent && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      background: 'var(--red)',
                      color: 'white',
                      padding: '3px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    급해요
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: title ? 'var(--text-primary)' : 'var(--text-muted)',
                  lineHeight: '1.4',
                  marginBottom: '8px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                <span style={{ color: 'var(--purple)' }}>Q. </span>
                {title || '질문 제목이 여기에 표시됩니다'}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: content ? 'var(--text-secondary)' : 'var(--text-muted)',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {content || '질문 내용 미리보기가 여기에 표시됩니다'}
              </div>
            </div>
          </div>

          {/* Tips */}
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
                '원하는 답변의 방향을 명시해주세요',
                '관련 태그를 달면 답변자가 찾기 쉬워요'
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

          {/* Guidelines */}
          <div
            className="card"
            style={{
              padding: '20px',
              background: '#fff7ed',
              borderColor: '#fed7aa'
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#c2410c',
                marginBottom: '8px'
              }}
            >
              ⚠ 게시 전 확인해주세요
            </div>
            <p
              style={{
                fontSize: '11px',
                color: '#9a3412',
                lineHeight: '1.6',
                fontWeight: '500'
              }}
            >
              개인정보(실명·연락처·계좌번호 등), 욕설/비방, 광고성 글은 사전 동의 없이 삭제될 수
              있어요. 좋은 답변을 위해 깨끗한 Q&A 공간을 함께 만들어주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
