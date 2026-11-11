/**
 * `get_research_on` — Moneypenny reads what the house already knows about one company, sector or
 * market (the Moneypenny operator plan, ASSESS: size up the situation before answering).
 *
 * WHY: asked about a subject the house had researched, she answered that it had nothing, because
 * no tool of hers read the research ledgers, the house campaigns or their recorded lessons. This
 * gives her one read-only lookup over that record (`server/house-research.ts`) and one prompt rule:
 * call it before saying the house has nothing, relay a lesson as written with its date, and never
 * turn one into a reason to buy or sell.
 *
 * Offered only with a linked desk (`DESKLESS_TOOLS` leaves it out) so it can also say whether the
 * member holds the name; widening it to a deskless session is a named next slice. Every subject is
 * checked against the catalogs the app already holds — the GICS sectors, the market catalog, the
 * ticker shape — the same checks the research list's own ask route makes, before any read.
 *
 * This file imports no trading or order module (`companion-no-order-path.spec.ts` scans for it):
 * the tool reads checked-in research and counts on the research list, and writes nothing.
 *
 * NOTHING LOADS AT IMPORT. The system prompt imports this file, so the server's whole import graph
 * reaches it, and the study worlds run that graph inside a corpus pinned to an older commit
 * (scripts/study/worlds/compose.mjs), where `src/domain/campaigns/` does not exist. Importing a value
 * from campaigns.ts reads every campaign file at load, so the ticker shape below is local, the
 * same pattern as campaigns.ts's `SYMBOL_RE` (the spec holds the two to the same answers; see
 * edition.ts for the same rule), and `server/house-research.ts`, which does read the campaigns, is
 * imported for its types only.
 */
import { MARKETS, marketById } from "../domain/market-catalog.js";
import { GICS_SECTORS } from "../domain/sector-coverage.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import type { ReadResearchOn, ResearchSubject } from "../server/house-research.js";

/** The schema the model sees — schema only, no executable reference. */
export const RESEARCH_READ_TOOL_DEF = {
  name: "get_research_on",
  description:
    "What the house's own research already holds on one company (kind name, subject a ticker like NVDA), sector (kind sector, subject a GICS sector name like Energy) or market (kind market, subject a market id like us-large-caps). Returns kind and subject as read; shelf ('has a research ledger' or 'no ledger yet' — for a name, its own ledger; for a market, the ledger on fund, the US-listed fund it is played through); ledgersInSector (sectors only: names, up to 12 of the sector's tickers that have a research ledger, and more); campaigns (up to 3 house campaigns that follow it, each with id, title and storyline); lessons (up to 6, newest first, each with kind — tested, killed or on-watch — idea, on (the day it was recorded), recheckOn, falsifier (what would prove it wrong), source, and stale: true once its re-check date has passed); more (lessons not shown); writeUps (only when there are any: the research desk's write-ups on it, the general one first, each with file — the research shelf file — and opening — its first line, quoted as written); onTheList (waiting: whether a question about it already waits on the research list, with ahead — asks ahead of it — and askedBy — how many members asked; never who); wait (one sentence on when research gets to it); onYourBook (names only: whether the member holds it); notCovered (news, lawsuits: not read here); note (house research is never a recommendation). For a name, empty lists, 'no ledger yet' and no writeUps mean the house has not researched it; a write-up means it has, even with no ledger. For a sector, research is kept per ticker: no campaigns means no house campaign follows the sector, and ledgersInSector names what it has researched in it; only when that is empty too has the house researched nothing in the sector. For a market, the same holds for its campaigns and its fund's ledger. Read-only; covers house research only.",
  input_schema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["name", "sector", "market"] },
      subject: {
        type: "string",
        description:
          "A stock ticker (NVDA, never an option symbol), a GICS sector name (Energy), or a market id (us-large-caps).",
      },
    },
    required: ["kind", "subject"],
  },
} as const;

const SUBJECT_MAX = 60;

/** A stock ticker's shape, as campaigns.ts and the research list's ask route check it. */
const SYMBOL_RE = /^[A-Z][A-Z0-9.]{0,9}$/;

const BAD_KIND = "kind must be one of name, sector, market";

/**
 * The model's subject, checked against the app's own catalogs — anything else is refused with the
 * valid choices named, so a typo recovers and no free text reaches a read.
 */
export function parseResearchSubject(input: unknown): ResearchSubject | { readonly error: string } {
  const raw = (input ?? {}) as { kind?: unknown; subject?: unknown };
  const text = typeof raw.subject === "string" ? raw.subject.trim().slice(0, SUBJECT_MAX) : "";
  if (raw.kind === "sector") {
    const hit = GICS_SECTORS.find((s) => s.name.toLowerCase() === text.toLowerCase());
    return hit
      ? { kind: "sector", subject: hit.name }
      : {
          error: `subject must be a sector by name: ${GICS_SECTORS.map((s) => s.name).join(", ")}`,
        };
  }
  if (raw.kind === "market") {
    const id = text.toLowerCase();
    return marketById(id)
      ? { kind: "market", subject: id }
      : { error: `subject must be a market id: ${MARKETS.map((m) => m.id).join(", ")}` };
  }
  if (raw.kind === "name") {
    const symbol = text.toUpperCase();
    return SYMBOL_RE.test(symbol)
      ? { kind: "name", subject: symbol }
      : { error: "subject must be a stock ticker like NVDA, never an option symbol" };
  }
  return { error: BAD_KIND };
}

/** The dispatcher's answer, in `CompanionToolResult`'s shape (kept structural, so this file and
 *  `companion-tools.ts` don't import each other). */
type ResearchReadResult =
  | { readonly ok: true; readonly result: unknown }
  | { readonly ok: false; readonly error: string };

/** Check the subject first, then read with the member's own held names — nobody else's. */
export function researchReadResult(
  read: ReadResearchOn | undefined,
  snapshot: ParticipantSnapshot | undefined,
  input: unknown,
): ResearchReadResult {
  const parsed = parseResearchSubject(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  if (!read) return { ok: false, error: "house research isn't available on this deployment" };
  const held = snapshot?.positions.map((p) => p.symbol) ?? [];
  return { ok: true, result: read(parsed, held) };
}

/** The prompt paragraph that tells her when to call it and how to relay it. */
export const RESEARCH_READ_RULE = `WHAT THE HOUSE ALREADY KNOWS. get_research_on reads the house's own research on one company (a ticker), sector or market: whether a research ledger exists, the house campaigns that follow it, the lessons recorded (tested, killed, on watch, each with its date and what would prove it wrong), and whether a question about it is already waiting on the research list. Call it before you say the house has nothing on a subject. Give a lesson as the house wrote it, with its date, and say so when its re-check date has passed. Never add a finding of your own, and never turn a lesson into a reason to buy or sell. When it lists a write-up, the research desk has written the subject up: say so, quote its opening line as written, and never say the house has not researched it. For a company, if it holds nothing, say the house has not researched it yet. For a sector, research is kept per company: no campaign means no house campaign follows the sector, so name the companies in it that have a research ledger, and say the house has not researched the sector only when there are none. For a market, check its fund's ledger the same way. It does not read news or lawsuits.`;
