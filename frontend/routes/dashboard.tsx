import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import { PageLoader } from "@/components/common/loaders";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: `Dashboard — ${APP_NAME}` },
      { name: "description", content: `Your ${APP_NAME} workspace.` },
      { property: "og:title", content: `Dashboard — ${APP_NAME}` },
      { property: "og:description", content: `Your ${APP_NAME} workspace.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardShell,
});

function DashboardShell() {
  const navigate = useNavigate();
  const { user, isAuthenticated, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      const redirect = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname + window.location.search : ROUTES.DASHBOARD,
      );
      navigate({ to: `${ROUTES.LOGIN}?redirect=${redirect}`, replace: true });
    }
  }, [initialized, isAuthenticated, navigate]);

  if (!initialized || !isAuthenticated || !user) {
    return <PageLoader label="Loading your workspace" />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
