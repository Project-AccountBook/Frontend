export type BoardType = 'QNA' | 'KNOWHOW';
export type ReferenceType = 'QNA' | 'KNOWHOW' | 'GROUPPURCHASE';

export interface BoardResponse {
  id: number;
  userId: number;
  authorNickname: string;
  categoryId: number;
  title: string;
  content: string;
  type: BoardType;
  views: number;
  resolved: boolean;
  urgent: boolean;
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
  tags: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardSearchResponse {
  id: number;
  userId: number;
  categoryId: number;
  title: string;
  content: string;
  type: string;
  tags: string[];
  createdAt: string;
}

export interface BoardHotResponse {
  id: number;
  title: string;
  type: BoardType;
  views: number;
  likeCount: number;
  score: number;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CommentResponse {
  id: number;
  userId: number;
  authorNickname: string;
  referenceId: number;
  referenceType: ReferenceType;
  parentId: number | null;
  content: string;
  deleted: boolean;
  accepted: boolean;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentThreadResponse {
  parent: CommentResponse;
  replies: CommentResponse[];
}

export interface BoardCategory {
  id: number;
  name: string;
  boardType: BoardType;
  displayOrder: number;
}

export interface LikeToggleResponse {
  liked: boolean;
  likeCount: number;
}

export interface BookmarkToggleResponse {
  bookmarked: boolean;
}

export interface FollowToggleResponse {
  following: boolean;
  followerCount: number;
}

export interface UserStatsResponse {
  userId: number;
  nickname: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  following: boolean;
}

export interface FollowUserResponse {
  userId: number;
  nickname: string;
}

export interface TagResponse {
  id: number;
  name: string;
}

export interface ImageResponse {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

import { authFetch } from '../api/client';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await authFetch(url, { ...init, headers });
  const text = await res.text();
  const json = text ? JSON.parse(text) : { success: res.ok, data: null, error: null };
  if (!res.ok || json.success === false) {
    throw new Error(json.error ?? `요청 실패 (${res.status})`);
  }
  return json.data as T;
}

export async function listBoards(
  type: BoardType | null = null,
  page = 0,
  size = 10,
  tag: string | null = null
): Promise<PageResponse<BoardResponse>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.set('sort', 'createdAt,desc');
  if (type) params.set('type', type);
  if (tag) params.set('tag', tag);
  return request(`/api/v1/boards?${params.toString()}`);
}

export async function searchBoards(
  keyword: string,
  page = 0,
  size = 50
): Promise<PageResponse<BoardSearchResponse>> {
  return request(
    `/api/v1/boards/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
  );
}

export async function listHotBoards(
  type: BoardType,
  days = 7,
  limit = 3
): Promise<BoardHotResponse[]> {
  return request(`/api/v1/boards/hot?type=${type}&days=${days}&limit=${limit}`);
}

export async function getBoard(id: number): Promise<BoardResponse> {
  return request(`/api/v1/boards/${id}`);
}

export async function createBoard(req: {
  categoryId: number;
  title: string;
  content: string;
  type: BoardType;
  tags?: string[];
}): Promise<{ id: number; title: string }> {
  return request('/api/v1/boards', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function updateBoard(
  id: number,
  req: { title: string; content: string; type: BoardType; tags?: string[] }
): Promise<{ id: number; title: string }> {
  return request(`/api/v1/boards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(req),
  });
}

export async function deleteBoard(id: number): Promise<number> {
  return request(`/api/v1/boards/${id}`, { method: 'DELETE' });
}

export async function setBoardResolved(id: number, value: boolean): Promise<boolean> {
  return request(`/api/v1/boards/${id}/resolved`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  });
}

export async function setBoardUrgent(id: number, value: boolean): Promise<boolean> {
  return request(`/api/v1/boards/${id}/urgent`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  });
}

export async function toggleBoardLike(id: number): Promise<LikeToggleResponse> {
  return request(`/api/v1/boards/${id}/like`, { method: 'POST' });
}

export async function toggleCommentLike(id: number): Promise<LikeToggleResponse> {
  return request(`/api/v1/comments/${id}/like`, { method: 'POST' });
}

export async function toggleBoardBookmark(id: number): Promise<BookmarkToggleResponse> {
  return request(`/api/v1/boards/${id}/bookmark`, { method: 'POST' });
}

export async function listMyBookmarks(): Promise<BoardResponse[]> {
  return request(`/api/v1/users/me/bookmarks`);
}

export async function attachBoardImage(
  boardId: number,
  imageUrl: string,
  s3Key?: string
): Promise<ImageResponse> {
  return request(`/api/v1/boards/${boardId}/images`, {
    method: 'POST',
    body: JSON.stringify({ imageUrl, s3Key: s3Key ?? null }),
  });
}

export async function listBoardImages(boardId: number): Promise<ImageResponse[]> {
  return request(`/api/v1/boards/${boardId}/images`);
}

