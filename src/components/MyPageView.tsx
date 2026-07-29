import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Lock,
  Bell,
  Tags,
  Trash2,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Mail,
  Shield,
  ChevronRight,
  Plus,
  Users,
  Bookmark,
  MessageSquare,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import {
  authApi,
  tokenStorage,
  userApi,
  interestCategoryApi,
  groupPurchaseCategoryApi,
  type UserProfileResponse,
  type InterestCategoryResponse,
  type GroupPurchaseCategoryResponse,
} from '../api';
import type { BoardResponse, FollowUserResponse } from '../lib/boardApi';
import {
  formatRelativeKo,
  getMyUserId,
  listFollowers,
  listFollowing,
  listMyBookmarks,
} from '../lib/boardApi';
import { stripMediaForPreview } from '../lib/renderPostContent';
import { openAddressSearch } from '../utils/daumPostcode';
import { isFirebaseConfigured } from '../config/firebase';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushPermissionStatus,
  isPushEnabledInApp,
  requestPushNotifications,
  resetPushSettingsInApp,
  setPushEnabledInApp,
  type PushPermissionStatus,
} from '../lib/fcm';

type UserProfile = UserProfileResponse;

type MyPageTab =
  | 'profile'
  | 'password'
  | 'notifications'
  | 'interestCategories'
  | 'follow'
  | 'bookmarks'
  | 'withdraw';

