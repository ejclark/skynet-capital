/**
 * The morning brief — everything knowable BEFORE the market opens, assembled into one view:
 * persona readiness, what each enabled playbook wants today, upcoming earnings proximity, and
 * current positions. Eric's ask (2026-08-13): a pre-market plan for Sauron (and any active bot)
 * given "all the events, state of the market, overnight developments, premarket positions."
 *
 * HONEST GAP, BY DESIGN: Sauron's own triggers (and beta-scout's ranking) run on live
 * sentiment/momentum, which only accumulate INSIDE the running `bots` process — a standalone
 * pre-market script has none yet. `liveSignal` is the seam: `{ available: false }` today,
 * swapped for real per-symbol data once the retrospective/insight loop
 * (docs/plans/trade-insights-loop.md) is persisting observations this can read instead of
 * silently guessing. Everything else here (calendar, playbook `desiredState`, readiness) is
 * pure/offline and correct today — the brief degrades honestly, not silently.
 */

import { assessReadiness } from "../autonomous/readiness.js";
import type { Bot } from "../bots/bot.js";
import {
  daysUntil,
  type EarningsPrint,
  nextPrint,
  UPCOMING_PRINTS,
} from "../domain/earnings-calendar.js";
import type { Portfolio } from "../domain/types.js";
import { genericSafetyScenarios } from "../evals/scenarios/generic-safety.js";
import { scenarioPacks } from "../evals/scenarios/index.js";
import type { Persona } from "../personas/persona.js";
import { enabledPlaybooks } from "../playbooks/registry.js";
import type { BrokerPort } from "../ports/broker.js";
import { PERSONA_LORE } from "./persona-lore.js";

interface PersonaBriefEntry {
  readonly personaId: string;
  readonly name: string;
  readonly thesis: string;
  readonly ready: boolean;
  readonly readinessReason: string;
}

interface PlaybookBriefEntry {
  readonly id: string;
  readonly symbol: string;
  readonly thesis: string;
  readonly evidence: string;
  readonly mode: string;
  readonly desiredState: "long" | "flat" | "no-window";
}

interface CalendarBriefEntry {
  readonly symbol: string;
  readonly date: string;
  readonly status: "confirmed" | "estimate";
  readonly daysUntil: number;
}

interface PositionBriefEntry {
  readonly botId: string;
  readonly botName: string;
  readonly cash?: number;
  readonly positions?: Portfolio["positions"];
  /** Set when the account couldn't be read — never thrown, the brief degrades to this instead. */
  readonly error?: string;
}

/** The seam a future insight-loop slice fills in — see the module header. */
type LiveSignalStatus =
  | { readonly available: false; readonly note: string }
  | {
      readonly available: true;
      readonly bySymbol: Readonly<Record<string, { sentiment: number; momentum: number }>>;
    };

export interface MorningBrief {
  readonly asOf: string;
  readonly personas: readonly PersonaBriefEntry[];
  readonly playbooks: readonly PlaybookBriefEntry[];
  /** SKYNET_PLAYBOOKS tokens that didn't parse — a misconfigured roster should show up here,
   *  not fail silently (same discipline `enabledPlaybooks` already logs at boot). */
  readonly rejectedPlaybookTokens: readonly string[];
  readonly calendar: readonly CalendarBriefEntry[];
  readonly positions: readonly PositionBriefEntry[];
  readonly liveSignal: LiveSignalStatus;
}

export interface MorningBriefDeps {
  /** Which personas to report readiness/thesis for. */
  readonly personas: readonly Persona[];
  /** Bots to read live positions for — omit to skip the positions section entirely (no
   *  credentials needed; calendar/playbook/readiness sections work standalone). */
  readonly bots?: readonly Bot[];
  /** Builds a broker for a bot. Injected so tests use fakes, no network. */
  readonly brokerFactory?: (bot: Bot) => BrokerPort;
  /** SKYNET_PLAYBOOKS + friends. */
  readonly playbookEnv: Readonly<Record<string, string | undefined>>;
  readonly calendar?: readonly EarningsPrint[];
  /** How many days ahead to list upcoming prints. Default 14. */
  readonly calendarWindowDays?: number;
}

