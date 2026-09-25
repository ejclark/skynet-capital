import { daysBetween } from "../options/position-guidance-rules.js";
import type { PulseItem, PulseStatus } from "../options/position-guidance-types.js";

/**
 * THE PULSE — how fresh each position guidance input is, measured against its live source (#3729;
 * Eric, 2026-09-25: "a sanity/pulse check against live information sources to ensure we're not
 * acting on cached/stale information"). Every assessor here is PURE: it takes what the live fetch
 * observed plus `now`, and returns one pulse row. The engine applies the demotion each status
 * carries; this module only decides the status, honestly.
 *
 * Ages are measured from the FEED'S OWN timestamps (`latestTrade.t`, `latestQuote.t`), never from
 * when we fetched — a fetch-time stamp would make a four-hour-old quote read as current.
 */

const SEC = 1000;
const MIN = 60 * SEC;
const DAY = 24 * 60 * MIN;

/** Spot in session: a trade older than this is aging; older than SPOT_STALE is stale. */
export const SPOT_AGING_MS = MIN;
export const SPOT_STALE_MS = 5 * MIN;
/** Option quotes in session. */
export const CHAIN_AGING_MS = 5 * MIN;
export const CHAIN_STALE_MS = 15 * MIN;
/** Out of session, a value from the last session is honest; older than this spans a missing session. */
export const CLOSED_STALE_MS = 4 * DAY;
/** Spot vs option-implied spot: past this, one of the two sources is wrong. */
export const PARITY_TOLERANCE = 0.01;
/** Research older than this is stale on its face. */
export const RESEARCH_STALE_DAYS = 7;
export const RESEARCH_AGING_DAYS = 3;

const row = (
  id: PulseItem["id"],
  source: string,
  status: PulseStatus,
  note: string,
  asOf?: string,
): PulseItem => ({ id, source, status, note, ...(asOf ? { asOf } : {}) });

function ageText(ms: number): string {
  if (ms < MIN) return `${Math.round(ms / SEC)}s old`;
  if (ms < 60 * MIN) return `${Math.round(ms / MIN)} min old`;
  if (ms < DAY) return `${(ms / (60 * MIN)).toFixed(1)} h old`;
  return `${(ms / DAY).toFixed(1)} days old`;
}

/** Grade an age against session-aware thresholds. */
function ageStatus(ms: number, open: boolean, aging: number, stale: number): PulseStatus {
  if (!open) return ms > CLOSED_STALE_MS ? "stale" : "fresh";
  return ms > stale ? "stale" : ms > aging ? "aging" : "fresh";
}

export interface SpotObservation {
  readonly last: number;
  readonly lastAt?: string;
  /** The underlying implied by put-call parity at the money — the second, independent source. */
  readonly parity?: number;
}

export function spotPulse(obs: SpotObservation | undefined, now: string, open: boolean): PulseItem {
  const source = "Alpaca IEX last trade × option parity";
  if (!obs) return row("spot", source, "stale", "no spot from the feed");
  if (obs.parity !== undefined) {
    const gap = Math.abs(obs.last / obs.parity - 1);
    if (gap > PARITY_TOLERANCE) {
      // Out of session, option marks go stale and wide on their own, so a gap is a warning — the
      // calls are already plans for the open. In session, one of two live sources is wrong.
      return row(
        "spot",
        source,
        open ? "stale" : "aging",
        `IEX $${obs.last.toFixed(2)} vs option-implied $${obs.parity.toFixed(2)} (${(gap * 100).toFixed(1)}% apart${open ? "" : ", after hours"})`,
        obs.lastAt,
      );
    }
  } else if (open) {
    // No second source in session means spot is unverified — never graded as if it were checked.
    return row(
      "spot",
      source,
      "stale",
      "no at-the-money call/put pair to cross-check spot",
      obs.lastAt,
    );
  }
  if (!obs.lastAt) return row("spot", source, "aging", "the feed gave no trade time");
  const age = Date.parse(now) - Date.parse(obs.lastAt);
  const status = ageStatus(age, open, SPOT_AGING_MS, SPOT_STALE_MS);
  const cross = obs.parity === undefined ? "no parity cross-check" : "matches option parity";
  const graded = status === "fresh" && obs.parity === undefined ? "aging" : status;
  return row(
    "spot",
    source,
    graded,
    `${ageText(age)}${open ? "" : " (as of close)"} · ${cross}`,
    obs.lastAt,
  );
}

