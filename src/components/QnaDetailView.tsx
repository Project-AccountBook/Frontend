import React, { useState } from 'react';
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  ThumbsUp,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  CheckCircle2,
  HelpCircle,
  Award,
  AlertCircle
} from 'lucide-react';
import { QNA_POSTS } from './QnaListView';

interface Answer {
  id: number;
  author: string;
  authorInitial: string;
  authorColor: string;
  authorBadge?: string;
  content: string;
  createdAt: string;
  likes: number;
  isBest?: boolean;
}

const MOCK_ANSWERS: Answer[] = [
  {
    id: 1,
    author: '재테크선배',
    authorInitial: '재',
    authorColor: '#10b981',
    authorBadge: '재테크 마스터',
    content:
      '둘 다 좋지만 우선순위를 정하자면 청약통장 먼저 추천드려요. 아이가 어릴 때 가입해두면 가점이 쌓이고, 나중에 청약 시 큰 도움이 됩니다.\n\n매달 20만원이면 청약 10 + 적금 10으로 나눠도 좋고, 처음 1-2년은 청약통장에 집중해서 가점 빨리 채우는 방식도 추천드려요. 금리 측면에서는 적금이 더 좋지만, 청약 가점은 시간이 돈인 자산이라 일찍 시작할수록 이득입니다.',
    createdAt: '15분 전',
    likes: 32,
    isBest: true
  },
  {
    id: 2,
    author: '꼼꼼맘',
    authorInitial: '꼼',
    authorColor: '#3b82f6',
    content:
      '저희집은 적금 위주로 모았어요. 아이 의료비, 학원비 같이 갑자기 큰 돈 나갈 일이 생각보다 많더라구요. 청약은 좀 더 자리 잡은 후에 시작해도 늦지 않다고 봅니다.',
    createdAt: '40분 전',
    likes: 18
  },
  {
    id: 3,
    author: '두아이맘',
    authorInitial: '두',
    authorColor: '#f43f5e',
    content:
      '저도 같은 고민 했었는데요, 결국 둘 다 들었어요. 청약통장 월 2만원(가점용 최소금액), 적금 18만원으로 분산했습니다. 청약은 가점만 챙기고 본격적인 저축은 적금으로요.',
    createdAt: '1시간 전',
    likes: 24
  }
];

interface QnaDetailViewProps {
  postId: number;
  onBack: () => void;
}

