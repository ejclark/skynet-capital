/**
 * One paper-checks run (#8256): guard the account, read the broker's clock and calendar, run each
 * picked check whose window is open, then clean up — always, by any path. The command
 * (`scripts/paper-checks.mjs`) owns the process: flags, signals, writing the record, the exit code.
 *
 * Exit codes: 2 refused before anything was placed (`guard.ts`), 1 something it placed is still
 * open after cleanup, 0 otherwise. A broker refusal is an answer and never fails the run.
 */
import { calendarDays } from "../../domain/market-clock.js";
import type { AlpacaTradingTransport } from "../trading-transport.js";
import type { CheckAnswer } from "./answer.js";
import { type CheckId, checkSpec } from "./catalog.js";
import { mlegStockLeg, optionsExtendedHours, sameDayOptions } from "./checks-options.js";
import {
  bracketAfterClose,
  eveningQuotes,
  extendedHours,
  fractionalExits,
} from "./checks-stock.js";
import { type CleanupReport, cleanup } from "./cleanup.js";
import { type Desk, newLedger } from "./desk.js";
import { type AccountSecrets, guardAccount } from "./guard.js";
import type { CheckRow, RunRecord } from "./results.js";
import { calendarRange, type MarketFacts, phaseAt, windowFor } from "./windows.js";

const RUNNERS: Partial<Record<CheckId, (desk: Desk) => Promise<CheckAnswer>>> = {
  "bracket-after-close": bracketAfterClose,
  "extended-hours": extendedHours,
  "evening-quotes": eveningQuotes,
  "fractional-exits": fractionalExits,
  "options-extended-hours": optionsExtendedHours,
  "same-day-options": sameDayOptions,
  "mleg-stock-leg": mlegStockLeg,
};

export interface RunOptions {
  readonly trading: AlpacaTradingTransport;
  readonly data: AlpacaTradingTransport;
  readonly only: readonly CheckId[];
  readonly runId: string;
  readonly dryRun: boolean;
  readonly sameDayQty: number;
  readonly campaignSymbols: readonly string[];
  readonly now: () => number;
  readonly sleep: (ms: number) => Promise<void>;
}

export interface PaperCheckRun {
  /** Guard, run the checks, clean up. Throws `PaperCheckRefused` before placing anything. */
  execute(): Promise<RunRecord>;
  /** Idempotent; a no-op until the guard has passed, so a refusal never touches the account. */
  cleanup(): Promise<CleanupReport>;
  /** The rows finished so far — what a signal-interrupted run writes. */
  rows(): readonly CheckRow[];
  /** The account's own identifiers once read, for redaction only. */
  secrets(): AccountSecrets | undefined;
}

async function readFacts(
  trading: AlpacaTradingTransport,
  now: number,
  sessions?: MarketFacts["sessions"],
): Promise<MarketFacts> {
  // Read before every check: a run that watches check 1 through the open crosses it.
  const clock = await trading.get("/v2/clock");
  const clockOpen = (clock.body as { is_open?: unknown } | null)?.is_open === true;
  if (clock.status !== 200)
    throw new Error(`could not read the broker's clock (HTTP ${clock.status})`);
  if (sessions) return { now, clockOpen, sessions };
  const { start, end } = calendarRange(now);
  const calendar = await trading.get(`/v2/calendar?start=${start}&end=${end}`);
  const days = calendarDays(calendar.body);
  if (calendar.status !== 200 || !days) {
    throw new Error(`could not read the broker's calendar (HTTP ${calendar.status})`);
  }
  return { now, clockOpen, sessions: days };
}

const iso = (ms: number): string => new Date(ms).toISOString();

export function createRun(options: RunOptions): PaperCheckRun {
  const ledger = newLedger();
  const finished: CheckRow[] = [];
  let desk: Desk | undefined;
  let account: AccountSecrets | undefined;
  let report: Promise<CleanupReport> | undefined;
  const runCleanup = (): Promise<CleanupReport> => {
    if (!desk) return Promise.resolve({ stillOpen: [], positionsLeft: [] });
    report ??= cleanup(desk);
    return report;
  };

  async function one(id: CheckId): Promise<CheckRow> {
    const facts = await readFacts(options.trading, options.now(), desk?.facts.sessions);
    const base = {
      check: id,
      ranAt: iso(facts.now),
      phase: phaseAt(facts),
      attempts: [],
      orderIds: [],
      cleanup: "nothing placed",
    };
    const spec = checkSpec(id);
    if (spec.notScriptable)
      return { ...base, outcome: "not scriptable", answer: spec.notScriptable };
    const window = windowFor(id, facts);
    if (!window.open) {
      return {
        ...base,
        outcome: "not in window",
        answer: `${spec.window}; not open now`,
        ...(window.next ? { nextWindow: window.next } : {}),
      };
    }
    const runner = RUNNERS[id];
    if (!(runner && desk)) return { ...base, outcome: "error", answer: "no runner for this check" };
    const checkDesk: Desk = { ...desk, facts };
    try {
      const answer = await runner(checkDesk);
      return { ...base, ...answer };
    } catch (error) {
      return {
        ...base,
        outcome: "error",
        answer: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    async execute() {
      const startedAt = iso(options.now());
      account = await guardAccount(options.trading);
      const facts = await readFacts(options.trading, options.now());
      desk = { ...options, facts, ledger };
      let done: CleanupReport;
      try {
        for (const id of options.only) finished.push(await one(id));
      } finally {
        done = await runCleanup();
      }
      const open = new Set(done.stillOpen);
      const rows = finished.map((row) => {
        const placed = [...ledger.orders]
          .filter(([, check]) => check === row.check)
          .map(([id]) => id);
        if (placed.length === 0) return row;
        const left = placed.filter((id) => open.has(id));
        return {
          ...row,
          orderIds: placed,
          cleanup: left.length ? `still open: ${left.join(", ")}` : "cancelled",
        };
      });
      const exitCode = done.stillOpen.length > 0 || done.positionsLeft.length > 0 ? 1 : 0;
      return {
        runId: options.runId,
        startedAt,
        finishedAt: iso(options.now()),
        exitCode,
        rows,
        stillOpen: done.stillOpen,
        positionsLeft: done.positionsLeft,
      };
    },
    cleanup: runCleanup,
    rows: () => finished,
    secrets: () => account,
  };
}
