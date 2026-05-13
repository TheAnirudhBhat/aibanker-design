import { promises as fs } from "fs";
import path from "path";
import type { UserState } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function getStatePath(userId: string): string {
  // Sanitize userId to prevent directory traversal
  const safe = userId.replace(/[^a-zA-Z0-9-]/g, "");
  return path.join(DATA_DIR, `user-state-${safe}.json`);
}

export async function loadUserState(userId: string): Promise<UserState | null> {
  try {
    const filePath = getStatePath(userId);
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as UserState;
  } catch {
    return null;
  }
}

export async function saveUserState(state: UserState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const filePath = getStatePath(state.userId);
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf-8");
}

export function createDefaultUserState(userId: string, bufferAmount: number): UserState {
  const now = new Date().toISOString();
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
    lastActiveAt: now,
    createdAt: now,
  };
}
