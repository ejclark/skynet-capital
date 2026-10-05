// PRODUCTION-SHAPE SEED for the stability budget run (#4612 slice 1, #4613).
//
// Why it exists: offline mode swaps the history, activity and event ledgers for empty in-memory
// stores (history-boot.ts, activity-store.ts, activity-bus.ts), and every spec runs on a handful of
// rows — so nothing local ever paid the cost of a 56-day-old ledger, and the Accounts click that
// OOM-killed production (a per-sample Intl formatter, ×3 passes) took 4 ms on a laptop. This writes
// the durable stores the server reads, in the exact on-disk format, at the depth production holds:
// `--days` of history for `--participants` accounts. Every record is typed against the repo's own
// record types and written with the stores' own key→file rule, so a format change breaks
// `npm run typecheck`, not the measurement.
//
//   npx tsx scripts/stability/seed.ts --out /tmp/stab --days 180 --participants 12
//
// Rates (per participant per day, the same as production as of 2026-10-04 — estimates where marked):
//   history     288 samples (history-sampler.ts: one every 5 minutes, 24/7) + 50 boot samples (one
//               per deploy restart; ~50 deploys a day, #4612)
//   activity    sauron ~89 orders, day/rumor bots ~22, humans ~4.4 (estimate — the audit's 1x shape)
//   decisions   sauron ~333 cycles, the other two bots ~111 (estimate)
//   feedback    ~0.44 filings and ~3.3 companion messages per member (estimate)
// Randomness is a fixed-seed LCG: the same arguments write the same rows, shifted to `--now`.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { ActivityEvent } from "../../src/observatory/activity-event.js";
import {
  activityEventFromAuditRecord,
  activityEventFromTradeRecord,
} from "../../src/observatory/activity-event.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import type { EquitySample } from "../../src/observatory/history-record.js";
import type { CompanionMessageLogEntry } from "../../src/server/companion-message-log.js";
import { opaqueMemberId } from "../../src/server/feedback-attribution.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";

const DAY_MS = 864e5;
const SAMPLE_MS = 5 * 60_000;
const BOOT_SAMPLES_PER_DAY = 50;
const SYMBOLS = ["NVDA", "AAPL", "EEM", "SPY", "TSLA", "AMD", "MSFT"] as const;
const OPTIONS = ["NVDA261120C00180000", "SPY261031P00560000"] as const;

/** The signed-in viewer: an owner (SKYNET_ALLOWED_EMAILS) who also owns `human-eric`. */
export const OWNER_EMAIL = "owner@stability.test";

export interface HarnessParticipant {
  readonly id: string;
  readonly kind: "bot" | "human";
  /** The env var pair live mode builds this participant from (load-participants.ts). */
  readonly keyVar: string;
  readonly secretVar: string;
  /** SKYNET_HUMAN_<ID>_EMAIL — the owner link, for the one human the viewer owns. */
  readonly emailVar?: string;
  /** Orders per day — bots trade far more than members. */
  readonly ordersPerDay: number;
  readonly cyclesPerDay: number;
}

const BOTS = [
  { id: "sauron", ordersPerDay: 89, cyclesPerDay: 333 },
  { id: "day-trader", ordersPerDay: 22, cyclesPerDay: 111 },
  { id: "rumor-trader", ordersPerDay: 22, cyclesPerDay: 111 },
];

/**
 * The roster both the seed and the runner use: up to three trading bots, then `human-eric` (the
 * viewer's own account), then members `human-m1…`. Live mode reads it from env vars, exactly as
 * production reads its roster — so the harness needs no fixture participants file.
 */
export function harnessRoster(count: number): HarnessParticipant[] {
  const roster: HarnessParticipant[] = BOTS.slice(0, Math.max(0, count - 1)).map((b) => {
    const slug = b.id.toUpperCase().replaceAll("-", "_");
    return {
      id: b.id,
      kind: "bot",
      keyVar: `SKYNET_BOT_${slug}_KEY`,
      secretVar: `SKYNET_BOT_${slug}_SECRET`,
      ordersPerDay: b.ordersPerDay,
      cyclesPerDay: b.cyclesPerDay,
    };
  });
  for (let i = 0; roster.length < count; i++) {
    const slug = i === 0 ? "ERIC" : `M${i}`;
    roster.push({
      id: `human-${slug.toLowerCase()}`,
      kind: "human",
      keyVar: `SKYNET_HUMAN_${slug}_KEY`,
      secretVar: `SKYNET_HUMAN_${slug}_SECRET`,
      ...(i === 0 ? { emailVar: `SKYNET_HUMAN_${slug}_EMAIL` } : {}),
      ordersPerDay: 4.4,
      cyclesPerDay: 0,
    });
  }
  return roster;
}

