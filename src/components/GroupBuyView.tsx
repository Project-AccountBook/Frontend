import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  ShoppingBag,
  MapPin,
  Wallet,
  Eye,
  Heart,
  PenSquare,
  Send,
  X,
  CheckCircle2,
  Bell,
  BellOff,
  Loader2,
  AlertCircle,
  Clock,
  TrendingUp,
  User,
  Plus,
  Lock,
} from 'lucide-react';
import {
  interestCategoryApi,
  type GroupPurchaseCategoryResponse,
  type InterestCategoryResponse,
} from '../api';
import { authFetch } from '../api/client';
import { useBackHandler } from '../lib/nativeBack';

const formatKRW = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

const getProgressBarColor = (statusType: 'blue' | 'red' | 'grey') => {
  if (statusType === 'blue') return 'var(--blue)';
  if (statusType === 'red') return 'var(--red)';
  return '#cbd5e1';
};

const SORT_TABS = [
  { id: 'latest', label: '최신순', icon: Clock },
  { id: 'deadline', label: '마감임박', icon: AlertCircle },
  { id: 'progress', label: '달성률', icon: TrendingUp },
];

const DISTANCE_TABS = [
  { id: '1.5km', label: '1.5km' },
  { id: '3.0km', label: '3km' },
  { id: '5.0km', label: '5km' },
  { id: '전체', label: '전체' },
];

interface GroupBuyItem {
  id: number;
  category: string;
  status: string;
  statusType: 'blue' | 'red' | 'grey';
  title: string;
  progress: number;
  currentParticipants: number;
  minParticipants: number;
  targetParticipants: number;
  price: number;
  views: number;
  bookmarks: number;
  creatorId: number;
  creator: string;
  creatorTemp: string;
  distance: string;
  description: string;
  deadline: string;
  imageColor: string;
  imageUrl?: string;
  pickupLocation?: string;
}

interface Account {
  id: number;
  accountName: string;
  currentBalance: number;
  kind?: 'ASSET' | 'CREDIT_CARD' | 'LOAN' | null;
}

interface Comment {
  id: number;
  sender: string;
  text: string;
  date: string;
  isSecret?: boolean;
  authorRole?: string;
}


