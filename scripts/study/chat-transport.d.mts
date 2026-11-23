// Type surface for chat-transport.mjs (`allowJs` is off).

import type { Call, UserMessage } from "./sealed.mjs";

export const ROLE: string;
export const TRANSPORT_NOTE: string;

export interface MessagesRequest {
  model?: string;
  system?: string | { type: string; text?: string }[];
  tools?: { name: string; description?: string; input_schema?: unknown }[];
  tool_choice?: { type: string };
  messages?: unknown[];
  [key: string]: unknown;
}

export interface ReplyBody {
  id: string;
  type: "message";
  role: "assistant";
  model: string | null;
  content: (
    | { type: "text"; text: string }
    | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  )[];
  stop_reason: "tool_use" | "end_turn";
}

export function systemText(system: MessagesRequest["system"]): string;
export function toolSection(tools: MessagesRequest["tools"]): string;
export function mayCallTools(request: MessagesRequest): boolean;
export function answerSchema(request: MessagesRequest): Record<string, unknown>;
export function transcriptText(messages: unknown[] | undefined): string;
export function sealedParts(request: MessagesRequest): {
  system: string;
  schema: string;
  message: UserMessage;
  model: string | undefined;
};
export function replyBody(
  answer: { text?: string; tool_uses?: { name: string; input_json: string }[] } | null | undefined,
  opts: { n: number; model?: string },
): ReplyBody;
export function streamEvents(body: ReplyBody): { type: string; [key: string]: unknown }[];
export function nativeInput(input: unknown): Record<string, unknown>;
export function toolCatchingCall(args: {
  rolePath: string;
  schema: string;
  message: UserMessage;
  model?: string;
  timeoutMs?: number;
  toolNames?: string[];
}): Promise<{ answer: Record<string, unknown>; usage: unknown }>;
export function makeTransport(opts: { call: Call; dir: string; timeoutMs?: number }): {
  doFetch: (
    method: string,
    url: string,
    headers: unknown,
    request: MessagesRequest,
  ) => Promise<{ status: number; body: unknown }>;
  doStream: (
    url: string,
    headers: unknown,
    request: MessagesRequest,
    onEvent: (event: { type: string; [key: string]: unknown }) => void,
  ) => Promise<void>;
};
