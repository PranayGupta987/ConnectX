import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import type { Conversation, Message, Paginated } from "@/types";

export interface SendMessageInput {
  content?: string;
  replyTo?: string | null;
  image?: File | null;
}

export const chatService = {
  async listConversations(page = 1, limit = 30): Promise<Paginated<Conversation>> {
    const { data } = await apiClient.get<Paginated<Conversation>>(API_ROUTES.CHATS.ROOT, {
      params: { page, limit },
    });
    return data;
  },
  async openConversation(userId: string): Promise<Conversation> {
    const { data } = await apiClient.post<Conversation>(API_ROUTES.CHATS.ROOT, { userId });
    return data;
  },
  async getConversation(id: string): Promise<Conversation> {
    const { data } = await apiClient.get<Conversation>(API_ROUTES.CHATS.ONE(id));
    return data;
  },
  async listMessages(
    conversationId: string,
    { before, limit = 30 }: { before?: string; limit?: number } = {},
  ): Promise<Message[]> {
    const { data } = await apiClient.get<Message[]>(API_ROUTES.CHATS.MESSAGES(conversationId), {
      params: { before, limit },
    });
    return data;
  },
  async sendMessage(
    conversationId: string,
    input: SendMessageInput,
  ): Promise<{ message: Message; conversation: Conversation }> {
    if (input.image) {
      const fd = new FormData();
      if (input.content) fd.append("content", input.content);
      if (input.replyTo) fd.append("replyTo", input.replyTo);
      fd.append("image", input.image);
      const { data } = await apiClient.post<{ message: Message; conversation: Conversation }>(
        API_ROUTES.CHATS.MESSAGES(conversationId),
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    }
    const { data } = await apiClient.post<{ message: Message; conversation: Conversation }>(
      API_ROUTES.CHATS.MESSAGES(conversationId),
      { content: input.content, replyTo: input.replyTo ?? undefined },
    );
    return data;
  },
  async editMessage(messageId: string, content: string): Promise<Message> {
    const { data } = await apiClient.patch<Message>(API_ROUTES.CHATS.MESSAGE(messageId), {
      content,
    });
    return data;
  },
  async deleteMessage(messageId: string): Promise<{ id: string; deletedForEveryone: boolean }> {
    const { data } = await apiClient.delete(API_ROUTES.CHATS.MESSAGE(messageId));
    return data;
  },
  async markSeen(conversationId: string): Promise<{ conversationId: string; seenAt: string }> {
    const { data } = await apiClient.post(API_ROUTES.CHATS.SEEN(conversationId));
    return data;
  },
};
