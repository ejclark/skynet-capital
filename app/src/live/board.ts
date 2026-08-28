/**
 * The board's client-side model — the JSON twin of the server's standings view, and the pure
 * function that moves it forward one `/events` patch at a time.
 *
 * Contract note (phase 0): these types mirror `standingsBoardView` and the `field`/`cue`/`reframe`
 * ops in `src/observatory/standings-patch.ts` + `src/universe/world-patch.ts` by hand. Every value
 * arrives formatted by the server — this module never derives a number, it only places what the
 * server said (the same doctrine the DOM patcher follows). A shared contract package is phase-1
 * work; duplicating ~40 lines of types beats coupling the app build into the server's tsconfig.
 */

export type FieldTone = "pos" | "neg" | "flat";

export interface BoardRow {
  readonly key: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly value: string;
  readonly tone: FieldTone;
  readonly bar: number;
  readonly sortValue: number;
}

export interface BoardBlock {
  readonly text: Record<string, string>;
  readonly tone?: Record<string, FieldTone>;
  readonly bar?: Record<string, number>;
}

export interface BoardSnapshot {
  readonly seq: number;
  readonly generatedAt: string;
  readonly metric: string;
  readonly rows: readonly BoardRow[];
  readonly blocks: Readonly<Record<string, BoardBlock>>;
  /** How many live ops this snapshot has absorbed since it was fetched — the seam's heartbeat. */
  readonly opsApplied: number;
}

/** The subset of the wire's op vocabulary this 2D view consumes. Empire/piece ops belong to the
 *  3D world and are deliberately ignored here — unknown kinds are NOT gaps. */
interface FieldOp {
  readonly kind: "field";
  readonly key: string;
  readonly text?: Record<string, string>;
  readonly tone?: Record<string, FieldTone>;
  readonly bar?: Record<string, number>;
  readonly sortValue?: number;
}
interface ReframeOp {
  readonly kind: "reframe";
  readonly reason: string;
}
export type PatchOp = FieldOp | ReframeOp | { readonly kind: string };

export interface BoardPatch {
  readonly seq: number;
  readonly at: string;
  readonly ops: readonly PatchOp[];
}

interface ApiBoard {
  readonly seq: number;
  readonly generatedAt: string;
  readonly metric: string;
  readonly view: {
    readonly rows: readonly BoardRow[];
    readonly blocks: Readonly<Record<string, BoardBlock>>;
  };
}

export async function fetchBoard(): Promise<BoardSnapshot> {
  const res = await fetch("/api/board", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET /api/board → ${res.status}`);
  const body = (await res.json()) as ApiBoard;
  return {
    seq: body.seq,
    generatedAt: body.generatedAt,
    metric: body.metric,
    rows: body.view.rows,
    blocks: body.view.blocks,
    opsApplied: 0,
  };
}

const isField = (op: PatchOp): op is FieldOp => op.kind === "field";

function applyRowOp(rows: readonly BoardRow[], op: FieldOp): readonly BoardRow[] {
  const next = rows.map((row) =>
    row.key === op.key
      ? {
          ...row,
          value: op.text?.value ?? row.value,
          tone: op.tone?.value ?? row.tone,
          bar: op.bar?.bar ?? row.bar,
          sortValue: op.sortValue ?? row.sortValue,
        }
      : row,
  );
  return [...next].sort((a, b) => b.sortValue - a.sortValue);
}

function applyBlockOp(block: BoardBlock, op: FieldOp): BoardBlock {
  return {
    text: { ...block.text, ...op.text },
    ...(block.tone || op.tone ? { tone: { ...block.tone, ...op.tone } } : {}),
    ...(block.bar || op.bar ? { bar: { ...block.bar, ...op.bar } } : {}),
  };
}

/**
 * Apply one seq-numbered patch. Returns the moved snapshot, or `null` when the honest answer is a
 * fresh fetch: a seq gap (this patch is not the next one), or a `reframe` (the server itself said
 * the page's structure moved beyond what ops can express).
 */
export function applyPatch(snapshot: BoardSnapshot, patch: BoardPatch): BoardSnapshot | null {
  if (patch.seq <= snapshot.seq) return snapshot; // already reflected in the fetched snapshot
  if (patch.seq !== snapshot.seq + 1) return null; // gap — recover with a snapshot, never guess
  if (patch.ops.some((op) => op.kind === "reframe")) return null;

  let rows = snapshot.rows;
  const blocks: Record<string, BoardBlock> = { ...snapshot.blocks };
  let applied = 0;
  for (const op of patch.ops) {
    if (!isField(op)) continue; // empire/piece/cue ops belong to other surfaces
    const block = blocks[op.key];
    if (block) {
      blocks[op.key] = applyBlockOp(block, op);
      applied += 1;
    } else if (rows.some((row) => row.key === op.key)) {
      rows = applyRowOp(rows, op);
      applied += 1;
    }
    // An op addressing a key this view doesn't hold is for a surface this shell doesn't render
    // yet (e.g. a compare pane) — ignoring it is correct; the seq run stays intact.
  }
  return {
    ...snapshot,
    seq: patch.seq,
    generatedAt: patch.at,
    rows,
    blocks,
    opsApplied: snapshot.opsApplied + applied,
  };
}
