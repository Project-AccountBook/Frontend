import { publicRequest, authRequest } from './client';
import type {
  EmailRequest,
  LoginRequest,
  ResetPasswordRequest,
  TokenResponse,
  VerifyRequest,
} from './types';

/** AuthController (/api/v1/auth) */
export const authApi = {
  login: (body: LoginRequest) =>
    publicRequest<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  exchangeOAuthCode: (code: string) =>
    publicRequest<TokenResponse>('/api/v1/auth/oauth2/token', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  reissue: (refreshToken: string) =>
    publicRequest<TokenResponse>('/api/v1/auth/reissue', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  sendSignupCode: (body: EmailRequest) =>
    publicRequest<void>('/api/v1/auth/email/send/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  sendPasswordCode: (body: EmailRequest) =>
    publicRequest<void>('/api/v1/auth/email/send/password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyCode: (body: VerifyRequest) =>
    publicRequest<boolean>('/api/v1/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resetPassword: (body: ResetPasswordRequest) =>
    publicRequest<void>('/api/v1/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    authRequest<void>('/api/v1/auth/logout', {
      method: 'POST',
    }),
};
