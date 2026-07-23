import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { API_ROUTES, STORAGE_KEYS } from "@/lib/constants";
import type { AIConversation } from "@/types";

export interface AiStreamHandlers {
  onStart?: (provider: string) => void;
  onToken: (token: string) => void;
  onDone?: (payload: { message: unknown; provider: string }) => void;
  onError?: (message: string) => void;
}

export const aiService = {
  async history(): Promise<AIConversation> {
    const { data } = await apiClient.get<AIConversation>(API_ROUTES.AI.HISTORY);
    return data;
  },

  async clear(): Promise<{ ok: boolean }> {
    const { data } = await apiClient.delete<{ ok: boolean }>(API_ROUTES.AI.HISTORY);
    return data;
  },

  /**
   * Streams a chat completion from the backend using Server-Sent Events over
   * fetch. Uses fetch instead of Axios so we can incrementally read chunks
   * from a ReadableStream and expose an AbortController for the Stop button.
   */
  async chatStream(
    prompt: string,
    handlers: AiStreamHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    const token =
      (typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        : null) ?? "";
    const res = await fetch(`${env.API_URL}${API_ROUTES.AI.CHAT}`, {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      handlers.onError?.(text || `Request failed (${res.status})`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split by SSE event delimiter (\n\n) — everything before is a complete event.
        const events = buffer.split(/\n\n/);
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            const payload = JSON.parse(raw) as {
              type: "start" | "user" | "token" | "done" | "error";
              provider?: string;
              token?: string;
              message?: unknown;
            };
            if (payload.type === "start") handlers.onStart?.(payload.provider ?? "");
            else if (payload.type === "token" && payload.token) handlers.onToken(payload.token);
            else if (payload.type === "done") {
              handlers.onDone?.({
                message: payload.message,
                provider: payload.provider ?? "",
              });
            } else if (payload.type === "error") {
              handlers.onError?.(String((payload as { message?: string }).message ?? "AI error"));
            }
          } catch {
            /* ignore malformed lines */
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // user pressed Stop
      handlers.onError?.((err as Error).message || "Stream failed");
    }
  },
};
