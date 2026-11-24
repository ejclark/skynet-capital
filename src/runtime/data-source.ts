import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type AccountFixture,
  FixtureTradingTransport,
} from "../adapters/fixture-trading-transport.js";
import { parseEventsJsonl, ReplayEventStream } from "../adapters/replay-event-stream.js";
import { SyntheticMarket } from "../adapters/synthetic-market-transport.js";
import { WritableFixtureTradingTransport } from "../adapters/writable-fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { AlpacaTradeUpdatesStream } from "../alpaca/trade-updates-stream.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { isSession } from "../domain/market-calendar.js";
import { regularSessionOpen, sessionBounds } from "../domain/market-session.js";
import { AlpacaNewsClient } from "../news/alpaca-news-client.js";
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
  /**
   * Builds the news client per participant, on that participant's own market-data credential
   * (#8203: held news is never read on the bots' shared key). Offline has no news endpoint, so the
   * read fails and the route says so in words.
   */
  readonly newsClientFactory: (participant: Participant) => AlpacaNewsClient;
  /** The roster (live: env; offline: fixture file). */
  loadParticipants(): Participant[];
  /** Start the realtime streams, pushing into `sink` — live: fills only, no price socket (#4864). */
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

  const newsClientFactory = (participant: Participant): AlpacaNewsClient =>
    new AlpacaNewsClient(
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
      ...(participant.credentials.accessToken
        ? { accessToken: participant.credentials.accessToken }
        : {}),
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
    newsClientFactory,
    loadParticipants: () => loadParticipants(createDefaultPersonas(), env),
    startParticipantStream,
    stopParticipantStream,
    startStreams: ({ participants, sink, onActivity, onStatus }) => {
      // No held-symbol price socket here, by design (#4864). Alpaca allows ONE market-data
      // connection per USER LOGIN per endpoint — not per paper account — and the bots app holds
      // that login's for its eval loop (no tick → no evaluation → no trades). Any socket this app
      // opens on a key under the same login is refused or starves the bots, and a key can't say
      // which login owns it. Held prices still move on the broker re-sync (60s).
      onStatus?.(
        "market-data",
        "off — the bots app owns the login's one price connection; prices refresh on broker re-sync",
      );

      for (const participant of participants) {
        startParticipantStream(participant, sink, onStatus, onActivity);
      }
      onStatus?.("trade-updates", `subscribed ${participants.length} account(s)`);
    },
  };
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

  const transportFor = offlineTransports(env, fixtures, events);

  const clientFactory: TradingClientFactory = (participant) =>
    new AlpacaTradingClient(transportFor(participant.id));

  return {
    mode: "offline",
    clientFactory,
    // The writable world's simulated market is also the data host (quotes, chains, snapshots).
    optionsClientFactory: (participant) =>
      new AlpacaOptionsClient(transportFor(participant.id), transportFor.market),
    newsClientFactory: (participant) =>
      new AlpacaNewsClient(transportFor.market ?? transportFor(participant.id)),
    loadParticipants: () => specs.map(toParticipant),
    // Offline replay emits every account's fills already; nothing to open per-account.
    startParticipantStream: () => {
      /* offline source has no live stream */
    },
    stopParticipantStream: () => {
      /* offline source has no live stream */
    },
    startStreams: ({ sink, onStatus }) => {
      transportFor.attach?.(sink);
      new ReplayEventStream({
        events,
        onEvent: sink,
        onStatus: (status) => onStatus?.("replay", status),
      }).start();
    },
  };
}

/**
 * Each account's offline transport. By default a fresh read-only `FixtureTradingTransport` per
 * client (writes are benign no-ops — the frozen book the crawl and the journeys replay). With
 * `SKYNET_OFFLINE_WRITES=apply`, ONE `WritableFixtureTradingTransport` per account, shared by its
 * trading and options clients, so an order a member submits is the order the desk reads back —
 * what a change scenario needs to check (`docs/members/change-scenarios.md`). Market orders fill
 * at the replay script's last price per symbol: fixed per boot, so a run is repeatable.
 */
