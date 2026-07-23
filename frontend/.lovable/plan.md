## Issues

**1. Duplicate dashboard layout on AI & Notifications routes**

`src/routes/dashboard.tsx` already wraps its `<Outlet />` in `<DashboardLayout>`. But `src/routes/dashboard.ai.tsx` and `src/routes/dashboard.notifications.tsx` each wrap their page again in `<DashboardLayout>`, producing a nested sidebar + header.

Fix: remove the inner `<DashboardLayout>` wrapper from those two route components, returning `<AIChat />` and `<NotificationsPanel />` directly (matching how `dashboard.chat.tsx`, `dashboard.friends.tsx`, `dashboard.index.tsx` etc. already work). No layout, styling, or route changes.

**2. Overview page stuck on skeletons**

`src/routes/dashboard.index.tsx` hardcodes `stats` values to `"—"` and renders `<ListSkeleton />` / `<CardSkeleton />` unconditionally — there is no data fetch, so it always looks like it's loading.

Fix: wire the Overview to data that already exists in the app's stores/services, without changing the visual layout:
- Stats cards: derive from existing state — active chats from `useChatStore` conversations count, friends online from `useFriendsStore` friends filtered by `isOnline`, notifications unread from `useNotificationStore`, and weekly activity from recent messages count (or call history length via `useCallStore` if populated). Replace `"—"` with the live numeric values.
- Recent activity: replace the permanent `<ListSkeleton />` with a real list built from the most recent conversations (last message preview + timestamp + avatar), using existing `UserAvatar` and `formatRelativeTime` helpers. Show `<ListSkeleton />` only while data is still loading; show an empty state ("No recent activity yet") when there is none.
- Suggested for you: replace the permanent `<CardSkeleton />`s with a small list of friend suggestions from `useFriendsStore` (e.g., online friends the user hasn't chatted with recently), or an empty state when none exist. Skeleton only shown during initial load.

No API additions, no backend changes, no design/theme changes — reuse existing stores, services, components, and Tailwind classes already in the project.

## Files to modify

- `src/routes/dashboard.ai.tsx` — remove `<DashboardLayout>` wrapper (and its import).
- `src/routes/dashboard.notifications.tsx` — remove `<DashboardLayout>` wrapper (and its import).
- `src/routes/dashboard.index.tsx` — replace hardcoded placeholders with live data derived from existing Zustand stores; keep the same grid, cards, spacing, and typography.

No other files touched.
