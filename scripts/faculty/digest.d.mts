// Types for digest.mjs (the round digest) — read by tests/scripts/faculty-digest.spec.ts.

export function worstTurn(
  turns: readonly {
    n: number;
    step?: number;
    confusion?: number;
    as_member?: string;
    noticed?: string;
  }[],
  dir: string,
):
  | {
      turn: { n: number; confusion?: number; as_member?: string; noticed?: string };
      frame?: string;
    }
  | undefined;
export function memberWrites(summary: {
  writes?: readonly { method: string; url: string; body: string | null }[];
}): string[];
export function entry(dir: string, summary: Record<string, unknown>): string;
