import { NextRequest, NextResponse } from "next/server";
import { deriveProfile } from "../../lib/financial-data";
import { buildSystemPrompt, streamChat } from "../../lib/ai";
import { searchMemories, storeMemory } from "../../lib/mem0";
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
      // Mem0 unavailable — continue without memories
      console.warn("Mem0 search failed, continuing without memories");
    }

    // Build system prompt with data + memories + context
    const systemPrompt = buildSystemPrompt(profile, memories, context);

    // Stream Claude response
    const stream = await streamChat(messages, systemPrompt);

    // Store conversation in Mem0 (non-blocking, after response starts)
    if (userId && latestUserMessage) {
      // Collect the full response for memory storage
      const [streamForClient, streamForMemory] = stream.tee();

      // Store in background
      (async () => {
        try {
          const reader = streamForMemory.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value);
          }
          if (fullResponse) {
            await storeMemory(userId, [
              { role: "user", content: latestUserMessage.content },
              { role: "assistant", content: fullResponse },
            ]);
          }
        } catch {
          console.warn("Failed to store conversation in Mem0");
        }
      })();

      return new Response(streamForClient, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

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
