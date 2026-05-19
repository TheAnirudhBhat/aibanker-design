import { NextRequest, NextResponse } from "next/server";
import { deriveProfile } from "../../lib/financial-data";
import { buildSystemPrompt, streamChat } from "../../lib/ai";
import { searchMemories } from "../../lib/mem0";
import type { ChatRequest } from "../../lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { messages, userId, context } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const profile = deriveProfile();

    // Search Mem0 for relevant memories
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();
    let memories: Awaited<ReturnType<typeof searchMemories>> = [];
    try {
      if (latestUserMessage && userId) {
        memories = await searchMemories(userId, latestUserMessage.content);
      }
    } catch {
      // Mem0 unavailable - continue without memories
      console.warn("Mem0 search failed, continuing without memories");
    }

    // Build system prompt with data + memories + context
    const systemPrompt = buildSystemPrompt(profile, memories, context);

    // Stream Claude response directly to client (no tee - avoids buffering)
    const stream = await streamChat(messages, systemPrompt);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
