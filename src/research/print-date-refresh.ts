import {
  daysUntil,
  type EarningsPrint,
  printEventId,
  printSpan,
} from "../domain/earnings-calendar.js";

/**
 * Keeping the earnings calendar current (#4479): the pure half of `confirm-print-dates`.
 *
 * S1-NVDA and G1-GOOG enter only on a `confirmed` print, so a stale table silently arms them to do
 * nothing. Two jobs keep it fresh, both writing only the checked-in, reviewed table:
 *   - CONFIRM — ask Nasdaq's earnings-date page about each near estimate and flip it to `confirmed`
 *     (a `CAL:` source) only when it calls the estimate's own date the company's, never Zacks'
 *     algorithmic guess. Two sources agreeing (our cadence and the company's word) is a confirm.
 *   - MOVE — a company date OFF the estimate is a single source against ours, so it is not flipped:
 *     the row's `date` moves to the announced day (what every display shows), it stays an
 *     `estimate` (entries stay closed), its window covers both days (both stay guarded), and its
 *     `ledgerId` keeps the research id it was opened under (#5714). It is then held for an IR read:
 *     a later run that finds the same day does not confirm it on its own.
 *   - NEEDS IR — every company-dated answer the run does not turn into a confirmation (a move, a
 *     held move, a date too far off to be this print, a date already past) is reported by name and
 *     sets the `needs-ir` outcome, so no answer is dropped without a word.
 *   - FILL — a playbook symbol with no print in the next ~100 days gets its next one estimated from
 *     cadence. An estimate only ever WIDENS a safety window and never opens an entry (the date
 *     policy in earnings-calendar.ts), so a rough cadence guess is the safe direction.
 *
 * LOUD FAILURE: a run where every fetch failed checked nothing, and must exit non-zero — reading a
 * blocked source as "nothing new" is how a broken calendar passes for a clean one. So must a run
 * that could not check a playbook symbol (S1-NVDA, G1-GOOG): those are the prints this exists for.
 * An answer the source sent but we could not read (an error inside a 200, wording we do not know)
 * is a failure too, never "not announced".
 *
 * The network, sleep and file I/O are injected so specs pin every rule offline.
 */

/**
 * Nasdaq's per-symbol earnings-date answer, read for the one thing that matters: is the date the
 * company's, or Zacks' guess? Its text says "is expected* to report earnings on MM/DD/YYYY" for a
 * confirmed date and "is estimated to report … derived from an algorithm" for a guess (checked
 * 2026-10-19: META and MSFT read "expected" on their IR dates; NVDA/CRWV/AVGO "estimated"). The
 * by-date calendar the script used to scan lists both kinds identically, so it "confirmed" NVDA's
 * Nov 18 guess — the false positive this reader exists to refuse. A date in wording we do not
 * recognise is a guess; no wording we recognise at all is a failure (`ok: false`).
 */
export interface Announcement {
  /** `false` = the source never answered, which is not the same as "not announced yet". */
  readonly ok: boolean;
  readonly date?: string;
  readonly confirmed: boolean;
  /** "after market close" | "before market open", when the source says. */
  readonly time?: string;
}

export type FetchAnnouncement = (symbol: string) => Promise<Announcement>;

