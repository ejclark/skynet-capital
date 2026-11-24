import { isRecord } from "../storage/parse-guards.js";

/**
 * THE VITALS REPORT — the `bots` process's pulse, carried to the dashboard on the `/controls` poll
 * it already makes every ~30s (#4220, slice 1 of #1307).
 *
 * Why: every incident on 2026-09-04 ended in log archaeology — a silent holding cycle and a dead
 * process looked the same from outside, and only a gated log pull could tell them apart. The
 * process already stamps `/data/health.json` (`bots-health-file.ts`), but only CI reads that
 * file. These are the same facts, plus when the price stream last ticked, when each bot last
 * evaluated and when it last placed an order, pushed to the one app that can render them.
 *
 * A header on the existing poll, not a new `/vitals` route (the plan's first sketch): the poll is
 * already authenticated, already arrives every ~30s, and already carries the process's word about
 * itself (`controls-poll-wire.ts`, `house-roster-wire.ts`), so "within one poll interval" needs no
 * second client, no second route and no second auth check. Expand/contract like its siblings: an
 * app that predates it ignores the header; a bots build that predates it omits it, and the
 * dashboard reads that as "no vitals", which slice 2 renders red, never green.
 *
 * Status, never credentials: timestamps, a commit, a bridge verdict and persona ids. Nothing here
 * may carry a key, a secret or an account id — the bridge secret's trust level is right for that
 * and nothing more (`insight-record.ts`).
 */

export const CONTROLS_BOT_VITALS_HEADER = "x-skynet-bots-vitals";

/** Mirrors the three boot lines in `bootMissionControl` (autonomous-live-wiring.ts). */
export type BridgeStatus = "armed" | "unreachable" | "unset";

/** One bot's own pulse: when it last evaluated a cycle, and when it last placed an order. */
export interface BotVitals {
  readonly id: string;
  /** The newest decision record this bot emitted — every cycle emits one, idle or not. */
  readonly lastEvalAt: string | null;
  /** The newest cycle in which this bot placed at least one order; null = none this boot. */
  readonly lastOrderAt: string | null;
}

/** What the process says about itself, as of the poll that carries it. */
export interface BotsVitals {
  /** `GIT_SHA` as the deploy stamped it; null on a rollback, which drops it (fly.toml). */
  readonly gitSha: string | null;
  readonly bootedAt: string;
  readonly bridge: BridgeStatus;
  /** The last controls poll that came back — the one before the poll carrying this report. */
  readonly lastControlsPollAt: string | null;
  /** The newest price event on the shared market-data stream; null = none this boot. */
  readonly lastTickAt: string | null;
  /** The newest of the bots' own `lastEvalAt`. */
  readonly lastEvalAt: string | null;
  /** The newest of the bots' own `lastOrderAt`. */
  readonly lastOrderAt: string | null;
  readonly bots: readonly BotVitals[];
}

/** A handful of bots plus the scouts' own persona ids; generous headroom, never a real limit.
 *  Over it, the sender keeps the most recently evaluated and the reader drops the whole report. */
export const MAX_VITALS_BOTS = 32;
const MAX_ID_LENGTH = 64;
/** The encoded header's ceiling. It shares one GET with the gate and roster headers under Node's
 *  16 KiB header limit, and a 431 there would fail the poll that carries the owner's suspend
 *  toggles, so the sender trims the stalest bots to fit rather than risk the poll. */
export const MAX_VITALS_HEADER_BYTES = 4 * 1024;
/** What `toISOString` writes, and nothing looser: `Date.parse` alone would take "2026" or "1". */
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
/** A full or abbreviated git sha and nothing else. Strict on purpose: the sha header's value
 *  (`controls-poll-wire.ts`) is rendered into owner-facing copy AND interpolated into a GitHub
 *  `compare/<base>...<head>` URL, so anything that isn't a sha is dropped rather than passed along.
 *  One pattern for both reports of one commit, so they never disagree on what a sha is. */
export const SHA = /^[0-9a-f]{7,40}$/;
const BRIDGE_STATUSES: readonly BridgeStatus[] = ["armed", "unreachable", "unset"];