/** The median quote age across every strike the guidance will price. */
export function chainPulse(
  quotedAt: readonly string[],
  total: number,
  now: string,
  open: boolean,
): PulseItem {
  const source = "Alpaca indicative option snapshots";
  if (quotedAt.length === 0)
    return row("chain", source, "stale", `no quote times on ${total} strikes`);
  const ages = quotedAt.map((t) => Date.parse(now) - Date.parse(t)).sort((a, b) => a - b);
  const median = ages[Math.floor(ages.length / 2)] ?? 0;
  const newest = quotedAt.reduce((a, b) => (a > b ? a : b));
  const status = ageStatus(median, open, CHAIN_AGING_MS, CHAIN_STALE_MS);
  return row(
    "chain",
    source,
    status,
    `median ${ageText(median)} · ${quotedAt.length}/${total} strikes quoted`,
    newest,
  );
}

export interface ResearchObservation {
  readonly assessed?: string;
  readonly probePrice?: number;
  readonly source: string;
}

/**
 * Research goes stale two ways: by the calendar, and by the tape — a ledger written at $80 says
 * nothing reliable about a stock now at $95. The tape test is one expected move over the days since
 * the ledger was worked, at the chain's own ATM volatility.
 */
export function researchPulse(
  obs: ResearchObservation | undefined,
  spot: number,
  atmVol: number | undefined,
  today: string,
): PulseItem {
  if (!obs?.assessed)
    return row(
      "research",
      obs?.source ?? "research ledger",
      "aging",
      "no dated research ledger for this name",
    );
  const days = Math.max(0, daysBetween(obs.assessed, today));
  if (days > RESEARCH_STALE_DAYS) {
    return row("research", obs.source, "stale", `${days} days since last assessed`, obs.assessed);
  }
  if (obs.probePrice !== undefined && atmVol !== undefined && atmVol > 0) {
    const move = obs.probePrice * atmVol * Math.sqrt(Math.max(1, days) / 365);
    const drift = spot - obs.probePrice;
    if (Math.abs(drift) > move) {
      return row(
        "research",
        obs.source,
        "stale",
        `the tape moved ${drift > 0 ? "+" : ""}${((drift / obs.probePrice) * 100).toFixed(1)}% since research ($${obs.probePrice.toFixed(2)}) — more than one expected move`,
        obs.assessed,
      );
    }
  }
  const status = days > RESEARCH_AGING_DAYS ? "aging" : "fresh";
  return row(
    "research",
    obs.source,
    status,
    `${days} day${days === 1 ? "" : "s"} since last assessed`,
    obs.assessed,
  );
}

export function earningsPulse(
  print:
    | { readonly date: string; readonly status: "confirmed" | "estimate"; readonly source: string }
    | undefined,
): PulseItem {
  if (!print)
    return row("earnings-date", "earnings calendar", "aging", "no upcoming print on the calendar");
  return print.status === "confirmed"
    ? row("earnings-date", print.source, "fresh", `confirmed ${print.date}`)
    : row(
        "earnings-date",
        print.source,
        "aging",
        `estimate ${print.date} — IR hasn't confirmed; DTE cut uses the window start`,
      );
}

/** 8-Ks filed after the research was last worked — each one is news the ledger has not read. */
export function filingsPulse(
  read:
    | {
        readonly fetchedAt: string;
        readonly filings: readonly { readonly date: string; readonly items: string }[];
      }
    | undefined,
  since: string | undefined,
  now: string,
): PulseItem {
  const filings = read?.filings;
  const fetchedAt = read?.fetchedAt ?? now;
  const source = "SEC EDGAR 8-K filings";
  if (!filings)
    return row("filings", source, "aging", "EDGAR unreachable — new filings unchecked", fetchedAt);
  if (!since)
    return row(
      "filings",
      source,
      "aging",
      "no research date to compare filings against",
      fetchedAt,
    );
  // ON or after: a filing dated the research day may have landed after the research was written.
  const fresh = filings.filter((f) => f.date >= since);
  if (fresh.length === 0)
    return row("filings", source, "fresh", `no 8-K since research (${since})`, fetchedAt);
  const list = fresh.map((f) => `${f.date}${f.items ? ` items ${f.items}` : ""}`).join("; ");
  return row(
    "filings",
    source,
    "stale",
    `${fresh.length} 8-K on or after the research date: ${list}`,
    fetchedAt,
  );
}

export function sessionPulse(open: boolean | undefined, now: string): PulseItem {
  if (open === undefined) {
    return row(
      "session",
      "clock (weekday 9:30–16:00 ET)",
      "aging",
      "broker clock unreachable — holidays not checked",
      now,
    );
  }
  return row(
    "session",
    "Alpaca market clock",
    "fresh",
    open ? "market open" : "market closed",
    now,
  );
}

/** The fallback when the broker clock is unreachable: a weekday between 9:30 and 16:00 ET. */
export function clockSessionOpen(now: string): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = part("weekday");
  if (day === "Sat" || day === "Sun") return false;
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}
