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

/** Mirrors the server's `LeaderMetric` — the four snapshot-derived rankings Standings offers. */
export type BoardMetric = "equity" | "pl" | "return" | "realized";

export const BOARD_METRICS: ReadonlyArray<{ key: BoardMetric; label: string }> = [
  { key: "equity", label: "Equity" },
  { key: "pl", label: "Unrealized P/L" },
  { key: "return", label: "Return %" },
  { key: "realized", label: "Realized P/L" },
];

export const parseBoardMetric = (raw: unknown): BoardMetric =>
  raw === "pl" || raw === "return" || raw === "realized" ? raw : "equity";

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

/** One side of a head-to-head — every figure server-formatted. Mirrors `standingsCompareView`. */
export interface CompareSide {
  readonly key: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly equity: string;
  readonly cash: string;
  readonly invested: string;
  readonly unrealized: string;
  readonly unrealizedTone: FieldTone;
  readonly returnPct: string;
  readonly returnTone: FieldTone;
}

export interface CompareDelta {
  readonly label: string;
  readonly lead: "a" | "b" | "tie";
  readonly amount: string;
}

export interface CompareHolding {
  readonly symbol: string;
  readonly aValue?: string;
  readonly bValue?: string;
  readonly shared: boolean;
  readonly heavier: "a" | "b" | "even";
}

export interface BoardCompare {
  readonly a: CompareSide;
  readonly b: CompareSide;
  readonly deltas: readonly CompareDelta[];
  readonly holdings: readonly CompareHolding[];
}

export interface BoardSnapshot {
  readonly seq: number;
  readonly generatedAt: string;
  readonly metric: string;
  readonly rows: readonly BoardRow[];
  readonly blocks: Readonly<Record<string, BoardBlock>>;
  readonly compare?: BoardCompare;
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
  readonly compare?: BoardCompare;
}

export interface ComparePick {
  readonly a?: string;
  readonly b?: string;
}

export async function fetchBoard(
  metric: BoardMetric,
  pick: ComparePick = {},
): Promise<BoardSnapshot> {
  const params = new URLSearchParams({ by: metric });
  if (pick.a) params.set("a", pick.a);
  if (pick.b) params.set("b", pick.b);
  const res = await fetch(`/api/board?${params}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET /api/board → ${res.status}`);
  const body = (await res.json()) as ApiBoard;
  return {
    seq: body.seq,
    generatedAt: body.generatedAt,
    metric: body.metric,
    rows: body.view.rows,
    blocks: body.view.blocks,
    ...(body.compare ? { compare: body.compare } : {}),
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
