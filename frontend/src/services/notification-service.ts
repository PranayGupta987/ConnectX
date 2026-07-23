import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import type { AppNotification, NotificationsPage } from "@/types";

export const notificationService = {
  async list(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<NotificationsPage> {
    const { data } = await apiClient.get<NotificationsPage>(API_ROUTES.NOTIFICATIONS.ROOT, {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        unreadOnly: params.unreadOnly ? "true" : undefined,
      },
    });
    return data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get<{ unread: number }>(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT);
    return data.unread;
  },

  async markRead(id: string): Promise<AppNotification> {
    const { data } = await apiClient.patch<AppNotification>(API_ROUTES.NOTIFICATIONS.ONE_READ(id));
    return data;
  },

  async markAllRead(): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean }>(API_ROUTES.NOTIFICATIONS.READ_ALL);
    return data;
  },

  async remove(id: string): Promise<{ id: string }> {
    const { data } = await apiClient.delete<{ id: string }>(API_ROUTES.NOTIFICATIONS.ONE(id));
    return data;
  },

  async clearAll(): Promise<{ ok: boolean }> {
    const { data } = await apiClient.delete<{ ok: boolean }>(API_ROUTES.NOTIFICATIONS.ROOT);
    return data;
  },
};