/** Where each store lives, as directories on the host; the runner maps fly.toml's `/data/…` here. */
export interface StoreDirs {
  readonly history: string;
  readonly activity: string;
  readonly orderAudit: string;
  readonly feedbackLog: string;
  readonly companionMessageLog: string;
  readonly insights: string;
}

export const defaultStoreDirs = (out: string): StoreDirs => ({
  history: join(out, "history"),
  activity: join(out, "activity"),
  orderAudit: join(out, "order-audit"),
  feedbackLog: join(out, "feedback-log"),
  companionMessageLog: join(out, "companion-message-log"),
  insights: join(out, "insights"),
});

export interface SeedOptions {
  readonly dirs: StoreDirs;
  readonly days: number;
  readonly participants: number;
  /** The newest sample's instant (ms); defaults to now, so "last month" windows hold data. */
  readonly now?: number;
}

export interface SeedReport {
  readonly days: number;
  readonly participants: number;
  readonly historyRows: number;
  readonly historyRowsPerParticipant: number;
  readonly activityRows: number;
  readonly auditRows: number;
  readonly eventRows: number;
  readonly feedbackRows: number;
  readonly messageRows: number;
  readonly decisionCycles: number;
  /** The newest equity per participant — the stub broker answers `/v2/account` with it. */
  readonly lastEquity: Readonly<Record<string, number>>;
}

/** The stores' own key→file rule (history-store.ts, activity-store.ts, …): unsafe chars → `_`. */
const fileFor = (dir: string, key: string): string =>
  join(dir, `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`);

const writeJsonl = (file: string, rows: readonly unknown[]): void =>
  writeFileSync(file, rows.length ? `${rows.map((r) => JSON.stringify(r)).join("\n")}\n` : "");

/** What every store writer shares: the window, the roster, and one seeded random stream. */
interface Ctx {
  readonly dirs: StoreDirs;
  readonly roster: readonly HarnessParticipant[];
  readonly days: number;
  readonly start: number;
  readonly now: number;
  readonly rnd: () => number;
}

const iso = (t: number): string => new Date(t).toISOString();

/** The history sampler's 5-minute grid, 24/7, plus one boot sample per deploy restart. */
function seedHistory(ctx: Ctx): { rows: number; lastEquity: Record<string, number> } {
  const { roster, start, now, rnd } = ctx;
  let rows = 0;
  const lastEquity: Record<string, number> = {};
  const bootGapMs = DAY_MS / BOOT_SAMPLES_PER_DAY;
  for (const p of roster) {
    const lines: string[] = [];
    let equity = 100_000;
    let realized = 0;
    let nextBoot = start + rnd() * bootGapMs;
    const sample = (t: number): void => {
      const row: EquitySample = {
        at: iso(t),
        participantId: p.id,
        equity: +equity.toFixed(2),
        cash: +(equity * 0.4).toFixed(2),
        realizedPl: +realized.toFixed(2),
      };
      lines.push(JSON.stringify(row));
    };
    for (let t = start; t < now; t += SAMPLE_MS) {
      equity += (rnd() - 0.5) * 200;
      if (rnd() < 0.01) realized += (rnd() - 0.4) * 500;
      sample(t);
      for (; nextBoot < t + SAMPLE_MS && nextBoot < now; nextBoot += bootGapMs)
        sample(Math.floor(nextBoot));
    }
    lastEquity[p.id] = +equity.toFixed(2);
    rows += lines.length;
    writeFileSync(fileFor(ctx.dirs.history, p.id), `${lines.join("\n")}\n`);
  }
  return { rows, lastEquity };
}

interface Fill {
  readonly orderId: string;
  readonly at: number;
  readonly symbol: string;
  readonly qty: number;
  readonly price: number;
}

