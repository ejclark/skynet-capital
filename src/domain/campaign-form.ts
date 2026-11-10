/**
 * A MEMBER'S CAMPAIGN FORM (#6949 slice 3a) — what a member fills in, and the one function that
 * compiles it into the same `Campaign` record the house files use.
 *
 * Eric (2026-11-06): "Users should be able to craft their own campaigns as well." The precedent is
 * the authored play (#809, `src/playbooks/authored-play-form.ts`): a member fills in a form, never
 * writes logic, and the result is the record every house play already is. Here that means:
 *
 *   - an ANCHOR picked from the catalogs only: one of the 11 GICS sectors (`sector-coverage.ts`) or
 *     a market from `market-catalog.ts`. Nothing free-typed can become an anchor.
 *   - a CAST picked from `ticker-directory/`, stocks and US-listed ETFs only (`isTradable`): a
 *     campaign never offers a move the order path can't place (the brief's honesty default). The
 *     anchor's fund is added to the cast for the member, so criterion 2 holds without them knowing.
 *   - a STORYLINE of at most `MAX_STORYLINE` characters (#2224's member-text precedent) and a TITLE
 *     of at most `MAX_TITLE`, both plain text, one line.
 *   - a starting MODE (#6952), one of `CAMPAIGN_MODES`.
 *
 * NO FREE-FORM LOGIC (criterion 7). Forces and open questions are the house's matching rules and
 * conviction pointers; the form takes neither, so a member's campaign compiles with both empty and
 * links events through its cast alone. The record holds them when the house adds them later.
 *
 * `parseCampaign` IS THE AUTHORITY. The compiled record is run through the same parser that loads
 * the house files, so a form can never write a record a house file couldn't be (the plan's
 * falsifier: a field the record can't hold means the record is drawn wrong, not that a second path
 * is needed). The checks above it only exist to answer one sentence per field instead of a throw.
 *
 * Shared by the server (the authority) and, later, the screen (an early read of it) — the same split
 * `specFromForm` uses. Paper only; a campaign never places or sizes an order.
 */

import { isRecord } from "../storage/parse-guards.js";
import {
  CAMPAIGN_MODES,
  type Campaign,
  type CampaignMode,
  castSymbols,
  isTradable,
  MAX_STORYLINE,
  parseCampaign,
} from "./campaigns.js";
import { MARKETS, marketById } from "./market-catalog.js";
import { GICS_SECTORS } from "./sector-coverage.js";

/** The title cap: a heading, not a paragraph. */
export const MAX_TITLE = 60;
/** The most symbols a member picks; the anchor's fund rides on top. The house AI buildout casts 16. */
export const MAX_PICKS = 16;

/** The cast role a member's own picks are filed under — how `formFromCampaign` finds them again. */
export const PICKS_ROLE = "Picked by the author";
/** The cast role the anchor's fund is filed under. */
export const FUND_ROLE = "The fund it is played through";

export interface CampaignForm {
  readonly title: string;
  /** A GICS sector by its label (`kind: "sector"`), or a market by its catalog id (`kind: "market"`). */
  readonly anchor: { readonly kind: "sector" | "market"; readonly id: string };
  readonly symbols: readonly string[];
  readonly storyline: string;
  readonly mode: CampaignMode;
}

export interface CampaignFormRefusal {
  readonly field: "title" | "anchor" | "symbols" | "storyline" | "mode" | "form";
  readonly reason: string;
}

export type CompiledCampaign =
  | { readonly ok: true; readonly campaign: Campaign }
  | { readonly ok: false; readonly refusals: readonly CampaignFormRefusal[] };

/** What the form offers: every choice comes from a catalog, so the screen and the server agree. */
export const CAMPAIGN_FORM_CHOICES = {
  sectors: GICS_SECTORS.map((s) => ({ name: s.name, fund: s.fund })),
  markets: MARKETS.map((m) => ({ id: m.id, name: m.name, fund: m.fund, holds: m.holds })),
  modes: CAMPAIGN_MODES,
  maxTitle: MAX_TITLE,
  maxStoryline: MAX_STORYLINE,
  maxPicks: MAX_PICKS,
} as const;

