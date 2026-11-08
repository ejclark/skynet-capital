/**
 * THE LANDSCAPE READ — per campaign, what moved, what is scheduled, what is reported and what the
 * house has tested, as one read the narrator's questions draw on (#6949 slice 5, criterion 4;
 * #6948). Eric, 2026-11-06: "Users need to be asked to interrogate the landscape to determine their
 * 'move'". This is the landscape they interrogate.
 *
 * IT READS, IT NEVER NARRATES. Every line comes from a record that already holds it, and every line
 * says how sure that record is (docs/process/EVENT-RESEARCH.md → Honesty rules):
 *   moved      daily closes the caller hands in, with both dates named. No closes, no move: a cast
 *              symbol nobody read prices for is listed as unread, never as flat.
 *   scheduled  calendar events the campaign links (campaigns.ts → linkEvents) from today on. A date
 *              is `confirmed` only when the event says so AND its source is a primary read; an
 *              `estimate` status or an `EST:` source is `estimated`, a `NEWS:` source `reported`.
 *   reported   news items whose own headline names the campaign (campaign-news.ts → linkNews),
 *              newest first. A filing or a Fed release stays `measured`; press stays `reported`.
 *   tested     each open question's conviction claim as the record holds it. `tested` is true only
 *              when the claim's bucket is `tested` or a research instrument studied it; a forward
 *              test waits for its day, and an untestable claim says so.
 * The slice's falsifier is a line that says more than its record: a reported item read as measured,
 * an estimated date read as confirmed, an untested claim read as tested. `landscapeLines` is where
 * that would happen, so its words come from the marks alone (tests/domain/campaign-landscape.spec.ts).
 *
 * ANY CAMPAIGN, HOUSE OR MEMBER. The read takes a `Campaign` record, so a member's campaign (slice 3,
 * the same record) is linked against the same calendar and the same news harvest at read time —
 * nothing about a member's campaign is collected separately.
 *
 * Paper only; educational. The read scopes the story; it never places, sizes or recommends an order.
 */
import type { ClaimStudy } from "../playbooks/claim-study.js";
import type { Conviction, ConvictionClaim } from "../playbooks/conviction-record.js";
import { linkNews, type NewsItem } from "./campaign-news.js";
import {
  anchorOf,
  type Campaign,
  castSymbols,
  type Evidence,
  type LinkReason,
  linkEvents,
} from "./campaigns.js";
import type { MarketEvent } from "./market-events-types.js";

/** One daily close, oldest first in a series (claim-score.ts → TapeBar has the same shape). */
export interface Close {
  readonly date: string;
  readonly close: number;
}

export interface LandscapeInputs {
  /** `YYYY-MM-DD`: the day the read is for. */
  readonly today: string;
  readonly events: readonly MarketEvent[];
  readonly news: readonly NewsItem[];
  readonly convictions: readonly Conviction[];
  /** Daily closes by symbol. Absent or missing a symbol → that symbol is unread, never flat. */
  readonly closes?: Readonly<Record<string, readonly Close[]>>;
  /** Where the closes came from, said on every move ("Yahoo daily closes, split-adjusted"). */
  readonly closesSource?: string;
  /** How many sessions a move spans. Default 5 (a trading week). */
  readonly sessions?: number;
  /** How far ahead the schedule looks, in calendar days. Default 30. */
  readonly aheadDays?: number;
  /** How far back the news looks, in calendar days. Default 14. */
  readonly backDays?: number;
}

export interface Move {
  readonly symbol: string;
  readonly from: Close;
  readonly to: Close;
  /** (to − from) / from × 100, rounded to a tenth. */
  readonly changePct: number;
  readonly source: string;
}

/** How sure the calendar is of a date. */
export type DateMark = "confirmed" | "estimated" | "reported";

export interface Scheduled {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly daysUntil: number;
  readonly kind: MarketEvent["kind"];
  readonly impact: MarketEvent["impact"];
  readonly dateIs: DateMark;
  readonly source: string;
  readonly reasons: readonly LinkReason[];
}

export interface Reported {
  readonly title: string;
  readonly url: string;
  readonly at: string;
  readonly source: string;
  readonly evidence: Exclude<Evidence, "estimated">;
  readonly reasons: readonly LinkReason[];
}

/** What the house's record says about one open question's claim. */
export interface Tested {
  readonly question: string;
  readonly conviction: string;
  readonly claim: string;
  /** The claim as the record states it; absent when the record holds no such claim. */
  readonly statement?: string;
  readonly bucket?: ConvictionClaim["bucket"];
  /** True only when the bucket is `tested` or an instrument studied it. */
  readonly tested: boolean;
  /** What a research instrument found, when one ran. */
  readonly study?: {
    readonly reading: string;
    readonly call: string;
    readonly confidence: string;
    readonly dataDate: string;
  };
  /** The study the record cites, when the bucket is `tested` (the claim's own `evidence`). */
  readonly evidence?: string;
  /** Why nothing here can check it, when that is the record's answer. */
  readonly untestable?: string;
  /** The claim against its own dated falsifier, as the scores ledger recorded it. */
  readonly score?: {
    readonly outcome: string;
    readonly dueOn?: string;
    readonly scoredOn?: string;
    /** Pending past its day: the scoring run has not read it yet. */
    readonly overdue: boolean;
  };
}

export interface Landscape {
  readonly campaign: { readonly id: string; readonly title: string; readonly storyline: string };
  readonly anchor: string;
  readonly today: string;
  readonly moved: { readonly sessions: number; readonly moves: readonly Move[] };
  /** Cast symbols with no closes to read. */
  readonly unread: readonly string[];
  readonly scheduled: readonly Scheduled[];
  readonly reported: readonly Reported[];
  readonly tested: readonly Tested[];
}

