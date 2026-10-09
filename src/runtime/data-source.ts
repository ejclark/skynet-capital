import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type AccountFixture,
  FixtureTradingTransport,
} from "../adapters/fixture-trading-transport.js";
import { parseEventsJsonl, ReplayEventStream } from "../adapters/replay-event-stream.js";
import { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { AlpacaMarketDataStream } from "../alpaca/market-data-stream.js";
import { AlpacaTradeUpdatesStream } from "../alpaca/trade-updates-stream.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import type { ObservatoryEvent } from "../observatory/events.js";
import { loadParticipants } from "../participants/load-participants.js";
import type { Participant } from "../participants/participant.js";
import { createDefaultPersonas } from "../personas/registry.js";
import { isOccSymbol } from "../trading/option-symbols.js";

type Env = Readonly<Record<string, string | undefined>>;

type EventSink = (event: ObservatoryEvent) => void;

type ActivitySink = (record: TradeActivityRecord) => void;

interface StartStreamsInput {
  readonly participants: readonly Participant[];
  /** Symbols currently held — what the live market-data stream subscribes to. */
  readonly heldSymbols: readonly string[];
  readonly sink: EventSink;
  /** Durable trade-activity capture, fed by each account's trade_updates stream (live mode only). */
  readonly onActivity?: ActivitySink;
  readonly onStatus?: (channel: string, status: string) => void;
}

/**
 * The one seam that decides whether the dashboard/autonomous loop talks to Alpaca or to
 * committed fixtures. `SKYNET_DATA_SOURCE=offline` swaps the live transport and sockets
 * for a `FixtureTradingTransport` + `ReplayEventStream` — same interfaces, no network,
 * no credentials. `live` (the default) is the real thing. Both CLI scripts wire through
 * here so the choice lives in exactly one place.
 */
export interface DataSource {
  readonly mode: "live" | "offline";
  /** Builds a trading client per participant (live: real; offline: fixture-backed). */
  readonly clientFactory: TradingClientFactory;
  /**
   * Builds the options client per participant (contracts/chains/option orders). Offline serves
   * the same fixtures, where the options endpoints simply 404 — callers degrade honestly.
   */
  readonly optionsClientFactory: (participant: Participant) => AlpacaOptionsClient;
  /** The roster (live: env; offline: fixture file). */
  loadParticipants(): Participant[];
  /** Start the realtime price/fill streams, pushing into `sink`. */
  startStreams(input: StartStreamsInput): void;
  /**
   * Start one account's fill stream — used when a participant is added at runtime. Live
   * opens that account's trade_updates socket; offline is a no-op (replay covers all).
   */
  startParticipantStream(
    participant: Participant,
    sink: EventSink,
    onStatus?: (channel: string, status: string) => void,
    onActivity?: ActivitySink,
  ): void;
  /**
   * Close one account's fill stream — used when a participant is removed at runtime, so a
   * departed member's credentials stop being used the moment they leave. Live closes the
   * tracked socket; offline is a no-op (replay owns its own lifecycle).
   */
  stopParticipantStream(participantId: string): void;
}

export function resolveDataSource(env: Env): DataSource {
  return (env.SKYNET_DATA_SOURCE ?? "live") === "offline"
    ? offlineDataSource(env)
    : liveDataSource(env);
}

// --- live ------------------------------------------------------------------

/** Market-data host (quotes, option snapshots, news) — same credentials, different base. */
export const ALPACA_DATA_BASE_URL = "https://data.alpaca.markets";

function liveDataSource(env: Env): DataSource {
  const transportFor = (participant: Participant, baseUrl: string) =>
    new FetchAlpacaTradingTransport({
      baseUrl,
      apiKey: participant.credentials.apiKey,
      apiSecret: participant.credentials.apiSecret,
      ...(participant.credentials.accessToken
        ? { accessToken: participant.credentials.accessToken }
        : {}),
    });

  const clientFactory: TradingClientFactory = (participant) =>
    new AlpacaTradingClient(
      transportFor(participant, participant.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL),
    );

  const optionsClientFactory = (participant: Participant): AlpacaOptionsClient =>
    new AlpacaOptionsClient(
      transportFor(participant, participant.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL),
      transportFor(participant, env.ALPACA_DATA_BASE_URL ?? ALPACA_DATA_BASE_URL),
    );

  // One tracked socket per participant, so a rotation replaces its stream (instead of leaking
  // the old socket alongside the new one) and a removal can actually close it.
  const fillStreams = new Map<string, AlpacaTradeUpdatesStream>();

  const stopParticipantStream: DataSource["stopParticipantStream"] = (participantId) => {
    fillStreams.get(participantId)?.stop();
    fillStreams.delete(participantId);
  };

  const startParticipantStream: DataSource["startParticipantStream"] = (
    participant,
    sink,
    onStatus,
    onActivity,
  ) => {
    stopParticipantStream(participant.id);
    const stream = new AlpacaTradeUpdatesStream({
      participantId: participant.id,
      apiKey: participant.credentials.apiKey,
      apiSecret: participant.credentials.apiSecret,
      baseUrl: participant.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL,
      onEvent: sink,
      ...(onActivity ? { onActivity } : {}),
      onStatus: (status) => onStatus?.("trade-updates", status),
    });
    fillStreams.set(participant.id, stream);
    stream.start();
  };

  return {
    mode: "live",
    clientFactory,
    optionsClientFactory,
    loadParticipants: () => loadParticipants(createDefaultPersonas(), env),
    startParticipantStream,
    stopParticipantStream,
    startStreams: ({ participants, heldSymbols, sink, onActivity, onStatus }) => {
      const plan = heldPriceStreamPlan(participants, heldSymbols);
      if (plan.credentials && plan.symbols.length > 0) {
        new AlpacaMarketDataStream({
          apiKey: plan.credentials.apiKey,
          apiSecret: plan.credentials.apiSecret,
          symbols: plan.symbols,
          onEvent: sink,
          onStatus: (status) => onStatus?.("market-data", status),
        }).start();
        onStatus?.("market-data", `streaming ${plan.symbols.join(", ")}`);
      } else {
        onStatus?.("market-data", plan.idleReason);
      }

      for (const participant of participants) {
        startParticipantStream(participant, sink, onStatus, onActivity);
      }
      onStatus?.("trade-updates", `subscribed ${participants.length} account(s)`);
    },
  };
}

/**
 * Which credential and symbols the dashboard's held-symbol price stream may use (#4864).
 *
 * Never a bot's credential: Alpaca allows ONE market-data socket per account, and the bots app
 * (`autonomous-data-connections.ts`) holds the bot account's for its eval loop. The roster lists
 * bots first, so the old `participants[0]` was Sauron's key — the dashboard's socket evicted the
 * bots' (`406 connection limit exceeded`) and, with no price ticks, the bots never evaluated.
 *
 * Never an OCC option symbol either: the stock feed rejects the whole subscribe frame
 * (`400 invalid syntax`) when one is in it, so a single held option silenced every stock tick.
 */
export function heldPriceStreamPlan(
  participants: readonly Participant[],
  heldSymbols: readonly string[],
): { credentials?: Participant["credentials"]; symbols: string[]; idleReason: string } {
  const symbols = heldSymbols.filter((symbol) => !isOccSymbol(symbol));
  const credentials = participants.find((p) => p.kind !== "bot")?.credentials;
  if (symbols.length === 0) {
    return { symbols, idleReason: "no open stock positions yet — price stream idle" };
  }
  if (!credentials) {
    return {
      symbols,
      idleReason:
        "no member credential to stream on (bot accounts' feeds belong to the bots app) — price stream idle",
    };
  }
  return { credentials, symbols, idleReason: "" };
}

// --- offline ---------------------------------------------------------------

/** A participant plus the canned account it reads — one entry in the fixture file. */
export interface OfflineParticipantFixture {
  readonly id: string;
  readonly displayName: string;
  readonly kind: Participant["kind"];
  readonly personaId?: string;
  readonly timezone?: string;
  readonly account: unknown;
  readonly positions?: unknown;
  readonly orders?: unknown;
}

const OFFLINE_CREDENTIALS = { apiKey: "offline", apiSecret: "offline" } as const;

/** The recorded price/fill script offline mode replays (empty if none committed). */
export function readOfflineEvents(env: Env): ObservatoryEvent[] {
  const dir = env.SKYNET_OFFLINE_FIXTURES ?? join("fixtures", "offline");
  return parseEventsJsonl(safeRead(join(dir, "events.jsonl")));
}

function offlineDataSource(env: Env): DataSource {
  const dir = env.SKYNET_OFFLINE_FIXTURES ?? join("fixtures", "offline");
  const specs = parseOfflineParticipants(readFileSync(join(dir, "participants.json"), "utf8"));
  const events = readOfflineEvents(env);
  const fixtures = new Map<string, AccountFixture>(
    specs.map((spec) => [
      spec.id,
      { account: spec.account, positions: spec.positions, orders: spec.orders },
    ]),
  );

  const clientFactory: TradingClientFactory = (participant) =>
    new AlpacaTradingClient(
      new FixtureTradingTransport(fixtures.get(participant.id) ?? { account: emptyAccount() }),
    );

  return {
    mode: "offline",
    clientFactory,
    optionsClientFactory: (participant) =>
      new AlpacaOptionsClient(
        new FixtureTradingTransport(fixtures.get(participant.id) ?? { account: emptyAccount() }),
      ),
    loadParticipants: () => specs.map(toParticipant),
    // Offline replay emits every account's fills already; nothing to open per-account.
    startParticipantStream: () => {
      /* offline source has no live stream */
    },
    stopParticipantStream: () => {
      /* offline source has no live stream */
    },
    startStreams: ({ sink, onStatus }) => {
      new ReplayEventStream({
        events,
        onEvent: sink,
        onStatus: (status) => onStatus?.("replay", status),
      }).start();
    },
  };
}

/** Parse the offline `participants.json` (throws on malformed JSON — fail loud in dev). */
export function parseOfflineParticipants(json: string): OfflineParticipantFixture[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("offline participants.json must be a JSON array");
  }
  return parsed as OfflineParticipantFixture[];
}

function toParticipant(spec: OfflineParticipantFixture): Participant {
  return {
    id: spec.id,
    displayName: spec.displayName,
    kind: spec.kind,
    credentials: OFFLINE_CREDENTIALS,
    ...(spec.personaId ? { personaId: spec.personaId } : {}),
    ...(spec.timezone ? { timezone: spec.timezone } : {}),
  };
}

function emptyAccount(): unknown {
  return { id: "offline", cash: "0", portfolio_value: "0", status: "ACTIVE" };
}

function safeRead(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}
