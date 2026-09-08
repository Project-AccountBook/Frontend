import { authRequest } from './client';
import type { NotificationResponse, PageResponse } from './types';

/** NotificationController (/api/v1/notifications) */
export const notificationApi = {
  getNotifications: (page = 0, size = 10) =>
    authRequest<PageResponse<NotificationResponse>>(
      `/api/v1/notifications?page=${page}&size=${size}&sort=createdAt,desc`
    ),

  getUnreadCount: () =>
    authRequest<number>('/api/v1/notifications/unread-count'),

  markAsRead: (id: number) =>
    authRequest<NotificationResponse>(`/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllAsRead: () =>
    authRequest<void>('/api/v1/notifications/read/all', {
      method: 'PATCH',
    }),

  deleteNotification: (id: number) =>
    authRequest<void>(`/api/v1/notifications/${id}`, {
      method: 'DELETE',
    }),

  registerDeviceToken: (fcmToken: string) =>
    authRequest<void>('/api/v1/notifications/device-token', {
      method: 'POST',
      body: JSON.stringify({ fcmToken }),
    }),

  unregisterDeviceToken: () =>
    authRequest<void>('/api/v1/notifications/device-token', {
      method: 'DELETE',
    }),

  /** Fetch all pages (for client-side filtering) */
  fetchAll: async (): Promise<{ items: NotificationResponse[]; error: string | null }> => {
    const all: NotificationResponse[] = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      const result = await notificationApi.getNotifications(page, 50);
      if (!result.ok || !result.data) {
        return {
          items: all,
          error: result.error ?? '알림을 불러오지 못했습니다.',
        };
      }

      all.push(...result.data.content);
      totalPages = result.data.totalPages;
      page += 1;
    }

    return { items: all, error: null };
  },
};
