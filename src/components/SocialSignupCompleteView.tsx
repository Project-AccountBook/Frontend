import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { userApi } from '../api';
import type { UserProfileResponse } from '../api/types';
import { openAddressSearch } from '../utils/daumPostcode';
import { useBackHandler } from '../lib/nativeBack';
import modiLogo from '../assets/modi-logo.png';

interface SocialSignupCompleteViewProps {
  onComplete: () => void;
}

export const SocialSignupCompleteView: React.FC<SocialSignupCompleteViewProps> = ({ onComplete }) => {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [birthDate, setBirthDate] = useState('');
  const [baseAddress, setBaseAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  const maxBirthDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const result = await userApi.getMyProfile();
        if (result.ok && result.data) {
          setProfile(result.data);
        } else {
          setErrorMsg(result.error ?? '프로필을 불러오는 데 실패했습니다.');
        }
      } catch {
        setErrorMsg('서버와 통신하는 중 오류가 발생했습니다.');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  useBackHandler(true, () => {
    onComplete();
    return true;
  });

  const handleAddressSearch = async () => {
    try {
      await openAddressSearch((selectedAddress) => {
        setBaseAddress(selectedAddress);
        setDetailAddress('');
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('주소 검색 창을 열 수 없습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (birthDate && birthDate > maxBirthDate) {
      setFieldErrors({ birthDate: '생년월일은 오늘 이후 날짜로 설정할 수 없습니다.' });
      return;
    }
    setFieldErrors({});

    if (!profile) {
      onComplete();
      return;
    }

    const fullAddress = [baseAddress, detailAddress.trim()].filter(Boolean).join(' ') || null;
    const hasChanges = Boolean(birthDate || fullAddress);

    if (!hasChanges) {
      onComplete();
      return;
    }

    setLoading(true);
    try {
      const result = await userApi.updateMyProfile({
        username: profile.username,
        birthDate: birthDate || null,
        address: fullAddress,
        budgetAlertThreshold: profile.budgetAlertThreshold,
        isPortfolioPublic: profile.isPortfolioPublic,
        isBudgetAlertEnabled: profile.isBudgetAlertEnabled,
        isInterestCategoryEnabled: profile.isInterestCategoryEnabled,
        isGoalAlertEnabled: profile.isGoalAlertEnabled ?? true,
        isSystemAlertEnabled: profile.isSystemAlertEnabled,
      });

      if (result.ok) {
        setSuccessMsg('회원가입이 완료되었습니다!');
        setTimeout(onComplete, 800);
      } else {
        setErrorMsg(result.error ?? '프로필 저장에 실패했습니다.');
      }
    } catch {
      setErrorMsg('서버와 통신하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="login-wrapper">
        <div className="login-card-container fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Loader2 size={32} className="spin-animation" style={{ color: 'var(--navy)' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            프로필 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card-container fade-in">
        <div className="login-header">
          <img src={modiLogo} alt="MODI" className="login-logo" />
          <p className="login-subtitle">
            간편 로그인 가입이 완료되었습니다.
            {profile?.username ? ` ${profile.username}님,` : ''} 추가 정보를 입력해 주세요.
          </p>
        </div>

        {errorMsg && (
          <div className="login-error-alert fade-in">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="login-success-alert fade-in">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">생년월일 (선택)</label>
            <div className={`input-icon-wrapper ${fieldErrors.birthDate ? 'has-error' : ''}`}>
              <Calendar size={18} className="input-icon" />
              <input
                type="date"
                className="form-input"
                value={birthDate}
                max={maxBirthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  if (fieldErrors.birthDate) setFieldErrors({ ...fieldErrors, birthDate: '' });
                }}
              />
            </div>
            {fieldErrors.birthDate && <span className="field-error-text">{fieldErrors.birthDate}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">주소 (선택)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="input-icon-wrapper" style={{ flex: 1 }}>
                <MapPin size={18} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="주소 검색을 눌러 주소를 선택하세요"
                  value={baseAddress}
                  readOnly
                />
              </div>
              <button type="button" onClick={handleAddressSearch} className="form-action-btn">
                주소 검색
              </button>
            </div>
          </div>

          {baseAddress && (
            <div className="form-group fade-in">
              <label className="form-label">상세 주소</label>
              <div className="input-icon-wrapper">
                <MapPin size={18} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="동/호수 등 상세 주소를 입력하세요"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="submit" className="login-btn-submit" disabled={loading} style={{ marginTop: '12px' }}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin-animation" />
                <span>저장 중...</span>
              </>
            ) : (
              <span>회원가입 완료</span>
            )}
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="login-text-link"
            disabled={loading}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            나중에 입력하기
          </button>
        </form>
      </div>
    </div>
  );
};