const DEFAULT_CALENDAR_WINDOW_DAYS = 14;

function personaEntry(persona: Persona): PersonaBriefEntry {
  const lore = PERSONA_LORE[persona.id];
  const readiness = assessReadiness(persona, {
    pack: scenarioPacks[persona.id],
    safetyScenarios: genericSafetyScenarios,
  });
  return {
    personaId: persona.id,
    name: lore?.name ?? persona.name,
    thesis: lore?.thesis ?? persona.thesis,
    ready: readiness.ready,
    readinessReason: readiness.reason,
  };
}

function calendarEntries(
  symbols: readonly string[],
  asOfIso: string,
  calendar: readonly EarningsPrint[],
  windowDays: number,
): CalendarBriefEntry[] {
  const entries: CalendarBriefEntry[] = [];
  for (const symbol of symbols) {
    const print = nextPrint(symbol, asOfIso, calendar);
    if (print && daysUntil(asOfIso, print.date) <= windowDays) {
      entries.push({
        symbol,
        date: print.date,
        status: print.status,
        daysUntil: daysUntil(asOfIso, print.date),
      });
    }
  }
  return entries.sort((a, b) => a.daysUntil - b.daysUntil);
}

async function positionEntry(
  bot: Bot,
  brokerFactory: (bot: Bot) => BrokerPort,
): Promise<PositionBriefEntry> {
  const lore = PERSONA_LORE[bot.persona.id];
  const botName = lore?.name ?? bot.persona.name;
  try {
    const portfolio = await brokerFactory(bot).getPortfolio();
    return { botId: bot.persona.id, botName, cash: portfolio.cash, positions: portfolio.positions };
  } catch (error) {
    return {
      botId: bot.persona.id,
      botName,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Assemble the brief. Positions are read in parallel and degrade to an error row per-bot
 * (never throw) — one broken account must not blank the rest of the morning's plan.
 */
export async function buildMorningBrief(
  asOfIso: string,
  deps: MorningBriefDeps,
): Promise<MorningBrief> {
  const calendar = deps.calendar ?? UPCOMING_PRINTS;
  const windowDays = deps.calendarWindowDays ?? DEFAULT_CALENDAR_WINDOW_DAYS;
  const roster = enabledPlaybooks(deps.playbookEnv);

  const playbooks: PlaybookBriefEntry[] = roster.enabled.map(({ playbook, mode }) => ({
    id: playbook.id,
    symbol: playbook.symbol,
    thesis: playbook.thesis,
    evidence: playbook.evidence,
    mode,
    desiredState: playbook.desiredState(asOfIso, calendar),
  }));

  const calendarSymbols = [
    ...new Set([...roster.enabled.map((e) => e.playbook.symbol), ...calendar.map((p) => p.symbol)]),
  ];

  // Positions need a brokerFactory to actually read anything — bots without one degrade to an
  // explicit error row rather than a silent omission (the honesty rule this whole brief follows).
  const positions = await Promise.all(
    (deps.bots ?? []).map((bot) =>
      deps.brokerFactory
        ? positionEntry(bot, deps.brokerFactory)
        : Promise.resolve({
            botId: bot.persona.id,
            botName: PERSONA_LORE[bot.persona.id]?.name ?? bot.persona.name,
            error: "no brokerFactory supplied — positions were not read",
          }),
    ),
  );

  return {
    asOf: asOfIso,
    personas: deps.personas.map(personaEntry),
    playbooks,
    rejectedPlaybookTokens: roster.rejected,
    calendar: calendarEntries(calendarSymbols, asOfIso, calendar, windowDays),
    positions,
    liveSignal: {
      available: false,
      note:
        "Sentiment/momentum only accumulate inside the live bots process — not available to a " +
        "standalone pre-market read yet. Will read from the persisted insight loop once " +
        "docs/plans/trade-insights-loop.md's observation tier lands.",
    },
  };
}
