"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserState } from "../lib/types";
import type { DerivedProfile } from "../lib/types";

function createDefaultUserState(userId: string, bufferAmount: number): UserState {
  return {
    userId,
    onboardingComplete: false,
    currentStep: "wrapped",
    goalStage: "choice",
    budgetStage: "digest",
    obligations: null,
    goal: null,
    budgetOverrides: {},
    budgetStyle: null,
    bufferAmount,
    bufferRemaining: bufferAmount,
    products: [],
    preferences: [],
    spendRatings: [],
    nudges: [],
    voice: "ryan",
    activeFlow: null,
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * @param profile  Derived financial profile
 * @param presetOverride  If provided, skip API/localStorage and use this state directly.
 *                        Used by the ?persona= system for read-only previews.
 */
/** A v4 id. Plain http:// — a LAN address on a phone — has no
    crypto.randomUUID (secure contexts only), and the app used to crash with
    "Application error" on its first load there (2026-09-25). */
const newId = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

export function useUserState(profile: DerivedProfile, presetOverride?: UserState | null) {
  const [state, setState] = useState<UserState | null>(presetOverride ?? null);
  const [isHydrated, setIsHydrated] = useState(!!presetOverride);

  // Load userId from localStorage + fetch persisted state (skipped when preset is active)
  useEffect(() => {
    if (presetOverride) return;

    let id = localStorage.getItem("aibanker-user-id");
    if (!id) {
      id = newId();
      localStorage.setItem("aibanker-user-id", id);
    }

    const bufferAmt =
      parseInt(profile.suggested_budgets.buffer_bucket.replace(/[₹,k]/g, "")) * 1000;

    fetch(`/api/state?userId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.state) {
          setState(data.state as UserState);
        } else {
          setState(createDefaultUserState(id!, bufferAmt));
        }
        setIsHydrated(true);
      })
      .catch(() => {
        setState(createDefaultUserState(id!, bufferAmt));
        setIsHydrated(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mutate: merge patch into state + auto-persist (local-only when preset is active)
  const mutate = useCallback((patch: Partial<UserState>) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      // Deep merge for budgetOverrides
      if (patch.budgetOverrides) {
        next.budgetOverrides = { ...prev.budgetOverrides, ...patch.budgetOverrides };
      }
      next.lastActiveAt = new Date().toISOString();
      // Skip persistence when running a persona preview
      if (!presetOverride) {
        fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: next.userId, state: next }),
        }).catch(() => {});
      }
      return next;
    });
  }, [presetOverride]);

  // Reset state to defaults
  const resetState = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const bufferAmt =
        parseInt(profile.suggested_budgets.buffer_bucket.replace(/[₹,k]/g, "")) * 1000;
      const fresh = createDefaultUserState(prev.userId, bufferAmt);
      // Persist the reset
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: fresh.userId, state: fresh }),
      }).catch(() => {});
      return fresh;
    });
  }, [profile]);

  // Generate a fresh userId and reload - old data stays on disk
  const resetUser = useCallback(() => {
    const fresh = newId();
    localStorage.setItem("aibanker-user-id", fresh);
    window.location.reload();
  }, []);

  // Full state replacement (used by substate toggling in persona previews)
  const replaceState = useCallback((next: UserState) => {
    setState(next);
  }, []);

  return { state, mutate, replaceState, resetState, resetUser, isHydrated };
}
