"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

export type ThemeMode = "light" | "dark";

/** Optional origin (viewport px) for the circular reveal — usually the toggle. */
export type ToggleOrigin = { x?: number; y?: number };

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: (origin?: ToggleOrigin) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "dls-theme-mode";

// App-wide: the `.dark` class lives on <html>, so the whole experience (chrome, sidebar,
// playground, AND the phone) themes from the single globals.css `.dark` block.
// A surface that fills the top of the screen can ask for the status bar to be
// painted its own colour instead of the page's. iOS standalone lays the page
// out SHORT by the top inset: that strip cannot be laid out into, it is the
// opaque status bar, and theme-color is the only thing that paints it — so a
// full-bleed scene meets a flat white bar unless it sets this. The override is
// a module-level single owner on purpose: the provider rewrites theme-color on
// every mode change, so a component writing the meta itself would be undone by
// the next toggle (the provider's effect runs after its children's).
let barTint: string | null = null;

/** Paint the standalone status bar to match a full-bleed surface; null restores
 *  the page colour. Re-applies immediately, and survives mode changes. */
export function setBarTint(color: string | null) {
  barTint = color && color.trim() ? color.trim() : null;
  applyClass(document.documentElement.classList.contains("dark") ? "dark" : "light");
}

function applyClass(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
  // The standalone iOS status bar is opaque and painted with theme-color (see
  // app/layout.tsx). It has to follow the APP theme, not the phone's scheme —
  // the two differ whenever the toggle is used — or a black bar tops a white
  // page and a white bar tops the dark scene.
  const bar = barTint ?? (mode === "dark" ? "#090b0c" : "#ffffff");
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bar));
}

// Briefly add a class to <html> so themed surfaces CROSS-FADE their colours on a mode change
// instead of snapping. Used for programmatic setMode and the reduced-motion / no-view-transition
// toggle fallback (the modern toggle path uses the circular view-transition reveal below). Self-
// removes so it never lags ordinary hover/press colour changes.
function flashThemeTransition() {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.add("theme-transition");
  window.setTimeout(() => el.classList.remove("theme-transition"), 340);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const modeRef = useRef<ThemeMode>(mode);

  // Restore persisted choice on mount + reflect it on <html>.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: ThemeMode = stored === "dark" ? "dark" : "light";
    modeRef.current = initial;
    setModeState(initial);
    applyClass(initial);
  }, []);

  // Keep the ref + <html> class in sync for any state-driven change.
  useEffect(() => {
    modeRef.current = mode;
    applyClass(mode);
  }, [mode]);

  const commit = useCallback((next: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  }, []);

  const setMode = useCallback(
    (next: ThemeMode) => {
      flashThemeTransition();
      commit(next);
    },
    [commit],
  );

  const toggle = useCallback(
    (origin?: ToggleOrigin) => {
      const next: ThemeMode = modeRef.current === "dark" ? "light" : "dark";

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const startViewTransition = (
        document as unknown as {
          startViewTransition?: (cb: () => void) => { ready: Promise<void> };
        }
      ).startViewTransition?.bind(document);

      // No View Transitions API (or reduced motion): fall back to the colour cross-fade
      // instead of an instant snap.
      if (!startViewTransition || prefersReduced) {
        flashThemeTransition();
        commit(next);
        applyClass(next);
        return;
      }

      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = startViewTransition(() => {
        // Apply synchronously inside the VT callback so the captured "new" snapshot
        // already reflects the next theme.
        flushSync(() => commit(next));
        applyClass(next);
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 480,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        })
        .catch(() => {
          /* transition skipped (e.g. rapid re-toggle) — state already committed */
        });
    },
    [commit],
  );

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
