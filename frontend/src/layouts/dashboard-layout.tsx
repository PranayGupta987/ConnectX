import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Phone,
  Sparkles,
  User as UserIcon,
  Users,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useSidebarStore } from "@/store";
import { ROUTES } from "@/lib/constants";

const NAV: ReadonlyArray<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: ROUTES.DASHBOARD, label: "Overview", icon: LayoutDashboard, exact: true },
  { to: ROUTES.CHAT, label: "Chat", icon: MessageSquare },
  { to: ROUTES.AI, label: "AI Assistant", icon: Sparkles },
  { to: ROUTES.FRIENDS, label: "Friends", icon: Users },
  { to: ROUTES.NOTIFICATIONS, label: "Notifications", icon: Bell },
  { to: ROUTES.CALLS, label: "Calls", icon: Phone },
  { to: ROUTES.PROFILE, label: "Profile", icon: UserIcon },
  { to: ROUTES.SETTINGS, label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuthStore();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const initials = (user?.displayName || user?.username || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-aurora opacity-40" />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <SidebarInner collapsed={collapsed} isActive={isActive} />
        <div className="mt-auto border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-full justify-center"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-sidebar-border p-4">
                <Logo />
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarInner collapsed={false} isActive={isActive} onNavigate={() => setMobileOpen(false)} hideLogo />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border glass-strong px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations, friends, files…"
              className="h-9 rounded-full border-border bg-background/60 pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-accent"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-mesh text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {user?.displayName || user?.username || "Guest"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm">{user?.displayName || "Guest"}</div>
                  <div className="text-xs text-muted-foreground">{user?.email ?? "not signed in"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={ROUTES.PROFILE}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={ROUTES.SETTINGS}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void (async () => {
                      await logout();
                      toast.success("Signed out");
                      if (typeof window !== "undefined") window.location.href = ROUTES.LOGIN;
                    })();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-h-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarInner({
  collapsed,
  isActive,
  onNavigate,
  hideLogo,
}: {
  collapsed: boolean;
  isActive: (to: string, exact?: boolean) => boolean;
  onNavigate?: () => void;
  hideLogo?: boolean;
}) {
  return (
    <>
      {!hideLogo && (
        <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-2")}>
          <Logo showWordmark={!collapsed} size={collapsed ? "sm" : "md"} />
        </div>
      )}
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-y-1.5 left-0 w-1 rounded-r-full"
                  style={{ background: "var(--gradient-primary)" }}
                />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
