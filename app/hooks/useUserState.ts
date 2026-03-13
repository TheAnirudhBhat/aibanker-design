"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserState } from "../lib/types";
import type { DerivedProfile } from "../lib/types";

function createDefaultUserState(userId: string, bufferAmount: number): UserState {
  return {
    userId,
    onboardingComplete: false,
    currentStep: "wrapped",
    personaStage: "q1",
    goalStage: "choice",
    budgetStage: "digest",
    personaAnswers: {},
    goal: null,
    budgetOverrides: {},
    budgetStyle: null,
    bufferAmount,
    bufferRemaining: bufferAmount,
    products: [],
    preferences: [],
    spendRatings: [],
    nudges: [],
    activeFlow: null,
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function useUserState(profile: DerivedProfile) {
  const [state, setState] = useState<UserState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load userId from localStorage + fetch persisted state
  useEffect(() => {
    let id = localStorage.getItem("aibanker-user-id");
    if (!id) {
      id = crypto.randomUUID();
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

  // Mutate: merge patch into state + auto-persist
  const mutate = useCallback((patch: Partial<UserState>) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      // Deep merge for budgetOverrides
      if (patch.budgetOverrides) {
        next.budgetOverrides = { ...prev.budgetOverrides, ...patch.budgetOverrides };
      }
      next.lastActiveAt = new Date().toISOString();
      // Fire-and-forget persist
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: next.userId, state: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

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

  // Generate a fresh userId and reload — old data stays on disk
  const resetUser = useCallback(() => {
    const newId = crypto.randomUUID();
    localStorage.setItem("aibanker-user-id", newId);
    window.location.reload();
  }, []);

  return { state, mutate, resetState, resetUser, isHydrated };
}
