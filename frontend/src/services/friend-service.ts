import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import type { FriendRequest, Paginated, SearchedUser, User } from "@/types";

export const friendService = {
  async search(query: string, page = 1, limit = 20): Promise<Paginated<SearchedUser>> {
    const { data } = await apiClient.get<Paginated<SearchedUser>>(API_ROUTES.FRIENDS.SEARCH, {
      params: { q: query, page, limit },
    });
    return data;
  },
  async listFriends(page = 1, limit = 50): Promise<Paginated<User>> {
    const { data } = await apiClient.get<Paginated<User>>(API_ROUTES.FRIENDS.ROOT, {
      params: { page, limit },
    });
    return data;
  },
  async listIncoming(): Promise<Paginated<FriendRequest>> {
    const { data } = await apiClient.get<Paginated<FriendRequest>>(
      API_ROUTES.FRIENDS.REQUESTS_INCOMING,
    );
    return data;
  },
  async listOutgoing(): Promise<Paginated<FriendRequest>> {
    const { data } = await apiClient.get<Paginated<FriendRequest>>(
      API_ROUTES.FRIENDS.REQUESTS_OUTGOING,
    );
    return data;
  },
  async sendRequest(receiverId: string): Promise<FriendRequest> {
    const { data } = await apiClient.post<FriendRequest>(API_ROUTES.FRIENDS.REQUESTS, {
      receiverId,
    });
    return data;
  },
  async accept(requestId: string): Promise<FriendRequest> {
    const { data } = await apiClient.post<FriendRequest>(
      API_ROUTES.FRIENDS.REQUEST_ACCEPT(requestId),
    );
    return data;
  },
  async reject(requestId: string): Promise<FriendRequest> {
    const { data } = await apiClient.post<FriendRequest>(
      API_ROUTES.FRIENDS.REQUEST_REJECT(requestId),
    );
    return data;
  },
  async cancel(requestId: string): Promise<{ id: string; status: string }> {
    const { data } = await apiClient.delete(API_ROUTES.FRIENDS.REQUEST_CANCEL(requestId));
    return data;
  },
  async remove(friendId: string): Promise<{ removed: boolean }> {
    const { data } = await apiClient.delete(API_ROUTES.FRIENDS.REMOVE(friendId));
    return data;
  },
};
