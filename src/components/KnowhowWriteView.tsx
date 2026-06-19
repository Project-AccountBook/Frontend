import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  PenSquare,
  ImagePlus,
  X,
  Hash,
  Eye,
  Type,
  AlignLeft,
  Lightbulb,
  Save
} from 'lucide-react';

const CATEGORIES = ['절약 노하우', '재테크', '가계부', '육아 꿀팁', '공동구매', '살림 팁'];

const TITLE_MAX = 60;
const CONTENT_MAX = 3000;

interface KnowhowWriteViewProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export const KnowhowWriteView: React.FC<KnowhowWriteViewProps> = ({ onCancel, onSubmit }) => {
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = category && title.trim().length > 0 && content.trim().length > 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setThumbnail(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
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
              background: canSubmit ? 'var(--blue)' : '#cbd5e1',
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            <PenSquare size={14} />
            <span>등록하기</span>
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
            {/* Category */}
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
                <Lightbulb size={14} color="var(--blue)" />
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
                  outline: 'none',
                  transition: 'all 0.15s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = 'var(--blue)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              />
            </div>
          </div>

          {/* Thumbnail */}
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
              <ImagePlus size={14} color="var(--blue)" />
              대표 이미지
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: '500',
                  marginLeft: '4px'
                }}
              >
                (선택 · 1장)
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {thumbnail ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '280px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundImage: `url(${thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <button
                  onClick={() => setThumbnail(null)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label="이미지 제거"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: '180px',
                  border: '2px dashed var(--border-hover)',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--blue)';
                  e.currentTarget.style.background = 'var(--blue-bg)';
                  e.currentTarget.style.color = 'var(--blue)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <ImagePlus size={28} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>
                  이미지를 업로드하세요
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  JPG, PNG · 최대 5MB
                </span>
              </button>
            )}
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
                lineHeight: '1.7',
                transition: 'all 0.15s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = 'var(--blue)';
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
                <Hash size={14} color="var(--blue)" />
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
                    color: 'var(--blue)',
                    background: 'var(--blue-bg)',
                    border: '1px solid var(--blue-border)',
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
                      color: 'var(--blue)'
                    }}
                    aria-label={`${t} 태그 제거`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? '태그 입력 후 Enter (예: 식비절약)' : ''}
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
          {/* Preview Card */}
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
                overflow: 'hidden',
                background: '#fafbfc'
              }}
            >
              {thumbnail && (
                <div
                  style={{
                    width: '100%',
                    height: '120px',
                    backgroundImage: `url(${thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              )}
              <div style={{ padding: '14px' }}>
                {category && (
                  <span
                    className="group-buy-category"
                    style={{ display: 'inline-block', marginBottom: '8px' }}
                  >
                    {category}
                  </span>
                )}
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: title ? 'var(--text-primary)' : 'var(--text-muted)',
                    lineHeight: '1.4',
                    marginBottom: '6px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {title || '제목이 여기에 표시됩니다'}
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
                  {content || '내용 미리보기가 여기에 표시됩니다'}
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
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
                '관련 이미지가 있으면 신뢰도가 올라가요',
                '적절한 태그는 글 노출에 도움이 돼요'
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
              개인정보, 상업적 광고, 욕설/비방이 포함된 글은 사전 동의 없이 삭제될 수 있어요.
              따뜻한 노하우 공간을 함께 만들어주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
