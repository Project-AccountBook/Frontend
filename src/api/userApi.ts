import { authRequest, publicRequest } from './client';
import type {
  SignupRequest,
  SignupResponse,
  UpdatePasswordRequest,
  UpdateProfileRequest,
  UserProfileResponse,
} from './types';

/** UserController (/api/v1/users) */
export const userApi = {
  signup: (body: SignupRequest) =>
    publicRequest<SignupResponse>('/api/v1/users/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMyProfile: () =>
    authRequest<UserProfileResponse>('/api/v1/users/me'),

  updateMyProfile: (body: UpdateProfileRequest) =>
    authRequest<void>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  updatePassword: (body: UpdatePasswordRequest) =>
    authRequest<void>('/api/v1/users/password', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  withdraw: () =>
    authRequest<void>('/api/v1/users/withdraw', {
      method: 'DELETE',
    }),
};
