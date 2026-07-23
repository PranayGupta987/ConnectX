import { create } from "zustand";
import type { AIMessage } from "@/types";
import { aiService } from "@/services/ai-service";

interface AIState {
  messages: AIMessage[];
  loadingHistory: boolean;
  streaming: boolean;
  provider: string | null;
  abortController: AbortController | null;

  loadHistory: () => Promise<void>;
  send: (prompt: string) => Promise<void>;
  regenerate: () => Promise<void>;
  stop: () => void;
  clear: () => Promise<void>;
}

function tempId() {
  return `local-${Math.random().toString(36).slice(2, 10)}`;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  loadingHistory: false,
  streaming: false,
  provider: null,
  abortController: null,

  loadHistory: async () => {
    set({ loadingHistory: true });
    try {
      const convo = await aiService.history();
      set({ messages: convo.messages ?? [] });
    } finally {
      set({ loadingHistory: false });
    }
  },

  send: async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || get().streaming) return;

    const now = new Date().toISOString();
    const optimisticUser: AIMessage = {
      id: tempId(),
      role: "user",
      content: trimmed,
      createdAt: now,
    };
    const optimisticAssistant: AIMessage = {
      id: tempId(),
      role: "assistant",
      content: "",
      createdAt: now,
      streaming: true,
    };
    const controller = new AbortController();

    set((s) => ({
      messages: [...s.messages, optimisticUser, optimisticAssistant],
      streaming: true,
      abortController: controller,
    }));

    const assistantId = optimisticAssistant.id;

    await aiService.chatStream(
      trimmed,
      {
        onStart: (provider) => set({ provider }),
        onToken: (token) => {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m,
            ),
          }));
        },
        onDone: () => {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m,
            ),
            streaming: false,
            abortController: null,
          }));
        },
        onError: (msg) => {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantId
                ? { ...m, streaming: false, content: m.content || `⚠️ ${msg}` }
                : m,
            ),
            streaming: false,
            abortController: null,
          }));
        },
      },
      controller.signal,
    );
  },

  regenerate: async () => {
    const { messages, streaming, send } = get();
    if (streaming) return;
    // find last user prompt
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        // drop trailing assistant reply(s) after this user turn
        set({ messages: messages.slice(0, i) });
        await send(messages[i].content);
        return;
      }
    }
  },

  stop: () => {
    const { abortController } = get();
    abortController?.abort();
    set((s) => ({
      streaming: false,
      abortController: null,
      messages: s.messages.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    }));
  },

  clear: async () => {
    await aiService.clear();
    set({ messages: [] });
  },
}));
