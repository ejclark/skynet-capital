import { displayName } from "../domain/campaign-questions.js";
import { type Campaign, parseCampaign } from "../domain/campaigns.js";
import { everyEvent } from "../domain/market-events.js";
import { ledgerCoversSymbol } from "../domain/sector-coverage.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";
import { listResearch, RESEARCH_DIR } from "./research-service.js";

/**
 * MEMBERS' OWN CAMPAIGNS (#6949 slices 3a, 3b, 6) — the campaigns a member crafts from the form.
 * Same shape as `authored-play-store.ts`: plain JSON on the volume (a title, a storyline, a sector
 * or market and some tickers — no credentials, no personal data), atomic tmp+rename writes, total
 * reads.
 *
 * Keyed by `opaqueMemberId(email)`: the key IS the author, and every write reads by that key, so
 * only the author ever changes a campaign's frame (criterion 11).
 *
 * THE PARTY'S BY DEFAULT (slice 6, criterion 8; Eric, 2026-11-07: "Campaigns are communal"). A new
 * campaign is saved shared, carrying `sharedAt` and the author's display name, unless the author
 * holds it back as a draft. `listShared` is the one read across authors and returns only records
 * carrying `sharedAt`; holding one back deletes that field, so the next read stops returning it.
 * A record saved before slice 6, under the old private default, has no `sharedAt` and stays a draft
 * until its author shares it: the flip never publishes a campaign its author saved as private.
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
  /**
   * Set while the campaign is the party's (slice 6: from its first save, unless held back as a
   * draft), with the display name to show beside it. Both or neither: a record with one and not
   * the other parses as a draft.
   */
  readonly sharedAt?: string;
  readonly sharedBy?: string;
}

/** A shared campaign as the party reads it: the record plus who it belongs to. */
export interface SharedCampaign {
  readonly memberKey: string;
  readonly record: MemberCampaignRecord & { readonly sharedAt: string; readonly sharedBy: string };
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
    const { sharedAt, sharedBy } = raw;
    const shared =
      typeof sharedAt === "string" && typeof sharedBy === "string" && sharedBy.length > 0
        ? { sharedAt, sharedBy: displayName(sharedBy) }
        : {};
    return { campaign, createdAt, updatedAt, researchAsk, ...shared };
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

  /** This author's campaigns, drafts included. Across authors, only `listShared` reads. */
  list(memberKey: string): readonly MemberCampaignRecord[] {
    return this.file.load()[memberKey] ?? [];
  }

  /**
   * Save a campaign under its author. A new campaign whose id this author already uses is refused
   * with the reason, never silently replaced; `replaceId` is Edit and swaps that one campaign (the
   * id may change with the title). Ids are unique per author only — nobody else's list is read.
   *
   * `share` says who it goes to the party as: a display name shares it, `false` holds it back as a
   * draft, and leaving it out keeps an edited campaign as it was (a new one with no `share` is a
   * draft, so the default lives in one place: the route).
   */
  save(
    memberKey: string,
    campaign: Campaign,
    researchAsk: readonly string[],
    options: {
      readonly replaceId?: string;
      readonly share?: { readonly by: string } | false;
      readonly at?: Date;
    } = {},
  ): CampaignSaveOutcome {
    const { replaceId, share, at = new Date() } = options;
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
    const by = share ? displayName(share.by) : "";
    const shared =
      share === undefined
        ? prior?.sharedAt && prior.sharedBy
          ? { sharedAt: prior.sharedAt, sharedBy: prior.sharedBy }
          : {}
        : by
          ? { sharedAt: prior?.sharedAt ?? iso, sharedBy: prior?.sharedBy ?? by }
          : {};
    const record: MemberCampaignRecord = {
      campaign,
      createdAt: prior?.createdAt ?? iso,
      updatedAt: iso,
      researchAsk: [...researchAsk],
      ...shared,
    };
    const next = prior ? mine.map((r) => (r === prior ? record : r)) : [...mine, record];
    this.file.write({ ...state, [memberKey]: next });
    return { ok: true, record };
  }

  /**
   * Every campaign its author has shared with the party, newest share first. The one read across
   * authors: a record without `sharedAt` is never returned. The caller serves it to signed-in
   * members only (the invite gate), which is the route's job, not the store's.
   */
  listShared(): readonly SharedCampaign[] {
    const out: SharedCampaign[] = [];
    for (const [memberKey, records] of Object.entries(this.file.load())) {
      for (const record of records) {
        if (record.sharedAt && record.sharedBy) {
          out.push({
            memberKey,
            record: { ...record, sharedAt: record.sharedAt, sharedBy: record.sharedBy },
          });
        }
      }
    }
    return out.sort((a, b) => b.record.sharedAt.localeCompare(a.record.sharedAt));
  }

  /**
   * Share one of this author's campaigns with the party, or hold it back as a draft. Only the
   * author's own key reaches a record; another member's id is `not-found` here, the same answer as
   * a campaign that does not exist. Sharing again keeps the first `sharedAt`.
   */
  setShared(
    memberKey: string,
    id: string,
    shared: { readonly by: string } | false,
    at = new Date(),
  ): "ok" | "not-found" {
    const state = this.file.load();
    const mine = state[memberKey] ?? [];
    const prior = mine.find((r) => r.campaign.id === id);
    if (!prior) return "not-found";
    const { sharedAt: _at, sharedBy: _by, ...rest } = prior;
    const by = shared ? displayName(shared.by) : "";
    const next: MemberCampaignRecord =
      shared && by ? { ...rest, sharedAt: prior.sharedAt ?? at.toISOString(), sharedBy: by } : rest;
    this.file.write({ ...state, [memberKey]: mine.map((r) => (r === prior ? next : r)) });
    return "ok";
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