export const GroupBuyView: React.FC<{
  initialGroupPurchaseId?: number | null;
  onInitialGroupPurchaseHandled?: () => void;
}> = ({ initialGroupPurchaseId = null, onInitialGroupPurchaseHandled }) => {
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await authFetch(url, { ...options, headers });
    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `HTTP error! status: ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.message || errJson.error || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return response.json();
  };

  // States
  const [items, setItems] = useState<GroupBuyItem[]>([]);

  const [categories, setCategories] = useState<GroupPurchaseCategoryResponse[]>([]);
  const [userLocationText, setUserLocationText] = useState('위치 정보 불러오는 중...');
  const [userBudget, setUserBudget] = useState(0);
  const [userBookmarks, setUserBookmarks] = useState<number[]>([]);
  const [participatedItems, setParticipatedItems] = useState<number[]>([]);
  const [interestCategories, setInterestCategories] = useState<InterestCategoryResponse[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [subscribingCategory, setSubscribingCategory] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [distanceLimit, setDistanceLimit] = useState('1.5km');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<GroupBuyItem | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Report States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Form states for Suggestion modal
  const [formType, setFormType] = useState<'request' | 'suggest'>('request');
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Group Buy Create Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    categoryId: '',
    content: '',
    price: '',
    minParticipants: '1',
    maxParticipants: '10',
    deadline: '',
    pickupLocation: '',
    customPickupLocation: '',
    imageUrl: '',
    accountId: ''
  });

  const [isUploading, setIsUploading] = useState(false);

  const closeTopOverlay = useCallback((): boolean => {
    if (showReportModal) {
      setShowReportModal(false);
      return true;
    }
    if (showLeaveConfirmation) {
      setShowLeaveConfirmation(false);
      return true;
    }
    if (showConfirmation) {
      setShowConfirmation(false);
      return true;
    }
    if (showRequestModal) {
      setShowRequestModal(false);
      return true;
    }
    if (isCreateModalOpen) {
      setIsCreateModalOpen(false);
      return true;
    }
    if (selectedItem) {
      setSelectedItem(null);
      return true;
    }
    return false;
  }, [
    showReportModal,
    showLeaveConfirmation,
    showConfirmation,
    showRequestModal,
    isCreateModalOpen,
    selectedItem,
  ]);

  useBackHandler(
    Boolean(
      selectedItem
      || showRequestModal
      || showConfirmation
      || showLeaveConfirmation
      || isCreateModalOpen
      || showReportModal,
    ),
    closeTopOverlay,
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetchWithAuth('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.url) {
        setCreateForm(prev => ({...prev, imageUrl: res.url}));
        triggerToast('이미지가 성공적으로 업로드되었습니다.');
      }
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      alert(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // Comment Board States
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentSecret, setNewCommentSecret] = useState(false);

  const activeCategoryName = activeCategoryId
    ? categories.find((c) => c.id === activeCategoryId)?.name ?? null
    : null;

  const subscribedInterest = activeCategoryId
    ? interestCategories.find((ic) => ic.categoryId === activeCategoryId)
    : null;

  const handleToggleCategoryNotification = async () => {
    if (!activeCategoryId || subscribingCategory) return;

    setSubscribingCategory(true);
    try {
      if (subscribedInterest) {
        const result = await interestCategoryApi.delete(subscribedInterest.id);
        if (result.ok) {
          setInterestCategories((prev) => prev.filter((ic) => ic.id !== subscribedInterest.id));
          triggerToast(`"${subscribedInterest.categoryName}" 카테고리 알림을 취소했습니다.`);
        } else {
          triggerToast(result.error ?? '관심 카테고리 해제에 실패했습니다.');
        }
      } else {
        const result = await interestCategoryApi.register(activeCategoryId);
        if (result.ok && result.data) {
          setInterestCategories((prev) => [...prev, result.data!]);
          triggerToast(`"${result.data.categoryName}" 카테고리 알림을 등록했습니다.`);
        } else {
          triggerToast(result.error ?? '관심 카테고리 등록에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error('Failed to toggle category notification:', err);
      triggerToast('관심 카테고리 처리 중 오류가 발생했습니다.');
    } finally {
      setSubscribingCategory(false);
    }
  };


  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const catRes = await fetchWithAuth('/api/v1/group-purchase-categories');
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }

      try {
        const interestRes = await fetchWithAuth('/api/v1/interest-categories');
        if (interestRes.success && interestRes.data) {
          setInterestCategories(interestRes.data);
        }
      } catch (err) {
        console.error("Failed to load interest categories:", err);
      }

      try {
        const profileRes = await fetchWithAuth('/api/v1/users/me');
        if (profileRes.success && profileRes.data) {
          setUserLocationText(profileRes.data.address || '서울시 마포구 서교동');
          setCurrentUserId(profileRes.data.id || null);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }

      fetchBudget();
      fetchUserWishedAndJoinedIds();
    };

    loadInitialData();
  }, []);

  const fetchBudget = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}-${month}`;
      const budgetRes = await fetchWithAuth(`/api/v1/budget/${yearMonth}/summary`);
      if (budgetRes.success && budgetRes.data) {
        setUserBudget(Number(budgetRes.data.totalRemainingBudget));
      }
    } catch (err) {
      console.error("Failed to load budget:", err);
    }
  };

  const fetchUserWishedAndJoinedIds = async () => {
    try {
      const wishedRes = await fetchWithAuth('/api/v1/group-purchases/wished-ids');
      if (wishedRes.success && wishedRes.data) {
        setUserBookmarks(wishedRes.data);
      }
      const joinedRes = await fetchWithAuth('/api/v1/group-purchases/joined-ids');
      if (joinedRes.success && joinedRes.data) {
        setParticipatedItems(joinedRes.data);
      }
    } catch (err) {
      console.error("Failed to load wished/joined IDs:", err);
    }
  };

  const mapBackendItemToFrontend = (bp: any, catList: { id: number; name: string }[]): GroupBuyItem => {
    const categoryName = catList.find(c => c.id === bp.categoryId)?.name ?? '';
    
    let statusText = '모집중';
    let statusType: 'blue' | 'red' | 'grey' = 'blue';
    if (bp.status === 'SUCCESS') {
      statusText = '모집 성공';
      statusType = 'blue';
    } else if (bp.status === 'FAILED') {
      statusText = '무산됨';
      statusType = 'grey';
    } else if (bp.status === 'CLOSED') {
      statusText = '거래 종료';
      statusType = 'grey';
    } else if (bp.status === 'BLIND') {
      statusText = '블라인드';
      statusType = 'grey';
    } else if (bp.status === 'RECRUITING') {
      const deadlineDate = new Date(bp.deadline);
      const diffTime = deadlineDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffTime < 0) {
        statusText = '기한 만료';
        statusType = 'grey';
      } else if (diffDays <= 1) {
        statusText = '마감임박';
        statusType = 'red';
      } else if (diffDays <= 3) {
        statusText = `마감임박 (D-${diffDays})`;
        statusType = 'red';
      } else {
        statusText = `모집중 (D-${diffDays})`;
        statusType = 'blue';
      }
    }

    const imageColorMap: Record<string, string> = {
      '식품': 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      '생활용품': 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      '육아용품': 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      '가전': 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    };
    const imageColor = imageColorMap[categoryName] || 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
    const deadlineStr = bp.deadline ? bp.deadline.replace('T', ' ').substring(0, 16) : '';

    return {
      id: bp.id,
      category: categoryName,
      status: statusText,
      statusType: statusType,
      title: bp.title,
      progress: Math.round(bp.achievementRate),
      currentParticipants: bp.currentParticipants,
      minParticipants: bp.minParticipants,
      targetParticipants: bp.maxParticipants,
      price: bp.price,
      views: bp.viewCount,
      bookmarks: 0,
      creatorId: bp.creatorId,
      creator: bp.creatorNickname || '이웃',
      creatorTemp: '36.5℃',
      distance: '단지 내',
      description: bp.content,
      deadline: deadlineStr,
      imageColor: imageColor,
      imageUrl: bp.imageUrl,
      pickupLocation: bp.pickupLocation
    };
  };

  const fetchGroupPurchases = async () => {
    try {
      let url = '/api/v1/group-purchases';
      const params = new URLSearchParams();
      
      if (activeCategoryId !== null) {
        params.append('categoryId', String(activeCategoryId));
      }

      if (distanceLimit !== '전체') {
        params.append('nearMe', 'true');
      }

      params.append('sortBy', sortBy);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetchWithAuth(url);
      if (res.success && res.data) {
        const mapped = res.data.map((item: any) => mapBackendItemToFrontend(item, categories));
        setItems(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch group purchases:", err);
    }
  };

  useEffect(() => {
    if (categories.length > 0) {
      fetchGroupPurchases();
    }
  }, [activeCategoryId, sortBy, distanceLimit, categories]);

  const handleItemClick = async (item: GroupBuyItem) => {
    try {
      const res = await fetchWithAuth(`/api/v1/group-purchases/${item.id}`);
      if (res.success && res.data) {
        const updated = mapBackendItemToFrontend(res.data, categories);
        setSelectedItem(updated);
        fetchGroupPurchases();
      }
    } catch (err) {
      console.error("Failed to fetch single item:", err);
      setSelectedItem(item);
    }
    fetchComments(item.id);
  };

  useEffect(() => {
    if (!initialGroupPurchaseId || categories.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetchWithAuth(`/api/v1/group-purchases/${initialGroupPurchaseId}`);
        if (cancelled) return;

        if (res.success && res.data) {
          const updated = mapBackendItemToFrontend(res.data, categories);
          setSelectedItem(updated);
          if (res.data.categoryId) {
            setActiveCategoryId(res.data.categoryId);
          }
          void fetchComments(initialGroupPurchaseId);
        }
      } catch (err) {
        console.error('Failed to open group purchase from notification:', err);
      } finally {
        if (!cancelled) {
          onInitialGroupPurchaseHandled?.();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialGroupPurchaseId, categories, onInitialGroupPurchaseHandled]);

  const fetchComments = async (postId: number) => {
    try {
      const res = await fetchWithAuth(`/api/v1/comments/${postId}?referenceType=GROUPPURCHASE`);
      if (res.success && res.data) {
        const mappedComments = res.data.map((comm: any) => {
          const dateVal = new Date(comm.createdAt);
          const diffMs = new Date().getTime() - dateVal.getTime();
          const diffMin = Math.floor(diffMs / (1000 * 60));
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          let dateStr = '방금 전';
          if (diffHrs > 24) {
            dateStr = dateVal.toLocaleDateString();
          } else if (diffHrs > 0) {
            dateStr = `${diffHrs}시간 전`;
          } else if (diffMin > 0) {
            dateStr = `${diffMin}분 전`;
          }
          
          return {
            id: comm.id,
            sender: comm.authorNickname || comm.userNickname || '이웃',
            text: comm.content,
            date: dateStr,
            isSecret: comm.isSecret,
            authorRole: comm.authorRole
          };
        });
        setComments(prev => ({ ...prev, [postId]: mappedComments }));
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Toggle Bookmark
  const toggleBookmark = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetchWithAuth(`/api/v1/group-purchases/${id}/wish`, {
        method: 'POST'
      });
      if (res.success) {
        const isBookmarkedNow = res.data;
        if (isBookmarkedNow) {
          setUserBookmarks(prev => [...prev, id]);
          triggerToast('관심 목록에 등록되었습니다!');
        } else {
          setUserBookmarks(prev => prev.filter(bId => bId !== id));
          triggerToast('관심 목록에서 해제되었습니다.');
        }
        fetchUserWishedAndJoinedIds();
      }
    } catch (err: any) {
      console.error("Failed to toggle wish:", err);
      alert(err.message || '찜하기 토글에 실패했습니다.');
    }
  };

  // Submit suggestion/request
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPrice) {
      alert('상품명과 희망 가격을 입력해 주세요.');
      return;
    }

    try {
      const res = await fetchWithAuth('/api/v1/group-purchase-applications', {
        method: 'POST',
        body: JSON.stringify({
          title: formTitle,
          content: formDesc || `${formType === 'request' ? '공구 신청' : '이웃 추천'} - ${formTitle}`,
          productUrl: formLink || null,
          expectedPrice: Number(formPrice)
        })
      });
      
      if (res.success) {
        setShowRequestModal(false);
        triggerToast(
          formType === 'request' 
            ? '공구 신청 접수가 완료되었습니다! 관리자 검토 후 연락드리겠습니다.'
            : '공구 제보가 성공적으로 접수되었습니다. 개설 시 알림을 보내드립니다!'
        );
        setFormTitle('');
        setFormPrice('');
        setFormLink('');
        setFormDesc('');
      }
    } catch (err: any) {
      console.error("Failed to submit suggestion:", err);
      alert(err.message || '신청/제보 등록에 실패했습니다.');
    }
  };

  // Handle Create Submit
  const fetchAccountsForCreate = async () => {
    try {
      const res = await fetchWithAuth('/api/v1/account');
      const eligibleAccounts = (res as Account[]).filter((account) => (account.kind ?? 'ASSET') !== 'LOAN');
      setUserAccounts(eligibleAccounts);
      if (eligibleAccounts.length > 0) {
        setCreateForm(prev => ({ ...prev, accountId: String(eligibleAccounts[0].id) }));
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchAccountsForCreate();
    }
  }, [isCreateModalOpen]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPickupLocation = createForm.pickupLocation === '기타 (직접 입력)' ? createForm.customPickupLocation : createForm.pickupLocation;
    
    if (!createForm.title || !createForm.categoryId || !createForm.content || !createForm.price || !createForm.deadline || !finalPickupLocation) {
      alert('필수 입력 항목을 모두 채워주세요.');
      return;
    }

    try {
      // Ensure deadline has seconds attached if needed, datetime-local provides YYYY-MM-DDThh:mm
      const formattedDeadline = createForm.deadline.length === 16 ? createForm.deadline + ':00' : createForm.deadline;
      
      const payload = {
        title: createForm.title,
        categoryId: Number(createForm.categoryId),
        content: createForm.content,
        price: Number(createForm.price),
        minParticipants: Number(createForm.minParticipants),
        maxParticipants: Number(createForm.maxParticipants),
        deadline: formattedDeadline,
        pickupLocation: finalPickupLocation,
        accountId: Number(createForm.accountId),
        imageUrl: createForm.imageUrl
      };

      const res = await fetchWithAuth('/api/v1/group-purchases', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.success) {
        setIsCreateModalOpen(false);
        triggerToast('공동구매 글이 성공적으로 등록되었습니다!');
        fetchGroupPurchases(); // refresh list
        setCreateForm({
          title: '', categoryId: '', content: '', price: '', minParticipants: '1', maxParticipants: '10', deadline: '', pickupLocation: '', customPickupLocation: '', imageUrl: '',
    accountId: ''
        });
      }
    } catch (err: any) {
      console.error("Failed to create group purchase:", err);
      alert(err.message || '글 등록에 실패했습니다.');
    }
  };

  // Add Comment
  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedItem) return;

    try {
      const res = await fetchWithAuth(`/api/v1/comments/${selectedItem.id}`, {
        method: 'POST',
        body: JSON.stringify({
          referenceType: 'GROUPPURCHASE',
          content: newCommentText,
          isSecret: newCommentSecret
        })
      });
      if (res.success) {
        setNewCommentText('');
        fetchComments(selectedItem.id);
        triggerToast('댓글이 성공적으로 등록되었습니다.');
      }
    } catch (err: any) {
      console.error("Failed to add comment:", err);
      alert(err.message || '댓글 등록에 실패했습니다.');
    }
  };

  // Click Participate
  const handleParticipateClick = async () => {
    if (!selectedItem) return;
    if (participatedItems.includes(selectedItem.id)) {
      triggerToast('이미 신청을 완료한 공동구매입니다.');
      return;
    }
    try {
      const res = await fetchWithAuth('/api/v1/account');
      const eligibleAccounts = (res as Account[]).filter((account) => (account.kind ?? 'ASSET') !== 'LOAN');
      setUserAccounts(eligibleAccounts);
      if (eligibleAccounts.length > 0) {
        setSelectedAccountId(eligibleAccounts[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch accounts", e);
    }
    setShowConfirmation(true);
  };

  // Confirm Participation & Account budget deduct
  const handleConfirmParticipation = async () => {
    if (!selectedItem) return;

    try {
      if (!selectedAccountId) {
        alert('결제 계좌를 선택해주세요.');
        return;
      }
      const res = await fetchWithAuth(`/api/v1/group-purchases/${selectedItem.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccountId })
      });
      if (res.success) {
        const joinData = res.data;
        
        fetchBudget();
        fetchUserWishedAndJoinedIds();
        fetchGroupPurchases();

        setShowConfirmation(false);
        setSelectedItem(null);

        if (joinData.budgetWarning) {
          triggerToast('공구 참여 완료! 예산 잔액이 초과 경고 범위를 지났습니다.');
        } else {
          triggerToast('공동구매 신청 완료! 가계부 지출 내역에 자동으로 기입됩니다.');
        }
      }
    } catch (err: any) {
      console.error("Failed to join group purchase:", err);
      alert(err.message || '공동구매 신청에 실패했습니다.');
      setShowConfirmation(false);
    }
  };

  // Leave (Cancel) Participation
  const handleLeaveClick = () => {
    if (!selectedItem) return;
    setShowLeaveConfirmation(true);
  };

  const handleConfirmLeave = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetchWithAuth(`/api/v1/group-purchases/${selectedItem.id}/leave`, {
        method: 'POST'
      });
      if (res.success) {
        triggerToast('신청 취소 완료!');
        fetchBudget();
        fetchUserWishedAndJoinedIds();
        fetchGroupPurchases();
        setSelectedItem(prev => prev ? { ...prev, currentParticipants: Math.max(0, prev.currentParticipants - 1) } : null);
        setShowLeaveConfirmation(false);
      }
    } catch (err: any) {
      console.error("Failed to leave group purchase:", err);
      alert(err.message || '취소에 실패했습니다.');
      setShowLeaveConfirmation(false);
    }
  };

  // Early Close Group Purchase
  const handleEarlyCloseClick = async () => {
    if (!selectedItem) return;
    const confirmClose = window.confirm("정말 이 공동구매를 조기 마감하시겠습니까?\\n즉시 성공 처리되며 참여자들의 결제가 진행됩니다.");
    if (!confirmClose) return;

    try {
      const res = await fetchWithAuth(`/api/v1/group-purchases/${selectedItem.id}/early-close`, {
        method: 'POST'
      });
      if (res.success) {
        triggerToast('조기 마감이 완료되어 공동구매가 성공 처리되었습니다!');
        fetchBudget(); // If creator was also participating, budget changes
        fetchGroupPurchases();
        
        // Update selected item in modal
        if (res.data) {
          const updated = mapBackendItemToFrontend(res.data, categories);
          setSelectedItem(updated);
        }
      }
    } catch (err: any) {
      console.error("Failed to early close group purchase:", err);
      alert(err.message || '조기 마감 처리에 실패했습니다.');
    }
  };

  // Report Submit Handler
  const handleReportSubmit = async () => {
    if (!selectedItem) return;
    if (reportReason.trim().length < 5) {
      alert("신고 사유를 5자 이상 입력해주세요.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const res = await fetchWithAuth(`/api/v1/reports`, {
        method: 'POST',
        body: JSON.stringify({
          targetType: "GROUP_PURCHASE",
          targetId: selectedItem.id,
          reason: reportReason
        })
      });
      if (res.success || res.data) {
        setShowReportModal(false);
        setReportReason('');
        triggerToast('신고가 정상적으로 접수되었습니다.');
      }
    } catch (err: any) {
      console.error("Failed to submit report:", err);
      alert(err.message || '신고 접수에 실패했습니다.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const filteredItems = items
    .filter(item => {
      if (activeCategoryName && item.category !== activeCategoryName) return false;
      if (showBookmarksOnly && !userBookmarks.includes(item.id)) return false;
      if (showMyPostsOnly && item.creatorId !== currentUserId) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return b.id - a.id;
      if (sortBy === 'deadline') {
        if (a.statusType === 'red') return -1;
        if (b.statusType === 'red') return 1;
        return a.id - b.id;
      }
      if (sortBy === 'progress') return b.progress - a.progress;
      return 0;
    });

  const renderProgressBar = (item: GroupBuyItem, compact = false) => (
    <div className={compact ? 'groupbuy-progress-compact' : undefined}>
      {!compact && (
        <div className="group-buy-progress-row">
          <span>
            참여 ({item.currentParticipants}/{item.targetParticipants}명)
          </span>
          <span className="percent">{item.progress}%</span>
        </div>
      )}
      <div className={`progress-bar-container${compact ? ' progress-bar-container--compact' : ''}`}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${Math.min(100, item.progress)}%`,
            backgroundColor: getProgressBarColor(item.statusType),
          }}
        />
      </div>
      {compact && (
        <span className="groupbuy-progress-compact-meta">
          {item.currentParticipants}/{item.targetParticipants}명 · {item.progress}%
        </span>
      )}
    </div>
  );

  const renderParticipatedBadge = (extraClass = '') => (
    <span className={`groupbuy-participated-badge${extraClass ? ` ${extraClass}` : ''}`}>
      <CheckCircle2 size={10} />
      신청완료
    </span>
  );

  return (
    <div className={`groupbuy-container fade-in${isNative ? ' groupbuy-page' : ''}`}>
      {isNative ? (
        <>
          <div className="groupbuy-budget-link-card groupbuy-budget-link-card--app">
            <div className="groupbuy-budget-main">
              <Wallet size={15} />
              <div className="groupbuy-budget-copy">
                <span className="groupbuy-budget-label">예산 잔액</span>
                <span className="groupbuy-budget-amount">
                  {formatKRW(userBudget)}
                  <span>원</span>
                </span>
              </div>
            </div>
            <div className="groupbuy-budget-meta">
              <span className="groupbuy-location-badge groupbuy-location-badge--app">
                <MapPin size={12} />
                <span>{userLocationText}</span>
              </span>
              <span className="groupbuy-budget-hint">가계부 연동 · {distanceLimit} 반경</span>
            </div>
          </div>

          <div className="qna-page-toolbar groupbuy-page-toolbar">
            <div className="qna-page-toolbar-actions groupbuy-page-toolbar-actions">
              <button
                type="button"
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`header-btn-secondary${showBookmarksOnly ? ' active' : ''}`}
              >
                <Heart size={16} fill={showBookmarksOnly ? 'currentColor' : 'transparent'} />
                <span>찜</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMyPostsOnly(!showMyPostsOnly)}
                className={`header-btn-secondary${showMyPostsOnly ? ' active' : ''}`}
              >
                <User size={16} />
                <span>내 글</span>
              </button>
            </div>
            <div className="qna-page-toolbar-actions groupbuy-page-toolbar-actions">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="header-btn-primary groupbuy-write-btn"
              >
                <PenSquare size={16} />
                <span>글쓰기</span>
              </button>
            </div>
          </div>

          <div className="groupbuy-category-section">
            <div className="groupbuy-category-scroll">
              <div
                className="dashboard-view-tabs groupbuy-category-tabs groupbuy-category-tabs--app"
                role="tablist"
                aria-label="카테고리"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryId === null}
                  onClick={() => setActiveCategoryId(null)}
                  className={`dashboard-tab-btn ${activeCategoryId === null ? 'active' : ''}`}
                >
                  전체
                </button>
                {categories.map((cat) => {
                  const isActive = activeCategoryId === cat.id;
                  const isSubscribed = interestCategories.some((ic) => ic.categoryId === cat.id);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`dashboard-tab-btn ${isActive ? 'active' : ''} ${isSubscribed ? 'subscribed' : ''}`}
                    >
                      {cat.name}
                      {isSubscribed && (
                        <span className="groupbuy-category-tab-dot" title="알림 등록됨" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeCategoryId !== null && activeCategoryName && (
              <button
                type="button"
                onClick={handleToggleCategoryNotification}
                disabled={subscribingCategory}
                className={`groupbuy-category-bell-btn${subscribedInterest ? ' subscribed' : ''}`}
                title={
                  subscribedInterest
                    ? `"${activeCategoryName}" 카테고리 알림 취소`
                    : `"${activeCategoryName}" 새 공구 알림 받기`
                }
              >
                {subscribingCategory ? (
                  <Loader2 size={14} className="spin-animation" />
                ) : subscribedInterest ? (
                  <BellOff size={14} />
                ) : (
                  <Bell size={14} />
                )}
                <span>
                  {activeCategoryName} · {subscribedInterest ? '알림 취소' : '새 공구 알림'}
                </span>
              </button>
            )}
          </div>

          <div className="card qna-filter groupbuy-filter">
            <div className="qna-filter-top">
              <div className="qna-filter-seg" role="tablist" aria-label="정렬">
                {SORT_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={sortBy === tab.id}
                      className={sortBy === tab.id ? 'active' : ''}
                      onClick={() => setSortBy(tab.id)}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <span className="qna-filter-count">
                전체 <strong>{filteredItems.length}</strong>개
              </span>
            </div>

            <div className="groupbuy-distance-seg" role="tablist" aria-label="반경">
              {DISTANCE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={distanceLimit === tab.id}
                  className={distanceLimit === tab.id ? 'active' : ''}
                  onClick={() => setDistanceLimit(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="card groupbuy-empty">검색 결과 조건에 맞는 공동구매가 없습니다.</div>
          ) : (
            <div className="group-buy-grid groupbuy-card-grid">
              {filteredItems.map((item) => {
                const isBookmarked = userBookmarks.includes(item.id);
                const isParticipated = participatedItems.includes(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="card groupbuy-card-compact"
                    onClick={() => handleItemClick(item)}
                  >
                    {isParticipated && renderParticipatedBadge('groupbuy-participated-badge--compact')}
                    {item.imageUrl ? (
                      <div
                        className="groupbuy-card-compact-thumb"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      />
                    ) : (
                      <div
                        className="groupbuy-card-compact-thumb groupbuy-card-compact-thumb--placeholder"
                        style={{ background: item.imageColor }}
                      >
                        <ShoppingBag size={22} />
                      </div>
                    )}
                    <div className="groupbuy-card-compact-body">
                      <div className="groupbuy-card-compact-badges">
                        <span className={`group-buy-status-badge ${item.statusType}`}>{item.status}</span>
                      </div>
                      <p className="groupbuy-card-compact-title">{item.title}</p>
                      <div className="groupbuy-card-compact-price">{formatKRW(item.price)}원</div>
                      {renderProgressBar(item, true)}
                      <div className="groupbuy-card-compact-meta">
                        <span>
                          <Eye size={12} />
                          {item.views}
                        </span>
                        <button
                          type="button"
                          className="groupbuy-card-compact-bookmark"
                          onClick={(e) => toggleBookmark(item.id, e)}
                          aria-label={isBookmarked ? '찜 해제' : '찜하기'}
                        >
                          <Heart
                            size={12}
                            fill={isBookmarked ? 'var(--red)' : 'transparent'}
                            color={isBookmarked ? 'var(--red)' : 'var(--text-muted)'}
                          />
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
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
                <span>{userLocationText} (인증 {distanceLimit} 반경)</span>
              </div>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>최종 결제 시 가계부 지출 자동 기입</span>
            </div>
          </div>

          <div className="groupbuy-filter-row">
            <div className="groupbuy-category-row">
              <div className="dashboard-view-tabs groupbuy-category-tabs" style={{ margin: 0 }}>
                <button
                  onClick={() => setActiveCategoryId(null)}
                  className={`dashboard-tab-btn ${activeCategoryId === null ? 'active' : ''}`}
                >
                  전체
                </button>
                {categories.map((cat) => {
                  const isActive = activeCategoryId === cat.id;
                  const isSubscribed = interestCategories.some((ic) => ic.categoryId === cat.id);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`dashboard-tab-btn ${isActive ? 'active' : ''} ${isSubscribed ? 'subscribed' : ''}`}
                    >
                      {cat.name}
                      {isSubscribed && <span className="groupbuy-category-tab-dot" title="알림 등록됨" />}
                    </button>
                  );
                })}
              </div>

              {activeCategoryId !== null && activeCategoryName && (
                <button
                  type="button"
                  onClick={handleToggleCategoryNotification}
                  disabled={subscribingCategory}
                  className={`groupbuy-category-bell-btn${subscribedInterest ? ' subscribed' : ''}`}
                  title={
                    subscribedInterest
                      ? `"${activeCategoryName}" 카테고리 알림 취소`
                      : `"${activeCategoryName}" 새 공구 알림 받기`
                  }
                >
                  {subscribingCategory ? (
                    <Loader2 size={14} className="spin-animation" />
                  ) : subscribedInterest ? (
                    <BellOff size={14} />
                  ) : (
                    <Bell size={14} />
                  )}
                  <span>
                    {activeCategoryName} · {subscribedInterest ? '알림 취소' : '새 공구 알림'}
                  </span>
                </button>
              )}
            </div>

            <div className="groupbuy-right-filters">
              <select
                className="groupbuy-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">최신순</option>
                <option value="deadline">마감임박순</option>
                <option value="progress">달성률순</option>
              </select>

              <select
                className="groupbuy-select"
                value={distanceLimit}
                onChange={(e) => setDistanceLimit(e.target.value)}
              >
                <option value="1.5km">반경 1.5km 내</option>
                <option value="3.0km">반경 3.0km 내</option>
                <option value="5.0km">반경 5.0km 내</option>
                <option value="전체">전체 보기</option>
              </select>

              <button
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`groupbuy-toggle-btn ${showBookmarksOnly ? 'active' : ''}`}
              >
                찜 목록
              </button>

              <button
                onClick={() => setShowMyPostsOnly(!showMyPostsOnly)}
                className={`groupbuy-toggle-btn ${showMyPostsOnly ? 'active' : ''}`}
                style={{ marginRight: '8px' }}
              >
                내가 쓴 글
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="groupbuy-action-btn"
                style={{
                  backgroundColor: '#ff7e36',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Plus size={16} />
                <span>공동구매 글쓰기</span>
              </button>
            </div>
          </div>

          <div className="group-buy-grid" style={{ marginTop: 0 }}>
            {filteredItems.map((item) => {
              const isBookmarked = userBookmarks.includes(item.id);
              const isParticipated = participatedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="group-buy-card"
                  onClick={() => handleItemClick(item)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {isParticipated && (
                    <div
                      style={{
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
                        zIndex: 2,
                      }}
                    >
                      <CheckCircle2 size={12} />
                      신청완료
                    </div>
                  )}

                  <div className="group-buy-header">
                    <span className="group-buy-category">{item.category}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`group-buy-status-badge ${item.statusType}`}>{item.status}</span>
                      <button
                        onClick={(e) => toggleBookmark(item.id, e)}
                        style={{ color: isBookmarked ? 'var(--red)' : 'var(--text-muted)' }}
                      >
                        <Heart size={16} fill={isBookmarked ? 'var(--red)' : 'transparent'} />
                      </button>
                    </div>
                  </div>

                  <div className="group-buy-title" style={{ fontSize: '16px' }}>
                    {item.title}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      {item.creator} • {item.distance}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Eye size={12} /> {item.views}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Heart size={12} /> {item.bookmarks}
                      </span>
                    </span>
                  </div>

                  <div>
                    <div className="group-buy-progress-row">
                      <span>
                        참여 인원 ({item.currentParticipants}/{item.targetParticipants}명)
                      </span>
                      <span className="percent">{item.progress}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, item.progress)}%`,
                          backgroundColor: getProgressBarColor(item.statusType),
                        }}
                      />
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
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '60px 24px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                검색 결과 조건에 맞는 공동구매가 없습니다.
              </div>
            )}
          </div>
        </>
      )}

      {/* 4. DETAIL MODAL DIALOG */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="modal-title">공동구매 상세 정보</span>
                <button 
                  onClick={() => setShowReportModal(true)}
                  style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <AlertCircle size={14} />
                  신고
                </button>
              </div>
              <X size={20} className="modal-close-btn" onClick={() => setSelectedItem(null)} />
            </div>
            
            <div className="modal-body">
              <div className="detail-modal-layout">
                {/* Left Col: Visuals & details */}
                <div>
                  {selectedItem.imageUrl ? (
                    <div className="detail-img-box" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
                      <img src={selectedItem.imageUrl} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div className="detail-img-box" style={{ background: selectedItem.imageColor }}>
                      <ShoppingBag size={48} />
                      <span style={{ fontWeight: '700', fontSize: '16px' }}>{selectedItem.title}</span>
                    </div>
                  )}

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

                  {selectedItem.pickupLocation && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                      <strong>수령 장소/시간 안내:</strong> {selectedItem.pickupLocation}
                    </div>
                  )}
                </div>

                {/* Right Col: Progress, Pricing & Q&A comments */}
                <div className="detail-right-col">
                  {/* Price */}
                  <div className="detail-pricing-box">
                    <span className="detail-price-title">공동구매 참가 가격</span>
                    <div className="detail-price-main">
                      {formatKRW(selectedItem.price)}<span>원</span>
                    </div>
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
                            <span>
                              {comm.sender}
                              {comm.authorRole === 'CREATOR' && (
                                <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>방장</span>
                              )}
                              {comm.authorRole === 'PARTICIPANT' && (
                                <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>참여자</span>
                              )}
                            </span>
                            <span className="date">{comm.date}</span>
                          </div>
                          <div className="comment-text">
                            {comm.isSecret && <Lock size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-secondary)' }} />}
                            {comm.text}
                          </div>
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
                        onKeyDown={(e) => {
                          if (e.nativeEvent.isComposing) return;
                          if (e.key === 'Enter') handleAddComment();
                        }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <input 
                          type="checkbox" 
                          checked={newCommentSecret} 
                          onChange={(e) => setNewCommentSecret(e.target.checked)} 
                          style={{ marginRight: '4px' }}
                        />
                        비밀
                      </label>
                      <button className="comment-btn" onClick={handleAddComment}>
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Participate CTA with integrated Budget Link check */}
                  {currentUserId === selectedItem.creatorId ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="detail-btn-participate completed" disabled style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none' }}>
                        <span>내가 개설한 공동구매</span>
                      </button>
                      {selectedItem.statusType === 'blue' || selectedItem.statusType === 'red' ? (
                        <button 
                          className="detail-btn-participate"
                          onClick={handleEarlyCloseClick}
                          disabled={selectedItem.currentParticipants < selectedItem.minParticipants}
                          title={selectedItem.currentParticipants < selectedItem.minParticipants ? "최소 인원이 충족되어야 조기 마감이 가능합니다." : ""}
                          style={{ 
                            flex: 'none',
                            width: 'auto',
                            background: selectedItem.currentParticipants >= selectedItem.minParticipants ? 'var(--blue)' : '#cbd5e1', 
                            padding: '0 20px', 
                            cursor: selectedItem.currentParticipants >= selectedItem.minParticipants ? 'pointer' : 'not-allowed'
                          }}
                        >
                          조기 마감하기
                        </button>
                      ) : null}
                    </div>
                  ) : participatedItems.includes(selectedItem.id) ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="detail-btn-participate completed" disabled style={{ flex: 1 }}>
                        <span>신청 완료한 공동구매</span>
                      </button>
                      <button 
                        onClick={handleLeaveClick}
                        style={{ 
                          background: '#fef2f2', 
                          color: '#ef4444', 
                          border: '1px solid #fca5a5', 
                          borderRadius: '12px', 
                          padding: '0 20px', 
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        신청 취소
                      </button>
                    </div>
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
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>결제 계좌 선택:</div>
                  <select
                    value={selectedAccountId || ''}
                    onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
                  >
                    {userAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} (잔고: {formatKRW(acc.currentBalance)}원)
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>참여 금액:</span>
                  <span style={{ fontWeight: '700' }}>{formatKRW(selectedItem.price)}원</span>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                신청 시에는 예약만 되며, <b>공동구매 확정(성공) 시</b> 지정된 계좌에서 즉시 차감(지출 기입)됩니다.<br/>
                확정 전 신청 취소 시에는 결제되지 않으며, 무산 시에도 자동으로 취소됩니다.
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
                  참여 결제하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-2. LEAVE CONFIRMATION POPUP */}
      {showLeaveConfirmation && selectedItem && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content small">
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} />
                <span>가계부 예산 환불 안내</span>
              </span>
              <X size={18} className="modal-close-btn" onClick={() => setShowLeaveConfirmation(false)} />
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>정말로 신청을 취소할까요?</h3>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'left', fontSize: '13px', margin: '16px 0', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>환불 예정 금액:</span>
                  <span style={{ fontWeight: '700', color: 'var(--blue)' }}>+{formatKRW(selectedItem.price)}원</span>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                취소 시 가계부에 환불 내역(수입)이 자동으로 기입되며, 즉시 예산이 복구됩니다.
              </p>

              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowLeaveConfirmation(false)}
                  style={{
                    background: '#f1f5f9',
                    color: 'var(--text-primary)',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  돌아가기
                </button>
                <button 
                  onClick={handleConfirmLeave}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  신청 취소하기
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

      

      {/* 6.6 Create Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>공동구매 글쓰기</h3>
              <X size={20} className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)} />
            </div>
            <form onSubmit={handleCreateSubmit} className="groupbuy-create-form">
              {/* 왼쪽 단 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>제목 <span style={{color:'red'}}>*</span></label>
                  <input type="text" placeholder="어떤 물건을 함께 사고 싶으신가요?" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
                </div>
                
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>카테고리 <span style={{color:'red'}}>*</span></label>
                  <select value={createForm.categoryId} onChange={e => setCreateForm({...createForm, categoryId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required>
                    <option value="">카테고리 선택</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>설명 <span style={{color:'red'}}>*</span></label>
                  <textarea placeholder="물건에 대한 설명이나 거래 방식 등을 자유롭게 적어주세요." value={createForm.content} onChange={e => setCreateForm({...createForm, content: e.target.value})} style={{ width: '100%', flex: 1, minHeight: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'none' }} required />
                </div>
              </div>

              {/* 오른쪽 단 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>이미지 파일 (선택)</label>
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: '140px', border: '2px dashed #cbd5e1', borderRadius: '12px',
                    backgroundColor: '#f8fafc', cursor: isUploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ display: 'none' }} />
                    {isUploading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>업로드 중...</span>
                      </div>
                    ) : createForm.imageUrl ? (
                      <>
                        <img src={createForm.imageUrl} alt="미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} 
                             onMouseEnter={e => e.currentTarget.style.opacity = '1'} 
                             onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                          <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', pointerEvents: 'none' }}>사진 변경하기</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                        <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '50%' }}>
                          <Plus size={24} color="#64748b" />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>클릭하여 이미지 업로드</span>
                        <span style={{ fontSize: '11px' }}>JPG, PNG 등 이미지 파일 지원</span>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>예상 금액(1인당) <span style={{color:'red'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" placeholder="15000" value={createForm.price} onChange={e => setCreateForm({...createForm, price: e.target.value})} style={{ width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }} required />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 'bold' }}>원</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>마감 기한 <span style={{color:'red'}}>*</span></label>
                  <input type="datetime-local" value={createForm.deadline} onChange={e => setCreateForm({...createForm, deadline: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} required />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>최소 인원</label>
                    <input type="number" min="1" value={createForm.minParticipants} onChange={e => setCreateForm({...createForm, minParticipants: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>최대 인원</label>
                    <input type="number" min="1" value={createForm.maxParticipants} onChange={e => setCreateForm({...createForm, maxParticipants: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>수령 장소 <span style={{color:'red'}}>*</span></label>
                  <select 
                    value={createForm.pickupLocation} 
                    onChange={e => setCreateForm({...createForm, pickupLocation: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }} 
                    required
                  >
                    <option value="" disabled>수령 장소를 선택해주세요</option>
                    <option value="101동 놀이터 앞">101동 놀이터 앞</option>
                    <option value="105동 분리수거장">105동 분리수거장</option>
                    <option value="정문 관리사무소">정문 관리사무소</option>
                    <option value="후문 상가 앞">후문 상가 앞</option>
                    <option value="커뮤니티 센터">커뮤니티 센터</option>
                    <option value="기타 (직접 입력)">기타 (직접 입력)</option>
                  </select>
                  {createForm.pickupLocation === '기타 (직접 입력)' && (
                    <input 
                      type="text" 
                      placeholder="예: OO빌라 1층 주차장" 
                      value={createForm.customPickupLocation} 
                      onChange={e => setCreateForm({...createForm, customPickupLocation: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '8px' }} 
                      required 
                    />
                  )}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ background: '#f1f5f9', color: '#475569', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>취소</button>
                <button type="submit" style={{ background: '#ff7e36', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>등록하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. REPORT MODAL */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)} style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} />
                게시글 신고하기
              </span>
              <X size={20} className="modal-close-btn" onClick={() => setShowReportModal(false)} />
            </div>
            <div className="modal-body" style={{ paddingTop: '16px' }}>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                부적절한 내용이나 허위 정보를 포함한 게시글인가요? 신고 사유를 상세히 적어주시면 관리자가 확인 후 조치하겠습니다.
              </p>
              <textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="신고 사유를 입력해주세요 (최소 5자 이상)"
                style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'none', fontSize: '14px', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setShowReportModal(false)} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>취소</button>
                <button onClick={handleReportSubmit} disabled={isSubmittingReport} style={{ padding: '10px 16px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isSubmittingReport ? '접수 중...' : '신고 접수'}
                </button>
              </div>
            </div>
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
