import { parseSteeredAccounts, type WiredConviction } from "../autonomous/convictions-wire.js";
import { parseStoredConviction } from "../playbooks/conviction-parse.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";
import type { MemberPointers } from "../subscriptions/conviction-pointer.js";

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
 * A DRAFT STEERS NOTHING. A record reaches the bots only with the `steering` status and the
 * accounts it may steer (slice 6c): `handedOver` lists those, and the controls poll carries them
 * (`convictions-wire.ts`). `handOver` writes that status, with the accounts the route resolved from
 * the session (never from a body); `takeBack` returns it to a draft, and so does an edit (`save`
 * always keeps a draft) — a view changed after its owner handed it over is a view they have not
 * handed over. Which subscriptions point at a held view is the pointer rule's call
 * (`conviction-pointer.ts`, fed by `pointers`). A status this build does not know is unreadable
 * rather than read as a draft.
 */

export type MemberConvictionStatus = "draft" | "steering";

export interface MemberConvictionRecord {
  readonly status: MemberConvictionStatus;
  readonly conviction: Conviction;
  /** The bot accounts a `steering` record may steer: its owner's, when they handed it over. */
  readonly accounts?: readonly string[];
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
  if (!isRecord(raw) || (raw.status !== "draft" && raw.status !== "steering")) return undefined;
  const conviction = parseStoredConviction(raw.conviction);
  if (!(conviction && isStamp(raw.createdAt) && isStamp(raw.updatedAt))) return undefined;
  const stamps = { createdAt: raw.createdAt, updatedAt: raw.updatedAt };
  if (raw.status === "draft") return { status: "draft", conviction, ...stamps };
  // A view handed over without the accounts it may steer could be pointed at from any bot.
  const accounts = parseSteeredAccounts(raw.accounts);
  return accounts ? { status: "steering", conviction, accounts, ...stamps } : undefined;
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
  | {
      readonly ok: true;
      readonly record: MemberConvictionRecord;
      /** The edit replaced a view that was steering, so it no longer is. */
      readonly tookBack: boolean;
    }
  | { readonly ok: false; readonly reason: string };

export type ConvictionStatusOutcome =
  | { readonly ok: true; readonly record: MemberConvictionRecord }
  | { readonly ok: false; readonly reason: string };

/** Why a status change was refused when the member holds no record by that id. */
export const GONE = "That view is gone. Refresh to see the views you hold.";

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

  /** Every view handed to the bots, with the accounts each may steer — what the poll carries. */
  handedOver(): readonly WiredConviction[] {
    return handedOverIn(this.load());
  }

  /** The pointer rule's read (`conviction-pointer.ts`): the views held per account, and every id.
   *  One read of the file, so both halves describe the same moment. */
  pointers(): MemberPointers {
    const state = this.load();
    const wired = handedOverIn(state);
    return {
      heldBy: (accountId) =>
        wired.filter((w) => w.accounts.includes(accountId)).map((w) => w.conviction),
      ids: new Set(Object.values(state).flatMap((records) => records.map((r) => r.conviction.id))),
    };
  }

  /** Hand one of this member's views to their bots: the `steering` status, with the accounts it may
   *  steer (the route resolves them from the session). Handing over a steering view again replaces
   *  its accounts. */
  handOver(
    memberKey: string,
    id: string,
    accounts: readonly string[],
    at: Date,
  ): ConvictionStatusOutcome {
    if (!parseSteeredAccounts(accounts)) {
      return { ok: false, reason: "No bot of yours can take this view." };
    }
    return this.restatus(memberKey, id, (r) => ({
      status: "steering",
      conviction: r.conviction,
      accounts,
      createdAt: r.createdAt,
      updatedAt: at.toISOString(),
    }));
  }

  /** Take one of this member's views back from their bots: a draft again. A draft is unchanged. */
  takeBack(memberKey: string, id: string, at: Date): ConvictionStatusOutcome {
    return this.restatus(memberKey, id, (r) =>
      r.status === "draft"
        ? r
        : {
            status: "draft",
            conviction: r.conviction,
            createdAt: r.createdAt,
            updatedAt: at.toISOString(),
          },
    );
  }

  private restatus(
    memberKey: string,
    id: string,
    next: (record: MemberConvictionRecord) => MemberConvictionRecord,
  ): ConvictionStatusOutcome {
    const state = this.file.loadIfReadable();
    if (!state) return { ok: false, reason: UNREADABLE_FILE };
    const mine = state[memberKey] ?? [];
    const prior = mine.find((r) => r.conviction.id === id);
    if (!prior) return { ok: false, reason: GONE };
    const record = next(prior);
    if (record !== prior) {
      this.file.write({ ...state, [memberKey]: mine.map((r) => (r === prior ? record : r)) });
    }
    return { ok: true, record };
  }

  /**
   * Save a draft. `replaceId` is Edit: it swaps that one record of this member for the new
   * conviction (the id may change with the title) and is refused when the record is gone. The edit
   * is always a draft, so a steering view edited is taken back (`tookBack`). A new record past the
   * member's cap is refused with the reason, never dropping an older one.
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
    return { ok: true, record, tookBack: replaced?.status === "steering" };
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

function handedOverIn(state: MemberConvictionsState): readonly WiredConviction[] {
  return Object.values(state).flatMap((records) =>
    records.flatMap((r) =>
      r.status === "steering" && r.accounts
        ? [{ conviction: r.conviction, accounts: r.accounts }]
        : [],
    ),
  );
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
