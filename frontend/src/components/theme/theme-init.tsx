import { useEffect } from "react";
import { useThemeStore } from "@/store";

/**
 * Applies the persisted theme to the <html> element on mount and reacts to
 * OS-level scheme changes when the user has chosen the "system" preference.
 */
export function ThemeInit() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    setTheme(theme);
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, setTheme]);

  return null;
}
