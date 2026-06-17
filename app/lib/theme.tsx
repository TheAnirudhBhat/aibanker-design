"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "dls-theme-mode";

// Briefly add a class to <html> so themed surfaces CROSS-FADE their colours on a mode switch
// instead of snapping. Only fires on a user toggle (not the on-mount localStorage restore), and
// self-removes after the transition so it never lags ordinary hover/press colour changes.
function flashThemeTransition() {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.add("theme-transition");
  window.setTimeout(() => el.classList.remove("theme-transition"), 340);
}

/**
 * Holds the current DLS colour mode for the phone-frame surfaces. The mode only
 * drives the `.dark` class on the app/device surface (see DeviceFrame + the
 * persona route) — the gallery chrome stays light regardless.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  // Restore persisted choice on mount (client only).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setModeState(stored);
    }
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    flashThemeTransition();
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    flashThemeTransition();
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Read the current colour mode. Returns a safe light-mode default when used
 * outside a provider so isolated component previews keep rendering.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { mode: "light", setMode: () => {}, toggle: () => {} };
  }
  return ctx;
}

/** Convenience: the class to spread onto a themed surface wrapper. */
export function themeClass(mode: ThemeMode): string | undefined {
  return mode === "dark" ? "dark" : undefined;
}