function offlineTransports(
  env: Env,
  fixtures: ReadonlyMap<string, AccountFixture>,
  events: readonly ObservatoryEvent[],
): ((participantId: string) => FixtureTradingTransport | WritableFixtureTradingTransport) & {
  readonly market?: SyntheticMarket;
  /** Where the writable world's fills go — the hub's sink, handed over in `startStreams`. */
  readonly attach?: (sink: EventSink) => void;
} {
  const fixtureFor = (id: string): AccountFixture =>
    fixtures.get(id) ?? { account: emptyAccount() };
  if (env.SKYNET_OFFLINE_WRITES !== "apply") {
    // The read-only world's calendar and clock read the same pinned instant (#8248).
    const fixed = Date.parse(env.SKYNET_FIXED_NOW ?? "");
    const now = Number.isFinite(fixed) ? () => new Date(fixed) : () => new Date();
    return (id) => new FixtureTradingTransport(fixtureFor(id), now);
  }
  const market = offlineMarket(env, fixtures, events);
  const ledgers = new Map<string, WritableFixtureTradingTransport>();
  let sink: EventSink | undefined;
  const ledger = (id: string): WritableFixtureTradingTransport => {
    let found = ledgers.get(id);
    if (!found) {
      found = new WritableFixtureTradingTransport(fixtureFor(id), {
        market,
        idPrefix: `paper-${id}`,
        clock: () => marketClock(market.now()),
        marketNow: () => market.now(),
        onFill: (fill) => sink?.({ type: "fill", participantId: id, ...fill }),
      });
      ledgers.set(id, found);
    }
    return found;
  };
  return Object.assign(ledger, {
    market,
    attach: (next: EventSink) => {
      sink = next;
    },
  });
}

/**
 * The writable world's `/v2/clock`, from the wall clock and the exchange calendar — so the broker
 * and the header agree: after hours an order queues for the open, as a paper account's would.
 */
export function marketClock(now: Date): {
  is_open: boolean;
  next_open: string;
  next_close: string;
} {
  const today = now.toISOString().slice(0, 10);
  const days = [
    today,
    ...Array.from({ length: 10 }, (_, i) =>
      new Date(now.getTime() + (i + 1) * 86_400_000).toISOString().slice(0, 10),
    ),
  ];
  const sessions = days.filter(isSession).map(sessionBounds);
  const current = sessions.find((s) => s.openAt <= now.getTime() && now.getTime() < s.closeAt);
  const next = sessions.find((s) => s.openAt > now.getTime());
  return {
    is_open: regularSessionOpen(now),
    next_open: new Date(next?.openAt ?? now.getTime()).toISOString(),
    next_close: new Date((current ?? next)?.closeAt ?? now.getTime()).toISOString(),
  };
}

/**
 * The simulated market the writable world quotes and fills against: one mark per underlying — the
 * replay script's last price, then every fixture position's own price, then `marks.json` beside the
 * fixtures (a world's declared prices win) — on the server's clock (`SKYNET_FIXED_NOW` when set).
 */
function offlineMarket(
  env: Env,
  fixtures: ReadonlyMap<string, AccountFixture>,
  events: readonly ObservatoryEvent[],
): SyntheticMarket {
  const marks = new Map<string, number>();
  for (const event of events) {
    if (event.type === "price") marks.set(event.symbol, event.price);
  }
  for (const fixture of fixtures.values()) {
    for (const raw of Array.isArray(fixture.positions) ? fixture.positions : []) {
      const p = raw as { symbol?: string; qty?: string; market_value?: string };
      const qty = Number(p.qty);
      const value = Number(p.market_value);
      if (
        p.symbol &&
        !isOccSymbol(p.symbol) &&
        qty &&
        Number.isFinite(value) &&
        !marks.has(p.symbol)
      ) {
        marks.set(p.symbol, Math.round((Math.abs(value / qty) + Number.EPSILON) * 100) / 100);
      }
    }
  }
  const dir = env.SKYNET_OFFLINE_FIXTURES ?? join("fixtures", "offline");
  const declared = safeRead(join(dir, "marks.json"));
  if (declared.trim()) {
    for (const [symbol, price] of Object.entries(JSON.parse(declared) as Record<string, number>)) {
      if (typeof price === "number" && price > 0) marks.set(symbol, price);
    }
  }
  const fixed = Date.parse(env.SKYNET_FIXED_NOW ?? "");
  const now = Number.isFinite(fixed) ? () => new Date(fixed) : () => new Date();
  return new SyntheticMarket({ marks, now });
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
