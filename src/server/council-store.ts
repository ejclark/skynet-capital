import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";

/**
 * THE COUNCIL — one line per member per week, visible inside the gate (`docs/THE-GAME.md:117`:
 * "Everyone commits one line: a thesis and their bot's stance for the week... the argument is the
 * product"). Issue #2224 shape 1 — the smallest member-authored-text-to-other-members surface,
 * extending the same pseudonymous exposure posture `feedback-log.ts`'s Feedback pulse already
 * established rather than inventing a new one (`opaqueMemberId`, never a name or email).
 *
 * A member's line REPLACES their prior line for the same week — a resubmit is an edit, not a
 * second entry — which is what makes "one line per member per week" true without a separate
 * already-submitted refusal path. Keyed by ISO week (`weekKey`) so old weeks stay readable as a
 * record without a retention sweep; the file is small (member count × week count), so one plain
 * JSON file (like `bot-controls-store.ts`) fits the whole history, not a JSONL-per-key store.
 */

export interface CouncilEntry {
  readonly text: string;
  readonly at: string;
  /** A playbook id from `src/playbooks/registry.ts`, when the member tagged one — not surfaced in
   *  the UI yet (issue #2224 shape 1's slicing sketch item 3); the field exists now so that slice
   *  needs no migration, the same forward-additive move `decision-db.ts`'s `retrospectives` table
   *  made for PR 7. */
  readonly playbookId?: string;
}

export interface CouncilState {
  readonly weeks: Readonly<Record<string, Readonly<Record<string, CouncilEntry>>>>;
}

export const EMPTY_COUNCIL: CouncilState = { weeks: {} };

export const MAX_COUNCIL_TEXT_LENGTH = 280;

function parseEntry(raw: unknown): CouncilEntry | null {
  if (!isRecord(raw)) return null;
  if (
    typeof raw.text !== "string" ||
    raw.text.length === 0 ||
    raw.text.length > MAX_COUNCIL_TEXT_LENGTH
  ) {
    return null;
  }
  if (typeof raw.at !== "string") return null;
  return {
    text: raw.text,
    at: raw.at,
    ...(typeof raw.playbookId === "string" && raw.playbookId.length > 0
      ? { playbookId: raw.playbookId }
      : {}),
  };
}

/** Total, defensive parse — a torn file or a hostile body can only ever produce `null` (caller
 *  falls back to `EMPTY_COUNCIL`), never a throw. Same doctrine as `bot-controls.ts`'s
 *  `parseControlsState`. */
export function parseCouncilState(raw: unknown): CouncilState | null {
  if (!isRecord(raw)) return null;
  const weeks: Record<string, Record<string, CouncilEntry>> = {};
  if (isRecord(raw.weeks)) {
    for (const [week, members] of Object.entries(raw.weeks)) {
      if (!isRecord(members)) continue;
      const entries: Record<string, CouncilEntry> = {};
      for (const [memberId, value] of Object.entries(members)) {
        const entry = parseEntry(value);
        if (entry) entries[memberId] = entry;
      }
      if (Object.keys(entries).length > 0) weeks[week] = entries;
    }
  }
  return { weeks };
}

/** The ISO-8601 week (`"2026-W37"`) `at` falls in, Monday-start per the standard — a stable key
 *  that needs no separate rollover job; "this week" is just `weekKey(new Date())`. */
export function weekKey(at: Date): string {
  const date = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  // ISO weekday: Monday = 1 ... Sunday = 7 (JS's own getUTCDay is Sunday = 0).
  const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + 4 - isoDay); // shift to this week's Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export class CouncilStore {
  private readonly file: JsonFileStore<CouncilState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseCouncilState(raw) ?? undefined,
      empty: EMPTY_COUNCIL,
      label: "council",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): CouncilState {
    return this.file.load();
  }

  /** One member's line for one week — replaces their prior line for that same week. `text` is
   *  trimmed and bounds-checked by the caller (`council-form.ts`), never here: this class persists,
   *  it doesn't validate. */
  submit(week: string, opaqueMemberId: string, entry: CouncilEntry): CouncilState {
    const state = this.load();
    const next: CouncilState = {
      weeks: {
        ...state.weeks,
        [week]: { ...state.weeks[week], [opaqueMemberId]: entry },
      },
    };
    this.file.write(next);
    return next;
  }
}

/** Derives the council file as a sibling of the already-pinned controls file — no new env var, no
 *  `fly.toml` change (envelope-protected), same move `decision-db.ts`'s `decisionDbPathFrom` makes
 *  for its own sibling file next to `SKYNET_BOTS_DB_PATH`. */
export function councilFilePathFrom(controlsFilePath: string): string {
  const lastSlash = Math.max(controlsFilePath.lastIndexOf("/"), controlsFilePath.lastIndexOf("\\"));
  const dir = lastSlash >= 0 ? controlsFilePath.slice(0, lastSlash + 1) : "";
  return `${dir}council.json`;
}

/** Build the store from the environment, riding the same file `bot-controls-store.ts` resolves. */
export function createCouncilStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): CouncilStore {
  return new CouncilStore(
    councilFilePathFrom(env.SKYNET_CONTROLS_FILE ?? "data/bot-controls.json"),
    onReadError,
  );
}