/**
 * The body's SHAPE only: right types, bounded sizes. A value that is the wrong kind of thing is a
 * malformed request (undefined → 400); a value that is the right kind but not allowed is a refusal
 * `campaignFromForm` names. The bounds stop an oversized body reaching the per-field checks.
 */
export function parseCampaignForm(raw: unknown): CampaignForm | undefined {
  if (!(isRecord(raw) && isRecord(raw.anchor))) return undefined;
  const { title, storyline, mode, symbols, anchor } = raw;
  if (typeof title !== "string" || title.length > MAX_TITLE * 4) return undefined;
  if (typeof storyline !== "string" || storyline.length > MAX_STORYLINE * 4) return undefined;
  if (typeof mode !== "string" || mode.length > 40) return undefined;
  if (anchor.kind !== "sector" && anchor.kind !== "market") return undefined;
  if (typeof anchor.id !== "string" || anchor.id.length > 60) return undefined;
  if (!Array.isArray(symbols) || symbols.length > MAX_PICKS * 4) return undefined;
  if (!symbols.every((s) => typeof s === "string" && s.length <= 12)) return undefined;
  return {
    title,
    storyline,
    mode: mode as CampaignMode,
    anchor: { kind: anchor.kind, id: anchor.id },
    symbols: symbols as string[],
  };
}

/** One line of plain text: whitespace runs (newlines included) collapse to one space. */
const oneLine = (s: string): string => s.replace(/\s+/g, " ").trim();

/** FNV-1a over the title, six hex digits: pure, so the screen can run it too (no node:crypto). */
const shortHash = (s: string): string => {
  let h = 0x811c9dc5;
  for (const ch of s) h = Math.imul(h ^ (ch.codePointAt(0) ?? 0), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6);
};

const SLUG_MAX = 40;

/**
 * A slug from the title, the record's id. The store refuses a second campaign with the same one, so
 * a slug that LOST the title (a non-Latin title slugs to nothing; a long one is cut at `SLUG_MAX`)
 * carries a hash of the whole title, and two different names never share an id by accident. Titles
 * differing only in punctuation or case ("AI!" and "ai?") are one name, and share one id on purpose.
 */
export function memberCampaignId(title: string): string {
  const line = oneLine(title);
  const full = line
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = full.slice(0, SLUG_MAX).replace(/-+$/, "");
  if (slug.length === 0) return `campaign-${shortHash(line.toLowerCase())}`;
  return slug === full ? slug : `${slug}-${shortHash(line.toLowerCase())}`;
}

/** The anchor's fund and the file that says so, or undefined when the anchor is not in a catalog. */
function anchorFund(
  anchor: CampaignForm["anchor"],
): { readonly fund: string; readonly source: string } | undefined {
  if (anchor.kind === "market") {
    const m = marketById(anchor.id);
    return m ? { fund: m.fund, source: "src/domain/market-catalog.ts" } : undefined;
  }
  const s = GICS_SECTORS.find((g) => g.name === anchor.id);
  return s ? { fund: s.fund, source: "src/domain/sector-coverage.ts" } : undefined;
}

/** The member's picks, upper-cased and each once, in the order given. */
const normalisedPicks = (symbols: readonly string[]): string[] => [
  ...new Set(symbols.map((s) => s.trim().toUpperCase()).filter((s) => s.length > 0)),
];

