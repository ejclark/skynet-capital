/**
 * Option-play wiring for the live autonomous runner — kept beside `autonomous-live-wiring.ts`
 * (which is near its size cap) so the option half grows here. Wiring only: the one piece of state
 * is each bot's options approval level, read at boot and again on a credential rotation.
 */
import { parseOptionsLevel } from "../adapters/alpaca-option-preflight.js";
import type { AlpacaAccount } from "../alpaca/alpaca-trading-client.js";
import type { AlpacaCredentials } from "../alpaca/credentials.js";
import type { AutonomousTraderConfig } from "../autonomous/autonomous-trader.js";
import type { DecisionDb } from "../autonomous/decision-db.js";
import type { Bot } from "../bots/bot.js";
import { botTradingClient } from "../bots/bot-broker.js";
import type { SwappableBotBroker } from "../bots/swappable-bot-broker.js";
import type { RiskConfig } from "../engine/guards.js";
import { claimOptionUnderlyings } from "../playbooks/option-ownership.js";
import type { EnabledPlaybook } from "../playbooks/playbook.js";
import { parseLifecycleActivity } from "../trading/option-lifecycle.js";

/** One option attempt per underlying per 10 minutes — approved or refused, observe or live. */
const OPTION_COOLDOWN_MS = 600_000;

type Log = { log(line: string): void; warn(line: string): void };
type ReadAccount = (credentials: AlpacaCredentials) => Promise<AlpacaAccount>;
const readBotAccount: ReadAccount = (credentials) => botTradingClient(credentials).getAccount();

/** A bot's merged roster with the one-option-playbook-per-underlying rule applied, every refusal
 *  and narrowing announced on a `[playbooks]` line — the same prefix the roster's own lines use. */
export function ownedOptionRoster(
  personaId: string,
  merged: readonly EnabledPlaybook[],
): EnabledPlaybook[] {
  return claimOptionUnderlyings(merged, (line) =>
    console.warn(`[playbooks] ${personaId}: ${line}`),
  );
}

/**
 * One account read per bot at boot, shared by everything boot needs from it — the daily-loss
 * baseline (`last_equity`) and the options approval level — so the level costs no extra call. A
 * bot whose read fails maps to `undefined`; each reader decides what that means for it.
 */
export async function readBootAccounts(
  bots: readonly Bot[],
  read: ReadAccount = readBotAccount,
): Promise<ReadonlyMap<string, AlpacaAccount | undefined>> {
  const accounts = await Promise.all(
    bots.map(async (bot) => {
      try {
        return [bot.persona.id, await read(bot.credentials)] as const;
      } catch {
        return [bot.persona.id, undefined] as const;
      }
    }),
  );
  return new Map(accounts);
}

function describeLevel(level: number | undefined): string {
  return level === undefined
    ? "options level unreadable — every option open will be refused"
    : `options level ${level}`;
}

/**
 * Each bot's Alpaca options approval level, as the guards read it (`RiskConfig.optionsLevel`):
 * absent refuses every option OPEN, which is the honest answer for an account whose level could
 * not be read. Re-read after a credential rotation — the new key may be a different account — and
 * a changed level re-applies that bot's roster, so its next cycle trades under the new one. The
 * order flow reads the level fresh again at submit, so this is never the last word.
 */
export class BotOptionLevels {
  private readonly levels = new Map<string, number | undefined>();
  private readonly read: ReadAccount;
  private readonly logger: Log;
  private onChange: (personaId: string) => void = () => undefined;

  constructor(read: ReadAccount = readBotAccount, logger: Log = console) {
    this.read = read;
    this.logger = logger;
  }

  /** The boot read (`readBootAccounts`): every bot's level, one line each — and the accounts
   *  themselves, handed back for the daily-loss baseline, so the level costs no call of its own. */
  async readAtBoot(bots: readonly Bot[]): Promise<ReadonlyMap<string, AlpacaAccount | undefined>> {
    const accounts = await readBootAccounts(bots, this.read);
    for (const [personaId, account] of accounts) {
      const level = parseOptionsLevel(account?.options_trading_level);
      this.levels.set(personaId, level);
      this.logger.log(`[options] ${personaId}: ${describeLevel(level)}`);
    }
    return accounts;
  }

  /** The risk config one bot trades under: the shared base plus its own level. */
  risk(personaId: string, base: RiskConfig): RiskConfig {
    const level = this.levels.get(personaId);
    return level === undefined ? base : { ...base, optionsLevel: level };
  }

  /** How to re-apply a bot's roster once its level changed — `run-autonomous.ts`'s one swap path,
   *  over the live `rosters` array (reassigned in place by that same path). */
  follow<R extends { readonly bot: Bot }>(
    rosters: readonly R[],
    swapIn: (index: number, roster: R) => void,
  ): void {
    this.onChange = (personaId) => {
      const index = rosters.findIndex((r) => r.bot.persona.id === personaId);
      const roster = rosters[index];
      if (roster) swapIn(index, roster);
    };
  }

