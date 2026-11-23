// Type surface for world-chat.mjs (`allowJs` is off).

export const VIEWER_HEADER: string;
export const CHAT_PATH: string;
export const FILE_PATH: string;
export const FOLLOWUP_PATH: string;
export const CHAT_LOG: string;
export const WORLD_FILING_BASE: number;
export const MODES: ("live" | "stub" | "off")[];

export interface Frame {
  event: string;
  data: unknown;
}
export interface Draft {
  kind: "filing" | "followup" | "view" | "research-question";
  draft: unknown;
}

export function chatHandles(req: { method: string; path: string }): boolean;
export function parseSse(text: string | null | undefined): Frame[];
export function draftsOf(frames: Frame[]): Draft[];
export function replyOf(frames: Frame[]): { text: string; ended: string; error?: unknown };
export function askedOf(body: unknown): { said: string; page: string | null };
export function filedAnswer(k: number): { ok: true; number: number; url: string };

export interface WorldChat {
  handles: (req: { method: string; path: string }) => boolean;
  respond: (req: {
    method: string;
    path: string;
    body: string | null;
  }) => Promise<{ status: number; contentType: string; body: string }>;
  exchanges: () => number;
  close: () => Promise<void>;
}
export function startWorldChat(opts: {
  run: string;
  world: string;
  viewer: string;
  log: string;
  record: string;
  mode?: "live" | "stub" | "off";
  stub?: string;
}): Promise<WorldChat>;
