import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import type { PublicProfile, User } from "@/types";

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string | null;
  status?: string | null;
  username?: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
}

export const userService = {
  async updateMe(patch: UpdateProfilePayload): Promise<User> {
    const { data } = await apiClient.patch<User>(API_ROUTES.USERS.ME, patch);
    return data;
  },

  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<User>(API_ROUTES.USERS.ME_AVATAR, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async uploadCover(file: File): Promise<User> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<User>(API_ROUTES.USERS.ME_COVER, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean }>(API_ROUTES.USERS.ME_PASSWORD, payload);
    return data;
  },

  async logoutAllDevices(): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean }>(API_ROUTES.USERS.ME_LOGOUT_ALL);
    return data;
  },

  async deleteAccount(): Promise<{ ok: boolean }> {
    const { data } = await apiClient.delete<{ ok: boolean }>(API_ROUTES.USERS.ME);
    return data;
  },

  async getProfile(id: string): Promise<PublicProfile> {
    const { data } = await apiClient.get<PublicProfile>(API_ROUTES.USERS.ONE(id));
    return data;
  },
};
