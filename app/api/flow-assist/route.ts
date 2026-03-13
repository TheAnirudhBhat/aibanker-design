import { NextRequest, NextResponse } from "next/server";
import { deriveProfile } from "../../lib/financial-data";
import { flowAssist } from "../../lib/ai";
import { searchMemories, storeMemory } from "../../lib/mem0";
import type { FlowAssistRequest } from "../../lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FlowAssistRequest;
    const { userId, mode, flowStage, dataContext } = body;

    if (!flowStage || !dataContext) {
      return NextResponse.json(
        { error: "flowStage and dataContext are required" },
        { status: 400 }
      );
    }

    const profile = deriveProfile();

    // Search Mem0 for relevant memories
    let memories: Awaited<ReturnType<typeof searchMemories>> = [];
    try {
      if (userId) {
        const searchQuery =
          mode === "reason" && body.userText
            ? body.userText
            : `${flowStage} financial analysis`;
        memories = await searchMemories(userId, searchQuery);
      }
    } catch {
      console.warn("Mem0 search failed, continuing without memories");
    }

    const result = await flowAssist(body, profile, memories);

    // Store the interaction in Mem0 (non-blocking)
    if (userId && result.message) {
      (async () => {
        try {
          const userContent = mode === "reason" && body.userText
            ? body.userText
            : `[Flow: ${flowStage}]`;
          await storeMemory(userId, [
            { role: "user", content: userContent },
            { role: "assistant", content: result.message },
          ]);
        } catch {
          // Non-critical
        }
      })();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Flow-assist API error:", error);
    return NextResponse.json(
      { error: "Failed to process flow-assist request" },
      { status: 500 }
    );
  }
}
