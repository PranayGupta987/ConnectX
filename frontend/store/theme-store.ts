import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "@/types";

interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

function resolveTheme(t: Theme): "light" | "dark" {
  if (t !== "system") return t;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      resolved: "dark",
      setTheme: (theme) => {
        const resolved = resolveTheme(theme);
        apply(resolved);
        set({ theme, resolved });
      },
      toggle: () => {
        const next = get().resolved === "dark" ? "light" : "dark";
        apply(next);
        set({ theme: next, resolved: next });
      },
    }),
    {
      name: "connectx.theme",
      onRehydrateStorage: () => (state) => {
        if (state) apply(resolveTheme(state.theme));
      },
    },
  ),
);
