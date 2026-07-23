import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ChatShell } from "@/components/chat/chat-shell";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/dashboard/chat")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Messages — ConnectX" },
      { name: "description", content: "Real-time private messaging with your ConnectX friends." },
      { property: "og:title", content: "Messages — ConnectX" },
      { property: "og:description", content: "Chat, share photos, and stay in touch in real time." },
    ],
  }),
  component: ChatShell,
});
