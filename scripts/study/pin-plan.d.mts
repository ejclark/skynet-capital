// Type surface for pin-plan.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export const HARNESS: "scripts/study/";

export type PinArgs =
  | { command: "prepare"; commit: string; dir: string }
  | { command: "remove"; dir: string };

export function pinArgs(argv: string[]): PinArgs;
export function isHarnessPath(path: string): boolean;
export function overlayManifest(files: { path: string; sha256: string }[]): {
  files: { path: string; sha256: string }[];
  tree: string;
};
export function cloneAttempts(from: string, to: string): string[][];
export function prepareVerdict(
  seen: { exists: boolean; worktreeHead?: string },
  commit: string,
): { action: "create" } | { action: "reuse" } | { action: "refuse"; why: string };
export function removeVerdict(seen: {
  registered: boolean;
  isMain: boolean;
  isSelf: boolean;
  hasPinRecord: boolean;
}): { ok: true } | { ok: false; why: string };
export function worktreesFrom(porcelain: string): Map<string, { head?: string; main: boolean }>;
