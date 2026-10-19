import { parseStoredConviction } from "../playbooks/conviction-parse.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * THE DURABLE STATE BEHIND MEMBERS' CONVICTIONS (#5482 slice 6a) — the views a member states on
 * R&D → Playbooks, or that Moneypenny drafts for them from chat and they confirm. Same shape as
 * `authored-play-store.ts`: plain JSON (a title, some sentences, some dates and pair ids — no
 * credentials, no personal data), atomic tmp+rename writes, total reads, keyed by
 * `opaqueMemberId(email)`.
 *
 * EVERY WRITE READS THE FILE WHOLE FIRST (`loadIfReadable`): each one rewrites every member's
 * records, so a file it could not read in full — torn, or holding a record a newer build wrote — is
 * left alone and the write refused, never rewritten without what it could not read.
 *
 * EVERY RECORD HERE IS A DRAFT, and a draft steers nothing. Nothing in the bots' wiring reads this
 * file, no subscription points at a record in it, and `GET /api/convictions` (the records the bots
 * act on) does not list it. Handing a member's view to the bots is its own slice, with its own
 * status; until then the status is written down so a later build can tell a draft from what it
 * hands over, and a status this build does not know is unreadable rather than read as a draft.
 */

export type MemberConvictionStatus = "draft";

export interface MemberConvictionRecord {
  readonly status: MemberConvictionStatus;
  readonly conviction: Conviction;
  /** ISO-8601. */
  readonly createdAt: string;
  /** ISO-8601. */
  readonly updatedAt: string;
}

/** Member key → that member's convictions, oldest first. */
export type MemberConvictionsState = Readonly<Record<string, readonly MemberConvictionRecord[]>>;

/** A member holds a handful of views at once; more is a list nobody reads, so it is refused. */
export const MAX_CONVICTIONS_PER_MEMBER = 12;

const isStamp = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= 40;

function parseRecord(raw: unknown): MemberConvictionRecord | undefined {
  if (!isRecord(raw) || raw.status !== "draft") return undefined;
  const conviction = parseStoredConviction(raw.conviction);
  if (!(conviction && isStamp(raw.createdAt) && isStamp(raw.updatedAt))) return undefined;
  return { status: "draft", conviction, createdAt: raw.createdAt, updatedAt: raw.updatedAt };
}

/** Total: a torn file is `undefined` (the store falls back to empty); a record this build cannot
 *  read is dropped, never fatal to the file. */
export function parseMemberConvictionsState(raw: unknown): MemberConvictionsState | undefined {
  if (!isRecord(raw)) return undefined;
  const state: Record<string, readonly MemberConvictionRecord[]> = {};
  for (const [member, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    const records = list.flatMap((item) => {
      const record = parseRecord(item);
      return record ? [record] : [];
    });
    if (records.length > 0) state[member] = records;
  }
  return state;
}

export type ConvictionSaveOutcome =
  | { readonly ok: true; readonly record: MemberConvictionRecord }
  | { readonly ok: false; readonly reason: string };

/** Why a write was refused when the file on disk could not be read whole. */
export const UNREADABLE_FILE =
  "Saved views couldn't be read in full just now, so nothing was changed. Try again shortly.";

export class MemberConvictionStore {
  private readonly file: JsonFileStore<MemberConvictionsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseMemberConvictionsState,
      empty: {},
      label: "member-convictions",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): MemberConvictionsState {
    return this.file.load();
  }

  list(memberKey: string): readonly MemberConvictionRecord[] {
    return this.load()[memberKey] ?? [];
  }

  /** Every member's conviction ids, for the draft's id check. */
  ids(): ReadonlySet<string> {
    return new Set(
      Object.values(this.load()).flatMap((records) => records.map((r) => r.conviction.id)),
    );
  }

  /**
   * Save a draft. `replaceId` is Edit: it swaps that one record of this member for the new
   * conviction (the id may change with the title) and is refused when the record is gone. A new
   * record past the member's cap is refused with the reason, never dropping an older one.
   */
  save(
    memberKey: string,
    conviction: Conviction,
    at: Date,
    replaceId?: string,
  ): ConvictionSaveOutcome {
    const state = this.file.loadIfReadable();
    if (!state) return { ok: false, reason: UNREADABLE_FILE };
    const mine = state[memberKey] ?? [];
    const stamp = at.toISOString();
    const replaced = replaceId ? mine.find((r) => r.conviction.id === replaceId) : undefined;
    if (replaceId && !replaced) {
      return { ok: false, reason: "That view is gone, so it can't be edited." };
    }
    const taken = Object.values(state)
      .flat()
      .some((r) => r.conviction.id === conviction.id && r !== replaced);
    if (taken) {
      return { ok: false, reason: `A view with the id "${conviction.id}" already exists.` };
    }
    if (!replaced && mine.length >= MAX_CONVICTIONS_PER_MEMBER) {
      return {
        ok: false,
        reason: `You hold ${MAX_CONVICTIONS_PER_MEMBER} views already; delete one before stating another.`,
      };
    }
    const record: MemberConvictionRecord = {
      status: "draft",
      conviction,
      createdAt: replaced?.createdAt ?? stamp,
      updatedAt: stamp,
    };
    const next = replaced ? mine.map((r) => (r === replaced ? record : r)) : [...mine, record];
    this.file.write({ ...state, [memberKey]: next });
    return { ok: true, record };
  }

  /** Remove one of this member's records; a missing id is a no-op. */
  delete(
    memberKey: string,
    id: string,
  ): { readonly ok: true } | { readonly ok: false; readonly reason: string } {
    const state = this.file.loadIfReadable();
    if (!state) return { ok: false, reason: UNREADABLE_FILE };
    const mine = state[memberKey] ?? [];
    if (!mine.some((r) => r.conviction.id === id)) return { ok: true };
    this.file.write({ ...state, [memberKey]: mine.filter((r) => r.conviction.id !== id) });
    return { ok: true };
  }
}

/** The file beside the subscriptions file (`SKYNET_SUBSCRIPTIONS_FILE`, pinned on the volume in
 *  `fly.toml`) — a sibling, so no new env var and no envelope-protected edit. */
export function memberConvictionsFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    "member-convictions.json",
  );
}

export function createMemberConvictionStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): MemberConvictionStore {
  return new MemberConvictionStore(memberConvictionsFilePath(env), onReadError);
}