/** One order: the journal's accepted line, then (most often) its filled line. */
function orderLines(ctx: Ctx, p: HarnessParticipant, i: number, n: number) {
  const { start, now, rnd } = ctx;
  const at = start + ((i + rnd()) / n) * (now - start);
  const option = rnd() < 0.2;
  const pool = option ? OPTIONS : SYMBOLS;
  const symbol = pool[Math.floor(rnd() * pool.length)] as string;
  const side = i % 2 === 0 ? ("buy" as const) : ("sell" as const);
  const qty = option ? 1 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 50);
  const price = option ? +(1 + rnd() * 9).toFixed(2) : +(50 + rnd() * 400).toFixed(2);
  const orderId = `${p.id}-o${i}-${Math.floor(rnd() * 1e9).toString(16)}`;
  const base = { orderId, participantId: p.id, symbol, side, quantity: qty } as const;
  const lines: TradeActivityRecord[] = [
    { ...base, filledQuantity: 0, status: "new", at: iso(at), source: "stream" },
  ];
  const filled = rnd() < 0.85;
  if (filled)
    lines.push({
      ...base,
      filledQuantity: qty,
      price,
      status: "filled",
      at: iso(at + 2000),
      source: "stream",
    });
  const audit: OrderAuditRecord | undefined =
    p.kind === "human" || rnd() < 0.5
      ? {
          participantId: p.id,
          ownerEmail: OWNER_EMAIL,
          orderId,
          at: iso(at - 500),
          code: option ? "201" : "101",
          intent: side === "buy" ? "open" : "close",
          symbol,
          side,
        }
      : undefined;
  const fill: Fill | undefined = filled ? { orderId, at, symbol, qty, price } : undefined;
  return { lines, audit, fill };
}

/** The trade journal, the order audit, and the activity-event bus fed from both. */
function seedActivity(ctx: Ctx) {
  const totals = { activityRows: 0, auditRows: 0, eventRows: 0 };
  const sauronFills: Fill[] = [];
  for (const p of ctx.roster) {
    const n = Math.round(p.ordersPerDay * ctx.days);
    const journal: TradeActivityRecord[] = [];
    const audit: OrderAuditRecord[] = [];
    const events: ActivityEvent[] = [];
    for (let i = 0; i < n; i++) {
      const order = orderLines(ctx, p, i, n);
      journal.push(...order.lines);
      events.push(...order.lines.map(activityEventFromTradeRecord));
      if (order.audit) {
        audit.push(order.audit);
        events.push(activityEventFromAuditRecord(order.audit));
      }
      if (order.fill && p.id === "sauron") sauronFills.push(order.fill);
    }
    totals.activityRows += journal.length;
    totals.auditRows += audit.length;
    totals.eventRows += events.length;
    writeJsonl(fileFor(ctx.dirs.activity, p.id), journal);
    writeJsonl(fileFor(ctx.dirs.orderAudit, p.id), audit);
    writeJsonl(fileFor(join(ctx.dirs.activity, "events"), p.id), events);
  }
  return { ...totals, sauronFills };
}

/** Feedback filings and companion messages, keyed by opaque member id as production keys them. */
function seedMemberLogs(ctx: Ctx): { feedbackRows: number; messageRows: number } {
  const { start, now, rnd, days } = ctx;
  const members = ctx.roster.filter((p) => p.kind === "human").length;
  const emails = [
    OWNER_EMAIL,
    ...Array.from({ length: Math.max(0, members - 1) }, (_, i) => `m${i + 1}@stability.test`),
  ];
  let feedbackRows = 0;
  let messageRows = 0;
  for (const email of emails) {
    const member = opaqueMemberId(email);
    const filings: FeedbackLogEntry[] = Array.from({ length: Math.round(0.44 * days) }, (_, i) => ({
      uuid: `${member}-${i}`,
      opaqueMemberId: member,
      issueNumber: 1000 + feedbackRows + i,
      url: `https://github.com/ejclark/skynet-capital/issues/${1000 + feedbackRows + i}`,
      kind: (["bug", "feature", "idea"] as const)[i % 3] ?? "idea",
      title: `Feedback item ${i} about the trade ticket and the research shelf`,
      filedAt: iso(start + rnd() * (now - start)),
    }));
    feedbackRows += filings.length;
    writeJsonl(fileFor(ctx.dirs.feedbackLog, member), filings);
    const messages: CompanionMessageLogEntry[] = Array.from(
      { length: Math.round(3.3 * days) },
      () => ({ opaqueMemberId: member, at: iso(start + rnd() * (now - start)) }),
    );
    messageRows += messages.length;
    writeJsonl(fileFor(ctx.dirs.companionMessageLog, member), messages);
  }
  return { feedbackRows, messageRows };
}

