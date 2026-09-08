import { authRequest } from './client';
import type {
  LocationResponse,
  NearbyUserResponse,
  UpdateLocationRequest,
} from './types';

/** UserLocationController (/api/v1/users/me/location) */
export const locationApi = {
  get: () => authRequest<LocationResponse>('/api/v1/users/me/location'),
  update: (body: UpdateLocationRequest) =>
    authRequest<LocationResponse>('/api/v1/users/me/location', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  nearby: (radiusKm: number) =>
    authRequest<NearbyUserResponse[]>(
      `/api/v1/users/me/location/nearby?radiusKm=${encodeURIComponent(radiusKm)}`
    ),
};