export const QnaDetailView: React.FC<QnaDetailViewProps> = ({ postId, onBack }) => {
  const post = QNA_POSTS.find((p) => p.id === postId) ?? QNA_POSTS[0];
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [answer, setAnswer] = useState('');

  const relatedPosts = QNA_POSTS.filter(
    (p) => p.id !== post.id && p.category === post.category
  ).slice(0, 3);

  return (
    <div className="fade-in">
      {/* Back button */}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: '24px'
        }}
      >
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* Question card */}
          <div className="card" style={{ padding: '32px' }}>
            {/* Status + Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              {post.isResolved ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#dcfce7',
                    color: '#16a34a',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #86efac'
                  }}
                >
                  <CheckCircle2 size={12} />
                  해결완료
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: 'var(--red-bg)',
                    color: 'var(--red)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--red-border)'
                  }}
                >
                  <HelpCircle size={12} />
                  답변대기
                </span>
              )}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  background: 'var(--purple-bg)',
                  color: 'var(--purple)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--purple-border)'
                }}
              >
                {post.category}
              </span>
              {post.isUrgent && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    background: 'var(--red)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}
                >
                  급해요
                </span>
              )}
            </div>

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

            {/* Author/meta row */}
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
                    background: post.authorColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                >
                  {post.authorInitial}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {post.author}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {post.createdAt}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
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
                  {post.answers}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ThumbsUp size={14} />
                  {post.likes}
                </span>
                <button
                  style={{
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="더보기"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
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
              {'\n\n'}
              비슷한 고민하셨던 분들 경험담 듣고 싶어요. 어떤 기준으로 선택하셨는지, 결과적으로
              만족스러우셨는지도 알려주시면 정말 큰 도움이 될 것 같습니다. 미리 감사드립니다!
            </div>

            {/* Action bar */}
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
                onClick={() => setLiked(!liked)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: liked ? 'var(--purple-bg)' : 'white',
                  color: liked ? 'var(--purple)' : 'var(--text-secondary)',
                  border: `1px solid ${liked ? 'var(--purple-border)' : 'var(--border)'}`,
                  transition: 'all 0.15s'
                }}
              >
                <ThumbsUp size={14} fill={liked ? 'var(--purple)' : 'none'} />
                <span>도움돼요 {post.likes + (liked ? 1 : 0)}</span>
              </button>

              <button
                onClick={() => setBookmarked(!bookmarked)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: bookmarked ? 'var(--blue-bg)' : 'white',
                  color: bookmarked ? 'var(--blue)' : 'var(--text-secondary)',
                  border: `1px solid ${bookmarked ? 'var(--blue-border)' : 'var(--border)'}`,
                  transition: 'all 0.15s'
                }}
              >
                <Bookmark size={14} fill={bookmarked ? 'var(--blue)' : 'none'} />
                <span>{bookmarked ? '저장됨' : '저장'}</span>
              </button>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: 'white',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                <Share2 size={14} />
                <span>공유</span>
              </button>
            </div>
          </div>

          {/* Answers card */}
          <div className="card" style={{ padding: '28px' }}>
            <div className="card-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="var(--text-primary)" />
                <span className="card-title">
                  답변 <span style={{ color: 'var(--purple)' }}>{post.answers}</span>
                </span>
              </div>
              <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
                <button className="sub-tab-btn active">추천순</button>
                <button className="sub-tab-btn">최신순</button>
              </div>
            </div>

            {/* Answer input */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--purple-bg)',
                  color: 'var(--purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '700',
                  flexShrink: 0
                }}
              >
                나
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="도움이 되는 답변을 남겨주세요. 본인의 경험을 구체적으로 적을수록 더 좋아요."
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
                disabled={!answer.trim()}
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
                  cursor: answer.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                <Send size={13} />
                답변 등록
              </button>
            </div>

            {/* Answers list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {MOCK_ANSWERS.map((a) => (
                <AnswerItem key={a.id} answer={a} canSelectBest={!post.isResolved} />
              ))}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Question status */}
          <div
            className="card"
            style={{
              padding: '20px',
              background: post.isResolved ? '#f0fdf4' : '#fef2f2',
              borderColor: post.isResolved ? '#bbf7d0' : 'var(--red-border)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px'
              }}
            >
              {post.isResolved ? (
                <CheckCircle2 size={20} color="#16a34a" />
              ) : (
                <AlertCircle size={20} color="var(--red)" />
              )}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: post.isResolved ? '#166534' : 'var(--red)'
                }}
              >
                {post.isResolved ? '해결된 질문이에요' : '답변을 기다리는 중'}
              </span>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: post.isResolved ? '#15803d' : '#b91c1c',
                lineHeight: '1.6',
                fontWeight: '500'
              }}
            >
              {post.isResolved
                ? '채택된 답변과 함께 다른 좋은 답변들도 확인해보세요.'
                : '답변을 달아 다른 엄마의 고민을 해결해주세요!'}
            </p>
          </div>

          {/* Author profile */}
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: post.authorColor,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '800',
                margin: '0 auto 12px'
              }}
            >
              {post.authorInitial}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              {post.author}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              질문자 · 활동지수 우수
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)'
              }}
            >
              {[
                { lbl: '질문', val: '14' },
                { lbl: '답변', val: '52' },
                { lbl: '채택', val: '38' }
              ].map((s) => (
                <div key={s.lbl}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {s.lbl}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related questions */}
          {relatedPosts.length > 0 && (
            <div className="card" style={{ padding: '24px' }}>
              <div className="card-header-row" style={{ marginBottom: '16px' }}>
                <span className="card-title" style={{ fontSize: '14px' }}>
                  비슷한 질문
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {relatedPosts.map((p) => (
                  <button
                    key={p.id}
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: '10px',
                      background: '#fafbfc',
                      border: '1px solid var(--border)',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fafbfc';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px'
                      }}
                    >
                      {p.isResolved ? (
                        <CheckCircle2 size={12} color="#16a34a" />
                      ) : (
                        <HelpCircle size={12} color="var(--red)" />
                      )}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: p.isResolved ? '#16a34a' : 'var(--red)'
                        }}
                      >
                        {p.isResolved ? '해결완료' : '답변대기'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '8px'
                      }}
                    >
                      {p.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MessageSquare size={11} />
                        {p.answers}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Eye size={11} />
                        {p.views.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface AnswerItemProps {
  answer: Answer;
  canSelectBest?: boolean;
}

const AnswerItem: React.FC<AnswerItemProps> = ({ answer, canSelectBest }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '12px',
        border: answer.isBest ? '2px solid #86efac' : '1px solid var(--border)',
        background: answer.isBest ? '#f0fdf4' : 'white'
      }}
    >
      {answer.isBest && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: '800',
            background: '#16a34a',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            marginBottom: '14px'
          }}
        >
          <Award size={12} />
          채택된 답변
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: answer.authorColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '700',
            flexShrink: 0
          }}
        >
          {answer.authorInitial}
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
              {answer.author}
            </span>
            {answer.authorBadge && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  background: 'var(--blue-bg)',
                  color: 'var(--blue)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                {answer.authorBadge}
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{answer.createdAt}</span>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
              marginBottom: '14px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {answer.content}
          </p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setLiked(!liked)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                padding: '6px 12px',
                borderRadius: '8px',
                background: liked ? 'var(--purple-bg)' : '#f8fafc',
                color: liked ? 'var(--purple)' : 'var(--text-secondary)',
                border: `1px solid ${liked ? 'var(--purple-border)' : 'var(--border)'}`
              }}
            >
              <ThumbsUp size={12} fill={liked ? 'var(--purple)' : 'none'} />
              도움돼요 {answer.likes + (liked ? 1 : 0)}
            </button>
            {canSelectBest && !answer.isBest && (
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#16a34a',
                  border: '1px solid #86efac'
                }}
              >
                <Award size={12} />
                답변 채택
              </button>
            )}
            <button
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                padding: '6px 8px'
              }}
            >
              답글
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
