import React, { useState } from 'react';
import {
  Search,
  PenSquare,
  Eye,
  MessageSquare,
  ThumbsUp,
  HelpCircle,
  CheckCircle2,
  Clock,
  Flame,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface QnaPost {
  id: number;
  category: string;
  title: string;
  content: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  createdAt: string;
  views: number;
  answers: number;
  likes: number;
  isResolved: boolean;
  isUrgent?: boolean;
  bestAnswer?: string;
}

export const QNA_POSTS: QnaPost[] = [
  {
    id: 1,
    category: '재테크',
    title: '아이 명의 적금 vs 청약통장, 어떤 게 먼저인가요?',
    content:
      '첫째 5살, 둘째 2살인데 아이 미래자금으로 매달 20만원씩 모으려고 합니다. 적금이랑 청약통장 둘 다 들어둘지 아니면 하나에 집중할지 고민이에요. 선배 엄마들 조언 부탁드려요!',
    author: '꿈꾸는맘',
    authorInitial: '꿈',
    authorColor: '#3b82f6',
    createdAt: '30분 전',
    views: 248,
    answers: 12,
    likes: 18,
    isResolved: false,
    isUrgent: true
  },
  {
    id: 2,
    category: '가계부',
    title: '가계부 앱 추천해주세요 (자동연동 가능한 걸로)',
    content:
      '수기로 쓰다가 너무 빼먹어서 자동 연동되는 앱을 찾고 있어요. 카드사 여러 개랑 계좌도 두 개라서 통합 관리 가능한 게 필요한데, 다들 어떤 앱 쓰시나요?',
    author: '가계부초보',
    authorInitial: '가',
    authorColor: '#f59e0b',
    createdAt: '2시간 전',
    views: 412,
    answers: 24,
    likes: 32,
    isResolved: true,
    bestAnswer: '저는 뱅크샐러드 4년째 쓰고 있어요. 카드/계좌 자동 연동 잘 되고 카테고리 분석도 깔끔합니다.'
  },
  {
    id: 3,
    category: '육아 비용',
    title: '어린이집 vs 유치원 비용 차이 어느 정도인가요?',
    content:
      '내년에 첫째가 5살 되는데 어린이집 계속 보낼지 유치원 옮길지 고민입니다. 동네마다 다르겠지만 평균적으로 월 비용 차이가 얼마나 나는지, 추가로 드는 비용도 있는지 궁금해요.',
    author: '곰돌이맘',
    authorInitial: '곰',
    authorColor: '#10b981',
    createdAt: '4시간 전',
    views: 567,
    answers: 18,
    likes: 24,
    isResolved: true,
    bestAnswer: '저희 동네 기준 어린이집은 정부지원 받으면 거의 무료, 유치원은 사립 기준 월 35-50만원 정도 차이 납니다.'
  },
  {
    id: 4,
    category: '절약',
    title: '관리비 너무 많이 나오는데 정상인가요?',
    content:
      '24평 아파트 4인가족 사는데 겨울철 관리비가 40만원 넘게 나와요. 다들 얼마나 나오시는지 궁금하고, 줄이는 팁 있으면 공유 부탁드립니다.',
    author: '추워요',
    authorInitial: '추',
    authorColor: '#06b6d4',
    createdAt: '6시간 전',
    views: 389,
    answers: 15,
    likes: 12,
    isResolved: false
  },
  {
    id: 5,
    category: '공동구매',
    title: '공구할 때 세금계산서 발행 의무인가요?',
    content:
      '동네 엄마들이랑 공구하면서 운영비 조금 받고 있는데, 이게 세금 신고 대상인지 헷갈려요. 비슷한 경험 있으신 분 답변 부탁드립니다.',
    author: '공구운영자',
    authorInitial: '공',
    authorColor: '#8b5cf6',
    createdAt: '하루 전',
    views: 234,
    answers: 7,
    likes: 9,
    isResolved: false
  },
  {
    id: 6,
    category: '재테크',
    title: 'ISA 계좌 만드는 게 이득일까요?',
    content:
      '연봉 4천 정도인 외벌이 가정인데 ISA 계좌가 절세 효과 있다는 얘기 듣고 알아보고 있어요. 우리 같은 케이스에서 실제로 얼마나 이득인지 경험 공유 부탁드려요.',
    author: '절세하고싶다',
    authorInitial: '절',
    authorColor: '#f43f5e',
    createdAt: '하루 전',
    views: 521,
    answers: 21,
    likes: 27,
    isResolved: true,
    bestAnswer: 'ISA는 3년 의무가입이지만 절세 효과 확실해요. 특히 배당주 투자하실거면 더더욱 추천드립니다.'
  },
  {
    id: 7,
    category: '살림',
    title: '세제·생활용품 정기구독 vs 마트구매 어느 게 쌀까요?',
    content:
      '쿠팡 정기구독 vs 마트 세일 노려서 사기 비교해보신 분 계실까요? 4인가족 기준으로요.',
    author: '생활달인',
    authorInitial: '생',
    authorColor: '#22c55e',
    createdAt: '2일 전',
    views: 178,
    answers: 8,
    likes: 11,
    isResolved: false
  },
  {
    id: 8,
    category: '육아 비용',
    title: '아이 학원비 한 달 평균 얼마나 쓰시나요?',
    content:
      '7세 아이 한 명인데 영어+미술+체육 하니까 한 달 60만원이 나가요. 다른 집은 어떻게 관리하시는지 너무 궁금합니다.',
    author: '교육비고민',
    authorInitial: '교',
    authorColor: '#ec4899',
    createdAt: '3일 전',
    views: 689,
    answers: 32,
    likes: 41,
    isResolved: true,
    bestAnswer: '저희는 한 학기당 최대 2개로 정해두고 분기마다 로테이션 돌려요. 평균 30만원 선에서 관리됩니다.'
  }
];

const CATEGORIES = ['전체', '재테크', '가계부', '육아 비용', '절약', '공동구매', '살림'];

const STATUS_TABS = [
  { id: 'all', label: '전체', icon: HelpCircle },
  { id: 'unsolved', label: '미해결', icon: AlertCircle },
  { id: 'resolved', label: '해결완료', icon: CheckCircle2 }
];

const SORT_TABS = [
  { id: 'latest', label: '최신순', icon: Clock },
  { id: 'answers', label: '답변많은순', icon: MessageSquare },
  { id: 'popular', label: '인기순', icon: Flame }
];

interface QnaListViewProps {
  onSelectPost: (id: number) => void;
  onWrite: () => void;
}

export const QnaListView: React.FC<QnaListViewProps> = ({ onSelectPost, onWrite }) => {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeSort, setActiveSort] = useState('latest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = QNA_POSTS.filter((p) => {
    const matchCategory = activeCategory === '전체' || p.category === activeCategory;
    const matchStatus =
      activeStatus === 'all' ||
      (activeStatus === 'unsolved' && !p.isResolved) ||
      (activeStatus === 'resolved' && p.isResolved);
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchStatus && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === 'answers') return b.answers - a.answers;
    if (activeSort === 'popular') return b.likes - a.likes;
    return b.id - a.id;
  });

  const unsolvedCount = QNA_POSTS.filter((p) => !p.isResolved).length;
  const resolvedCount = QNA_POSTS.filter((p) => p.isResolved).length;
  const resolveRate = Math.round((resolvedCount / QNA_POSTS.length) * 100);

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
              background: 'var(--purple-bg)',
              color: 'var(--purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <HelpCircle size={20} />
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
              Q&A 게시판
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              살림·재테크 궁금증을 다른 엄마들과 함께 해결해요
            </p>
          </div>
        </div>

        <button
          onClick={onWrite}
          className="header-btn-primary"
          style={{ background: 'var(--purple)' }}
        >
          <PenSquare size={16} />
          <span>질문하기</span>
        </button>
      </div>

      {/* Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="card" style={{ padding: '20px 24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--blue-bg)',
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HelpCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                전체 질문
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  marginTop: '2px'
                }}
              >
                {QNA_POSTS.length}
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    marginLeft: '4px'
                  }}
                >
                  개
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--red-bg)',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                답변 대기중
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  marginTop: '2px'
                }}
              >
                {unsolvedCount}
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    marginLeft: '4px'
                  }}
                >
                  개
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                해결률
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  marginTop: '2px'
                }}
              >
                {resolveRate}
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    marginLeft: '2px'
                  }}
                >
                  %
                </span>
              </div>
            </div>
          </div>
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
              placeholder="질문 제목, 내용으로 검색"
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="sub-tabs-container" style={{ marginBottom: 0 }}>
              {STATUS_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStatus(tab.id)}
                    className={`sub-tab-btn ${activeStatus === tab.id ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--border)'
              }}
            />

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
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            전체 <strong style={{ color: 'var(--text-primary)' }}>{sorted.length}</strong>개 질문
          </span>
        </div>
      </div>

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sorted.map((post) => (
          <button
            key={post.id}
            onClick={() => onSelectPost(post.id)}
            className="card"
            style={{
              display: 'flex',
              padding: '20px 24px',
              gap: '20px',
              alignItems: 'flex-start',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            {/* Status badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '76px',
                flexShrink: 0,
                padding: '12px 0',
                borderRight: '1px solid var(--border)'
              }}
            >
              {post.isResolved ? (
                <>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircle2 size={18} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>
                    해결완료
                  </span>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--red-bg)',
                      color: 'var(--red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <HelpCircle size={18} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--red)' }}>
                    답변대기
                  </span>
                </>
              )}
            </div>

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="group-buy-category">{post.category}</span>
                {post.isUrgent && (
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
                    급해요
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {post.createdAt}
                </span>
              </div>

              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  lineHeight: '1.4',
                  marginBottom: '8px',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                Q. {post.title}
              </h3>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '12px'
                }}
              >
                {post.content}
              </p>

              {post.bestAnswer && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '10px 12px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}
                >
                  <CheckCircle2 size={14} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#166534',
                      lineHeight: '1.5',
                      fontWeight: '500',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    <strong>채택답변</strong> · {post.bestAnswer}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: post.authorColor,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
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
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: post.answers > 0 ? 'var(--purple)' : 'var(--text-secondary)',
                      fontWeight: post.answers > 0 ? '700' : '500'
                    }}
                  >
                    <MessageSquare size={13} />
                    답변 {post.answers}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ThumbsUp size={13} />
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
