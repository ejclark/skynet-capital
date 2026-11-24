export type LifecycleOp =
  | { kind: "add"; label: string }
  | { kind: "remove"; labels: string[] }
  | { kind: "blockers"; count: number }
  | { kind: "boarded"; on: boolean }
  | { kind: "close" };
export type LifecycleTransition = { from: string; to: string; op: LifecycleOp };
export const STATE_OF_CODE: Record<string, string>;
export function transitions(): LifecycleTransition[];
export function lifecycleDiagram(): string;
export function lifecycleBlock(): string;
export function withLifecycle(text: string): string | null;
