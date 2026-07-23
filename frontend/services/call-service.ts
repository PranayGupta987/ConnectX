import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import type { CallRecord, CallsPage } from "@/types";

export const callService = {
  async history(params: { page?: number; limit?: number } = {}): Promise<CallsPage> {
    const { data } = await apiClient.get<CallsPage>(API_ROUTES.CALLS.ROOT, {
      params: { page: params.page ?? 1, limit: params.limit ?? 20 },
    });
    return data;
  },

  async get(id: string): Promise<CallRecord> {
    const { data } = await apiClient.get<CallRecord>(API_ROUTES.CALLS.ONE(id));
    return data;
  },

  async clear(): Promise<{ ok: boolean }> {
    const { data } = await apiClient.delete<{ ok: boolean }>(API_ROUTES.CALLS.ROOT);
    return data;
  },
};