/** Nasdaq's wording when Zacks has no date at all — the one honest "not announced". */
const NO_DATE = /ha(?:s not|sn't) provided us with the upcoming earnings report date/;

/**
 * Read Nasdaq's `reportText` into an announcement. Only the "expected*" wording confirms; text that
 * neither carries a date nor says there is none is unread, so `ok: false` — a change in Nasdaq's
 * wording must stop the run loudly, not quietly stop every confirmation.
 */
export function parseReportText(text: string): Announcement {
  const confirmed = text.match(
    /is expected\* to report earnings on\s+(\d{2})\/(\d{2})\/(\d{4})\s*(after market close|before market open)?/,
  );
  if (confirmed && !/derived from an algorithm/.test(text)) {
    const [, mm, dd, yyyy, time] = confirmed;
    return { ok: true, date: `${yyyy}-${mm}-${dd}`, confirmed: true, ...(time ? { time } : {}) };
  }
  const guess = text.match(/to report earnings on\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (guess) return { ok: true, date: `${guess[3]}-${guess[1]}-${guess[2]}`, confirmed: false };
  return NO_DATE.test(text) ? { ok: true, confirmed: false } : { ok: false, confirmed: false };
}

/** A confirmation: the row as it is on file, and what it becomes. */
export interface PrintUpdate {
  readonly from: EarningsPrint;
  readonly to: EarningsPrint;
}

/** A company-dated answer the run did not turn into a confirmation — it waits for an IR read. */
export interface NeedsIr {
  readonly print: EarningsPrint;
  /** The day the source calls the company's. */
  readonly said: string;
  /**
   * `moved` — this run moved the row to it; `held` — the row already moved there once, so one
   * source is not enough to confirm it; `far` — too far off the estimate to be the same print;
   * `past` — the day has gone while the estimate's window has not.
   */
  readonly why: "moved" | "held" | "far" | "past";
}

export interface ConfirmResult {
  /**
   * Most urgent first: `unreachable` — every fetch failed; `needs-ir` — the source gave a company
   * date the run did not confirm; `found` — confirmations only; `none` — checked, nothing to do.
   */
  readonly outcome: "unreachable" | "needs-ir" | "found" | "none";
  readonly attempts: number;
  readonly failures: number;
  /** The symbols whose fetch failed or could not be read, by name. */
  readonly failed: readonly string[];
  readonly updates: readonly PrintUpdate[];
  readonly needsIr: readonly NeedsIr[];
  readonly checked: readonly EarningsPrint[];
}

/** Mega-cap IR rarely announces a call more than ~4–5 weeks out; checking further is a near-certain miss. */
const CONFIRM_LOOKAHEAD_DAYS = 35;
/** A confirmed date this far off the estimate is the same quarter moved (META moved 7); a quarter is 91. */
const SAME_PRINT_DAYS = 14;
/** EARS 1: a playbook symbol with nothing on file this far ahead gets a cadence estimate. */
const FILL_LOOKAHEAD_DAYS = 100;
/** One quarter, in whole weeks, so the estimate keeps the print's weekday. */
const CADENCE_DAYS = 91;
/** The fill's honest window: a week early, two late — Q4 prints tend to land later than a quarter on. */
const FILL_WINDOW = { before: 7, after: 14 } as const;
/** A cadence fill this close to a row already on file is that row, not a missing print. */
const FILL_DEDUPE_DAYS = 21;
/** A fetch that has not answered in this long is a failure, not a wait (the 2026-10-02 run sat ~3 minutes). */
const FETCH_TIMEOUT_MS = 15_000;

const shift = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const at = (today: string): string => `${today}T00:00:00Z`;

/** The move note a run appends to a row's source — stripped before a second move appends its own. */
const MOVE_NOTE = " · CAL: Nasdaq calls ";

/**
 * An estimate this automation already moved (its source carries the move note). One source moved
 * it, so that source agreeing with itself the next day is not a confirmation. A move made by hand
 * from research is not caught here: there our research and the source agree, which is a confirm.
 */
const movedByRun = (p: EarningsPrint): boolean => p.source.includes(MOVE_NOTE);

/** The estimates worth checking today: still ahead (window included) and inside the lookahead. */
export function confirmCandidates(
  prints: readonly EarningsPrint[],
  today: string,
  lookaheadDays: number = CONFIRM_LOOKAHEAD_DAYS,
): EarningsPrint[] {
  return prints.filter(
    (p) =>
      p.status === "estimate" &&
      daysUntil(at(today), printSpan(p).end) >= 0 &&
      daysUntil(at(today), p.date) <= lookaheadDays,
  );
}

/**
 * Ask the source about each candidate's symbol (once per symbol). An estimate it calls the
 * company's on the estimate's own date is confirmed; a company date anywhere else is a move or a
 * refusal, and either way it lands in `needsIr` so the run says so.
 */
export async function runConfirm(
  prints: readonly EarningsPrint[],
  today: string,
  fetchSymbol: FetchAnnouncement,
): Promise<ConfirmResult> {
  const checked = confirmCandidates(prints, today);
  const memo = new Map<string, Announcement>();
  const ask = async (symbol: string): Promise<Announcement> => {
    const known = memo.get(symbol) ?? (await fetchSymbol(symbol));
    memo.set(symbol, known);
    return known;
  };

  const updates: PrintUpdate[] = [];
  const needsIr: NeedsIr[] = [];
  for (const print of checked) {
    const said = await ask(print.symbol);
    if (!(said.ok && said.confirmed && said.date)) continue;
    const hold = (why: NeedsIr["why"]): void => {
      needsIr.push({ print, said: said.date as string, why });
    };
    if (daysUntil(at(today), said.date) < 0) {
      hold("past");
      continue;
    }
    if (Math.abs(daysUntil(at(print.date), said.date)) > SAME_PRINT_DAYS) {
      hold("far");
      continue;
    }
    if (said.date === print.date) {
      if (movedByRun(print)) {
        hold("held");
        continue;
      }
      updates.push({
        from: print,
        to: {
          symbol: print.symbol,
          date: print.date,
          status: "confirmed",
          source: `CAL: Nasdaq earnings date (api.nasdaq.com/api/analyst/${print.symbol}/earnings-date) says "expected", Zacks' confirmed-date wording, checked ${today}${said.time ? ` — ${said.time}` : ""}`,
          ...(print.ledgerId ? { ledgerId: print.ledgerId } : {}),
        },
      });
      continue;
    }
    const span = printSpan(print);
    updates.push({
      from: print,
      to: {
        symbol: print.symbol,
        date: said.date,
        status: "estimate",
        source: `${print.source.split(MOVE_NOTE)[0]}${MOVE_NOTE}${said.date} the company's date (checked ${today}) — a move off ${print.date}, so held as an estimate until an IR read`,
        window: {
          start: said.date < span.start ? said.date : span.start,
          end: said.date > span.end ? said.date : span.end,
        },
        ledgerId: printEventId(print),
      },
    });
    hold("moved");
  }

  const attempts = memo.size;
  const failed = [...memo.entries()].filter(([, a]) => !a.ok).map(([symbol]) => symbol);
  const failures = failed.length;
  const outcome =
    attempts > 0 && failures === attempts
      ? "unreachable"
      : needsIr.length > 0
        ? "needs-ir"
        : updates.length > 0
          ? "found"
          : "none";
  return { outcome, attempts, failures, failed, updates, needsIr, checked };
}

/**
 * EARS 3: a run that checked nothing must never read as a clean pass (exit 2), and nor may one that
 * could not check a `watched` symbol — a playbook's own print (exit 3). `needs-ir` exits 0: the
 * calendar is as safe as one source can make it, and the outcome line says what waits on a read.
 */
export const refreshExitCode = (
  result: Pick<ConfirmResult, "outcome" | "failed">,
  watched: readonly string[] = [],
): number => {
  if (result.outcome === "unreachable") return 2;
  return result.failed.some((symbol) => watched.includes(symbol)) ? 3 : 0;
};

export interface FetchDeps {
  readonly fetch: (url: string, init?: RequestInit) => Promise<Response>;
  readonly sleep: (ms: number) => Promise<void>;
  readonly timeoutMs?: number;
  readonly log: (line: string) => void;
}

/**
 * Nasdaq's earnings-date answer for one symbol. The endpoint wants browser-like headers, is flaky
 * under bursts (a run of ~8 rapid calls drew a 503), and can stall a connection without answering —
 * so every attempt carries a timeout, failures retry with backoff, and a persistent failure is
 * `ok: false`.
 */
export async function fetchEarningsDate(symbol: string, deps: FetchDeps): Promise<Announcement> {
  const { log } = deps;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await deps.fetch(`https://api.nasdaq.com/api/analyst/${symbol}/earnings-date`, {
        signal: AbortSignal.timeout(deps.timeoutMs ?? FETCH_TIMEOUT_MS),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; skynet-capital research)",
          Accept: "application/json, text/plain, */*",
          Origin: "https://www.nasdaq.com",
          Referer: "https://www.nasdaq.com/",
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const body = (await res.json()) as {
        data?: { reportText?: string | null } | null;
        status?: { rCode?: number; bCodeMessage?: unknown } | null;
      };
      // Nasdaq reports its errors as HTTP 200 with `data: null` and the code in `status.rCode`
      // ("Symbol not exists" is rCode 400) — an error, never an empty answer.
      const rCode = body.status?.rCode;
      if (!body.data || (rCode !== undefined && rCode !== 200))
        throw new Error(
          `answered 200 with rCode ${rCode} ${JSON.stringify(body.status?.bCodeMessage ?? null)}`,
        );
      await deps.sleep(300); // polite between successful calls too
      const said = parseReportText(body.data.reportText ?? "");
      if (!said.ok)
        log(
          `[confirm-print-dates] ${symbol}: reportText not in any wording we read — "${(body.data.reportText ?? "").slice(0, 160)}"`,
        );
      return said;
    } catch (error) {
      log(`[confirm-print-dates] ${symbol} attempt ${attempt} failed: ${error}`);
      if (attempt < 3) await deps.sleep(attempt * 1000);
    }
  }
  log(`[confirm-print-dates] ${symbol}: giving up after 3 attempts.`);
  return { ok: false, confirmed: false };
}

/**
 * EARS 1: for each playbook symbol with no print in the next `lookaheadDays`, the next estimate —
 * 13 weeks on from its latest row on or before today, stepped past today if the table went stale.
 * Skipped when that estimate sits on top of a row already on file further out.
 */
export function cadenceFills(
  prints: readonly EarningsPrint[],
  symbols: readonly string[],
  today: string,
  lookaheadDays: number = FILL_LOOKAHEAD_DAYS,
): EarningsPrint[] {
  const fills: EarningsPrint[] = [];
  for (const symbol of [...new Set(symbols)]) {
    const rows = prints.filter((p) => p.symbol === symbol);
    const covered = rows.some((p) => {
      const span = printSpan(p);
      return (
        daysUntil(at(today), span.end) >= 0 && daysUntil(at(today), span.start) <= lookaheadDays
      );
    });
    const base = rows
      .filter((p) => daysUntil(at(today), p.date) <= 0)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (covered || !base) continue;

    let date = shift(base.date, CADENCE_DAYS);
    while (daysUntil(at(today), date) < 0) date = shift(date, CADENCE_DAYS);
    const onFile = rows.some((p) => Math.abs(daysUntil(at(p.date), date)) <= FILL_DEDUPE_DAYS);
    if (onFile) continue;

    fills.push({
      symbol,
      date,
      status: "estimate",
      source: `EST: auto cadence — 13 weeks after the ${base.date} print (confirm-print-dates, ${today}); unconfirmed`,
      window: { start: shift(date, -FILL_WINDOW.before), end: shift(date, FILL_WINDOW.after) },
    });
  }
  return fills;
}

const ARRAY_MARKER = "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [";

interface EntrySpan {
  readonly start: number;
  readonly end: number; // exclusive
  readonly text: string;
}

/** The `{...}` entries of the array literal, skipping braces inside strings and `//` comments. */
function entrySpans(source: string): { entries: EntrySpan[]; close: number } {
  const open = source.indexOf(ARRAY_MARKER);
  if (open === -1) throw new Error(`could not find "${ARRAY_MARKER}"`);
  const entries: EntrySpan[] = [];
  let depth = 0;
  let entryStart = -1;
  for (let i = open + ARRAY_MARKER.length; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i++;
      while (i < source.length && source[i] !== ch) i += source[i] === "\\" ? 2 : 1;
    } else if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
    } else if (ch === "{") {
      if (depth === 0) entryStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0)
        entries.push({ start: entryStart, end: i + 1, text: source.slice(entryStart, i + 1) });
    } else if (ch === "]" && depth === 0) {
      return { entries, close: i };
    }
  }
  throw new Error(`unterminated "${ARRAY_MARKER}"`);
}

