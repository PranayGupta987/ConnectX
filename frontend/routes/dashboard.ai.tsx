import { createFileRoute, redirect } from "@tanstack/react-router";
import { AIChat } from "@/components/ai/ai-chat";
import { ROUTES, APP_NAME, AI_ASSISTANT } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";

export const Route = createFileRoute("/dashboard/ai")({
  head: () => ({
    meta: [
      { title: `${AI_ASSISTANT.NAME} — ${APP_NAME}` },
      { name: "description", content: `Chat with ${AI_ASSISTANT.NAME}, your built-in AI assistant inside ${APP_NAME}.` },
      { property: "og:title", content: `${AI_ASSISTANT.NAME} — ${APP_NAME}` },
      { property: "og:description", content: `Your personal AI assistant inside ${APP_NAME}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    const { isAuthenticated, initialized } = useAuthStore.getState();
    if (initialized && !isAuthenticated) throw redirect({ to: ROUTES.LOGIN });
  },
  component: AIChat,
});
