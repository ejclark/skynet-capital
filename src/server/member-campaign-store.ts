import { type Campaign, parseCampaign } from "../domain/campaigns.js";
import { everyEvent } from "../domain/market-events.js";
import { ledgerCoversSymbol } from "../domain/sector-coverage.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";
import { listResearch, RESEARCH_DIR } from "./research-service.js";

/**
 * MEMBERS' OWN CAMPAIGNS (#6949 slice 3a) — the campaigns a member crafts from the form, held
 * PRIVATE to their author. Same shape as `authored-play-store.ts`: plain JSON on the volume (a
 * title, a storyline, a sector or market and some tickers — no credentials, no personal data),
 * atomic tmp+rename writes, total reads.
 *
 * Keyed by `opaqueMemberId(email)`: the key IS the author, and the only reads are by that key, so
 * a member's campaign reaches nobody else (criterion 8). Inviting the party is slice 3b; until then
 * no read here takes another member's key.
 *
 * Every record is re-checked through `parseCampaign` on load, the same parser the house files pass,
 * so a hand-edited or stale file drops the bad record rather than serving it.
 */

/** A member's campaign as stored: the record, when, and what research it asked for. */
export interface MemberCampaignRecord {
  readonly campaign: Campaign;
  readonly createdAt: string;
  readonly updatedAt: string;
  /**
   * Cast names the house had no research on when the campaign was saved (criterion 9). An ask,
   * not a dispatch: nothing in the app starts research, so it can never raise the research lane's
   * ceiling.
   */
  readonly researchAsk: readonly string[];
}

export type MemberCampaignsState = Readonly<Record<string, readonly MemberCampaignRecord[]>>;

const EMPTY: MemberCampaignsState = {};

function parseRecord(raw: unknown): MemberCampaignRecord | undefined {
  if (!(isRecord(raw) && isRecord(raw.campaign))) return undefined;
  const { createdAt, updatedAt, researchAsk } = raw;
  if (typeof createdAt !== "string" || typeof updatedAt !== "string") return undefined;
  if (!(Array.isArray(researchAsk) && researchAsk.every((s) => typeof s === "string")))
    return undefined;
  try {
    const id = String(raw.campaign.id);
    const campaign = parseCampaign(raw.campaign, "member-campaigns.json", id);
    return { campaign, createdAt, updatedAt, researchAsk };
  } catch {
    return undefined;
  }
}

export function parseMemberCampaignsState(raw: unknown): MemberCampaignsState | undefined {
  if (!isRecord(raw)) return undefined;
  const state: Record<string, readonly MemberCampaignRecord[]> = {};
  for (const [member, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    // One id per author: a hand-edited file holding two keeps the first, so Edit can't wedge.
    const seen = new Set<string>();
    const records = list.flatMap((item) => {
      const record = parseRecord(item);
      if (!record || seen.has(record.campaign.id)) return [];
      seen.add(record.campaign.id);
      return [record];
    });
    if (records.length > 0) state[member] = records;
  }
  return state;
}

export type CampaignSaveOutcome =
  | { readonly ok: true; readonly record: MemberCampaignRecord }
  | {
      readonly ok: false;
      /** Which form field the reason belongs to: a taken name is the title's to fix. */
      readonly field: "title" | "form";
      readonly reason: string;
    };

/** The most campaigns one member keeps; a bound on member text, not a game rule. */
export const MAX_CAMPAIGNS_PER_MEMBER = 20;

export class MemberCampaignStore {
  private readonly file: JsonFileStore<MemberCampaignsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseMemberCampaignsState(raw),
      empty: EMPTY,
      label: "member-campaigns",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** This author's campaigns. The only read: there is no list-all and no by-id across members. */
  list(memberKey: string): readonly MemberCampaignRecord[] {
    return this.file.load()[memberKey] ?? [];
  }

  /**
   * Save a campaign under its author. A new campaign whose id this author already uses is refused
   * with the reason, never silently replaced; `replaceId` is Edit and swaps that one campaign (the
   * id may change with the title). Ids are unique per author only — nobody else's list is read.
   */
  save(
    memberKey: string,
    campaign: Campaign,
    researchAsk: readonly string[],
    replaceId?: string,
    at = new Date(),
  ): CampaignSaveOutcome {
    const state = this.file.load();
    const mine = state[memberKey] ?? [];
    const prior =
      replaceId === undefined ? undefined : mine.find((r) => r.campaign.id === replaceId);
    if (replaceId !== undefined && !prior) {
      return { ok: false, field: "form", reason: "That campaign is gone, so it can't be changed." };
    }
    if (mine.some((r) => r.campaign.id === campaign.id && r !== prior)) {
      return { ok: false, field: "title", reason: "You already have a campaign with that name." };
    }
    if (!prior && mine.length >= MAX_CAMPAIGNS_PER_MEMBER) {
      return {
        ok: false,
        field: "form",
        reason: `You can keep ${MAX_CAMPAIGNS_PER_MEMBER} campaigns; remove one first.`,
      };
    }
    const iso = at.toISOString();
    const record: MemberCampaignRecord = {
      campaign,
      createdAt: prior?.createdAt ?? iso,
      updatedAt: iso,
      researchAsk: [...researchAsk],
    };
    const next = prior ? mine.map((r) => (r === prior ? record : r)) : [...mine, record];
    this.file.write({ ...state, [memberKey]: next });
    return { ok: true, record };
  }

  /** Remove one of this author's campaigns; another member's id is not theirs to remove. */
  delete(memberKey: string, id: string): void {
    const state = this.file.load();
    const mine = state[memberKey] ?? [];
    const remaining = mine.filter((r) => r.campaign.id !== id);
    if (remaining.length === mine.length) return; // nothing of theirs by that id: no write
    const next: MemberCampaignsState =
      remaining.length > 0
        ? { ...state, [memberKey]: remaining }
        : Object.fromEntries(Object.entries(state).filter(([key]) => key !== memberKey));
    this.file.write(next);
  }
}

/** The file beside the subscriptions file, like the authored plays: no new env var, no envelope edit. */
export function memberCampaignsFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    "member-campaigns.json",
  );
}

export function createMemberCampaignStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): MemberCampaignStore {
  return new MemberCampaignStore(memberCampaignsFilePath(env), onReadError);
}

/**
 * Whether the house has a ledger on a symbol — the shelf's own rule (`ledgerCoversSymbol`, shared
 * with the coverage map and the shelf chips), read once per call. A save is rare, so this reads the
 * shelf fresh each time rather than caching a stale answer.
 */
export function shelfResearched(root: string = RESEARCH_DIR()): (symbol: string) => boolean {
  const eventSymbols = new Map(everyEvent().map((e) => [e.id, new Set(e.symbols)]));
  const ledgers = listResearch(root).ledgers.map((d) =>
    d.slug.startsWith("events/") ? d.slug.slice("events/".length) : d.slug,
  );
  return (symbol) =>
    ledgers.some((id) => ledgerCoversSymbol(id, symbol, eventSymbols.get(id) ?? new Set()));
}
