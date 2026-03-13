import { NextRequest, NextResponse } from "next/server";
import { storeDecision } from "../../lib/mem0";
import type { MemoryRequest } from "../../lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MemoryRequest;
    const { userId, type, value } = body;

    if (!userId || !type || !value) {
      return NextResponse.json(
        { error: "Missing userId, type, or value" },
        { status: 400 }
      );
    }

    await storeDecision(userId, type, value);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Memory API error:", error);
    return NextResponse.json(
      { error: "Failed to store memory" },
      { status: 500 }
    );
  }
}
