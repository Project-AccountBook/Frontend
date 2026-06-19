import React, { useState } from 'react';
import {
  Search,
  PenSquare,
  Eye,
  MessageSquare,
  Heart,
  Lightbulb,
  TrendingUp,
  Flame,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface KnowhowPost {
  id: number;
  category: string;
  title: string;
  content: string;
  thumbnail?: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  createdAt: string;
  views: number;
  comments: number;
  likes: number;
  isHot?: boolean;
}

export const KNOWHOW_POSTS: KnowhowPost[] = [
  {
    id: 1,
    category: '절약 노하우',
    title: '한 달 식비 50만원 줄이는 우리집 장보기 루틴',
    content:
      '아이 둘 키우면서 식비가 너무 많이 나와서 고민이었는데, 일요일에 일주일치 식단을 짜고 장을 보기 시작하면서 한 달 식비를 절반 가까이 줄였어요. 제가 실천하는 5가지 루틴을 공유합니다.',
    thumbnail:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=60',
    author: '미니맘',
    authorInitial: '미',
    authorColor: '#3b82f6',
    createdAt: '2시간 전',
    views: 1284,
    comments: 42,
    likes: 187,
    isHot: true
  },
  {
    id: 2,
    category: '재테크',
    title: '청약통장 200만원 모으기, 이렇게 시작했어요',
    content:
      '아이 미래 위해 청약통장 가입했는데 매달 납입하는 게 부담스러웠어요. 자동이체 + 풍차돌리기 조합으로 1년에 200만원 모은 후기입니다.',
    thumbnail:
      'https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=800&q=60',
    author: '재테크맘',
    authorInitial: '재',
    authorColor: '#10b981',
    createdAt: '5시간 전',
    views: 932,
    comments: 28,
    likes: 124,
    isHot: true
  },
  {
    id: 3,
    category: '육아 꿀팁',
    title: '기저귀 박스떼기 vs 낱개, 진짜 이득은?',
    content:
      '기저귀 살 때마다 고민되는 박스떼기 vs 낱개 구매. 한 달간 가격 비교하면서 데이터 정리해봤어요. 결론부터 말씀드리면 박스떼기가 평균 18% 더 저렴합니다.',
    thumbnail:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=60',
    author: '두아이맘',
    authorInitial: '두',
    authorColor: '#f43f5e',
    createdAt: '하루 전',
    views: 678,
    comments: 19,
    likes: 89
  },
  {
    id: 4,
    category: '공동구매',
    title: '동네 엄마들이랑 공구할 때 꼭 정해야 할 5가지',
    content:
      '공구하다가 다툼 생긴 적 많으시죠? 저희 동네에서 1년 넘게 공구하면서 정리한 룰을 공유드려요. 정산, 배송, 환불 정책까지!',
    author: '공구의신',
    authorInitial: '공',
    authorColor: '#8b5cf6',
    createdAt: '하루 전',
    views: 543,
    comments: 31,
    likes: 76
  },
  {
    id: 5,
    category: '절약 노하우',
    title: '아이옷 절반 가격에 사는 시즌 오프 활용법',
    content:
      '아이옷이 금방 작아져서 너무 아까웠는데, 시즌 오프 활용하면서 비용을 절반으로 줄였어요. 어느 시기에 어떤 아이템을 사야 하는지 정리했습니다.',
    thumbnail:
      'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=800&q=60',
    author: '알뜰맘',
    authorInitial: '알',
    authorColor: '#f59e0b',
    createdAt: '2일 전',
    views: 421,
    comments: 14,
    likes: 58
  },
  {
    id: 6,
    category: '가계부',
    title: '6개월 가계부 쓰고 발견한 우리집 새는 돈',
    content:
      '가계부 6개월 꾸준히 쓰면서 발견한 우리집의 새는 돈 BEST 3. 카테고리별로 정리해보니 의외로 큰 금액이 빠져나가고 있더라고요.',
    author: '꼼꼼맘',
    authorInitial: '꼼',
    authorColor: '#06b6d4',
    createdAt: '3일 전',
    views: 389,
    comments: 22,
    likes: 71
  }
];

const CATEGORIES = ['전체', '절약 노하우', '재테크', '가계부', '육아 꿀팁', '공동구매', '살림 팁'];

const SORT_TABS = [
  { id: 'latest', label: '최신순', icon: Clock },
  { id: 'popular', label: '인기순', icon: Flame },
  { id: 'views', label: '조회순', icon: TrendingUp }
];

interface KnowhowListViewProps {
  onSelectPost: (id: number) => void;
  onWrite: () => void;
}

export const KnowhowListView: React.FC<KnowhowListViewProps> = ({ onSelectPost, onWrite }) => {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeSort, setActiveSort] = useState('latest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = KNOWHOW_POSTS.filter((p) => {
    const matchCategory = activeCategory === '전체' || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === 'popular') return b.likes - a.likes;
    if (activeSort === 'views') return b.views - a.views;
    return b.id - a.id;
  });

  const hotPosts = [...KNOWHOW_POSTS].sort((a, b) => b.likes - a.likes).slice(0, 3);

  return (
    <div className="fade-in">
      {/* Sub Header */}
      <div className="dashboard-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--blue-bg)',
              color: 'var(--blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Lightbulb size={20} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px'
              }}
            >
              노하우 공유
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              엄마들의 살림·재테크·육아 노하우를 나눠보세요
            </p>
          </div>
        </div>

        <button
          onClick={onWrite}
          className="header-btn-primary"
          style={{ background: 'var(--blue)' }}
        >
          <PenSquare size={16} />
          <span>글쓰기</span>
        </button>
      </div>

      {/* Hot Posts Strip */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <div
          className="card-header-row"
          style={{ marginBottom: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} color="#f43f5e" />
            <span className="card-title">이번 주 HOT 노하우</span>
          </div>
          <span className="stat-label">2026년 6월 셋째 주</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '16px'
          }}
        >
          {hotPosts.map((post, idx) => (
            <button
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: '#fafbfc',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.background = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = '#fafbfc';
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background:
                    idx === 0 ? '#f43f5e' : idx === 1 ? '#fb923c' : '#fbbf24',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '800',
                  flexShrink: 0
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
                    marginBottom: '4px'
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
                    fontWeight: '500'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Heart size={11} />
                    {post.likes}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MessageSquare size={11} />
                    {post.comments}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`dashboard-tab-btn ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              padding: '8px 14px',
              borderRadius: '10px',
              minWidth: '260px',
              flex: '0 1 320px'
            }}
          >
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="제목, 내용으로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                fontFamily: 'inherit',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Sort Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
            {SORT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
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
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            전체 <strong style={{ color: 'var(--text-primary)' }}>{sorted.length}</strong>개 글
          </span>
        </div>
      </div>

      {/* Posts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '20px'
        }}
      >
        {sorted.map((post) => (
          <button
            key={post.id}
            onClick={() => onSelectPost(post.id)}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              textAlign: 'left',
              cursor: 'pointer'
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
                  position: 'relative'
                }}
              >
                {post.isHot && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: 'var(--red)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    HOT
                  </span>
                )}
              </div>
            )}

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="group-buy-category">{post.category}</span>
                {!post.thumbnail && post.isHot && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      background: 'var(--red-bg)',
                      color: 'var(--red)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--red-border)'
                    }}
                  >
                    HOT
                  </span>
                )}
                <span
                  style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}
                >
                  {post.createdAt}
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
                  overflow: 'hidden'
                }}
              >
                {post.title}
              </h3>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {post.content}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: post.authorColor,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                  >
                    {post.authorInitial}
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {post.author}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '14px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={13} />
                    {post.views.toLocaleString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={13} />
                    {post.comments}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Heart size={13} />
                    {post.likes}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px',
          marginTop: '32px'
        }}
      >
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          className="dashboard-date-arrow"
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white'
          }}
        >
          <ChevronLeft size={16} />
        </button>
        {[1, 2, 3, 4, 5].map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              background: page === p ? 'var(--navy)' : 'white',
              color: page === p ? 'white' : 'var(--text-secondary)',
              border: page === p ? '1px solid var(--navy)' : '1px solid var(--border)'
            }}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setPage(page + 1)}
          className="dashboard-date-arrow"
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
