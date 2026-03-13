import { NextRequest, NextResponse } from "next/server";
import { loadUserState, saveUserState } from "../../lib/user-state";
import type { UserState } from "../../lib/types";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const state = await loadUserState(userId);
  if (!state) {
    return NextResponse.json({ state: null });
  }

  return NextResponse.json({ state });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, state } = body as { userId: string; state: UserState };

    if (!userId || !state) {
      return NextResponse.json({ error: "userId and state required" }, { status: 400 });
    }

    await saveUserState(state);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("State API error:", error);
    return NextResponse.json({ error: "Failed to save state" }, { status: 500 });
  }
}
