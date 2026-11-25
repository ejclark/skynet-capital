import { postJson } from "./post";

/**
 * The newcomer's first minutes (#8250), client side: the puzzle the server builds from the
 * earnings calendar and daily bars (`src/server/practice-puzzle.ts`), the practice pick kept in
 * this browser only, and Connect with Alpaca's two calls. Every digit shown comes from the
 * puzzle response — this module computes stakes from those numbers and invents none.
 */

export interface PuzzleName {
  readonly symbol: string;
  readonly reportDate: string;
  readonly timing: "after-close" | "before-open";
  readonly beforeDate: string;
  readonly beforeClose: number;
  readonly afterDate: string;
  readonly afterClose: number;
  readonly movePct: number;
  readonly lastClose: number;
  readonly lastCloseDate: string;
}

export interface Puzzle {
  readonly question: string;
  readonly names: readonly PuzzleName[];
  readonly answer: string;
  readonly source: string;
  readonly readAt: string;
}

export type PuzzleRead = Puzzle | { readonly note: string };

export async function fetchPuzzle(): Promise<PuzzleRead> {
  const res = await fetch("/api/practice/puzzle", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`puzzle ${res.status}`);
  return (await res.json()) as PuzzleRead;
}

export const isPuzzle = (read: PuzzleRead | undefined): read is Puzzle =>
  read !== undefined && "names" in read;

/** The league's starting line — the stake chips are shares of it. */
export const STARTING_LINE = 1_000_000;
/** The three stake chips: 0.1%, 0.5% and 1% of the starting line. */
export const STAKE_SHARES = [0.001, 0.005, 0.01] as const;

/** Whole shares nearest a stake at a price — at least one. */
export function sharesFor(stake: number, price: number): number {
  if (!(price > 0)) return 0;
  return Math.max(1, Math.round((STARTING_LINE * stake) / price));
}

/** A practice pick: never an order, never sent anywhere — kept in this browser. */
export interface PracticePick {
  readonly symbol: string;
  readonly shares: number;
  readonly price: number;
  readonly priceDate: string;
  readonly source: string;
}

const PICK_KEY = "sc.practice-pick";

export function readPick(): PracticePick | undefined {
  try {
    const raw = localStorage.getItem(PICK_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : undefined;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as PracticePick).symbol === "string" &&
      Number.isInteger((parsed as PracticePick).shares) &&
      typeof (parsed as PracticePick).price === "number"
    ) {
      return parsed as PracticePick;
    }
  } catch {
    // storage unavailable or corrupt — no pick
  }
  return undefined;
}

export function writePick(pick: PracticePick | undefined): void {
  try {
    if (pick) localStorage.setItem(PICK_KEY, JSON.stringify(pick));
    else localStorage.removeItem(PICK_KEY);
  } catch {
    // storage unavailable — the pick just doesn't persist
  }
}

/** The outcome of the last connect, read once from the server. */
export type ConnectResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | {
      readonly ok: false;
      readonly error: string;
      readonly reason?: "balance";
      readonly found?: number;
    };

export async function fetchConnectResult(): Promise<ConnectResult | null> {
  const res = await fetch("/api/connect/alpaca", { credentials: "same-origin" });
  if (!res.ok) return null;
  const body = (await res.json()) as { result?: ConnectResult | null };
  return body.result ?? null;
}

export type ConnectStart =
  | { readonly ok: true; readonly authorizeUrl: string }
  | {
      readonly ok: false;
      readonly error: string;
    };

export const startConnect = (input: {
  readonly displayName: string;
  readonly timezone?: string;
}): Promise<ConnectStart> => postJson("/api/connect/alpaca", input);