export async function deleteImage(imageId: number): Promise<number> {
  return request(`/api/v1/images/${imageId}`, { method: 'DELETE' });
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch(`/api/files/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    throw new Error(`업로드 실패 (${res.status})`);
  }
  const json = (await res.json()) as { url: string };
  return json.url;
}

export async function listComments(
  postId: number,
  referenceType: ReferenceType
): Promise<CommentResponse[]> {
  return request(`/api/v1/comments/${postId}?referenceType=${referenceType}`);
}

export async function listCommentThreads(
  postId: number,
  referenceType: ReferenceType,
  page = 0,
  size = 20
): Promise<PageResponse<CommentThreadResponse>> {
  return request(
    `/api/v1/comments/${postId}/threads?referenceType=${referenceType}&page=${page}&size=${size}`
  );
}

export async function createComment(
  postId: number,
  content: string,
  referenceType: ReferenceType
): Promise<number> {
  return request(`/api/v1/comments/${postId}`, {
    method: 'POST',
    body: JSON.stringify({ referenceType, content }),
  });
}

export async function replyComment(
  postId: number,
  parentCommentId: number,
  content: string,
  referenceType: ReferenceType
): Promise<number> {
  return request(`/api/v1/comments/${postId}/${parentCommentId}`, {
    method: 'POST',
    body: JSON.stringify({ referenceType, content }),
  });
}

export async function updateComment(commentId: number, content: string): Promise<number> {
  return request(`/api/v1/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export async function acceptComment(commentId: number): Promise<number> {
  return request(`/api/v1/comments/${commentId}/accept`, { method: 'PATCH' });
}

export async function deleteComment(commentId: number): Promise<number> {
  return request(`/api/v1/comments/${commentId}`, { method: 'DELETE' });
}

export async function listBoardCategories(type: BoardType): Promise<BoardCategory[]> {
  return request(`/api/v1/board-categories?type=${type}`);
}

export async function listTags(): Promise<TagResponse[]> {
  return request(`/api/v1/tags`);
}

export async function toggleFollow(targetUserId: number): Promise<FollowToggleResponse> {
  return request(`/api/v1/users/${targetUserId}/follow`, { method: 'POST' });
}

export async function listFollowers(userId: number): Promise<FollowUserResponse[]> {
  return request(`/api/v1/users/${userId}/followers`);
}

export async function listFollowing(userId: number): Promise<FollowUserResponse[]> {
  return request(`/api/v1/users/${userId}/following`);
}

export async function getUserStats(userId: number): Promise<UserStatsResponse> {
  return request(`/api/v1/users/${userId}/stats`);
}

// Admin
export interface AdminBoardResponse {
  id: number;
  userId: number;
  categoryId: number;
  title: string;
  content: string;
  type: BoardType;
  views: number;
  adminDeleted: boolean;
  userDeleted: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface AdminCommentResponse {
  id: number;
  userId: number;
  referenceId: number;
  referenceType: ReferenceType;
  parentId: number | null;
  content: string;
  adminDeleted: boolean;
  userDeleted: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface LikeReconcileReport {
  scanned: number;
  mismatched: number;
  corrected: number;
}

export async function adminListBoards(
  type: BoardType | null = null,
  includeDeleted = false,
  page = 0,
  size = 20
): Promise<PageResponse<AdminBoardResponse>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.set('includeDeleted', String(includeDeleted));
  if (type) params.set('type', type);
  return request(`/api/v1/admin/boards?${params.toString()}`);
}

export async function adminListComments(
  referenceType: ReferenceType | null = null,
  referenceId: number | null = null,
  page = 0,
  size = 20
): Promise<PageResponse<AdminCommentResponse>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.set('sort', 'createdAt,desc');
  if (referenceType) params.set('referenceType', referenceType);
  if (referenceId !== null) params.set('referenceId', String(referenceId));
  return request(`/api/v1/admin/comments?${params.toString()}`);
}

export async function adminDeleteBoard(boardId: number): Promise<number> {
  return request(`/api/v1/admin/boards/${boardId}`, { method: 'DELETE' });
}

export async function adminDeleteComment(commentId: number): Promise<number> {
  return request(`/api/v1/admin/comments/${commentId}`, { method: 'DELETE' });
}

export async function adminReconcileLikes(limit = 500): Promise<LikeReconcileReport> {
  return request(`/api/v1/admin/likes/reconcile?limit=${limit}`, { method: 'POST' });
}

export async function adminReindexBoards(): Promise<number> {
  return request(`/api/v1/admin/boards/reindex`, { method: 'POST' });
}

let cachedMyUserId: Promise<number> | null = null;

export async function getMyUserId(): Promise<number> {
  if (!cachedMyUserId) {
    cachedMyUserId = request<{ id: number }>(`/api/v1/users/me`).then((r) => r.id);
    cachedMyUserId.catch(() => {
      cachedMyUserId = null;
    });
  }
  return cachedMyUserId;
}

export function clearMyUserIdCache(): void {
  cachedMyUserId = null;
}

const COLOR_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#22c55e',
];

export function authorColorForUser(userId: number): string {
  return COLOR_PALETTE[userId % COLOR_PALETTE.length];
}

export function authorLabelForUser(userId: number): string {
  return `사용자 ${userId}`;
}

export function authorInitialForUser(userId: number): string {
  return `U${userId % 100}`.slice(0, 2);
}

export function formatRelativeKo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (Number.isNaN(diffMs)) return isoDate;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return date.toLocaleDateString('ko-KR');
}
