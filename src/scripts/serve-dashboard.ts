/**
 * CLI: run the live observatory server.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run serve:dashboard              # live — reads accounts from .env, streams from Alpaca
 *   npm run serve:dashboard:offline      # offline — reads fixtures/offline, no network, no keys
 *   # open http://localhost:8787  (add ?key=<password> if SKYNET_DASHBOARD_PASSWORD is set)
 *
 * Reads every participant's account for the initial paint, then pushes updates to browsers
 * over SSE as events arrive: live price ticks and fills (or replayed fixtures offline). The
 * live-vs-offline choice lives entirely behind `resolveDataSource`.
 */
import { buildDashboardData } from "../observatory/dashboard-data.js";
import { resolveDataSource } from "../runtime/data-source.js";
import { createDashboardServer } from "../server/dashboard-server.js";
import { ObservatoryHub } from "../server/observatory-hub.js";
import { resolvePort } from "../server/resolve-port.js";

const PORT = resolvePort(process.env);

async function main(): Promise<void> {
  const dataSource = resolveDataSource(process.env);
  const participants = dataSource.loadParticipants();
  if (participants.length === 0) {
    console.error(
      dataSource.mode === "offline"
        ? "No participants in fixtures/offline/participants.json."
        : "No participants found. Populate .env first.",
    );
    process.exit(1);
  }

  const initial = await buildDashboardData(participants, {
    clientFactory: dataSource.clientFactory,
  });
  const hub = new ObservatoryHub(initial);

  const heldSymbols = [
    ...new Set(initial.participants.flatMap((p) => p.positions.map((pos) => pos.symbol))),
  ];
  dataSource.startStreams({
    participants,
    heldSymbols,
    sink: (event) => hub.apply(event),
    onStatus: (channel, status) => console.log(`[${channel}] ${status}`),
  });

  const password = process.env.SKYNET_DASHBOARD_PASSWORD;
  if (!password) {
    console.warn(
      "⚠️  No SKYNET_DASHBOARD_PASSWORD set — the dashboard is OPEN to anyone who can reach it. Fine for localhost; set a password before exposing it publicly.",
    );
  }
  createDashboardServer({ hub, password }).listen(PORT, () => {
    const suffix = password ? " (append ?key=<password>)" : "";
    console.log(`Observatory live on port ${PORT} [${dataSource.mode}]${suffix}`);
    console.log(`Participants: ${participants.map((p) => p.displayName).join(", ")}`);
  });
}

main().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});
