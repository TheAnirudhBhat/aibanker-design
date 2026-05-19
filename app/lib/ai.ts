import Anthropic from "@anthropic-ai/sdk";
import type { DerivedProfile, Memory, ChatMessage, FlowAssistRequest, FlowAssistResponse, FlowAction } from "./types";
import { getFinancialSummaryForAI } from "./financial-data";
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

const IDENTITY_INTRO = `You are the AI banker inside a banking app called "slice Banker". You are a calm financial operator - not a chatbot, not a coach, not a customer support agent.`;

const PERSONALITY = `PERSONALITY:
- Calm, direct, observant, non-judgmental.
- Short sentences. 1–3 sentences by default unless the user asks for detail.
- Lead with observations and facts, not suggestions.
- Use INR formatting (₹X,XXX or ₹Xk/₹XL). Be specific - never say "a lot", say "₹6,354".
- No emojis. No greetings. No filler phrases ("Got it!", "Great question", "Happy to help").
- No humor, sarcasm, or judgment about spending behavior.
- Never reveal raw narrations, account numbers, or IFSC codes.
- Insight structure: Observation → Context → Suggestion (optional).`;

const IMPORTANT_RULES = `1. When asked about spending, use EXACT numbers from the financial data.
2. For affordability questions, consider: category budget remaining, buffer, upcoming bills, and goal impact.
3. Don't make up transactions or amounts not in the data.
4. If you don't know something, say so - don't fabricate.
5. For goals, factor in the user's actual savings rate and investment patterns.
6. Never judge or shame spending behavior. Surface facts, not verdicts.`;

export function buildSystemPrompt(
  profile: DerivedProfile,
  memories: Memory[],
  context?: {
    currentGoal?: string;
    currentPace?: string;
    currentBudgetStyle?: string;
    recentFlow?: string;
  },
): string {
  const financialData = getFinancialSummaryForAI();

  let prompt = `${IDENTITY_INTRO}

${PERSONALITY}

${financialData}

USER PROFILE:
- Name: ${profile.wrapped.money_personality_label}
- Current Balance: ₹${profile.accountBalance.toLocaleString("en-IN")}
- Savings Rate: ${profile.persona.actual_savings_pct}
- Top Lifestyle Category: ${profile.wrapped.top_category_label} (${profile.wrapped.top_category_share_pct})
- Data Period: ${profile.dataRange.from} to ${profile.dataRange.to} (${profile.dataRange.months} months)
`;

  if (context?.currentGoal) {
    prompt += `\nACTIVE GOAL: ${context.currentGoal}`;
  }
  if (context?.currentPace) {
    prompt += `\nPACE: ${context.currentPace}`;
  }
  if (context?.currentBudgetStyle) {
    prompt += `\nBUDGET STYLE: ${context.currentBudgetStyle}`;
  }
  if (context?.recentFlow) {
    prompt += `\nRECENT CONTEXT: User just completed the "${context.recentFlow}" flow.`;
  }

  if (memories.length > 0) {
    prompt += `\n\nWHAT I REMEMBER ABOUT THIS USER:\n`;
    for (const mem of memories) {
      prompt += `- ${mem.memory}\n`;
    }
    prompt += `\nUse these memories to personalize responses. Respect stated preferences (e.g., if they said "don't cut my food budget", don't suggest cutting food).`;
  }

  prompt += `\n\nIMPORTANT RULES:\n${IMPORTANT_RULES}`;

  return prompt;
}

export async function streamChat(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<ReadableStream> {
  const client = getClient();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

// ============ FLOW ASSIST (non-streaming, tool_use) ============

const flowTools: Anthropic.Tool[] = [
  {
    name: "update_budget",
    description:
      "Update a category's monthly budget. Use when the user wants to change spending limits.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description: "Category name from the user's budget",
        },
        amount: {
          type: "number",
          description: "New monthly budget in rupees (not formatted)",
        },
      },
      required: ["category", "amount"],
    },
  },
  {
    name: "change_pace",
    description:
      "Switch the goal pace. Use when the user's budget constraints make the current pace unrealistic.",
    input_schema: {
      type: "object" as const,
      properties: {
        pace_id: {
          type: "string",
          enum: ["aggressive", "balanced", "relaxed"],
        },
        reason: { type: "string" },
      },
      required: ["pace_id"],
    },
  },
  {
    name: "adjust_timeline",
    description: "Suggest extending or shortening the goal timeline.",
    input_schema: {
      type: "object" as const,
      properties: {
        months: {
          type: "number",
          description: "New timeline in months",
        },
        reason: { type: "string" },
      },
      required: ["months"],
    },
  },
];

