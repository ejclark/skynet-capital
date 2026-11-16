import {
  parseTargetSplit,
  type TargetSplit,
  type TargetSplitInput,
} from "../observatory/target-split.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * THE DURABLE STATE BEHIND A MEMBER'S TARGET SPLIT (#4607 slice 1) — one record per member, so the
 * target set on a laptop is the one the phone compares against. Keyed by `opaqueMemberId(email)`,
 * the same per-member identity space as saved positions: a target belongs to the person, not to a
 * linked desk (a member may own zero or several).
 *
 * Plain JSON (three percents, a tolerance and a timestamp — no amounts, no PII), atomic tmp+rename
 * writes, total reads. A write reads the file whole first and refuses rather than rewrite a file it
 * could only read in part (`exit-plan-store.ts`'s rule), so one bad record never erases the rest.
 */

type TargetSplitState = Readonly<Record<string, TargetSplit>>;

function parseState(raw: unknown): TargetSplitState | undefined {
  if (!isRecord(raw)) return undefined;
  const state: Record<string, TargetSplit> = {};
  for (const [member, record] of Object.entries(raw)) {
    const parsed = parseTargetSplit(record);
    if (parsed) state[member] = parsed;
  }
  return state;
}

export class TargetSplitStore {
  private readonly file: JsonFileStore<TargetSplitState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseState,
      empty: {},
      label: "target-splits",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** This member's target, or undefined when they have not set one. */
  get(memberKey: string): TargetSplit | undefined {
    return this.file.load()[memberKey];
  }

  /** Set (or replace) this member's target. Undefined when the file could not be read whole, so
   *  the write was refused. */
  set(memberKey: string, input: TargetSplitInput, at = new Date()): TargetSplit | undefined {
    const state = this.file.loadIfReadable();
    if (!state) return undefined;
    const next: TargetSplit = {
      sharesPct: input.sharesPct,
      optionsPct: input.optionsPct,
      cashPct: input.cashPct,
      tolerancePct: input.tolerancePct,
      updatedAt: at.toISOString(),
    };
    this.file.write({ ...state, [memberKey]: next });
    return next;
  }

  /** Remove this member's target. False when the file could not be read whole. */
  clear(memberKey: string): boolean {
    const state = this.file.loadIfReadable();
    if (!state) return false;
    if (!(memberKey in state)) return true;
    this.file.write(Object.fromEntries(Object.entries(state).filter(([key]) => key !== memberKey)));
    return true;
  }
}

/** The file beside the saved-positions file (`SKYNET_SAVED_POSITIONS_FILE`, pinned on the volume
 *  in `fly.toml`) — a sibling, so no new env var and no envelope-protected edit. Both are a
 *  member's own book data, keyed the same way. */
export function targetSplitsFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SAVED_POSITIONS_FILE ?? "data/saved-positions.json",
    "target-splits.json",
  );
}

export function createTargetSplitStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): TargetSplitStore {
  return new TargetSplitStore(targetSplitsFilePath(env), onReadError);
}
