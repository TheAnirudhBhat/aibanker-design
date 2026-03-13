import MemoryClient from "mem0ai";
import type { Memory } from "./types";

let client: MemoryClient | null = null;

export function getMem0Client(): MemoryClient {
  if (!client) {
    const apiKey = process.env.MEM0_API_KEY;
    if (!apiKey || apiKey === "m0-REPLACE_ME") {
      throw new Error("MEM0_API_KEY not configured");
    }
    client = new MemoryClient({ apiKey });
  }
  return client;
}

export async function storeMemory(
  userId: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<void> {
  try {
    const mem0 = getMem0Client();
    await mem0.add(messages as Parameters<typeof mem0.add>[0], { user_id: userId });
  } catch (error) {
    console.error("Failed to store memory:", error);
  }
}

export async function searchMemories(
  userId: string,
  query: string
): Promise<Memory[]> {
  try {
    const mem0 = getMem0Client();
    const results = await mem0.search(query, { user_id: userId });

    if (!Array.isArray(results)) {
      // Handle the case where results might be wrapped
      const arr = (results as { results?: unknown[] })?.results;
      if (Array.isArray(arr)) {
        return arr.map((r: unknown) => {
          const item = r as { id?: string; memory?: string; created_at?: string };
          return {
            id: item.id || "",
            memory: item.memory || "",
            created_at: item.created_at,
          };
        });
      }
      return [];
    }

    return results.map((r: unknown) => {
      const item = r as { id?: string; memory?: string; created_at?: string };
      return {
        id: item.id || "",
        memory: item.memory || "",
        created_at: item.created_at,
      };
    });
  } catch (error) {
    console.error("Failed to search memories:", error);
    return [];
  }
}

export async function storeDecision(
  userId: string,
  type: string,
  value: string
): Promise<void> {
  try {
    const mem0 = getMem0Client();
    await mem0.add(
      [{ role: "user", content: `[Decision] ${type}: ${value}` }],
      { user_id: userId }
    );
  } catch (error) {
    console.error("Failed to store decision:", error);
  }
}
