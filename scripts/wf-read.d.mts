// Type surface for wf-read.mjs — same arrangement as fix-held.d.mts (scripts/ is plain ESM with
// `allowJs` off, so a spec importing it needs this).

export interface Agent {
  key: string;
  agentId: string | null;
  label: string | null;
  phase: string | null;
  status: "running" | "done" | "failed";
  result: unknown;
}
export interface Run {
  id: string;
  dir: string;
  started: string | null;
  agents: Agent[];
  session?: string;
}
export interface ToolCall {
  tool: string;
  head: string;
  status: "ok" | "error" | "pending";
}

export function parseJsonl(text: string): unknown[];
export function projectSlug(cwd: string): string;
export function defaultProjectDir(cwd?: string, env?: Record<string, string | undefined>): string;
export function readRun(runDir: string): Run;
export function listRuns(projectDir: string, session?: string): Run[];
export function extractJson(text: string): unknown;
export function tailTools(transcriptText: string, n: number): ToolCall[];
export function defaultTmpRoots(uid?: number | string): string[];
export function main(
  argv: string[],
  ctx?: { cwd?: string; env?: Record<string, string | undefined> },
): { code: number; out: string };