function buildFlowAssistSystemPrompt(
  profile: DerivedProfile,
  memories: Memory[],
  request: FlowAssistRequest,
): string {
  const financialData = getFinancialSummaryForAI();

  let prompt = `${IDENTITY_INTRO}

${PERSONALITY}

${financialData}

USER PROFILE:
- Personality: ${profile.wrapped.money_personality_label}
- Balance: ₹${profile.accountBalance.toLocaleString("en-IN")}
- Savings Rate: ${profile.persona.actual_savings_pct}
- Top Lifestyle Category: ${profile.wrapped.top_category_label} (${profile.wrapped.top_category_share_pct})
- Data Period: ${profile.dataRange.from} to ${profile.dataRange.to} (${profile.dataRange.months} months)
`;

  if (memories.length > 0) {
    prompt += `\nWHAT I REMEMBER ABOUT THIS USER:\n`;
    for (const mem of memories) {
      prompt += `- ${mem.memory}\n`;
    }
    prompt += `
USE THESE MEMORIES TO:
- Respect stated preferences (e.g. "don't cut my food budget" → never suggest cutting food)
- Reference past decisions ("Last time you chose the relaxed pace...")
- Avoid repeating advice they've already rejected
- Personalize tone based on their communication style
- Factor in known goals, concerns, or life context
`;
  }

  prompt += `\nSTAGE CONTEXT:\nFlow stage: ${request.flowStage}\n\n${request.dataContext}`;

  if (request.mode === "reason") {
    prompt += `\n\nMODE: REASONING
The user has typed a message about their budget/goal. Reason about what they want, then:
1. Respond with a clear, direct observation - state what the data shows
2. Use tools to apply changes (update_budget, change_pace, adjust_timeline)
3. If the request is unclear, ask a single clarifying question

IMPORTANT:
- When the user says they "can only cut X", that means their total monthly cut capacity is X
- If the cut is less than required, suggest switching to a slower pace or extending timeline
- State impact factually - no cheerleading or alarm`;
  } else {
    prompt += `\n\nMODE: COPY GENERATION
Write a concise, factual analysis of the data provided. Lead with the most significant observation.
- Observation first, then context, then optional suggestion
- Use specific numbers from the data
- Keep it under 100 words
- No emojis, no greetings, no filler phrases
- Do NOT use bullet points or headers - write in short, plain sentences`;
  }

  return prompt;
}

export async function flowAssist(
  request: FlowAssistRequest,
  profile: DerivedProfile,
  memories: Memory[],
): Promise<FlowAssistResponse> {
  const client = getClient();
  const systemPrompt = buildFlowAssistSystemPrompt(profile, memories, request);

  const messages: Anthropic.MessageParam[] = [];

  if (request.conversationHistory && request.conversationHistory.length > 0) {
    for (const msg of request.conversationHistory.slice(-6)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  if (request.mode === "reason" && request.userText) {
    messages.push({ role: "user", content: request.userText });
  } else if (request.mode === "copy") {
    messages.push({
      role: "user",
      content: `Generate the analysis for the "${request.flowStage}" stage using the data provided in the system prompt.`,
    });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    tools: request.mode === "reason" ? flowTools : undefined,
  });

  // Parse response: extract text blocks and tool_use blocks
  let message = "";
  const actions: FlowAction[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      message += block.text;
    } else if (block.type === "tool_use") {
      const input = block.input as Record<string, unknown>;
      switch (block.name) {
        case "update_budget":
          actions.push({
            type: "set_budget",
            category: input.category as string,
            amount: input.amount as number,
          });
          break;
        case "change_pace":
          actions.push({
            type: "set_pace",
            paceId: input.pace_id as "aggressive" | "balanced" | "relaxed",
          });
          break;
        case "adjust_timeline":
          actions.push({
            type: "set_timeline",
            months: input.months as number,
          });
          break;
      }
    }
  }

  return { message, actions };
}