  /** After a rotation: read the new account's level; a change re-applies the roster. A failed read
   *  keeps the level already in force (the submit-time read still gates every open) and says so. */
  async refresh(personaId: string, credentials: AlpacaCredentials): Promise<void> {
    let level: number | undefined;
    try {
      level = parseOptionsLevel((await this.read(credentials)).options_trading_level);
    } catch (error) {
      this.logger.warn(
        `[options] ${personaId}: options level re-read after rotation failed — keeping the last one (${String(error)})`,
      );
      return;
    }
    if (this.levels.has(personaId) && this.levels.get(personaId) === level) return;
    this.levels.set(personaId, level);
    this.logger.log(`[options] ${personaId}: rotated — ${describeLevel(level)}`);
    try {
      this.onChange(personaId);
    } catch (error) {
      // Called un-awaited from the rotation callback: a throw here must never become an
      // unhandled rejection that takes the bots process down.
      this.logger.warn(`[options] ${personaId}: roster re-apply failed — ${String(error)}`);
    }
  }
}

/** What a live trader needs for option plays: its broker as both the quote source and the
 *  tracker of orders left working, and the per-underlying attempt gap. */
export function optionTraderConfig(
  broker: SwappableBotBroker,
): Pick<AutonomousTraderConfig, "optionMarket" | "optionOrders" | "optionCooldownMs"> {
  return { optionMarket: broker, optionOrders: broker, optionCooldownMs: OPTION_COOLDOWN_MS };
}

/** A failed option quote read, as a log line — the read itself fails soft. */
export function optionReadWarn(personaId: string): (what: string, error: unknown) => void {
  return (what, error) =>
    console.warn(`[options] ${personaId}: ${what} read failed — ${String(error)}`);
}

/**
 * Boot, before the first cycle: cancel every open order a bot stamped — what a crashed process left
 * behind. Each bot's sweep touches only orders carrying its OWN client order id prefix, so a
 * member's desk order, or another bot's, is never canceled. Runs in observe mode too (there it
 * should find nothing). A sweep that cannot list the orders is logged and boot carries on: the
 * no-stacking fence still refuses to stack an open on anything left working.
 */
export async function sweepOrphanOptionOrders(
  brokers: ReadonlyMap<string, Pick<SwappableBotBroker, "sweepOrphanOptionOrders">>,
  logger: Log = console,
): Promise<void> {
  for (const [personaId, broker] of brokers) {
    try {
      const swept = await broker.sweepOrphanOptionOrders();
      if (swept.length > 0) {
        logger.warn(
          `[options] ${personaId}: canceled ${swept.length} option order(s) left open by an earlier run: ${swept.join(", ")}`,
        );
      }
    } catch (error) {
      logger.warn(
        `[options] ${personaId}: orphan order sweep failed (non-fatal): ${String(error)}`,
      );
    }
  }
}

/** How often each bot's account is asked what happened to its contracts. Expiries and assignments
 *  post after the close, so half-hourly is ample; two reads an hour per bot cost nothing. */
export const OPTION_LIFECYCLE_SWEEP_MS = 30 * 60_000;

/**
 * One pass: each bot's newest option expiry/assignment reports, into the decision store, which
 * stores each once and closes the contract it names (#4642 slice 8). This is how a sold put that
 * expired, or was assigned, reaches its playbook's realized P/L — no order ever fills for either.
 * A failed read is logged and skipped; the next pass reads the same page again, so nothing is lost.
 */
export async function sweepOptionLifecycle(
  brokers: ReadonlyMap<string, Pick<SwappableBotBroker, "readOptionLifecycle">>,
  db: Pick<DecisionDb, "recordOptionLifecycle">,
  logger: Log = console,
): Promise<void> {
  for (const [personaId, broker] of brokers) {
    try {
      const read = await broker.readOptionLifecycle();
      if (!read.ok) {
        logger.warn(
          `[options] ${personaId}: option expiry/assignment read failed — next pass retries`,
        );
        continue;
      }
      const activities = read.rows.map(parseLifecycleActivity).filter((a) => a !== null);
      const added = db.recordOptionLifecycle(personaId, activities);
      if (added > 0) {
        logger.log(`[options] ${personaId}: recorded ${added} new expiry/assignment report(s)`);
      }
    } catch (error) {
      logger.warn(`[options] ${personaId}: option lifecycle sweep failed — ${String(error)}`);
    }
  }
}

/** The sweep at boot and every `OPTION_LIFECYCLE_SWEEP_MS` after; a pass still running is never
 *  doubled up. Dark with no decision store (`SKYNET_BOTS_DB_PATH` unset) — there is nowhere to
 *  score the reports. Returns the timer so a caller (a spec) can stop it. */
export function armOptionLifecycleSweep(
  brokers: ReadonlyMap<string, Pick<SwappableBotBroker, "readOptionLifecycle">>,
  db: Pick<DecisionDb, "recordOptionLifecycle"> | undefined,
  logger: Log = console,
  everyMs = OPTION_LIFECYCLE_SWEEP_MS,
): ReturnType<typeof setInterval> | undefined {
  if (!db) return undefined;
  let running = false;
  const pass = () => {
    if (running) return;
    running = true;
    void sweepOptionLifecycle(brokers, db, logger).finally(() => {
      running = false;
    });
  };
  pass();
  return setInterval(pass, everyMs);
}
