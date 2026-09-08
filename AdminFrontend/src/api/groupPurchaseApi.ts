import { authRequest } from './client';
import type { GroupPurchaseResponse } from './types';

export interface GroupPurchaseListParams {
  region?: string;
  categoryId?: number;
  nearMe?: boolean;
  sortBy?: 'latest' | 'deadline';
}

function buildQuery(params?: GroupPurchaseListParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  if (params.region) search.set('region', params.region);
  if (params.categoryId != null) search.set('categoryId', String(params.categoryId));
  if (params.nearMe) search.set('nearMe', 'true');
  if (params.sortBy) search.set('sortBy', params.sortBy);
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** GroupPurchaseController (/api/v1/group-purchases) */
export const groupPurchaseApi = {
  getAll: (params?: GroupPurchaseListParams) =>
    authRequest<GroupPurchaseResponse[]>(`/api/v1/group-purchases${buildQuery(params)}`),

  getById: (id: number) =>
    authRequest<GroupPurchaseResponse>(`/api/v1/group-purchases/${id}`),
};
