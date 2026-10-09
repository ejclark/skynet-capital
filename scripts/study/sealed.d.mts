// Type surface for sealed.mjs — same arrangement as metrics.d.mts (`allowJs` is off).

export type Block =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } };

export interface UserMessage {
  type: "user";
  message: { role: "user"; content: Block[] };
}

export type RecordedBlock =
  | { type: "text"; text: string }
  | { type: "image"; sha256: string; bytes: number };

export const ROLES: string;
export function readSchema(name: string): string;
export function sealedArgs(opts: { rolePath: string; schema: string }): string[];
export function imageBlock(b64: string): Block;
export function userMessage(text: string, images?: { label?: string; b64: string }[]): UserMessage;
export function parseResult(stdout: string | null | undefined): Record<string, unknown>;
export function signedIn(
  run?: (
    cmd: string,
    args: string[],
    opts: { encoding: "utf8" },
  ) => { stdout?: string; error?: Error | null },
): { ok: boolean; why: string };
export function sealedCall(args: {
  rolePath: string;
  schema: string;
  message: UserMessage;
  timeoutMs?: number;
}): Promise<Record<string, unknown>>;
export function stubPick(present: number[], n: number): { n: number; repeated: boolean } | null;
export function redactImages(message: UserMessage): {
  type: "user";
  message: { role: "user"; content: RecordedBlock[] };
};
export type Call = (args: {
  role: string;
  rolePath: string;
  schema: string;
  message: UserMessage;
  timeoutMs?: number;
}) => Promise<Record<string, unknown>>;
export function makeCaller(opts?: { stub?: string; record?: string }): Call;
export function halfFrame(browser: unknown, jpeg: Uint8Array): Promise<string>;
