import { type PlaybookChain, parseChain } from "../playbooks/chain.js";
import { chainHoldsProblems } from "../playbooks/chain-form.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * MEMBERS' OWN CHAINS (#6959 slice 3b) — the chains a member draws in R&D → Playbooks, held private
 * to their author and SHADOW ONLY (criterion 5): a record here is a chain written down, and nothing
 * more. Same shape as `member-campaign-store.ts`: plain JSON on the volume (a title and up to three
 * links of playbook ids and events — no credentials, no personal data), atomic tmp+rename writes,
 * total reads, keyed by `opaqueMemberId(email)`.
 *
 * THE RULE, MECHANICAL. No record carries a status, and no reader outside the chain API and the
 * shadow replay imports this file: no roster, no subscription, no bot wire reads it, so a saved chain
 * cannot place an order. `tests/server/member-chain-store.spec.ts` holds that by scanning the live
 * trading code for this file's name. A live handoff is slice 2, and waits on per-playbook ledgers
 * (#4269); when it lands it adds its own door, it does not reuse this store's.
 *
 * Every record is re-checked on load through `parseChain` and the holding check the form ran, so a
 * hand-edited or stale file drops the bad record rather than serving a chain the form would refuse.
 */

export interface MemberChainRecord {
  readonly chain: PlaybookChain;
  /** ISO-8601. */
  readonly createdAt: string;
  /** ISO-8601. */
  readonly updatedAt: string;
}

export type MemberChainsState = Readonly<Record<string, readonly MemberChainRecord[]>>;

const EMPTY: MemberChainsState = {};

/** The most chains one member keeps; a bound on member text, not a game rule. */
export const MAX_CHAINS_PER_MEMBER = 10;

function parseRecord(raw: unknown): MemberChainRecord | undefined {
  if (!isRecord(raw)) return undefined;
  const { createdAt, updatedAt } = raw;
  if (typeof createdAt !== "string" || typeof updatedAt !== "string") return undefined;
  const parsed = parseChain(raw.chain);
  if (!parsed.ok) return undefined;
  if (chainHoldsProblems(parsed.chain).some((p) => p !== undefined)) return undefined;
  return { chain: parsed.chain, createdAt, updatedAt };
}

export function parseMemberChainsState(raw: unknown): MemberChainsState | undefined {
  if (!isRecord(raw)) return undefined;
  const state: Record<string, readonly MemberChainRecord[]> = {};
  for (const [member, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    // One id per author: a hand-edited file holding two keeps the first, so Edit can't wedge.
    const seen = new Set<string>();
    const records = list.flatMap((item) => {
      const record = parseRecord(item);
      if (!record || seen.has(record.chain.id)) return [];
      seen.add(record.chain.id);
      return [record];
    });
    if (records.length > 0) state[member] = records;
  }
  return state;
}

export type ChainSaveOutcome =
  | { readonly ok: true; readonly record: MemberChainRecord }
  | {
      readonly ok: false;
      /** Which form field the reason belongs to: a taken title is the title's to fix. */
      readonly field: "title" | "links";
      readonly reason: string;
    };

export class MemberChainStore {
  private readonly file: JsonFileStore<MemberChainsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseMemberChainsState(raw),
      empty: EMPTY,
      label: "member-chains",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** This author's chains. The only read: there is no list-all and no by-id across members. */
  list(memberKey: string): readonly MemberChainRecord[] {
    return this.file.load()[memberKey] ?? [];
  }

  /**
   * Save a chain under its author. A new chain whose id this author already uses is refused with
   * the reason, never silently replaced; `replaceId` is Edit and swaps that one chain (the id may
   * change with the title).
   */
  save(
    memberKey: string,
    chain: PlaybookChain,
    replaceId?: string,
    at = new Date(),
  ): ChainSaveOutcome {
    const state = this.file.load();
    const mine = state[memberKey] ?? [];
    const prior = replaceId === undefined ? undefined : mine.find((r) => r.chain.id === replaceId);
    if (replaceId !== undefined && !prior) {
      return { ok: false, field: "links", reason: "That chain is gone, so it can't be changed." };
    }
    if (mine.some((r) => r.chain.id === chain.id && r !== prior)) {
      return { ok: false, field: "title", reason: "You already have a chain with that name." };
    }
    if (!prior && mine.length >= MAX_CHAINS_PER_MEMBER) {
      return {
        ok: false,
        field: "links",
        reason: `You can keep ${MAX_CHAINS_PER_MEMBER} chains; remove one first.`,
      };
    }
    const iso = at.toISOString();
    const record: MemberChainRecord = {
      chain,
      createdAt: prior?.createdAt ?? iso,
      updatedAt: iso,
    };
    const next = prior ? mine.map((r) => (r === prior ? record : r)) : [...mine, record];
    this.file.write({ ...state, [memberKey]: next });
    return { ok: true, record };
  }

  /** Remove one of this author's chains; another member's id is not theirs to remove. */
  delete(memberKey: string, id: string): void {
    const state = this.file.load();
    const mine = state[memberKey] ?? [];
    const remaining = mine.filter((r) => r.chain.id !== id);
    if (remaining.length === mine.length) return; // nothing of theirs by that id: no write
    const next: MemberChainsState =
      remaining.length > 0
        ? { ...state, [memberKey]: remaining }
        : Object.fromEntries(Object.entries(state).filter(([key]) => key !== memberKey));
    this.file.write(next);
  }
}

/** The file beside the subscriptions file, like the authored plays: no new env var, no envelope edit. */
export function memberChainsFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    "member-chains.json",
  );
}

export function createMemberChainStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): MemberChainStore {
  return new MemberChainStore(memberChainsFilePath(env), onReadError);
}
