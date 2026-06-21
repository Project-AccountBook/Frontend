import React, { useState } from 'react';
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  CornerDownRight,
  ThumbsUp
} from 'lucide-react';
import { KNOWHOW_POSTS } from './KnowhowListView';

interface Comment {
  id: number;
  author: string;
  authorInitial: string;
  authorColor: string;
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 1,
    author: '세아이맘',
    authorInitial: '세',
    authorColor: '#10b981',
    content:
      '저도 비슷한 고민이었는데 큰 도움이 됐어요! 특히 일요일 식단 짜기는 바로 실천해봐야겠어요. 좋은 글 감사합니다.',
    createdAt: '1시간 전',
    likes: 12,
    replies: [
      {
        id: 11,
        author: '미니맘',
        authorInitial: '미',
        authorColor: '#3b82f6',
        content: '도움이 되셨다니 다행이에요! 일요일 30분이면 충분하니까 꼭 시도해보세요 :)',
        createdAt: '45분 전',
        likes: 3
      }
    ]
  },
  {
    id: 2,
    author: '쌍둥이맘',
    authorInitial: '쌍',
    authorColor: '#f43f5e',
    content:
      '대형마트 vs 동네마트 비교 자료 더 자세히 볼 수 있을까요? 카테고리별로 가격 차이가 궁금하네요.',
    createdAt: '2시간 전',
    likes: 8
  },
  {
    id: 3,
    author: '알뜰살뜰',
    authorInitial: '알',
    authorColor: '#8b5cf6',
    content:
      '저는 여기에 추가로 냉장고 파먹기 챌린지 하고 있어요. 일주일에 한 번 마트 안 가는 날 정해두니까 식비가 또 줄더라구요!',
    createdAt: '3시간 전',
    likes: 24
  }
];

interface KnowhowDetailViewProps {
  postId: number;
  onBack: () => void;
}