/** One bot cycle: three observed intents, plus the placed one when a real fill is due. */
function decisionCycle(
  ctx: Ctx,
  bot: string,
  at: number,
  i: number,
  placed?: Fill,
): DecisionRecord {
  const symbol = SYMBOLS[i % SYMBOLS.length] as string;
  const observed: OrderIntent[] = [0, 1, 2].map((k) => ({
    symbol: SYMBOLS[(i + k) % SYMBOLS.length] as string,
    side: k % 2 ? "sell" : "buy",
    quantity: 5 + k,
    type: "market",
    reason: `momentum ${(ctx.rnd() * 3).toFixed(2)} over 20 bars; sentiment ${(ctx.rnd() * 2 - 1).toFixed(2)}`,
  }));
  const intent: OrderIntent | undefined = placed && {
    symbol: placed.symbol,
    side: "buy",
    quantity: placed.qty,
    type: "market",
    reason: "momentum breakout",
    playbookId: "accumulator",
    playbookMode: "standard",
  };
  const result = placed && {
    status: "filled" as const,
    filledQuantity: placed.qty,
    filledPrice: placed.price,
    orderId: placed.orderId,
  };
  return {
    at,
    personaId: bot,
    mode: "live",
    rawIntents: intent ? [...observed, intent] : observed,
    guardedIntents: intent ? [intent] : [],
    outcomes: [
      ...observed.map((o) => ({ intent: o, action: "observed" as const })),
      ...(intent && result
        ? [{ intent, action: "placed" as const, result: { intent, ...result } }]
        : []),
    ],
    context: {
      asOf: iso(at),
      quotes: { [symbol]: { symbol, bid: 100, ask: 100.1, last: 100.05, asOf: iso(at) } },
    },
  };
}

/** decisions.db: every bot's cycles, sauron's placed ones tied to its real fills. */
function seedDecisions(ctx: Ctx, sauronFills: readonly Fill[]): number {
  const db = openDecisionDb(join(ctx.dirs.insights, "decisions.db"));
  let cycles = 0;
  let next = 0;
  try {
    for (const bot of ctx.roster.filter((p) => p.cyclesPerDay > 0)) {
      const n = Math.round(bot.cyclesPerDay * ctx.days);
      let batch: DecisionRecord[] = [];
      for (let i = 0; i < n; i++) {
        const at = ctx.start + (i / n) * (ctx.now - ctx.start);
        const due = bot.id === "sauron" ? sauronFills[next] : undefined;
        const placed = due && due.at <= at ? due : undefined;
        if (placed) next += 1;
        batch.push(decisionCycle(ctx, bot.id, at, i, placed));
        if (batch.length >= 1000) {
          db.recordBatch(batch);
          cycles += batch.length;
          batch = [];
        }
      }
      db.recordBatch(batch);
      cycles += batch.length;
    }
  } finally {
    db.close();
  }
  return cycles;
}

export function seedStores(opts: SeedOptions): SeedReport {
  const { dirs, days, participants } = opts;
  const now = Math.floor((opts.now ?? Date.now()) / SAMPLE_MS) * SAMPLE_MS;
  let seed = 42;
  const ctx: Ctx = {
    dirs,
    days,
    now,
    start: now - days * DAY_MS,
    roster: harnessRoster(participants),
    rnd: () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    },
  };
  for (const dir of Object.values(dirs)) mkdirSync(dir, { recursive: true });
  mkdirSync(join(dirs.activity, "events"), { recursive: true });
  const history = seedHistory(ctx);
  const { sauronFills, ...activity } = seedActivity(ctx);
  const logs = seedMemberLogs(ctx);
  const decisionCycles = seedDecisions(ctx, sauronFills);
  return {
    days,
    participants: ctx.roster.length,
    historyRows: history.rows,
    historyRowsPerParticipant: Math.round(history.rows / ctx.roster.length),
    ...activity,
    ...logs,
    decisionCycles,
    lastEquity: history.lastEquity,
  };
}

/** `--name value` from argv, or the fallback. */
function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

if (process.argv[1]?.endsWith("seed.ts")) {
  const out = arg("out", "");
  if (!out) {
    console.error(
      "usage: tsx scripts/stability/seed.ts --out <dir> [--days 180] [--participants 12]",
    );
    process.exit(2);
  }
  const report = seedStores({
    dirs: defaultStoreDirs(out),
    days: Number(arg("days", "180")),
    participants: Number(arg("participants", "12")),
  });
  console.log(JSON.stringify(report));
}