function refusalsFor(form: CampaignForm): CampaignFormRefusal[] {
  const refusals: CampaignFormRefusal[] = [];
  const title = oneLine(form.title);
  if (title.length === 0) refusals.push({ field: "title", reason: "Give the campaign a name." });
  else if (title.length > MAX_TITLE)
    refusals.push({ field: "title", reason: `Keep the name to ${MAX_TITLE} characters.` });
  if (!anchorFund(form.anchor))
    refusals.push({
      field: "anchor",
      reason: "Pick one of the 11 sectors or one of the markets on the list.",
    });
  // The anchor's fund is added for the member, so picking it too costs no pick.
  const fund = anchorFund(form.anchor)?.fund;
  const picks = normalisedPicks(form.symbols).filter((s) => s !== fund);
  if (picks.length > MAX_PICKS)
    refusals.push({ field: "symbols", reason: `Pick at most ${MAX_PICKS} symbols.` });
  const unknown = picks.filter((s) => !isTradable(s));
  if (unknown.length > 0)
    refusals.push({
      field: "symbols",
      reason: `${unknown.join(", ")} ${unknown.length === 1 ? "isn't" : "aren't"} a stock or US-listed fund in our directory.`,
    });
  const storyline = oneLine(form.storyline);
  if (storyline.length === 0)
    refusals.push({
      field: "storyline",
      reason: "Say in one sentence what the campaign is about.",
    });
  else if (storyline.length > MAX_STORYLINE)
    refusals.push({
      field: "storyline",
      reason: `Keep the storyline to ${MAX_STORYLINE} characters.`,
    });
  if (!(CAMPAIGN_MODES as readonly string[]).includes(form.mode))
    refusals.push({ field: "mode", reason: "Pick a starting mode from the list." });
  return refusals;
}

/**
 * Compile a form into a campaign record, or name every field that stops it. `id` is the record's
 * id (the store picks it: `memberCampaignId` of the title). The result has passed `parseCampaign`.
 */
export function campaignFromForm(form: CampaignForm, id: string): CompiledCampaign {
  const refusals = refusalsFor(form);
  const fund = anchorFund(form.anchor);
  if (refusals.length > 0 || !fund) return { ok: false, refusals };
  const picks = normalisedPicks(form.symbols).filter((s) => s !== fund.fund);
  const draft: Campaign = {
    id,
    title: oneLine(form.title),
    storyline: oneLine(form.storyline),
    ...(form.anchor.kind === "sector" ? { sector: form.anchor.id } : { market: form.anchor.id }),
    mode: form.mode,
    cast: [
      ...(picks.length > 0
        ? [{ role: PICKS_ROLE, symbols: picks, source: "src/domain/ticker-directory/" }]
        : []),
      { role: FUND_ROLE, symbols: [fund.fund], source: fund.source },
    ],
    forces: [],
    openQuestions: [],
  };
  try {
    return { ok: true, campaign: parseCampaign(draft, "a member's campaign form", id) };
  } catch (err) {
    // Unreachable while the checks above mirror the parser; kept so a drift refuses, never stores.
    return { ok: false, refusals: [{ field: "form", reason: String((err as Error).message) }] };
  }
}

/**
 * The form a saved campaign came from, so Edit opens on it. The anchor's fund is not among the
 * picks even if the member typed it: it is always in the cast, so listing it again adds nothing.
 */
export function formFromCampaign(campaign: Campaign): CampaignForm {
  return {
    title: campaign.title,
    anchor:
      campaign.market !== undefined
        ? { kind: "market", id: campaign.market }
        : { kind: "sector", id: campaign.sector ?? "" },
    symbols: campaign.cast.find((r) => r.role === PICKS_ROLE)?.symbols ?? [],
    storyline: campaign.storyline,
    mode: campaign.mode ?? "play",
  };
}

/**
 * The cast names the house has no research on — what a member's campaign asks the research lane
 * for (criterion 9). The anchor's fund is left out: it is the vehicle, and its research is the
 * sector's or the market's. This only NAMES the ask; nothing here starts research, so the ask can
 * never raise the work spigot's ceiling — a lane that later reads asks takes them inside its own
 * per-run limit (`npm run work-gate`).
 */
export function researchAskFor(
  campaign: Campaign,
  isResearched: (symbol: string) => boolean,
): readonly string[] {
  const fund = campaign.cast.find((r) => r.role === FUND_ROLE)?.symbols[0];
  return castSymbols(campaign).filter((s) => s !== fund && !isResearched(s));
}
