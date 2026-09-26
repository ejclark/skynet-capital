// Types for the spec's import; the runtime is guard-bash.mjs (same pattern as script-deps.d.mts).
export interface BannedRule {
  name: string;
  test: (command: string) => boolean;
  reason: string;
}
export declare const BANNED: readonly BannedRule[];
export interface HookInput {
  tool_name?: string;
  tool_input?: { command?: string; [key: string]: unknown };
}
export declare function guardVerdict(
  input: HookInput | null | undefined,
): { allow: true } | { allow: false; rule: string; reason: string };