interface MyPageViewProps {
  onOpenBoard?: (type: 'QNA' | 'KNOWHOW', id: number) => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({ onOpenBoard }) => {
  const [activeTab, setActiveTab] = useState<MyPageTab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [editBaseAddress, setEditBaseAddress] = useState('');
  const [editDetailAddress, setEditDetailAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isCurrentPasswordVerified, setIsCurrentPasswordVerified] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Withdraw
  const [withdrawConfirm, setWithdrawConfirm] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Interest categories
  const [interestCategories, setInterestCategories] = useState<InterestCategoryResponse[]>([]);
  const [allCategories, setAllCategories] = useState<GroupPurchaseCategoryResponse[]>([]);
  const [loadingInterestCategories, setLoadingInterestCategories] = useState(false);
  const [interestCategoryError, setInterestCategoryError] = useState<string | null>(null);
  const [interestCategorySuccess, setInterestCategorySuccess] = useState<string | null>(null);
  const [interestActionId, setInterestActionId] = useState<number | null>(null);
  const [addingCategoryId, setAddingCategoryId] = useState<number | null>(null);

  // Follow
  const [followSubTab, setFollowSubTab] = useState<'following' | 'followers'>('following');
  const [followingList, setFollowingList] = useState<FollowUserResponse[]>([]);
  const [followersList, setFollowersList] = useState<FollowUserResponse[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BoardResponse[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [bookmarksError, setBookmarksError] = useState<string | null>(null);

  const [pushPermission, setPushPermission] = useState<PushPermissionStatus>(() => getPushPermissionStatus());
  const [pushEnabledInApp, setPushEnabledInAppState] = useState<boolean>(() => isPushEnabledInApp());
  const [pushLoading, setPushLoading] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const thresholdSaveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (activeTab === 'notifications') {
      setPushPermission(getPushPermissionStatus());
      setPushEnabledInAppState(isPushEnabledInApp());
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (thresholdSaveTimer.current !== null) {
        window.clearTimeout(thresholdSaveTimer.current);
      }
    };
  }, []);

  // 프로필 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const result = await userApi.getMyProfile();
        if (result.ok && result.data) {
          setProfile({
            ...result.data,
            isGoalAlertEnabled: result.data.isGoalAlertEnabled ?? true,
          });
          setEditForm({
            ...result.data,
            isGoalAlertEnabled: result.data.isGoalAlertEnabled ?? true,
          });
        } else {
          setProfileError(result.error ?? '프로필을 불러오는 데 실패했습니다.');
        }
      } catch {
        setProfileError('서버와 통신 중 오류가 발생했습니다. 백엔드가 실행 중인지 확인해 주세요.');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab !== 'password') {
      setIsCurrentPasswordVerified(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwError(null);
      setPwSuccess(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'follow') return;
    let cancelled = false;
    const load = async () => {
      setFollowLoading(true);
      setFollowError(null);
      try {
        const myId = await getMyUserId();
        const [followingRes, followersRes] = await Promise.all([
          listFollowing(myId),
          listFollowers(myId),
        ]);
        if (cancelled) return;
        setFollowingList(followingRes);
        setFollowersList(followersRes);
      } catch (e) {
        if (!cancelled) setFollowError((e as Error).message);
      } finally {
        if (!cancelled) setFollowLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'bookmarks') return;
    let cancelled = false;
    const load = async () => {
      setBookmarksLoading(true);
      setBookmarksError(null);
      try {
        const data = await listMyBookmarks();
        if (!cancelled) setBookmarks(data);
      } catch (e) {
        if (!cancelled) setBookmarksError((e as Error).message);
      } finally {
        if (!cancelled) setBookmarksLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'interestCategories') return;

    const fetchInterestCategories = async () => {
      setLoadingInterestCategories(true);
      setInterestCategoryError(null);
      try {
        const [interestResult, categoryResult] = await Promise.all([
          interestCategoryApi.getMyCategories(),
          groupPurchaseCategoryApi.getAll(),
        ]);

        if (interestResult.ok && interestResult.data) {
          setInterestCategories(interestResult.data);
        } else {
          setInterestCategoryError(interestResult.error ?? '관심 카테고리를 불러오지 못했습니다.');
        }

        if (categoryResult.ok && categoryResult.data) {
          setAllCategories(categoryResult.data);
        }
      } catch {
        setInterestCategoryError('서버와 통신 중 오류가 발생했습니다.');
      } finally {
        setLoadingInterestCategories(false);
      }
    };

    fetchInterestCategories();
  }, [activeTab]);

  const unsubscribedCategories = allCategories.filter(
    (cat) => !interestCategories.some((ic) => ic.categoryId === cat.id),
  );

  const handleDeleteInterestCategory = async (item: InterestCategoryResponse) => {
    setInterestActionId(item.id);
    setInterestCategoryError(null);
    setInterestCategorySuccess(null);
    try {
      const result = await interestCategoryApi.delete(item.id);
      if (result.ok) {
        setInterestCategories((prev) => prev.filter((ic) => ic.id !== item.id));
        setInterestCategorySuccess(`"${item.categoryName}" 카테고리 알림을 해제했습니다.`);
        setTimeout(() => setInterestCategorySuccess(null), 3000);
      } else {
        setInterestCategoryError(result.error ?? '관심 카테고리 해제에 실패했습니다.');
      }
    } catch {
      setInterestCategoryError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setInterestActionId(null);
    }
  };

  const handleAddInterestCategory = async (categoryId: number) => {
    setAddingCategoryId(categoryId);
    setInterestCategoryError(null);
    setInterestCategorySuccess(null);
    try {
      const result = await interestCategoryApi.register(categoryId);
      if (result.ok && result.data) {
        setInterestCategories((prev) => [...prev, result.data!]);
        setInterestCategorySuccess(`"${result.data.categoryName}" 관심 카테고리를 등록했습니다.`);
        setTimeout(() => setInterestCategorySuccess(null), 3000);
      } else {
        setInterestCategoryError(result.error ?? '관심 카테고리 등록에 실패했습니다.');
      }
    } catch {
      setInterestCategoryError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setAddingCategoryId(null);
    }
  };

  const resetPasswordFlow = () => {
    setIsCurrentPasswordVerified(false);
    setNewPassword('');
    setConfirmPassword('');
    setPwError(null);
    setPwSuccess(null);
  };

  const startEditing = () => {
    if (!profile) return;
    setEditing(true);
    setEditForm(profile);
    setEditBaseAddress(profile.address ?? '');
    setEditDetailAddress('');
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditBaseAddress('');
    setEditDetailAddress('');
  };

  const handleAddressSearch = async () => {
    try {
      await openAddressSearch((selectedAddress) => {
        setEditBaseAddress(selectedAddress);
        setEditDetailAddress('');
      });
    } catch (err) {
      console.error(err);
      setProfileError('주소 검색 창을 열 수 없습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  // 프로필 저장
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      const fullAddress = [editBaseAddress, editDetailAddress.trim()].filter(Boolean).join(' ') || null;

      const result = await userApi.updateMyProfile({
        username: editForm.username ?? '',
        birthDate: editForm.birthDate ?? null,
        address: fullAddress,
        budgetAlertThreshold: editForm.budgetAlertThreshold ?? 80,
        isPortfolioPublic: editForm.isPortfolioPublic ?? false,
        isBudgetAlertEnabled: editForm.isBudgetAlertEnabled ?? true,
        isInterestCategoryEnabled: editForm.isInterestCategoryEnabled ?? true,
        isGoalAlertEnabled: editForm.isGoalAlertEnabled ?? true,
        isSystemAlertEnabled: editForm.isSystemAlertEnabled ?? true,
      });
      if (result.ok) {
        setProfile({ ...profile!, ...editForm, address: fullAddress } as UserProfile);
        setEditing(false);
        setEditBaseAddress('');
        setEditDetailAddress('');
        setProfileSuccess('프로필이 성공적으로 저장되었습니다.');
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(result.error ?? '저장에 실패했습니다.');
      }
    } catch {
      setProfileError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSavingProfile(false);
    }
  };

  const buildNotificationSettingsPayload = (source: UserProfile) => ({
    username: source.username,
    birthDate: source.birthDate ?? null,
    address: source.address ?? null,
    budgetAlertThreshold: source.budgetAlertThreshold,
    isPortfolioPublic: source.isPortfolioPublic,
    isBudgetAlertEnabled: source.isBudgetAlertEnabled,
    isInterestCategoryEnabled: source.isInterestCategoryEnabled,
    isGoalAlertEnabled: source.isGoalAlertEnabled,
    isSystemAlertEnabled: source.isSystemAlertEnabled,
  });

  const persistNotificationSettings = async (
    nextProfile: UserProfile,
    revertOnFailure?: UserProfile
  ): Promise<boolean> => {
    setSavingNotifications(true);
    setNotificationFeedback(null);
    setProfile(nextProfile);

    try {
      const result = await userApi.updateMyProfile(buildNotificationSettingsPayload(nextProfile));
      if (result.ok) return true;

      if (revertOnFailure) setProfile(revertOnFailure);
      setNotificationFeedback({
        msg: result.error ?? '알림 설정 저장에 실패했습니다.',
        type: 'error',
      });
      return false;
    } catch {
      if (revertOnFailure) setProfile(revertOnFailure);
      setNotificationFeedback({
        msg: '서버와 통신 중 오류가 발생했습니다.',
        type: 'error',
      });
      return false;
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleNotificationToggle = async (
    key: 'isBudgetAlertEnabled' | 'isInterestCategoryEnabled' | 'isGoalAlertEnabled' | 'isSystemAlertEnabled',
    value: boolean
  ) => {
    if (!profile || savingNotifications) return;
    const previous = profile;
    await persistNotificationSettings({ ...profile, [key]: value }, previous);
  };

  const handleBudgetThresholdChange = (value: number, immediate = false) => {
    if (!profile || savingNotifications) return;

    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    const previous = profile;
    const next = { ...profile, budgetAlertThreshold: clamped };
    setProfile(next);

    if (thresholdSaveTimer.current !== null) {
      window.clearTimeout(thresholdSaveTimer.current);
      thresholdSaveTimer.current = null;
    }

    if (immediate) {
      void persistNotificationSettings(next, previous);
      return;
    }

    thresholdSaveTimer.current = window.setTimeout(() => {
      void persistNotificationSettings(next, previous);
    }, 400);
  };

  const [editingBudgetThreshold, setEditingBudgetThreshold] = useState(false);
  const [budgetThresholdDraft, setBudgetThresholdDraft] = useState('');
  const budgetThresholdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingBudgetThreshold) {
      budgetThresholdInputRef.current?.focus();
      budgetThresholdInputRef.current?.select();
    }
  }, [editingBudgetThreshold]);

  const startEditingBudgetThreshold = () => {
    if (!profile || savingNotifications) return;
    setBudgetThresholdDraft(String(profile.budgetAlertThreshold));
    setEditingBudgetThreshold(true);
  };

  const cancelBudgetThresholdInput = () => {
    setEditingBudgetThreshold(false);
  };

  const commitBudgetThresholdInput = () => {
    if (!profile) return;

    const trimmed = budgetThresholdDraft.trim();
    if (trimmed === '') {
      cancelBudgetThresholdInput();
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      cancelBudgetThresholdInput();
      return;
    }

    handleBudgetThresholdChange(parsed, true);
    setEditingBudgetThreshold(false);
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (!isFirebaseConfigured()) return;

    setPushLoading(true);
    setPushFeedback(null);
    try {
      if (enabled) {
        if (pushPermission === 'denied') {
          setPushFeedback({ msg: '브라우저 설정에서 알림을 허용한 뒤 다시 시도해 주세요.', type: 'error' });
          return;
        }

        if (pushPermission === 'default') {
          const result = await requestPushNotifications();
          setPushPermission(getPushPermissionStatus());
          if (!result.ok) {
            setPushFeedback({ msg: result.error ?? '푸시 알림 설정에 실패했습니다.', type: 'error' });
            return;
          }
        } else {
          setPushEnabledInApp(true);
          await enablePushNotifications();
        }

        setPushEnabledInAppState(true);
      } else {
        await disablePushNotifications();
        setPushEnabledInAppState(false);
      }
    } catch (err) {
      setPushFeedback({
        msg: err instanceof Error ? err.message : '푸시 알림 설정에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setPushLoading(false);
    }
  };

  const pushToggleChecked =
    pushEnabledInApp &&
    pushPermission === 'granted' &&
    isFirebaseConfigured();

  const pushToggleDescription = (() => {
    if (!isFirebaseConfigured()) {
      return 'Firebase 설정이 없어 푸시 알림을 사용할 수 없습니다.';
    }
    if (pushPermission === 'denied') {
      return '브라우저에서 알림이 차단되어 있습니다. 주소창 옆 자물쇠/설정에서 허용해 주세요.';
    }
    if (pushPermission === 'default') {
      return '켜면 탭을 닫아도 OS 알림을 받을 수 있습니다. 처음 켤 때 브라우저 권한을 묻습니다.';
    }
    if (pushToggleChecked) {
      return '탭을 닫아도 OS 알림을 받습니다. 앱 사용 중에도 알림 팝업과 배지가 갱신됩니다.';
    }
    return '꺼두면 OS 푸시는 받지 않습니다. 앱 사용 중에는 탭 전환 시 배지가 갱신됩니다.';
  })();

  // 현재 비밀번호 확인
  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPassword) {
      setPwError('현재 비밀번호를 입력해 주세요.');
      return;
    }
    if (!profile?.email) {
      setPwError('프로필 정보를 불러온 후 다시 시도해 주세요.');
      return;
    }

    setPwLoading(true);
    try {
      const result = await authApi.login({ email: profile.email, password: currentPassword });
      if (result.ok && result.data) {
        tokenStorage.setTokens(result.data.accessToken, result.data.refreshToken);
        setIsCurrentPasswordVerified(true);
        setPwSuccess('현재 비밀번호가 확인되었습니다. 새 비밀번호를 입력해 주세요.');
        setTimeout(() => setPwSuccess(null), 3000);
      } else {
        setPwError(result.error ?? '현재 비밀번호가 일치하지 않습니다.');
      }
    } catch {
      setPwError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setPwLoading(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (!newPassword) { setPwError('새 비밀번호를 입력해 주세요.'); return; }
    if (!/(?=.*[0-9])(?=.*[a-zA-Z])(?=.*\W)(?=\S+$).{8,16}/.test(newPassword)) {
      setPwError('비밀번호는 8~16자 영문, 숫자, 특수문자 조합이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) { setPwError('새 비밀번호가 일치하지 않습니다.'); return; }

    const isSettingPassword = profile?.hasPassword === false;

    setPwLoading(true);
    try {
      const result = await userApi.updatePassword(
        isSettingPassword
          ? { newPassword }
          : { currentPassword, newPassword },
      );
      if (result.ok) {
        setPwSuccess(isSettingPassword
          ? '비밀번호가 성공적으로 설정되었습니다. 이제 이메일·비밀번호로도 로그인할 수 있습니다.'
          : '비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsCurrentPasswordVerified(false);
        if (profile) {
          setProfile({ ...profile, hasPassword: true });
        }
        setTimeout(() => setPwSuccess(null), 3000);
      } else {
        setPwError(result.error ?? (isSettingPassword ? '비밀번호 설정에 실패했습니다.' : '비밀번호 변경에 실패했습니다.'));
      }
    } catch {
      setPwError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setPwLoading(false);
    }
  };

  // 회원탈퇴
  const handleWithdraw = async () => {
    if (withdrawConfirm !== '회원탈퇴') { setWithdrawError('확인 문구를 정확히 입력해 주세요.'); return; }
    setWithdrawLoading(true);
    setWithdrawError(null);
    try {
      try {
        await disablePushNotifications();
      } catch {
        // 탈퇴는 푸시 해제 실패와 무관하게 진행
      }
      const result = await userApi.withdraw();
      if (result.ok) {
        resetPushSettingsInApp();
        tokenStorage.clear();
        window.location.reload();
      } else {
        setWithdrawError(result.error ?? '회원 탈퇴에 실패했습니다.');
      }
    } catch {
      setWithdrawError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const needsPasswordSetup = profile?.hasPassword === false;
  const passwordTabLabel = needsPasswordSetup ? '비밀번호 설정' : '비밀번호 변경';

  const tabs: { id: MyPageTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: '프로필 정보', icon: User },
    { id: 'password', label: passwordTabLabel, icon: Lock },
    { id: 'notifications', label: '알림 설정', icon: Bell },
    { id: 'interestCategories', label: '관심 카테고리', icon: Tags },
    { id: 'follow', label: '팔로우 목록', icon: Users },
    { id: 'bookmarks', label: '저장한 글', icon: Bookmark },
    { id: 'withdraw', label: '회원 탈퇴', icon: Trash2 },
  ];

  const Feedback = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
    <div className={type === 'success' ? 'mypage-success-alert' : 'mypage-error-alert'}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span>{msg}</span>
    </div>
  );

  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
    disabled = false,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
    disabled?: boolean;
  }) => (
    <div className="mypage-toggle-row" style={{ opacity: disabled ? 0.7 : 1 }}>
      <div className="mypage-toggle-info">
        <span className="mypage-toggle-label">{label}</span>
        {description && <span className="mypage-toggle-desc">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`mypage-toggle-btn ${checked ? 'active' : ''}`}
        aria-checked={checked}
        role="switch"
        disabled={disabled}
      >
        <span className="mypage-toggle-knob" />
      </button>
    </div>
  );

  return (
    <div className="mypage-wrapper fade-in">
      {/* Page header */}
      <div className="mypage-header">
        <h1 className="mypage-page-title">설정 및 프로필</h1>
        <p className="mypage-page-subtitle">계정 정보와 알림 설정을 관리합니다</p>
      </div>

      <div className="mypage-layout">
        {/* Sidebar tabs */}
        <aside className="mypage-sidenav">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`mypage-sidenav-item ${activeTab === id ? 'active' : ''} ${id === 'withdraw' ? 'danger' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={14} className="mypage-sidenav-arrow" />
            </button>
          ))}
        </aside>

        {/* Main panel */}
        <div className="mypage-panel">
          {/* ── Profile Tab ─────────────────── */}
          {activeTab === 'profile' && (
            <div>
              <div className="mypage-section-head">
                <div>
                  <h2 className="mypage-section-title">프로필 정보</h2>
                  <p className="mypage-section-desc">닉네임, 생년월일, 주소 등 기본 정보를 관리합니다</p>
                </div>
                {!editing && profile && (
                  <button className="mypage-btn-edit" onClick={startEditing}>
                    <Edit2 size={15} />
                    <span>수정</span>
                  </button>
                )}
              </div>

              {profileSuccess && <Feedback msg={profileSuccess} type="success" />}
              {profileError && <Feedback msg={profileError} type="error" />}

              {loadingProfile ? (
                <div className="mypage-loading">
                  <Loader2 size={24} className="spin-animation" />
                  <span>프로필 불러오는 중...</span>
                </div>
              ) : profile ? (
                <div className="mypage-profile-grid">
                  {/* Email (read-only always) */}
                  <div className="mypage-field">
                    <label className="mypage-field-label"><Mail size={14} /> 이메일</label>
                    <div className="mypage-field-value readonly">
                      <span>{profile.email}</span>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="mypage-field">
                    <label className="mypage-field-label"><User size={14} /> 닉네임</label>
                    {editing ? (
                      <input
                        className="mypage-input"
                        value={editForm.username ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder="닉네임을 입력하세요"
                      />
                    ) : (
                      <div className="mypage-field-value"><span>{profile.username}</span></div>
                    )}
                  </div>

                  {/* Birth date */}
                  <div className="mypage-field">
                    <label className="mypage-field-label"><Calendar size={14} /> 생년월일</label>
                    {editing ? (
                      <input
                        type="date"
                        className="mypage-input"
                        value={editForm.birthDate ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                      />
                    ) : (
                      <div className="mypage-field-value">
                        <span>{profile.birthDate ?? '—'}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="mypage-field span-full">
                    <label className="mypage-field-label"><MapPin size={14} /> 주소</label>
                    {editing ? (
                      <div className="mypage-address-edit">
                        <div className="mypage-address-search-row">
                          <input
                            className="mypage-input"
                            value={editBaseAddress}
                            readOnly
                            placeholder="주소 검색을 눌러 주소를 선택하세요"
                          />
                          <button
                            type="button"
                            className="mypage-btn-address-search"
                            onClick={handleAddressSearch}
                          >
                            주소 검색
                          </button>
                        </div>
                        {editBaseAddress && (
                          <input
                            className="mypage-input mypage-address-detail"
                            value={editDetailAddress}
                            onChange={(e) => setEditDetailAddress(e.target.value)}
                            placeholder="동/호수 등 상세 주소를 입력하세요"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="mypage-field-value">
                        <span>{profile.address ?? '—'}</span>
                      </div>
                    )}
                  </div>

                  {/* Portfolio public */}
                  <div className="mypage-field span-full">
                    <label className="mypage-field-label"><Shield size={14} /> 포트폴리오 공개</label>
                    {editing ? (
                      <div className="mypage-radio-group">
                        <label className="mypage-radio-label">
                          <input type="radio" checked={editForm.isPortfolioPublic === true} onChange={() => setEditForm({ ...editForm, isPortfolioPublic: true })} />
                          공개
                        </label>
                        <label className="mypage-radio-label">
                          <input type="radio" checked={editForm.isPortfolioPublic === false} onChange={() => setEditForm({ ...editForm, isPortfolioPublic: false })} />
                          비공개
                        </label>
                      </div>
                    ) : (
                      <div className="mypage-field-value">
                        <span className={`mypage-badge ${profile.isPortfolioPublic ? 'green' : 'gray'}`}>
                          {profile.isPortfolioPublic ? '공개' : '비공개'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {editing && (
                <div className="mypage-action-row">
                  <button className="mypage-btn-cancel" onClick={cancelEditing}>
                    <X size={15} /> 취소
                  </button>
                  <button className="mypage-btn-save" onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? <Loader2 size={15} className="spin-animation" /> : <Save size={15} />}
                    저장
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Password Tab ─────────────────── */}
          {activeTab === 'password' && (
            <div>
              <div className="mypage-section-head">
                <div>
                  <h2 className="mypage-section-title">{passwordTabLabel}</h2>
                  <p className="mypage-section-desc">
                    {needsPasswordSetup
                      ? '간편 로그인으로 가입한 계정입니다. 이메일·비밀번호 로그인을 사용하려면 비밀번호를 설정해 주세요.'
                      : isCurrentPasswordVerified
                        ? '새로운 비밀번호를 입력해 주세요'
                        : '현재 비밀번호를 입력하여 본인 확인을 진행해 주세요'}
                  </p>
                </div>
              </div>

              {pwSuccess && <Feedback msg={pwSuccess} type="success" />}
              {pwError && <Feedback msg={pwError} type="error" />}

              {needsPasswordSetup ? (
                <form onSubmit={handleChangePassword} className="mypage-form mypage-form-password">
                  <div className="mypage-field span-full">
                    <label className="mypage-field-label">새 비밀번호 <span style={{ color: 'var(--red)', marginLeft: '2px' }}>*</span></label>
                    <div className="mypage-pw-wrapper">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        className="mypage-input"
                        placeholder="8~16자 영문, 숫자, 특수문자 조합"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button type="button" className="mypage-pw-toggle" onClick={() => setShowNewPw(!showNewPw)}>
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="mypage-field span-full">
                    <label className="mypage-field-label">새 비밀번호 확인 <span style={{ color: 'var(--red)', marginLeft: '2px' }}>*</span></label>
                    <div className="mypage-pw-wrapper">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        className="mypage-input"
                        placeholder="동일한 비밀번호를 한번 더 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button type="button" className="mypage-pw-toggle" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="mypage-action-row" style={{ marginTop: '32px' }}>
                    <button type="submit" className="mypage-btn-save" disabled={pwLoading}>
                      {pwLoading ? <Loader2 size={15} className="spin-animation" /> : <Save size={15} />}
                      비밀번호 설정
                    </button>
                  </div>
                </form>
              ) : !isCurrentPasswordVerified ? (
                <form onSubmit={handleVerifyCurrentPassword} className="mypage-form mypage-form-password">
                  <div className="mypage-field span-full">
                    <label className="mypage-field-label">현재 비밀번호</label>
                    <div className="mypage-pw-verify-row">
                      <div className="mypage-pw-wrapper">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          className="mypage-input"
                          placeholder="현재 비밀번호를 입력하세요"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button type="button" className="mypage-pw-toggle" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                          {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button type="submit" className="mypage-btn-verify-pw" disabled={pwLoading}>
                        {pwLoading ? <Loader2 size={15} className="spin-animation" /> : <Lock size={15} />}
                        현재 비밀번호 확인
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="mypage-form mypage-form-password">
                  <div className="mypage-field span-full">
                    <label className="mypage-field-label">새 비밀번호 <span style={{ color: 'var(--red)', marginLeft: '2px' }}>*</span></label>
                    <div className="mypage-pw-wrapper">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        className="mypage-input"
                        placeholder="8~16자 영문, 숫자, 특수문자 조합"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button type="button" className="mypage-pw-toggle" onClick={() => setShowNewPw(!showNewPw)}>
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="mypage-field span-full">
                    <label className="mypage-field-label">새 비밀번호 확인 <span style={{ color: 'var(--red)', marginLeft: '2px' }}>*</span></label>
                    <div className="mypage-pw-wrapper">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        className="mypage-input"
                        placeholder="동일한 비밀번호를 한번 더 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button type="button" className="mypage-pw-toggle" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="mypage-action-row" style={{ marginTop: '32px' }}>
                    <button type="button" className="mypage-btn-cancel" onClick={resetPasswordFlow}>
                      <X size={15} /> 취소
                    </button>
                    <button type="submit" className="mypage-btn-save" disabled={pwLoading}>
                      {pwLoading ? <Loader2 size={15} className="spin-animation" /> : <Save size={15} />}
                      비밀번호 변경
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Notifications Tab ────────────── */}
          {activeTab === 'notifications' && profile && (
            <div>
              <div className="mypage-section-head">
                <div>
                  <h2 className="mypage-section-title">알림 설정</h2>
                  <p className="mypage-section-desc">변경 사항은 즉시 저장됩니다</p>
                </div>
              </div>

              {pushFeedback && <Feedback msg={pushFeedback.msg} type={pushFeedback.type} />}
              {notificationFeedback && (
                <Feedback msg={notificationFeedback.msg} type={notificationFeedback.type} />
              )}

              {isFirebaseConfigured() && pushPermission !== 'unsupported' && (
                <div className="mypage-notification-group">
                  <h3 className="mypage-notification-group-label">푸시 수신</h3>
                  <div className="mypage-toggles-list">
                    <div className="mypage-toggle-row" style={{ opacity: pushLoading ? 0.7 : 1 }}>
                      <div className="mypage-toggle-info">
                        <span className="mypage-toggle-label">브라우저 푸시 알림</span>
                        <span className="mypage-toggle-desc">{pushToggleDescription}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handlePushToggle(!pushToggleChecked)}
                        className={`mypage-toggle-btn ${pushToggleChecked ? 'active' : ''}`}
                        aria-checked={pushToggleChecked}
                        role="switch"
                        disabled={pushLoading || pushPermission === 'denied'}
                      >
                        <span className="mypage-toggle-knob" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mypage-notification-group">
                <h3 className="mypage-notification-group-label">알림 종류</h3>
                <div className="mypage-toggles-list">
                <ToggleSwitch
                  checked={profile.isBudgetAlertEnabled}
                  onChange={(v) => void handleNotificationToggle('isBudgetAlertEnabled', v)}
                  label="예산 초과 알림"
                  description="설정한 예산 기준(%) 초과 시 알림을 받습니다"
                  disabled={savingNotifications}
                />

                {profile.isBudgetAlertEnabled && (
                  <div className="mypage-threshold-row fade-in">
                    <label className="mypage-field-label">예산 대비 알림 기준 (%)</label>
                    <div className="mypage-threshold-control">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={profile.budgetAlertThreshold}
                        onChange={(e) => handleBudgetThresholdChange(Number(e.target.value))}
                        className="mypage-range"
                        disabled={savingNotifications}
                      />
                      {editingBudgetThreshold ? (
                        <div className="mypage-threshold-value-input-wrap">
                          <input
                            ref={budgetThresholdInputRef}
                            type="number"
                            min={0}
                            max={100}
                            className="mypage-threshold-value-input"
                            value={budgetThresholdDraft}
                            onChange={(e) => setBudgetThresholdDraft(e.target.value)}
                            onBlur={commitBudgetThresholdInput}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitBudgetThresholdInput();
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelBudgetThresholdInput();
                              }
                            }}
                            disabled={savingNotifications}
                          />
                          <span className="mypage-threshold-value-suffix">%</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="mypage-range-value mypage-range-value-btn"
                          onClick={startEditingBudgetThreshold}
                          disabled={savingNotifications}
                          title="클릭하여 직접 입력"
                        >
                          {profile.budgetAlertThreshold}%
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <ToggleSwitch
                  checked={profile.isInterestCategoryEnabled}
                  onChange={(v) => void handleNotificationToggle('isInterestCategoryEnabled', v)}
                  label="관심 카테고리 알림"
                  description="내가 등록한 관심 카테고리에 새 글이 올라오면 알려드립니다"
                  disabled={savingNotifications}
                />

                <ToggleSwitch
                  checked={profile.isGoalAlertEnabled}
                  onChange={(v) => void handleNotificationToggle('isGoalAlertEnabled', v)}
                  label="계좌 목표 달성 알림"
                  description="계좌 목표 금액에 도달하면 알려드립니다"
                  disabled={savingNotifications}
                />

                <ToggleSwitch
                  checked={profile.isSystemAlertEnabled}
                  onChange={(v) => void handleNotificationToggle('isSystemAlertEnabled', v)}
                  label="시스템 알림"
                  description="회원가입 환영, 서비스 공지 등 시스템 안내 알림을 받습니다"
                  disabled={savingNotifications}
                />
                </div>
              </div>
            </div>
          )}

          {/* ── Interest Categories Tab ─────── */}
          {activeTab === 'interestCategories' && (
            <div>
              <div className="mypage-section-head">
                <div>
                  <h2 className="mypage-section-title">관심 카테고리</h2>
                  <p className="mypage-section-desc">
                    구독 중인 공동구매 카테고리를 관리합니다. 새 공구가 올라오면 알림을 받을 수 있습니다.
                  </p>
                </div>
              </div>

              {interestCategorySuccess && <Feedback msg={interestCategorySuccess} type="success" />}
              {interestCategoryError && <Feedback msg={interestCategoryError} type="error" />}

              {loadingInterestCategories ? (
                <div className="mypage-loading">
                  <Loader2 size={24} className="spin-animation" />
                  <span>관심 카테고리 불러오는 중...</span>
                </div>
              ) : (
                <>
                  {interestCategories.length === 0 ? (
                    <div
                      style={{
                        padding: '32px 20px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        border: '1px dashed var(--border)',
                        borderRadius: '12px',
                        marginBottom: '24px',
                      }}
                    >
                      등록된 관심 카테고리가 없습니다.
                      <br />
                      아래에서 추가하거나, 공동구매 페이지에서 카테고리를 선택해 알림을 등록해 보세요.
                    </div>
                  ) : (
                    <div className="mypage-interest-list" style={{ marginBottom: '32px' }}>
                      {interestCategories.map((item) => (
                        <div key={item.id} className="mypage-interest-item">
                          <div className="mypage-interest-item-info">
                            <span className="mypage-interest-item-name">{item.categoryName}</span>
                            <span className="mypage-interest-item-desc">
                              새 공동구매 등록 시 알림을 받습니다
                            </span>
                          </div>
                          <div className="mypage-interest-item-actions">
                            <button
                              type="button"
                              className="mypage-btn-icon-danger"
                              onClick={() => handleDeleteInterestCategory(item)}
                              disabled={interestActionId === item.id}
                              title="알림 해제"
                            >
                              {interestActionId === item.id ? (
                                <Loader2 size={14} className="spin-animation" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {unsubscribedCategories.length > 0 && (
                    <div>
                      <h3 className="mypage-field-label" style={{ marginBottom: '4px' }}>
                        카테고리 추가
                      </h3>
                      <p className="mypage-section-desc" style={{ marginBottom: '8px' }}>
                        아직 등록하지 않은 카테고리를 선택해 관심 카테고리로 추가할 수 있습니다.
                      </p>
                      <div className="mypage-interest-add-grid">
                        {unsubscribedCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className="mypage-interest-add-btn"
                            onClick={() => handleAddInterestCategory(cat.id)}
                            disabled={addingCategoryId === cat.id}
                          >
                            {addingCategoryId === cat.id ? (
                              <Loader2 size={14} className="spin-animation" />
                            ) : (
                              <Plus size={14} />
                            )}
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Follow Tab ───────────────────── */}
          {activeTab === 'follow' && (
            <div>
              <div className="mypage-section-head">
                <div>
                  <h2 className="mypage-section-title">팔로우 목록</h2>
                  <p className="mypage-section-desc">내가 팔로우 중인 사용자와 나를 팔로우한 사용자를 확인합니다</p>
                </div>
              </div>

              <div className="sub-tabs-container" style={{ marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setFollowSubTab('following')}
                  className={`sub-tab-btn ${followSubTab === 'following' ? 'active' : ''}`}
                >
                  팔로잉 ({followingList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFollowSubTab('followers')}
                  className={`sub-tab-btn ${followSubTab === 'followers' ? 'active' : ''}`}
                >
                  팔로워 ({followersList.length})
                </button>
              </div>

              {followError && <Feedback msg={followError} type="error" />}

              {followLoading ? (
                <div className="mypage-loading">
                  <Loader2 size={24} className="spin-animation" />
                  <span>불러오는 중...</span>
                </div>
              ) : (
                (() => {
                  const list = followSubTab === 'following' ? followingList : followersList;
                  if (list.length === 0) {
                    return (
                      <div
                        style={{
                          padding: '32px 20px',
                          textAlign: 'center',
                          color: 'var(--text-secondary)',
                          fontSize: '14px',
                          border: '1px dashed var(--border)',
                          borderRadius: '12px',
                        }}
                      >
                        {followSubTab === 'following'
                          ? '아직 팔로우 중인 사용자가 없습니다.'
                          : '아직 팔로워가 없습니다.'}
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {list.map((u) => (
                        <div
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 16px',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            background: 'white',
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
                              fontSize: '14px',
                              fontWeight: '700',
                            }}
                          >
                            {u.nickname?.charAt(0) ?? '?'}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {u.nickname ?? '탈퇴한 사용자'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* ── Bookmarks Tab ────────────────── */}
          {activeTab === 'bookmarks' && (
            <div>
              <div className="mypage-section-head">
                <div>
                  <h2 className="mypage-section-title">저장한 글</h2>
                  <p className="mypage-section-desc">북마크한 Q&A 및 노하우 게시물을 확인합니다</p>
                </div>
              </div>

              {bookmarksError && <Feedback msg={bookmarksError} type="error" />}

              {bookmarksLoading ? (
                <div className="mypage-loading">
                  <Loader2 size={24} className="spin-animation" />
                  <span>불러오는 중...</span>
                </div>
              ) : bookmarks.length === 0 ? (
                <div
                  style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px',
                  }}
                >
                  아직 저장한 글이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bookmarks.map((b) => {
                    const isQna = b.type === 'QNA';
                    const accent = isQna ? 'var(--purple)' : 'var(--blue)';
                    const accentBg = isQna ? 'var(--purple-bg)' : 'var(--blue-bg)';
                    const TypeIcon = isQna ? HelpCircle : Lightbulb;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onOpenBoard?.(b.type, b.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '16px 18px',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          background: 'white',
                          textAlign: 'left',
                          cursor: onOpenBoard ? 'pointer' : 'default',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: accent,
                              background: accentBg,
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            <TypeIcon size={11} />
                            {isQna ? 'Q&A' : '노하우'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {formatRelativeKo(b.createdAt)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            lineHeight: '1.4',
                          }}
                        >
                          {isQna ? 'Q. ' : ''}
                          {b.title}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {stripMediaForPreview(b.content)}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span style={{ fontWeight: '600' }}>{b.authorNickname}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Eye size={12} />
                            {b.views.toLocaleString()}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <MessageSquare size={12} />
                            {b.likeCount}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Withdraw Tab ─────────────────── */}
          {activeTab === 'withdraw' && (
            <div>
              <div className="mypage-section-head">
                <div>
                  <h2 className="mypage-section-title" style={{ color: 'var(--red)' }}>회원 탈퇴</h2>
                  <p className="mypage-section-desc">탈퇴 시 모든 데이터가 영구적으로 삭제됩니다</p>
                </div>
              </div>

              <div className="mypage-withdraw-warning">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <p className="mypage-withdraw-warning-title">탈퇴 전 꼭 확인해 주세요</p>
                  <ul className="mypage-withdraw-warning-list">
                    <li>계정에 연결된 모든 거래 내역, 예산, 자산 데이터가 삭제됩니다.</li>
                    <li>작성하신 게시글 및 댓글이 모두 삭제됩니다.</li>
                    <li>한 번 탈퇴하면 복구가 불가능합니다.</li>
                  </ul>
                </div>
              </div>

              {withdrawError && <Feedback msg={withdrawError} type="error" />}

              <div className="mypage-withdraw-form">
                <label className="mypage-field-label" style={{ marginBottom: '10px', display: 'block' }}>
                  확인을 위해 아래 입력창에 <strong>회원탈퇴</strong>를 입력해 주세요
                </label>
                <input
                  className="mypage-input"
                  placeholder="회원탈퇴"
                  value={withdrawConfirm}
                  onChange={(e) => setWithdrawConfirm(e.target.value)}
                  style={{ maxWidth: '280px' }}
                />
              </div>

              <div className="mypage-action-row" style={{ marginTop: '24px' }}>
                <button
                  onClick={handleWithdraw}
                  className="mypage-btn-danger"
                  disabled={withdrawConfirm !== '회원탈퇴' || withdrawLoading}
                >
                  {withdrawLoading ? <Loader2 size={15} className="spin-animation" /> : <Trash2 size={15} />}
                  회원 탈퇴
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