export const KnowhowDetailView: React.FC<KnowhowDetailViewProps> = ({ postId, onBack }) => {
  const post = KNOWHOW_POSTS.find((p) => p.id === postId) ?? KNOWHOW_POSTS[0];
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState('');

  const relatedPosts = KNOWHOW_POSTS.filter(
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
          {/* Post body card */}
          <div className="card" style={{ padding: '32px' }}>
            {/* Category + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  background: 'var(--blue-bg)',
                  color: 'var(--blue)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--blue-border)'
                }}
              >
                {post.category}
              </span>
              {post.isHot && (
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
                  HOT
                </span>
              )}
            </div>

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
                  {post.comments}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Heart size={14} />
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

            {/* Thumbnail */}
            {post.thumbnail && (
              <div
                style={{
                  width: '100%',
                  height: '320px',
                  backgroundImage: `url(${post.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '12px',
                  margin: '24px 0'
                }}
              />
            )}

            {/* Content */}
            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.8',
                color: 'var(--text-primary)',
                marginTop: post.thumbnail ? '0' : '24px'
              }}
            >
              <p style={{ marginBottom: '20px' }}>{post.content}</p>

              <p style={{ marginBottom: '20px' }}>
                안녕하세요, 여섯 살 첫째와 두 살 둘째를 키우는 워킹맘입니다. 작년 이맘때만 해도
                저희집 월 식비가 평균 110만원 정도였는데요, 너무 부담스러워서 가계부를 다시 쓰기
                시작했어요. 그러면서 매주 일요일 30분만 투자해서 식단을 짜고 장을 보는 루틴을
                만들었더니, 지난달 식비가 <strong>59만원</strong>까지 줄었습니다.
              </p>

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '32px 0 12px',
                  color: 'var(--text-primary)'
                }}
              >
                1. 일요일 30분, 일주일 식단표 만들기
              </h3>
              <p style={{ marginBottom: '20px' }}>
                일요일 오전에 가족 일정과 외식 계획을 체크하고, 평일 저녁 메뉴 5개를 미리 정해요.
                메뉴를 정하고 나면 필요한 재료가 자동으로 나오기 때문에 충동구매가 사라집니다.
              </p>

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '32px 0 12px',
                  color: 'var(--text-primary)'
                }}
              >
                2. 동네 마트 + 대형 마트 분리 전략
              </h3>
              <p style={{ marginBottom: '20px' }}>
                채소·과일은 동네 시장이 평균 22% 저렴했어요. 반대로 우유·계란·세제 같은 공산품은
                대형마트 + 공동구매가 훨씬 쌉니다. 카테고리별로 어디서 살지 정해두면 발품 줄이고
                돈도 아낄 수 있어요.
              </p>

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '32px 0 12px',
                  color: 'var(--text-primary)'
                }}
              >
                3. 냉장고 정리부터 시작하기
              </h3>
              <p style={{ marginBottom: '20px' }}>
                장 보기 전에 냉장고를 먼저 확인해요. 이미 있는 재료를 모르고 또 사는 일이 줄어들고,
                유통기한이 임박한 재료를 활용한 메뉴를 자연스럽게 식단에 넣게 됩니다.
              </p>

              <p style={{ marginBottom: '20px' }}>
                작은 변화지만 한 달, 두 달 쌓이니까 가족 외식 한 번 더 할 수 있을 만큼의 여유가
                생겼어요. 다들 화이팅입니다! 궁금한 점 있으시면 댓글로 남겨주세요 :)
              </p>
            </div>

            {/* Tags */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border)'
              }}
            >
              {['#식비절약', '#장보기루틴', '#식단표', '#워킹맘'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    background: '#f1f5f9',
                    padding: '6px 12px',
                    borderRadius: '20px'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Action bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '32px'
              }}
            >
              <button
                onClick={() => setLiked(!liked)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: liked ? 'var(--red-bg)' : 'white',
                  color: liked ? 'var(--red)' : 'var(--text-secondary)',
                  border: `1px solid ${liked ? 'var(--red-border)' : 'var(--border)'}`,
                  transition: 'all 0.15s'
                }}
              >
                <Heart size={16} fill={liked ? 'var(--red)' : 'none'} />
                <span>좋아요 {post.likes + (liked ? 1 : 0)}</span>
              </button>

              <button
                onClick={() => setBookmarked(!bookmarked)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: bookmarked ? 'var(--blue-bg)' : 'white',
                  color: bookmarked ? 'var(--blue)' : 'var(--text-secondary)',
                  border: `1px solid ${bookmarked ? 'var(--blue-border)' : 'var(--border)'}`,
                  transition: 'all 0.15s'
                }}
              >
                <Bookmark size={16} fill={bookmarked ? 'var(--blue)' : 'none'} />
                <span>{bookmarked ? '저장됨' : '저장'}</span>
              </button>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: 'white',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                <Share2 size={16} />
                <span>공유</span>
              </button>
            </div>
          </div>

          {/* Comments card */}
          <div className="card" style={{ padding: '28px' }}>
            <div className="card-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="var(--text-primary)" />
                <span className="card-title">
                  댓글 <span style={{ color: 'var(--blue)' }}>{post.comments}</span>
                </span>
              </div>
              <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
                <button className="sub-tab-btn active">최신순</button>
                <button className="sub-tab-btn">인기순</button>
              </div>
            </div>

            {/* Comment input */}
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
                disabled={!comment.trim()}
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
                  cursor: comment.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                <Send size={13} />
                등록
              </button>
            </div>

            {/* Comments list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MOCK_COMMENTS.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              알뜰살림 6년차 워킹맘
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
                { lbl: '게시글', val: '28' },
                { lbl: '팔로워', val: '142' },
                { lbl: '좋아요', val: '1.2K' }
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
            <button
              style={{
                width: '100%',
                marginTop: '16px',
                background: 'var(--blue)',
                color: 'white',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              + 팔로우
            </button>
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <div className="card" style={{ padding: '24px' }}>
              <div className="card-header-row" style={{ marginBottom: '16px' }}>
                <span className="card-title" style={{ fontSize: '14px' }}>
                  관련 노하우
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
                        <Eye size={11} />
                        {p.views.toLocaleString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Heart size={11} />
                        {p.likes}
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

const CommentItem: React.FC<{ comment: Comment; isReply?: boolean }> = ({
  comment,
  isReply
}) => {
  const [liked, setLiked] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '16px 0',
        borderBottom: isReply ? 'none' : '1px solid var(--border)',
        marginLeft: isReply ? '24px' : 0
      }}
    >
      {isReply && (
        <CornerDownRight
          size={16}
          color="var(--text-muted)"
          style={{ marginTop: '12px', flexShrink: 0 }}
        />
      )}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: comment.authorColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '700',
          flexShrink: 0
        }}
      >
        {comment.authorInitial}
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
            {comment.author}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{comment.createdAt}</span>
        </div>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
            marginBottom: '10px'
          }}
        >
          {comment.content}
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setLiked(!liked)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '600',
              color: liked ? 'var(--blue)' : 'var(--text-secondary)'
            }}
          >
            <ThumbsUp size={12} fill={liked ? 'var(--blue)' : 'none'} />
            {comment.likes + (liked ? 1 : 0)}
          </button>
          {!isReply && (
            <button
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}
            >
              답글
            </button>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {comment.replies.map((r) => (
              <CommentItem key={r.id} comment={r} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
