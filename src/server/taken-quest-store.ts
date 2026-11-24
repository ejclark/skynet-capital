import type { QuestBaseRate, QuestMoveKind, QuestSource } from "../domain/quest.js";
import type { TakenQuest } from "../domain/quest-score.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { boundedString, isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * THE QUESTS MEMBERS TOOK (#7028 slice 6). One row per accepted order a quest drafted
 * (`quest-taken.ts`): the quest's id and move, the broker's order id, when, and the base rate the
 * quest carried. `GET /api/quests/taken` joins them onto the account's own trades and scores them
 * (`src/domain/quest-score.ts`); the in-game feedback loop (#7029) reads the scores per quest type.
 *
 * Keyed by desk id, newest last, the oldest dropped past `MAX_PER_DESK`. Plain JSON (ids, a symbol,
 * a timestamp and the study's own numbers — no amounts, no prices), atomic tmp+rename writes, total
 * reads; a write reads the file whole first and refuses rather than rewrite a file it could only
 * read in part (`exit-plan-store.ts`'s rule). A member's rows answer to that member alone (the
 * route's owned-set check).
 */

type TakenState = Readonly<Record<string, readonly TakenQuest[]>>;

/** Enough for a year of a busy member's quests; the oldest go first. */
export const MAX_PER_DESK = 500;

const SOURCES: ReadonlySet<string> = new Set<QuestSource>(["position", "conditions", "event"]);
const MOVES: ReadonlySet<string> = new Set<QuestMoveKind>([
  "sell-to-close",
  "buy-to-close",
  "roll",
  "buy-shares",
  "sell-cash-secured-put",
  "buy-call",
  "sell-covered-call",
]);

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** The rate as written, or undefined — every field the quest record names, nothing more. */
function parseBaseRate(raw: unknown): QuestBaseRate | undefined {
  if (!isRecord(raw)) return undefined;
  const source = boundedString(raw.source, 200);
  const note = boundedString(raw.note, 400);
  if (raw.kind === "untested") return note ? { kind: "untested", note } : undefined;
  if (raw.kind === "tested") {
    const { rate, sample, worstDecile } = raw;
    if (!(num(rate) && num(sample) && num(worstDecile) && source)) return undefined;
    return { kind: "tested", rate, sample, worstDecile, source };
  }
  if (raw.kind === "measured") {
    const { rate, sample, episodes, episodesNeeded, mean, worstDecile, worstSingle } = raw;
    const numbers = [rate, sample, episodes, episodesNeeded, mean, worstDecile, worstSingle];
    if (!(numbers.every(num) && source && note)) return undefined;
    return {
      kind: "measured",
      rate: rate as number,
      sample: sample as number,
      episodes: episodes as number,
      episodesNeeded: episodesNeeded as number,
      mean: mean as number,
      worstDecile: worstDecile as number,
      worstSingle: worstSingle as number,
      source,
      note,
    };
  }
  return undefined;
}

function parseTaken(raw: unknown): TakenQuest | undefined {
  if (!isRecord(raw)) return undefined;
  const questId = boundedString(raw.questId, 200);
  const symbol = boundedString(raw.symbol, 12);
  const orderId = boundedString(raw.orderId, 100);
  const takenAt = boundedString(raw.takenAt, 40);
  const occ = raw.occ === undefined ? undefined : boundedString(raw.occ, 40);
  const baseRate = parseBaseRate(raw.baseRate);
  const { source, moveKind } = raw;
  if (!(questId && symbol && orderId && takenAt && baseRate)) return undefined;
  if (!(typeof source === "string" && SOURCES.has(source))) return undefined;
  if (!(typeof moveKind === "string" && MOVES.has(moveKind))) return undefined;
  if (raw.occ !== undefined && occ === undefined) return undefined;
  return {
    questId,
    source: source as QuestSource,
    moveKind: moveKind as QuestMoveKind,
    symbol,
    ...(occ ? { occ } : {}),
    orderId,
    takenAt,
    baseRate,
  };
}

function parseTakenState(raw: unknown): TakenState | undefined {
  if (!isRecord(raw)) return undefined;
  const state: Record<string, TakenQuest[]> = {};
  for (const [desk, rows] of Object.entries(raw)) {
    if (!Array.isArray(rows)) continue;
    const kept = rows.flatMap((row) => {
      const taken = parseTaken(row);
      return taken ? [taken] : [];
    });
    if (kept.length > 0) state[desk] = kept;
  }
  return state;
}

export class TakenQuestStore {
  private readonly file: JsonFileStore<TakenState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseTakenState,
      empty: {},
      label: "taken-quests",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** The quests this desk took, oldest first. */
  taken(deskId: string): readonly TakenQuest[] {
    return this.file.load()[deskId] ?? [];
  }

  /** Record one taken quest. An order already recorded is not recorded twice. False when the file
   *  could not be read whole, so the write was refused. */
  record(deskId: string, taken: TakenQuest): boolean {
    const state = this.file.loadIfReadable();
    if (!state) return false;
    const rows = state[deskId] ?? [];
    if (rows.some((r) => r.orderId === taken.orderId)) return true;
    this.file.write({ ...state, [deskId]: [...rows, taken].slice(-MAX_PER_DESK) });
    return true;
  }

  /**
   * The broker replaced an order (Modify, `POST /api/trade/replace`): the quest recorded against
   * the old id now follows the new one, since every later fill lands under the new id (#7309).
   * Only the join key moves — the quest, its move and the rate it carried stay as fired. A second
   * replace moves it again, so a chain always ends on the latest order. True when nothing needed
   * moving or the move was written; false when the file could not be read whole.
   */
  replace(deskId: string, fromOrderId: string, toOrderId: string): boolean {
    const state = this.file.loadIfReadable();
    if (!state) return false;
    const rows = state[deskId] ?? [];
    if (!rows.some((r) => r.orderId === fromOrderId)) return true;
    const moved = rows.map((r) => (r.orderId === fromOrderId ? { ...r, orderId: toOrderId } : r));
    this.file.write({ ...state, [deskId]: moved });
    return true;
  }
}

/** The file beside the subscriptions file (`SKYNET_SUBSCRIPTIONS_FILE`, pinned on the volume in
 *  `fly.toml`) — a sibling, so no new env var and no envelope-protected edit. */
export function createTakenQuestStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): TakenQuestStore {
  return new TakenQuestStore(
    siblingPath(
      env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
      "taken-quests.json",
    ),
    onReadError,
  );
}