const encode = (vitals: BotsVitals): string =>
  Buffer.from(JSON.stringify(vitals), "utf8").toString("base64");

/** Bots side: the header to add to the poll. Empty when there is nothing to report yet (the boot
 *  fetch, before the bridge verdict is in) — an absent header is the honest signal. `bots` is
 *  expected most recently evaluated first; the sender trims from the end, so what it keeps always
 *  reads whole on the other side. */
export function controlsPollVitalsHeaders(vitals: BotsVitals | undefined): Record<string, string> {
  if (!vitals) return {};
  // A `GIT_SHA` that is not a sha travels as null (unknown), so it never voids the rest of the pulse.
  const sha = vitals.gitSha?.trim().toLowerCase() ?? "";
  const bots = vitals.bots
    .filter((bot) => bot.id.length > 0 && bot.id.length <= MAX_ID_LENGTH)
    .slice(0, MAX_VITALS_BOTS);
  let sent: BotsVitals = { ...vitals, gitSha: SHA.test(sha) ? sha : null, bots };
  let encoded = encode(sent);
  while (encoded.length > MAX_VITALS_HEADER_BYTES && sent.bots.length > 0) {
    sent = { ...sent, bots: sent.bots.slice(0, -1) };
    encoded = encode(sent);
  }
  return { [CONTROLS_BOT_VITALS_HEADER]: encoded };
}

/** An ISO instant or null, and nothing else: a string that does not parse as a date is junk. */
function isInstant(value: unknown): value is string {
  return typeof value === "string" && ISO_INSTANT.test(value) && Number.isFinite(Date.parse(value));
}

function isInstantOrNull(value: unknown): value is string | null {
  return value === null || isInstant(value);
}

function parseBot(value: unknown): BotVitals | undefined {
  if (!isRecord(value)) return undefined;
  const { id, lastEvalAt, lastOrderAt } = value;
  if (typeof id !== "string" || id.length === 0 || id.length > MAX_ID_LENGTH) return undefined;
  if (!(isInstantOrNull(lastEvalAt) && isInstantOrNull(lastOrderAt))) return undefined;
  return { id, lastEvalAt, lastOrderAt };
}

function parseVitals(decoded: unknown): BotsVitals | undefined {
  if (!isRecord(decoded)) return undefined;
  const { gitSha, bootedAt, bridge, lastControlsPollAt, lastTickAt, lastEvalAt, lastOrderAt } =
    decoded;
  if (!(gitSha === null || (typeof gitSha === "string" && SHA.test(gitSha)))) return undefined;
  if (!isInstant(bootedAt)) return undefined;
  if (!BRIDGE_STATUSES.includes(bridge as BridgeStatus)) return undefined;
  const instants = [lastControlsPollAt, lastTickAt, lastEvalAt, lastOrderAt];
  if (!instants.every(isInstantOrNull)) return undefined;
  const rawBots = decoded.bots;
  if (!Array.isArray(rawBots) || rawBots.length > MAX_VITALS_BOTS) return undefined;
  const bots = rawBots.map(parseBot);
  if (!bots.every((bot): bot is BotVitals => bot !== undefined)) return undefined;
  return {
    gitSha: gitSha as string | null,
    bootedAt,
    bridge: bridge as BridgeStatus,
    lastControlsPollAt: lastControlsPollAt as string | null,
    lastTickAt: lastTickAt as string | null,
    lastEvalAt: lastEvalAt as string | null,
    lastOrderAt: lastOrderAt as string | null,
    bots,
  };
}

/** App side: the vitals an authenticated poll carried, or `undefined` for anything short of a
 *  clean, complete payload — a partial pulse would read as health it never asserted. */
export function parseControlsPollVitals(
  headers: NodeJS.Dict<string | string[]>,
): BotsVitals | undefined {
  const raw = headers[CONTROLS_BOT_VITALS_HEADER];
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  try {
    return parseVitals(JSON.parse(Buffer.from(raw, "base64").toString("utf8")));
  } catch {
    return undefined;
  }
}