const quote = (s: string): string => JSON.stringify(s);

/** One row in the file's multi-line style, keeping any `//` comment the row it replaces carried. */
function serialize(p: EarningsPrint, comments: readonly string[] = []): string {
  const lines = [
    ...comments,
    `symbol: ${quote(p.symbol)},`,
    `date: ${quote(p.date)},`,
    `status: ${quote(p.status)},`,
    `source: ${quote(p.source)},`,
    ...(p.window
      ? [`window: { start: ${quote(p.window.start)}, end: ${quote(p.window.end)} },`]
      : []),
    ...(p.ledgerId ? [`ledgerId: ${quote(p.ledgerId)},`] : []),
  ];
  return `{\n${lines.map((l) => `    ${l}`).join("\n")}\n  }`;
}

const field = (text: string, name: string): string | undefined =>
  text.match(new RegExp(`\\b${name}:\\s*"([^"]+)"`))?.[1];

/**
 * Rewrite `UPCOMING_PRINTS` in place: each update replaces exactly the row it came from (matched on
 * symbol AND date — NVDA has three rows), fills are appended before the closing bracket, and every
 * other byte of the file is left as it was. Run biome format afterwards for line width.
 */
export function rewriteCalendar(
  source: string,
  updates: readonly PrintUpdate[],
  fills: readonly EarningsPrint[],
): string {
  const { entries, close } = entrySpans(source);
  let out = source;
  if (fills.length > 0) {
    const added = fills.map((f) => `  ${serialize(f)},\n`).join("");
    out = `${out.slice(0, close)}${added}${out.slice(close)}`;
  }
  for (const entry of [...entries].reverse()) {
    const update = updates.find(
      (u) =>
        u.from.symbol === field(entry.text, "symbol") && u.from.date === field(entry.text, "date"),
    );
    if (!update) continue;
    const comments = entry.text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("//"));
    out = `${out.slice(0, entry.start)}${serialize(update.to, comments)}${out.slice(entry.end)}`;
  }
  return out;
}
