/**
 * CLI: run the live observatory server.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run serve:dashboard              # live — reads accounts from .env + the store, streams from Alpaca
 *   npm run serve:dashboard:offline      # offline — reads fixtures/offline, no network, no keys
 *   # open http://localhost:8787  (add ?key=<password> if SKYNET_DASHBOARD_PASSWORD is set)
 *
 * Reads every participant's account for the initial paint, then pushes updates to browsers
 * over SSE as events arrive. `/add` lets people self-register their own Alpaca paper account,
 * which appears live with no restart. The live-vs-offline choice lives behind `resolveDataSource`.
 */
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { buildDashboardData } from "../observatory/dashboard-data.js";
import { createParticipantStore } from "../participants/participant-store.js";
import type { Participant } from "../participants/participant.js";
import { resolveDataSource } from "../runtime/data-source.js";
import { createDashboardServer } from "../server/dashboard-server.js";
import { ObservatoryHub } from "../server/observatory-hub.js";
import { ParticipantService } from "../server/participant-service.js";
import { resolvePort } from "../server/resolve-port.js";

const PORT = resolvePort(process.env);

function dedupeById(participants: readonly Participant[]): Participant[] {
  const byId = new Map<string, Participant>();
  for (const participant of participants) {
    if (!byId.has(participant.id)) {
      byId.set(participant.id, participant);
    }
  }
  return [...byId.values()];
}

async function main(): Promise<void> {
  const dataSource = resolveDataSource(process.env);
  const store = createParticipantStore(process.env);
  const roster = dedupeById([...dataSource.loadParticipants(), ...store.load()]);
  if (roster.length === 0 && dataSource.mode === "offline") {
    console.error("No participants in fixtures/offline/participants.json.");
    process.exit(1);
  }

  const initial = await buildDashboardData(roster, { clientFactory: dataSource.clientFactory });
  const hub = new ObservatoryHub(initial);

  const sink = (event: Parameters<typeof hub.apply>[0]) => hub.apply(event);
  const onStatus = (channel: string, status: string) => console.log(`[${channel}] ${status}`);

  const heldSymbols = [
    ...new Set(initial.participants.flatMap((p) => p.positions.map((pos) => pos.symbol))),
  ];
  dataSource.startStreams({ participants: roster, heldSymbols, sink, onStatus });

  const service = new ParticipantService({
    hub,
    store,
    clientFactory: dataSource.clientFactory,
    startStream: (participant) => dataSource.startParticipantStream(participant, sink, onStatus),
    baseUrl: process.env.ALPACA_PAPER_BASE_URL ?? ALPACA_PAPER_BASE_URL,
  });

  const password = process.env.SKYNET_DASHBOARD_PASSWORD;
  if (!password) {
    console.warn(
      "⚠️  No SKYNET_DASHBOARD_PASSWORD set — the dashboard is OPEN to anyone who can reach it. Fine for localhost; set a password before exposing it publicly.",
    );
  }
  if (!process.env.SKYNET_STORE_SECRET) {
    console.warn(
      "⚠️  No SKYNET_STORE_SECRET set — self-service credentials are stored UNENCRYPTED. Set it before exposing /add publicly.",
    );
  }

  createDashboardServer({
    hub,
    password,
    addParticipant: (input) => service.addParticipant(input),
  }).listen(PORT, () => {
    const suffix = password ? " (append ?key=<password>)" : "";
    console.log(`Observatory live on port ${PORT} [${dataSource.mode}]${suffix}`);
    console.log(`Participants: ${roster.map((p) => p.displayName).join(", ")}`);
  });
}

main().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});