const DAY_MS = 86_400_000;
const dayNumber = (date: string): number => Date.parse(`${date.slice(0, 10)}T00:00:00Z`) / DAY_MS;
const round1 = (n: number): number => Math.round(n * 10) / 10;

/** The move over the last `sessions` closes on or before `today`, or undefined when too few. */
function moveOf(
  symbol: string,
  closes: readonly Close[],
  today: string,
  sessions: number,
  source: string,
): Move | undefined {
  const seen = closes.filter((c) => c.date <= today && Number.isFinite(c.close) && c.close > 0);
  const to = seen.at(-1);
  const from = seen.at(-1 - sessions);
  if (!(to && from)) return undefined;
  return {
    symbol,
    from,
    to,
    changePct: round1(((to.close - from.close) / from.close) * 100),
    source,
  };
}

/** An event's date mark: confirmed only by a confirmed status on a primary source. */
export function dateMarkOf(event: MarketEvent, evidence: Evidence): DateMark {
  if (event.status !== "confirmed" || evidence === "estimated") return "estimated";
  return evidence === "reported" ? "reported" : "confirmed";
}

/** The claim a campaign's open question points at: labelled "3." in its statement, as call sheets are. */
function claimFor(conviction: Conviction | undefined, label: string): ConvictionClaim | undefined {
  return conviction?.claims.find((c) => c.statement.match(/^(\d+[a-z]?)\./)?.[1] === label);
}

function studyOf(study: ClaimStudy | undefined): Tested["study"] {
  if (study?.disposition !== "studied") return undefined;
  const { reading, call, confidence } = study.verdict;
  return { reading, call, confidence, dataDate: study.dataDate };
}

/** Why nothing here can check the claim, when the record says so; the study's reason first. */
function untestableWhy(claim: ConvictionClaim): string | undefined {
  if (claim.study?.disposition === "untestable") return claim.study.reason;
  return claim.bucket === "untestable" ? claim.evidence : undefined;
}

function testedOf(
  q: Campaign["openQuestions"][number],
  convictions: readonly Conviction[],
  today: string,
): Tested {
  const base = { question: q.question, conviction: q.conviction, claim: q.claim };
  const claim = claimFor(
    convictions.find((c) => c.id === q.conviction),
    q.claim,
  );
  if (!claim) return { ...base, tested: false };
  const study = studyOf(claim.study);
  const untestable = untestableWhy(claim);
  const s = claim.score;
  return {
    ...base,
    statement: claim.statement,
    bucket: claim.bucket,
    tested: claim.bucket === "tested" || study !== undefined,
    ...(study ? { study } : {}),
    ...(claim.bucket === "tested" ? { evidence: claim.evidence } : {}),
    ...(untestable ? { untestable } : {}),
    ...(s
      ? {
          score: {
            outcome: s.outcome,
            ...(s.dueOn ? { dueOn: s.dueOn } : {}),
            ...(s.scoredOn ? { scoredOn: s.scoredOn } : {}),
            overdue: s.outcome === "pending" && s.dueOn !== undefined && s.dueOn < today,
          },
        }
      : {}),
  };
}

/** The landscape for one campaign on `inputs.today`. Pure: everything it reads is handed in. */
export function landscapeOf(campaign: Campaign, inputs: LandscapeInputs): Landscape {
  const { today, closes = {} } = inputs;
  const sessions = inputs.sessions ?? 5;
  const ahead = inputs.aheadDays ?? 30;
  const back = inputs.backDays ?? 14;
  const t = dayNumber(today);

  const moves: Move[] = [];
  const unread: string[] = [];
  for (const symbol of castSymbols(campaign)) {
    const series = closes[symbol];
    const move = series
      ? moveOf(symbol, series, today, sessions, inputs.closesSource ?? "daily closes")
      : undefined;
    if (move) moves.push(move);
    else unread.push(symbol);
  }
  moves.sort(
    (a, b) => Math.abs(b.changePct) - Math.abs(a.changePct) || a.symbol.localeCompare(b.symbol),
  );

  const scheduled: Scheduled[] = linkEvents(campaign, inputs.events)
    .map((l) => ({ l, days: dayNumber(l.at) - t }))
    .filter(({ days }) => days >= 0 && days <= ahead)
    .map(({ l, days }) => ({
      id: l.event.id,
      title: l.event.title,
      date: l.at,
      daysUntil: days,
      kind: l.event.kind,
      impact: l.event.impact,
      dateIs: dateMarkOf(l.event, l.evidence),
      source: l.source,
      reasons: l.reasons,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const reported: Reported[] = linkNews(campaign, inputs.news)
    .filter((l) => {
      const age = t - dayNumber(l.at);
      return age >= 0 && age <= back;
    })
    .map((l) => ({
      title: l.item.title,
      url: l.item.url,
      at: l.at,
      source: l.source,
      evidence: l.evidence,
      reasons: l.reasons,
    }))
    .sort((a, b) => b.at.localeCompare(a.at) || a.title.localeCompare(b.title));

  return {
    campaign: { id: campaign.id, title: campaign.title, storyline: campaign.storyline },
    anchor: `${anchorOf(campaign).name} (${anchorOf(campaign).fund})`,
    today,
    moved: { sessions, moves },
    unread,
    scheduled,
    reported,
    tested: campaign.openQuestions.map((q) => testedOf(q, inputs.convictions, today)),
  };
}
