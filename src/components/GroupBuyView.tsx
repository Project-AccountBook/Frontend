import React, { useState } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Wallet, 
  Eye, 
  Heart, 
  Plus,
  Send,
  X,
  CheckCircle2
} from 'lucide-react';

const formatKRW = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

const getProgressBarColor = (statusType: 'blue' | 'red' | 'grey') => {
  if (statusType === 'blue') return 'var(--blue)';
  if (statusType === 'red') return 'var(--red)';
  return '#cbd5e1';
};

interface GroupBuyItem {
  id: number;
  category: string;
  status: string;
  statusType: 'blue' | 'red' | 'grey';
  title: string;
  progress: number;
  currentParticipants: number;
  targetParticipants: number;
  price: number;
  views: number;
  bookmarks: number;
  creator: string;
  creatorTemp: string;
  distance: string;
  description: string;
  deadline: string;
  imageColor: string;
}

interface Comment {
  id: number;
  sender: string;
  text: string;
  date: string;
}

export const GroupBuyView: React.FC = () => {
  // Mock Data
  const [items, setItems] = useState<GroupBuyItem[]>([
    {
      id: 1,
      category: '생활용품',
      status: '모집중 (D-2)',
      statusType: 'blue',
      title: '친환경 세탁세제 대용량 공구',
      progress: 125,
      currentParticipants: 25,
      targetParticipants: 20,
      price: 15000,
      views: 142,
      bookmarks: 12,
      creator: '서교동 썬더맘',
      creatorTemp: '37.8℃',
      distance: '0.5km',
      description: '유기농 식물성 성분으로 만든 고농축 친환경 세탁 세제입니다. 대용량 3L 제품이며 배송비가 비싸서 동네 분들과 함께 저렴하게 구매하고자 공구를 모집합니다. 퇴근 시간 서교 초등학교 정문 앞에서 전달 가능해요!',
      deadline: '2026-06-24 18:00',
      imageColor: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
    },
    {
      id: 2,
      category: '식품',
      status: '마감임박 (D-1)',
      statusType: 'red',
      title: '제주 유기농 흑돼지 삼겹살 1kg',
      progress: 85,
      currentParticipants: 17,
      targetParticipants: 20,
      price: 28000,
      views: 241,
      bookmarks: 24,
      creator: '망원동 육식주의자',
      creatorTemp: '39.2℃',
      distance: '0.8km',
      description: '제주도 농장에서 직송하는 무항생제 명품 흑돼지 삼겹살 1kg입니다. 진공 포장 후 아이스박스에 꼼꼼히 배송됩니다. 양이 1인가구가 먹기에는 너무 많아 분할 구매하실 이웃을 구해요. 수령 시간 조율 가능합니다!',
      deadline: '2026-06-23 20:00',
      imageColor: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)'
    },
    {
      id: 3,
      category: '육아용품',
      status: '모집중 (D-4)',
      statusType: 'blue',
      title: '프리미엄 아기 물티슈 10팩 박스',
      progress: 60,
      currentParticipants: 6,
      targetParticipants: 10,
      price: 19800,
      views: 98,
      bookmarks: 8,
      creator: '서교동 두아이아빠',
      creatorTemp: '36.5℃',
      distance: '1.2km',
      description: '피부 저극 없는 유기농 엠보싱 물티슈 10팩들이 한 박스 공구 진행합니다. 박스 크기가 커서 택배비 절약용으로 공구 올려봐요. 합정역 3번출구 근처에서 전달해 드립니다.',
      deadline: '2026-06-26 12:00',
      imageColor: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
    },
    {
      id: 4,
      category: '가전',
      status: '모집중 (D-7)',
      statusType: 'blue',
      title: '가성비 무선 에어 서큘레이터',
      progress: 40,
      currentParticipants: 2,
      targetParticipants: 5,
      price: 49000,
      views: 112,
      bookmarks: 15,
      creator: '홍대입구 싱글남',
      creatorTemp: '37.0℃',
      distance: '1.4km',
      description: '소음이 적고 풍량이 강해 서브 에어컨 대용으로 좋은 무선 서큘레이터입니다. 공동구매 5대 이상 묶음 시 대당 4.9만원 특가 구매 가능하다고 하여 멤버 모집합니다. 박스째 미개봉 상태로 드립니다.',
      deadline: '2026-06-29 18:00',
      imageColor: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
    },
    {
      id: 5,
      category: '생필품',
      status: '진행완료',
      statusType: 'grey',
      title: '친환경 대나무 화장지 30롤',
      progress: 100,
      currentParticipants: 15,
      targetParticipants: 15,
      price: 12000,
      views: 185,
      bookmarks: 9,
      creator: '합정동 환경지킴이',
      creatorTemp: '38.0℃',
      distance: '2.1km',
      description: '먼지가 나지 않는 100% 천연 대나무 3겹 데코 화장지 30롤입니다. 모집 인원이 모두 찬 상태이며, 현재 제품 주문이 들어가 다음 주 월요일부터 순차 양도 예정입니다.',
      deadline: '2026-06-20 15:00',
      imageColor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
    }
  ]);

  // States
  const [userBudget, setUserBudget] = useState(3140894);
  const [userBookmarks, setUserBookmarks] = useState<number[]>([2]); // Default bookmark Item 2
  const [participatedItems, setParticipatedItems] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('latest');
  const [distanceLimit, setDistanceLimit] = useState('1.5km');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showParticipatedOnly, setShowParticipatedOnly] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<GroupBuyItem | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Suggestion modal
  const [formType, setFormType] = useState<'request' | 'suggest'>('request');
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Comment Board States
  const [comments, setComments] = useState<Record<number, Comment[]>>({
    2: [
      { id: 1, sender: '서교동 썬더맘', text: '삼겹살 부위 비율이 어떻게 되나요? 살코기가 많은 편인가요?', date: '3시간 전' },
      { id: 2, sender: '망원동 육식주의자', text: '껍질 제거된 오리지널 삼겹살이고, 비계와 살코기 비율이 3:7 정도로 적당히 고소한 부위들로 선별 발송됩니다!', date: '2시간 전' },
      { id: 3, sender: '합정동 환경지킴이', text: '저 퇴근이 7시 반쯤인데, 수령 시간을 그때 맞춰주실 수 있을까요?', date: '1시간 전' },
      { id: 4, sender: '망원동 육식주의자', text: '네, 아이스팩 동봉 상태라 8시 전까지만 수령해 가시면 문제 없습니다!', date: '30분 전' }
    ]
  });
  const [newCommentText, setNewCommentText] = useState('');

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Toggle Bookmark
  const toggleBookmark = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (userBookmarks.includes(id)) {
      setUserBookmarks(userBookmarks.filter(bId => bId !== id));
      setItems(items.map(item => item.id === id ? { ...item, bookmarks: item.bookmarks - 1 } : item));
      triggerToast('관심 목록에서 해제되었습니다.');
    } else {
      setUserBookmarks([...userBookmarks, id]);
      setItems(items.map(item => item.id === id ? { ...item, bookmarks: item.bookmarks + 1 } : item));
      triggerToast('관심 목록에 등록되었습니다!');
    }
  };

  // Submit suggestion/request
  const handleSubmitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPrice) {
      alert('상품명과 희망 가격을 입력해 주세요.');
      return;
    }
    setShowRequestModal(false);
    triggerToast(
      formType === 'request' 
        ? '공구 신청 접수가 완료되었습니다! 관리자 검토 후 연락드리겠습니다.'
        : '공구 제보가 성공적으로 접수되었습니다. 개설 시 알림을 보내드립니다!'
    );
    // Reset forms
    setFormTitle('');
    setFormPrice('');
    setFormLink('');
    setFormDesc('');
  };

  // Add Comment
  const handleAddComment = () => {
    if (!newCommentText.trim() || !selectedItem) return;

    const newItemComment: Comment = {
      id: Date.now(),
      sender: '나 (가계부 회원)',
      text: newCommentText,
      date: '방금 전'
    };

    setComments({
      ...comments,
      [selectedItem.id]: [...(comments[selectedItem.id] || []), newItemComment]
    });
    setNewCommentText('');
  };

  // Click Participate
  const handleParticipateClick = () => {
    if (!selectedItem) return;
    if (participatedItems.includes(selectedItem.id)) {
      triggerToast('이미 신청을 완료한 공동구매입니다.');
      return;
    }
    setShowConfirmation(true);
  };

  // Confirm Participation & Account budget deduct
  const handleConfirmParticipation = () => {
    if (!selectedItem) return;

    if (userBudget < selectedItem.price) {
      alert(`경고: 가계부 예산 잔액이 부족합니다!\n현재 잔액: ${formatKRW(userBudget)}원\n필요 금액: ${formatKRW(selectedItem.price)}원`);
      setShowConfirmation(false);
      return;
    }

    // Deduct budget
    setUserBudget(userBudget - selectedItem.price);
    setParticipatedItems([...participatedItems, selectedItem.id]);
    
    // Update participant counts
    setItems(items.map(item => {
      if (item.id === selectedItem.id) {
        const nextParticipants = item.currentParticipants + 1;
        const nextProgress = Math.round((nextParticipants / item.targetParticipants) * 100);
        return {
          ...item,
          currentParticipants: nextParticipants,
          progress: nextProgress
        };
      }
      return item;
    }));

    setShowConfirmation(false);
    setSelectedItem(null);
    triggerToast('공동구매 신청 완료! 가계부 지출 내역에 자동으로 기입됩니다.');
  };

  // Filter logic
  const filteredItems = items
    .filter(item => {
      // Category filter
      if (activeCategory !== '전체' && item.category !== activeCategory) return false;
      
      // Location certified radius filter
      const distanceVal = parseFloat(item.distance);
      const limitVal = parseFloat(distanceLimit);
      if (distanceVal > limitVal) return false;

      // Bookmark toggle
      if (showBookmarksOnly && !userBookmarks.includes(item.id)) return false;

      // Participated toggle
      if (showParticipatedOnly && !participatedItems.includes(item.id)) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort logic
      if (sortBy === 'latest') return b.id - a.id;
      if (sortBy === 'deadline') {
        if (a.statusType === 'red') return -1;
        if (b.statusType === 'red') return 1;
        return a.id - b.id;
      }
      if (sortBy === 'progress') return b.progress - a.progress;
      return 0;
    });

  return (
    <div className="groupbuy-container fade-in">
      
      {/* 1. Address Link & Budget Link bar */}
      <div className="groupbuy-budget-link-card">
        <div className="groupbuy-budget-left">
          <div className="groupbuy-budget-title">
            <Wallet size={16} />
            <span>내 가계부 예산 연동 활성화됨</span>
          </div>
          <div className="groupbuy-budget-val">
            예산 잔액: {formatKRW(userBudget)}<span>원</span>
          </div>
        </div>
        <div className="groupbuy-budget-right">
          <div className="groupbuy-location-badge">
            <MapPin size={14} />
            <span>서울시 마포구 서교동 (인증 1.5km 반경)</span>
          </div>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>최종 결제 시 가계부 지출 자동 기입</span>
        </div>
      </div>

      {/* 2. Filter & Sort Row */}
      <div className="groupbuy-filter-row">
        <div className="dashboard-view-tabs" style={{ margin: 0 }}>
          {['전체', '식품', '생활용품', '육아용품', '가전'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`dashboard-tab-btn ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="groupbuy-right-filters">
          {/* Sorting */}
          <select 
            className="groupbuy-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">최신순</option>
            <option value="deadline">마감임박순</option>
            <option value="progress">달성률순</option>
          </select>

          {/* certified radius */}
          <select
            className="groupbuy-select"
            value={distanceLimit}
            onChange={(e) => setDistanceLimit(e.target.value)}
          >
            <option value="1.5km">반경 1.5km 내</option>
            <option value="3.0km">반경 3.0km 내</option>
            <option value="5.0km">반경 5.0km 내</option>
          </select>

          {/* bookmark toggle */}
          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`groupbuy-toggle-btn ${showBookmarksOnly ? 'active' : ''}`}
          >
            찜 목록
          </button>

          {/* participating toggle */}
          <button
            onClick={() => setShowParticipatedOnly(!showParticipatedOnly)}
            className={`groupbuy-toggle-btn ${showParticipatedOnly ? 'active' : ''}`}
          >
            신청 내역
          </button>

          {/* request modal btn */}
          <button
            onClick={() => {
              setFormType('request');
              setShowRequestModal(true);
            }}
            className="groupbuy-action-btn"
          >
            <Plus size={16} />
            <span>신청 / 제보</span>
          </button>
        </div>
      </div>

      {/* 3. Group Buy listing grid */}
      <div className="group-buy-grid" style={{ marginTop: 0 }}>
        {filteredItems.map((item) => {
          const isBookmarked = userBookmarks.includes(item.id);
          const isParticipated = participatedItems.includes(item.id);

          return (
            <div 
              key={item.id} 
              className="group-buy-card"
              onClick={() => {
                // Increment views mock count
                setItems(items.map(i => i.id === item.id ? { ...i, views: i.views + 1 } : i));
                setSelectedItem({ ...item, views: item.views + 1 });
              }}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {isParticipated && (
                <div style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  background: 'var(--green)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 2
                }}>
                  <CheckCircle2 size={12} />
                  신청완료
                </div>
              )}

              <div className="group-buy-header">
                <span className="group-buy-category">{item.category}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`group-buy-status-badge ${item.statusType}`}>
                    {item.status}
                  </span>
                  <button 
                    onClick={(e) => toggleBookmark(item.id, e)}
                    style={{ color: isBookmarked ? 'var(--red)' : 'var(--text-muted)' }}
                  >
                    <Heart size={16} fill={isBookmarked ? 'var(--red)' : 'transparent'} />
                  </button>
                </div>
              </div>

              <div className="group-buy-title" style={{ fontSize: '16px' }}>{item.title}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  {item.creator} • {item.distance}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Eye size={12} /> {item.views}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Heart size={12} /> {item.bookmarks}</span>
                </span>
              </div>

              <div>
                <div className="group-buy-progress-row">
                  <span>참여 인원 ({item.currentParticipants}/{item.targetParticipants}명)</span>
                  <span className="percent">{item.progress}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, item.progress)}%`, 
                      backgroundColor: getProgressBarColor(item.statusType) 
                    }}
                  ></div>
                </div>
              </div>

              <div className="group-buy-price-row">
                <span className="group-buy-price-lbl">공구 가격</span>
                <div className="group-buy-price-val">
                  {formatKRW(item.price)}
                  <span>원</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            검색 결과 조건에 맞는 공동구매가 없습니다.
          </div>
        )}
      </div>

      {/* 4. DETAIL MODAL DIALOG */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">공동구매 상세 정보</span>
              <X size={20} className="modal-close-btn" onClick={() => setSelectedItem(null)} />
            </div>
            
            <div className="modal-body">
              <div className="detail-modal-layout">
                {/* Left Col: Visuals & details */}
                <div>
                  <div className="detail-img-box" style={{ background: selectedItem.imageColor }}>
                    <ShoppingBag size={48} />
                    <span style={{ fontWeight: '700', fontSize: '16px' }}>{selectedItem.title}</span>
                  </div>

                  <div className="detail-creator-row">
                    <div className="detail-creator-info">
                      <div className="detail-creator-avatar">
                        {selectedItem.creator.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700' }}>{selectedItem.creator}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>이웃 인증 완료 • {selectedItem.distance}</div>
                      </div>
                    </div>
                    <span className="manner-temp">매너온도 {selectedItem.creatorTemp}</span>
                  </div>

                  <div className="detail-stat-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={14} /> 조회수 {selectedItem.views}회</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Heart size={14} /> 관심 {selectedItem.bookmarks}명</span>
                  </div>

                  <p className="detail-content-text">{selectedItem.description}</p>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    <strong>수령 장소/시간 안내:</strong> 개설자가 설정한 조율 시간 및 아파트 단지 입구 근처 놀이터에서 직접 인도가 원칙입니다.
                  </div>
                </div>

                {/* Right Col: Progress, Pricing & Q&A comments */}
                <div className="detail-right-col">
                  {/* Price */}
                  <div className="detail-pricing-box">
                    <span className="detail-price-title">공동구매 참가 가격</span>
                    <div className="detail-price-main">
                      {formatKRW(selectedItem.price)}<span>원</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                      * 시중가 대비 약 25%~30% 할인된 특가입니다.
                    </span>
                  </div>

                  {/* Progress bar info */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      <span>모집 현황 ({selectedItem.currentParticipants}명 / {selectedItem.targetParticipants}명)</span>
                      <span style={{ color: 'var(--blue)', fontWeight: '700' }}>{selectedItem.progress}%</span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${Math.min(100, selectedItem.progress)}%`, 
                          backgroundColor: getProgressBarColor(selectedItem.statusType) 
                        }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                      마감 시각: {selectedItem.deadline}
                    </span>
                  </div>

                  {/* Comments section */}
                  <div>
                    <div className="comment-section-title">질문 및 수령 조율 (댓글)</div>
                    <div className="comments-list">
                      {(comments[selectedItem.id] || []).map((comm) => (
                        <div key={comm.id} className="comment-item">
                          <div className="comment-meta">
                            <span>{comm.sender}</span>
                            <span className="date">{comm.date}</span>
                          </div>
                          <div className="comment-text">{comm.text}</div>
                        </div>
                      ))}
                      {(comments[selectedItem.id] || []).length === 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                          등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!
                        </div>
                      )}
                    </div>
                    <div className="comment-input-row">
                      <input 
                        type="text" 
                        placeholder="유통기한, 수령 일정 등을 이웃과 문의해 보세요."
                        className="comment-input"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <button className="comment-btn" onClick={handleAddComment}>
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Participate CTA with integrated Budget Link check */}
                  {participatedItems.includes(selectedItem.id) ? (
                    <button className="detail-btn-participate completed" disabled>
                      <span>신청 완료한 공동구매</span>
                    </button>
                  ) : selectedItem.statusType === 'grey' ? (
                    <button className="detail-btn-participate completed" disabled>
                      <span>마감된 공동구매</span>
                    </button>
                  ) : (
                    <button 
                      className="detail-btn-participate"
                      onClick={handleParticipateClick}
                    >
                      <ShoppingBag size={18} />
                      <span>이웃과 함께 공구 참여하기</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. BUDGET VERIFICATION POPUP/CONFIRMATION */}
      {showConfirmation && selectedItem && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content small">
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} />
                <span>가계부 예산 연동 확인</span>
              </span>
              <X size={18} className="modal-close-btn" onClick={() => setShowConfirmation(false)} />
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--blue-bg)',
                color: 'var(--blue)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>공동구매 신청을 완료할까요?</h3>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'left', fontSize: '13px', margin: '16px 0', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>참여 금액:</span>
                  <span style={{ fontWeight: '700' }}>{formatKRW(selectedItem.price)}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>현재 예산 잔액:</span>
                  <span style={{ fontWeight: '700' }}>{formatKRW(userBudget)}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>참여 후 예산 잔액:</span>
                  <span style={{ fontWeight: '700', color: 'var(--blue)' }}>{formatKRW(userBudget - selectedItem.price)}원</span>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                신청이 즉시 확정되며, 가계부 예산에서 가출금 됩니다. 공구 최종 모집 완료 시 지출 내역에 자동 기입됩니다.
              </p>

              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  style={{
                    background: '#f1f5f9',
                    color: 'var(--text-primary)',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  취소
                </button>
                <button 
                  onClick={handleConfirmParticipation}
                  style={{
                    background: 'var(--blue)',
                    color: 'white',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  신청 확정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUGGEST / REQUEST MODAL */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">공구 신청 및 제보하기</span>
              <X size={20} className="modal-close-btn" onClick={() => setShowRequestModal(false)} />
            </div>

            <form onSubmit={handleSubmitSuggestion}>
              <div className="modal-body">
                {/* Form Tabs */}
                <div className="sub-tabs-container" style={{ width: '100%', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setFormType('request')}
                    className={`sub-tab-btn ${formType === 'request' ? 'active' : ''}`}
                    style={{ flex: 1 }}
                  >
                    관리자에게 공구 신청
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('suggest')}
                    className={`sub-tab-btn ${formType === 'suggest' ? 'active' : ''}`}
                    style={{ flex: 1 }}
                  >
                    이웃 추천/제보하기
                  </button>
                </div>

                <div className="form-group">
                  <label>상품명</label>
                  <input 
                    type="text" 
                    placeholder="예: 친환경 화장지 30롤, 한라봉 5kg 박스"
                    className="form-input"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>공구 희망 가격</label>
                  <input 
                    type="number" 
                    placeholder="예: 15000 (원 단위 입력)"
                    className="form-input"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>참고 온라인 링크 (선택)</label>
                  <input 
                    type="url" 
                    placeholder="쇼핑몰 링크가 있다면 첨부해 주세요."
                    className="form-input"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>상세 신청 / 제보 내용</label>
                  <textarea 
                    placeholder="제안 사유, 필요한 수량, 동네 배부 장소 제안 등 자유롭게 기입해 주세요."
                    className="form-textarea"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {formType === 'request' 
                    ? '* 관리자가 상품 도매 단가 및 동네 수요를 예측하여 검토 후 연락드립니다.'
                    : '* 이웃 추천/제보는 인근 지역의 활발한 개설자가 검토 후 직접 공구를 열 수 있도록 매칭됩니다.'
                  }
                </p>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowRequestModal(false)}
                    style={{
                      background: '#f1f5f9',
                      color: 'var(--text-primary)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    style={{
                      background: 'var(--navy)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    작성 완료
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="toast-overlay">
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
