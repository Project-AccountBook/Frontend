import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Bell,
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
} from 'lucide-react';

interface UserProfile {
  email: string;
  username: string;
  birthDate: string | null;
  address: string | null;
  budgetAlertThreshold: number;
  isPortfolioPublic: boolean;
  isBudgetAlertEnabled: boolean;
  isInterestCategoryEnabled: boolean;
  isSystemAlertEnabled: boolean;
}

type MyPageTab = 'profile' | 'password' | 'notifications' | 'withdraw';

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
});

export const MyPageView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MyPageTab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Withdraw
  const [withdrawConfirm, setWithdrawConfirm] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // 프로필 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const res = await fetch('/api/v1/users/me', { headers: authHeader() });
        const data = await res.json();
        if (res.ok && data.success) {
          setProfile(data.data);
          setEditForm(data.data);
        } else {
          setProfileError(data.error ?? '프로필을 불러오는 데 실패했습니다.');
        }
      } catch {
        setProfileError('서버와 통신 중 오류가 발생했습니다. 백엔드가 실행 중인지 확인해 주세요.');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // 프로필 저장
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      const body = {
        username: editForm.username,
        birthDate: editForm.birthDate ?? null,
        address: editForm.address ?? null,
        budgetAlertThreshold: editForm.budgetAlertThreshold ?? 80,
        isPortfolioPublic: editForm.isPortfolioPublic ?? false,
        isBudgetAlertEnabled: editForm.isBudgetAlertEnabled ?? true,
        isInterestCategoryEnabled: editForm.isInterestCategoryEnabled ?? true,
        isSystemAlertEnabled: editForm.isSystemAlertEnabled ?? true,
      };
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile({ ...profile!, ...editForm } as UserProfile);
        setEditing(false);
        setProfileSuccess('프로필이 성공적으로 저장되었습니다.');
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(data.error ?? '저장에 실패했습니다.');
      }
    } catch {
      setProfileError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSavingProfile(false);
    }
  };

  // 알림 설정
  const handleSaveNotifications = async () => {
    if (!profile) return;
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      const body = {
        username: profile.username,
        birthDate: profile.birthDate ?? null,
        address: profile.address ?? null,
        budgetAlertThreshold: profile.budgetAlertThreshold,
        isPortfolioPublic: profile.isPortfolioPublic,
        isBudgetAlertEnabled: profile.isBudgetAlertEnabled,
        isInterestCategoryEnabled: profile.isInterestCategoryEnabled,
        isSystemAlertEnabled: profile.isSystemAlertEnabled,
      };
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess('알림 설정이 저장되었습니다.');
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(data.error ?? '저장에 실패했습니다.');
      }
    } catch {
      setProfileError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSavingProfile(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (!newPassword) { setPwError('새 비밀번호를 입력해 주세요.'); return; }
    if (!/(?=.*[0-9])(?=.*[a-zA-Z])(?=.*\W)(?=\S+$).{8,16}/.test(newPassword)) {
      setPwError('비밀번호는 8~16자 영문 대소문자, 숫자, 특수문자 조합이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) { setPwError('새 비밀번호가 일치하지 않습니다.'); return; }

    setPwLoading(true);
    try {
      const res = await fetch('/api/v1/users/password', {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => setPwSuccess(null), 3000);
      } else {
        setPwError(data.error ?? '비밀번호 변경에 실패했습니다.');
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
      const res = await fetch('/api/v1/users/withdraw', {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (res.ok) {
        localStorage.clear();
        window.location.reload();
      } else {
        const data = await res.json();
        setWithdrawError(data.error ?? '회원 탈퇴에 실패했습니다.');
      }
    } catch {
      setWithdrawError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const tabs: { id: MyPageTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: '프로필 정보', icon: User },
    { id: 'password', label: '비밀번호 변경', icon: Lock },
    { id: 'notifications', label: '알림 설정', icon: Bell },
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
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="mypage-toggle-row">
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
                  <button className="mypage-btn-edit" onClick={() => { setEditing(true); setEditForm(profile); }}>
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
                  <div className="mypage-field">
                    <label className="mypage-field-label"><MapPin size={14} /> 주소</label>
                    {editing ? (
                      <input
                        className="mypage-input"
                        value={editForm.address ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        placeholder="주소를 입력하세요"
                      />
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
                  <button className="mypage-btn-cancel" onClick={() => setEditing(false)}>
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
                  <h2 className="mypage-section-title">비밀번호 변경</h2>
                  <p className="mypage-section-desc">현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다</p>
                </div>
              </div>

              {pwSuccess && <Feedback msg={pwSuccess} type="success" />}
              {pwError && <Feedback msg={pwError} type="error" />}

              <form onSubmit={handleChangePassword} className="mypage-form">
                <div className="mypage-field span-full">
                  <label className="mypage-field-label">현재 비밀번호</label>
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
                </div>

                <div className="mypage-field span-full">
                  <label className="mypage-field-label">새 비밀번호 <span style={{ color: 'var(--red)', marginLeft: '2px' }}>*</span></label>
                  <div className="mypage-pw-wrapper">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      className="mypage-input"
                      placeholder="8~16자 영문 대소문자, 숫자, 특수문자 조합"
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

                <div className="mypage-action-row">
                  <button type="submit" className="mypage-btn-save" disabled={pwLoading}>
                    {pwLoading ? <Loader2 size={15} className="spin-animation" /> : <Save size={15} />}
                    비밀번호 변경
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Notifications Tab ────────────── */}
          {activeTab === 'notifications' && profile && (
            <div>
              <div className="mypage-section-head">
                <div>
                  <h2 className="mypage-section-title">알림 설정</h2>
                  <p className="mypage-section-desc">앱 내 알림 및 서비스 수신 여부를 설정합니다</p>
                </div>
              </div>

              {profileSuccess && <Feedback msg={profileSuccess} type="success" />}
              {profileError && <Feedback msg={profileError} type="error" />}

              <div className="mypage-toggles-list">
                <ToggleSwitch
                  checked={profile.isBudgetAlertEnabled}
                  onChange={(v) => setProfile({ ...profile, isBudgetAlertEnabled: v })}
                  label="예산 초과 알림"
                  description="설정한 예산 기준(%) 초과 시 알림을 받습니다"
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
                        onChange={(e) => setProfile({ ...profile, budgetAlertThreshold: Number(e.target.value) })}
                        className="mypage-range"
                      />
                      <span className="mypage-range-value">{profile.budgetAlertThreshold}%</span>
                    </div>
                  </div>
                )}

                <ToggleSwitch
                  checked={profile.isInterestCategoryEnabled}
                  onChange={(v) => setProfile({ ...profile, isInterestCategoryEnabled: v })}
                  label="관심 카테고리 알림"
                  description="내가 등록한 관심 카테고리에 새 글이 올라오면 알려드립니다"
                />

                <ToggleSwitch
                  checked={profile.isSystemAlertEnabled}
                  onChange={(v) => setProfile({ ...profile, isSystemAlertEnabled: v })}
                  label="보안 알림"
                  description="로그인, 비밀번호 변경 등 보안 관련 이벤트를 알려드립니다"
                />
              </div>

              <div className="mypage-action-row" style={{ marginTop: '32px' }}>
                <button className="mypage-btn-save" onClick={handleSaveNotifications} disabled={savingProfile}>
                  {savingProfile ? <Loader2 size={15} className="spin-animation" /> : <Save size={15} />}
                  설정 저장
                </button>
              </div>
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
