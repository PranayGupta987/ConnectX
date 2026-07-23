import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    { name: "connectx.sidebar", partialize: (s) => ({ collapsed: s.collapsed }) },
  ),
);
