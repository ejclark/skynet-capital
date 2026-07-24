/**
 * CLI: run the live observatory server.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run serve:dashboard
 *   # open http://localhost:8787  (add ?key=<password> if SKYNET_DASHBOARD_PASSWORD is set)
 *
 * Reads every participant's account for the initial paint, then pushes updates to browsers
 * over SSE as events arrive: live price ticks now, and engine-emitted fills once autonomous
 * trading is on. No polling — the page updates the instant state changes.
 */
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { AlpacaMarketDataStream } from "../alpaca/market-data-stream.js";
import { AlpacaTradeUpdatesStream } from "../alpaca/trade-updates-stream.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { buildDashboardData } from "../observatory/dashboard-data.js";
import { loadParticipants } from "../participants/load-participants.js";
import type { Participant } from "../participants/participant.js";
import { createDefaultPersonas } from "../personas/registry.js";
import { createDashboardServer } from "../server/dashboard-server.js";
import { ObservatoryHub } from "../server/observatory-hub.js";

const PORT = Number(process.env.SKYNET_DASHBOARD_PORT ?? "8787");

function clientFor(participant: Participant): AlpacaTradingClient {
  return new AlpacaTradingClient(
    new FetchAlpacaTradingTransport({
      baseUrl: participant.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL,
      apiKey: participant.credentials.apiKey,
      apiSecret: participant.credentials.apiSecret,
    }),
  );
}

async function main(): Promise<void> {
  const participants = loadParticipants(createDefaultPersonas(), process.env);
  if (participants.length === 0) {
    console.error("No participants found. Populate .env first.");
    process.exit(1);
  }

  const initial = await buildDashboardData(participants, { clientFactory: clientFor });
  const hub = new ObservatoryHub(initial);

  // Live prices for whatever is currently held (nothing until the bots trade).
  const heldSymbols = [
    ...new Set(initial.participants.flatMap((p) => p.positions.map((pos) => pos.symbol))),
  ];
  const dataCreds = participants[0]?.credentials;
  if (heldSymbols.length > 0 && dataCreds) {
    new AlpacaMarketDataStream({
      apiKey: dataCreds.apiKey,
      apiSecret: dataCreds.apiSecret,
      symbols: heldSymbols,
      onEvent: (event) => hub.apply(event),
      onStatus: (status) => console.log(`[market-data] ${status}`),
    }).start();
    console.log(`[market-data] streaming ${heldSymbols.join(", ")}`);
  } else {
    console.log("[market-data] no open positions yet — price stream idle");
  }

  // Fills: every participant's trade_updates stream pushes into the hub in realtime.
  for (const participant of participants) {
    new AlpacaTradeUpdatesStream({
      participantId: participant.id,
      apiKey: participant.credentials.apiKey,
      apiSecret: participant.credentials.apiSecret,
      baseUrl: participant.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL,
      onEvent: (event) => hub.apply(event),
      onStatus: (status) => console.log(`[trade-updates] ${status}`),
    }).start();
  }
  console.log(`[trade-updates] subscribed ${participants.length} account(s)`);

  const password = process.env.SKYNET_DASHBOARD_PASSWORD;
  createDashboardServer({ hub, password }).listen(PORT, () => {
    const suffix = password ? " (append ?key=<password>)" : "";
    console.log(`Observatory live at http://localhost:${PORT}${suffix}`);
    console.log(`Participants: ${participants.map((p) => p.displayName).join(", ")}`);
  });
}

main().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});
