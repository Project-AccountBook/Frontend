import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2, Play, User, Calendar, MapPin, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

type Mode = 'login' | 'signup' | 'reset';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<Mode>('login');

  // Common inputs & status
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Login inputs
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup inputs
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Reset password inputs
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);
  const [isResetEmailVerified, setIsResetEmailVerified] = useState(false);

  const resetState = () => {
    setEmail('');
    setCode('');
    setPassword('');
    setUsername('');
    birthDate && setBirthDate('');
    address && setAddress('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEmailSent(false);
    setIsEmailVerified(false);
    setIsResetEmailSent(false);
    setIsResetEmailVerified(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});
  };

  const handleModeChange = (newMode: Mode) => {
    resetState();
    setMode(newMode);
  };

  // --- Email Sending ---
  const sendVerificationCode = async (type: 'SIGNUP' | 'RESET') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email) {
      setFieldErrors({ email: '이메일을 입력해 주세요.' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldErrors({ email: '올바른 이메일 형식이 아닙니다.' });
      return;
    }

    setLoading(true);
    const endpoint = type === 'SIGNUP' ? '/api/v1/auth/email/send/signup' : '/api/v1/auth/email/send/password';
    try {
      // SIGNUP 시 이미 가입된 이메일인지 사전 확인 (회원가입 API 명세 기반 에러 응답 처리)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setSuccessMsg('인증 코드가 이메일로 전송되었습니다. 메일함을 확인해 주세요.');
        if (type === 'SIGNUP') setIsEmailSent(true);
        else setIsResetEmailSent(true);
      } else if (response.status === 409 || (resData.error && resData.error.includes('이미'))) {
        // 중복 이메일: 백엔드가 409 Conflict 또는 관련 메시지를 보낸 경우
        setErrorMsg('이미 가입된 이메일 주소입니다. 로그인 화면으로 돌아가 로그인해 주세요.');
      } else if (response.status === 429 || (resData.error && resData.error.includes('요청'))) {
        setErrorMsg('잠시 후 다시 시도해 주세요. (1분에 1회만 발송 가능)');
      } else {
        setErrorMsg(resData.error || '인증 코드 전송에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('서버와 통신하는 중 오류가 발생했습니다. 백엔드가 실행 중인지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // --- Email Verification ---
  const verifyCode = async (type: 'SIGNUP' | 'RESET') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!code) {
      setFieldErrors({ code: '인증 번호를 입력해 주세요.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type }),
      });
      const resData = await response.json();
      if (response.ok && resData.success && resData.data === true) {
        setSuccessMsg('이메일 인증이 완료되었습니다.');
        if (type === 'SIGNUP') setIsEmailVerified(true);
        else setIsResetEmailVerified(true);
      } else {
        setErrorMsg(resData.error || '인증 번호가 일치하지 않거나 만료되었습니다.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('서버와 통신하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // --- Login Submit ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const errors: Record<string, string> = {};
    if (!email) errors.email = '이메일을 입력해 주세요.';
    if (!password) errors.password = '비밀번호를 입력해 주세요.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        localStorage.setItem('accessToken', resData.data.accessToken);
        localStorage.setItem('refreshToken', resData.data.refreshToken);
        localStorage.setItem('userEmail', email);
        onLoginSuccess();
      } else {
        setErrorMsg(resData.error || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('서버 연결에 실패했습니다. 백엔드가 실행 중인지 확인하시거나, 데모 모드로 로그인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // --- Signup Submit ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const errors: Record<string, string> = {};
    if (!isEmailVerified) {
      errors.email = '이메일 인증을 완료해야 회원가입할 수 있습니다.';
    }
    if (!username) errors.username = '닉네임을 입력해 주세요.';
    if (!password) {
      errors.password = '비밀번호를 입력해 주세요.';
    } else if (!/(?=.*[0-9])(?=.*[a-zA-Z])(?=.*\W)(?=\S+$).{8,16}/.test(password)) {
      errors.password = '비밀번호는 8~16자 영문 대소문자, 숫자, 특수문자 조합이어야 합니다.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username,
          birthDate: birthDate ? birthDate : null,
          address: address ? address : null
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setSuccessMsg('회원가입이 완료되었습니다! 로그인 화면으로 돌아가 로그인해 주세요.');
        setTimeout(() => {
          handleModeChange('login');
        }, 2000);
      } else {
        setErrorMsg(resData.error || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('서버와 통신하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // --- Password Reset Submit ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const errors: Record<string, string> = {};
    if (!isResetEmailVerified) {
      errors.email = '이메일 인증을 완료해 주세요.';
    }
    if (!newPassword) {
      errors.newPassword = '새 비밀번호를 입력해 주세요.';
    } else if (!/(?=.*[0-9])(?=.*[a-zA-Z])(?=.*\W)(?=\S+$).{8,16}/.test(newPassword)) {
      errors.newPassword = '비밀번호는 8~16자 영문 대소문자, 숫자, 특수문자 조합이어야 합니다.';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = '새 비밀번호와 일치하지 않습니다.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setSuccessMsg('비밀번호가 성공적으로 재설정되었습니다! 새로운 비밀번호로 로그인해 주세요.');
        setTimeout(() => {
          handleModeChange('login');
        }, 2500);
      } else {
        setErrorMsg(resData.error || '비밀번호 재설정에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('서버와 통신하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('userEmail', 'demo@jointliving.com');
    onLoginSuccess();
  };

  // Demo signup handler (unused, commented out for strict TS)
  /*
  const handleDemoSignup = () => {
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('userEmail', email || 'demo-user@jointliving.com');
    onLoginSuccess();
  };
  */

  return (
    <div className="login-wrapper">
      <div className="login-card-container fade-in">

        {/* Header Section */}
        <div className="login-header">
          <h1 className="login-title" style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: 'var(--navy)' }}>Joint Living</h1>
          <p className="login-subtitle">
            {mode === 'login' && '함께하면 즐겁고 가벼워지는 공동생활 가계부'}
            {mode === 'signup' && '똑똑한 자산 관리의 시작, 공동생활 가계부 회원가입'}
            {mode === 'reset' && '비밀번호를 재설정하여 안전하게 계정을 찾아보세요'}
          </p>
        </div>

        {/* Global Feedback Messages */}
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

        {/* --- MODE: LOGIN --- */}
        {mode === 'login' && (
          <>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <div className={`input-icon-wrapper ${fieldErrors.email ? 'has-error' : ''}`}>
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="아이디"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                  />
                </div>
                {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <div className={`input-icon-wrapper ${fieldErrors.password ? 'has-error' : ''}`}>
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="input-action-btn"
                    tabIndex={-1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
              </div>

              <div className="login-options-row">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="remember-me-checkbox"
                  />
                  <span>로그인 상태 유지</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleModeChange('reset')}
                  className="login-text-link"
                  style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}
                >
                  비밀번호 찾기
                </button>
              </div>

              <button type="submit" className="login-btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin-animation" />
                    <span>로그인 중...</span>
                  </>
                ) : (
                  <span>로그인</span>
                )}
              </button>
            </form>

            {/* Social Logins */}
            <div className="login-divider">
              <span>간편 로그인</span>
            </div>

            <div className="social-login-icons-row">
              <a href="http://localhost:8000/oauth2/authorization/kakao" className="social-icon-btn kakao" title="카카오 로그인">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path fill="#3C1E1E" d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.553 1.706 4.8 4.29 5.99l-.865 3.167c-.078.29.088.59.366.666.084.024.17.025.25.004l3.727-2.47c.4.053.808.082 1.232.082 4.97 0 9-3.186 9-7.115C21 6.185 16.97 3 12 3z" />
                </svg>
              </a>
              <a href="http://localhost:8000/oauth2/authorization/naver" className="social-icon-btn naver" title="네이버 로그인">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#FFF" d="M16.2 3H21v18h-4.8l-8.4-12v12H3V3h4.8l8.4 12V3z" />
                </svg>
              </a>
              <a href="http://localhost:8000/oauth2/authorization/google" className="social-icon-btn google" title="구글 로그인">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 0 12 0 7.33 0 3.3 2.68 1.34 6.6l3.85 2.99C6.1 6.88 8.85 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.63z" />
                  <path fill="#FBBC05" d="M5.19 14.39C4.95 13.68 4.81 12.91 4.81 12s.14-1.68.38-2.39L1.34 6.6C.49 8.27 0 10.08 0 12s.49 3.73 1.34 5.4l3.85-3.01z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.04.7-2.36 1.11-4.23 1.11-3.15 0-5.9-1.84-6.81-4.55L1.34 17.75C3.3 21.68 7.33 24 12 24z" />
                </svg>
              </a>
            </div>

            <div className="login-footer-actions" style={{ marginTop: '28px' }}>
              <span>아직 계정이 없으신가요? <button onClick={() => handleModeChange('signup')} className="login-text-link font-bold" style={{ color: '#2563eb', marginLeft: '4px' }}>회원가입</button></span>
            </div>

            <div className="login-divider" style={{ margin: '16px 0' }}>
              <span>또는</span>
            </div>

            <button onClick={handleDemoLogin} className="login-btn-demo">
              <Play size={14} />
              <span>데모 모드로 체험하기</span>
            </button>
          </>
        )}

        {/* --- MODE: SIGNUP --- */}
        {mode === 'signup' && (
          <>
            <form onSubmit={handleSignup} className="login-form">

              {/* Email send and verify group */}
              <div className="form-group">
                <label className="form-label">이메일 주소 <span className="required-star">*</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className={`input-icon-wrapper ${fieldErrors.email ? 'has-error' : ''}`} style={{ flex: 1 }}>
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="example@email.com"
                      value={email}
                      disabled={isEmailVerified}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isEmailVerified || loading}
                    onClick={() => sendVerificationCode('SIGNUP')}
                    className="form-action-btn"
                  >
                    {isEmailSent ? '재발송' : '인증 요청'}
                  </button>
                </div>
                {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
              </div>

              {isEmailSent && !isEmailVerified && (
                <div className="form-group fade-in">
                  <label className="form-label">인증 번호 입력 <span className="required-star">*</span></label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className={`input-icon-wrapper ${fieldErrors.code ? 'has-error' : ''}`} style={{ flex: 1 }}>
                      <Lock size={18} className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="인증번호 6자리를 입력하세요"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          if (fieldErrors.code) setFieldErrors({ ...fieldErrors, code: '' });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => verifyCode('SIGNUP')}
                      className="form-action-btn verify"
                    >
                      인증하기
                    </button>
                  </div>
                  {fieldErrors.code && <span className="field-error-text">{fieldErrors.code}</span>}
                </div>
              )}

              {/* Basic Fields (active after email verification) */}
              <div className={`signup-expanded-fields ${isEmailVerified ? 'active' : ''}`}>
                <div className="form-group">
                  <label className="form-label">닉네임 <span className="required-star">*</span></label>
                  <div className={`input-icon-wrapper ${fieldErrors.username ? 'has-error' : ''}`}>
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="활동할 닉네임을 입력하세요"
                      value={username}
                      disabled={!isEmailVerified}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: '' });
                      }}
                    />
                  </div>
                  {fieldErrors.username && <span className="field-error-text">{fieldErrors.username}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">비밀번호 <span className="required-star">*</span></label>
                  <div className={`input-icon-wrapper ${fieldErrors.password ? 'has-error' : ''}`}>
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="8~16자 영문 대소문자, 숫자, 특수문자 조합"
                      value={password}
                      disabled={!isEmailVerified}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                      }}
                    />
                  </div>
                  {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">생년월일 (선택)</label>
                  <div className="input-icon-wrapper">
                    <Calendar size={18} className="input-icon" />
                    <input
                      type="date"
                      className="form-input"
                      value={birthDate}
                      disabled={!isEmailVerified}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">주소 (선택)</label>
                  <div className="input-icon-wrapper">
                    <MapPin size={18} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="시/군/구 동 주소를 입력하세요"
                      value={address}
                      disabled={!isEmailVerified}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isEmailVerified || loading}
                className="login-btn-submit"
                style={{ marginTop: '12px' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin-animation" />
                    <span>가입 진행 중...</span>
                  </>
                ) : (
                  <span>회원가입 완료</span>
                )}
              </button>
            </form>

            <div className="signup-footer-actions">
              <button onClick={() => handleModeChange('login')} className="login-back-btn">
                <ArrowLeft size={16} />
                <span>로그인 화면으로 돌아가기</span>
              </button>
            </div>
          </>
        )}

        {/* --- MODE: RESET PASSWORD --- */}
        {mode === 'reset' && (
          <>
            <form onSubmit={handleResetPassword} className="login-form">

              {/* Reset Email request */}
              <div className="form-group">
                <label className="form-label">이메일 주소 <span className="required-star">*</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className={`input-icon-wrapper ${fieldErrors.email ? 'has-error' : ''}`} style={{ flex: 1 }}>
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="등록된 이메일을 입력하세요"
                      value={email}
                      disabled={isResetEmailVerified}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isResetEmailVerified || loading}
                    onClick={() => sendVerificationCode('RESET')}
                    className="form-action-btn"
                  >
                    {isResetEmailSent ? '재발송' : '코드 발송'}
                  </button>
                </div>
                {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
              </div>

              {/* Reset code verify */}
              {isResetEmailSent && !isResetEmailVerified && (
                <div className="form-group fade-in">
                  <label className="form-label">인증 번호 입력 <span className="required-star">*</span></label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className={`input-icon-wrapper ${fieldErrors.code ? 'has-error' : ''}`} style={{ flex: 1 }}>
                      <Lock size={18} className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="인증번호 6자리를 입력하세요"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          if (fieldErrors.code) setFieldErrors({ ...fieldErrors, code: '' });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => verifyCode('RESET')}
                      className="form-action-btn verify"
                    >
                      인증하기
                    </button>
                  </div>
                  {fieldErrors.code && <span className="field-error-text">{fieldErrors.code}</span>}
                </div>
              )}

              {/* New Password setting inputs (active after reset code verification) */}
              <div className={`signup-expanded-fields ${isResetEmailVerified ? 'active' : ''}`}>
                <div className="form-group">
                  <label className="form-label">새 비밀번호 <span className="required-star">*</span></label>
                  <div className={`input-icon-wrapper ${fieldErrors.newPassword ? 'has-error' : ''}`}>
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="8~16자 영문 대소문자, 숫자, 특수문자 조합"
                      value={newPassword}
                      disabled={!isResetEmailVerified}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: '' });
                      }}
                    />
                  </div>
                  {fieldErrors.newPassword && <span className="field-error-text">{fieldErrors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">새 비밀번호 확인 <span className="required-star">*</span></label>
                  <div className={`input-icon-wrapper ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="동일한 비밀번호를 한번 더 입력하세요"
                      value={confirmPassword}
                      disabled={!isResetEmailVerified}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                      }}
                    />
                  </div>
                  {fieldErrors.confirmPassword && <span className="field-error-text">{fieldErrors.confirmPassword}</span>}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isResetEmailVerified || loading}
                className="login-btn-submit"
                style={{ marginTop: '12px' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin-animation" />
                    <span>재설정 중...</span>
                  </>
                ) : (
                  <span>비밀번호 재설정 완료</span>
                )}
              </button>
            </form>

            <div className="signup-footer-actions">
              <button onClick={() => handleModeChange('login')} className="login-back-btn">
                <ArrowLeft size={16} />
                <span>로그인 화면으로 돌아가기</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
