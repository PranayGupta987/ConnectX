import { createFileRoute, redirect } from "@tanstack/react-router";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";

export const Route = createFileRoute("/dashboard/notifications")({
  head: () => ({
    meta: [
      { title: `Notifications — ${APP_NAME}` },
      { name: "description", content: `All your ${APP_NAME} notifications in one place.` },
      { property: "og:title", content: `Notifications — ${APP_NAME}` },
      { property: "og:description", content: `Your ${APP_NAME} activity, alerts, and updates.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    const { isAuthenticated, initialized } = useAuthStore.getState();
    if (initialized && !isAuthenticated) throw redirect({ to: ROUTES.LOGIN });
  },
  component: NotificationsPanel,
});
