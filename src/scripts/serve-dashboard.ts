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
import { JsonlAuditStore } from "../autonomous/jsonl-audit-store.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { buildDashboardData } from "../observatory/dashboard-data.js";
import {
  createBootHistoryStore,
  rehydrateHistory,
  seedSampleRecorder,
} from "../observatory/history-boot.js";
import { startHistorySampler } from "../observatory/history-sampler.js";
import type { Participant } from "../participants/participant.js";
import { createParticipantStore } from "../participants/participant-store.js";
import { resolveDataSource } from "../runtime/data-source.js";
import { resolveAuth } from "../server/auth/resolve-auth.js";
import { createDashboardServer } from "../server/dashboard-server.js";
import { resolveFeedback } from "../server/feedback-service.js";
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

  // Equity/realized history: coarse periodic samples to the mounted volume (SKYNET_HISTORY_DIR →
  // /data/history in prod, data/history in dev). See docs/LIVING-UNIVERSE.md.
  // Boot ORDER is load-bearing (docs/plans/history-layer.md slice 1): seed realized P/L from durable
  // history and write the baseline BEFORE the hub exists, so no live fill lands on an unseeded 0 and
  // no `realizedPl: 0` sample is recorded for the next boot to rehydrate.
  const history = createBootHistoryStore(process.env, dataSource.mode);
  const initial = await rehydrateHistory(
    history,
    await buildDashboardData(roster, { clientFactory: dataSource.clientFactory }),
  );
  const hub = new ObservatoryHub(initial);

  const sink = (event: Parameters<typeof hub.apply>[0]) => hub.apply(event);
  const onStatus = (channel: string, status: string) => console.log(`[${channel}] ${status}`);

  startHistorySampler({
    getState: () => hub.getState(),
    store: history,
    // Ceremony seam: derived took-profit / deployed-capital transitions ride the same event
    // stream as fills, so any renderer can celebrate them (visual treatment is a later, taste-
    // gated slice — today they simply flow; the reducer passes them through untouched).
    onTransitions: (transitions) => {
      for (const transition of transitions) {
        hub.apply({ type: "world_transition", transition, at: transition.at });
      }
    },
  });

  // Autonomous decision audit trail (Phase 2.1) — the same JSONL the runner writes when
  // SKYNET_AUDIT_DIR is set. When present, bot profiles show the live "what it decided and why."
  const auditDir = process.env.SKYNET_AUDIT_DIR;

  const heldSymbols = [
    ...new Set(initial.participants.flatMap((p) => p.positions.map((pos) => pos.symbol))),
  ];
  dataSource.startStreams({ participants: roster, heldSymbols, sink, onStatus });

  const service = new ParticipantService({
    hub,
    store,
    clientFactory: dataSource.clientFactory,
    startStream: (participant) => dataSource.startParticipantStream(participant, sink, onStatus),
    // Founding record: capture the seed baseline the moment an account joins (fire-and-forget, and
    // idempotent — a re-onboarding member keeps the history they already have).
    recordSeedSample: seedSampleRecorder(history),
    baseUrl: process.env.ALPACA_PAPER_BASE_URL ?? ALPACA_PAPER_BASE_URL,
  });

  const auth = resolveAuth(process.env);
  const password = process.env.SKYNET_DASHBOARD_PASSWORD;
  if (auth) {
    if (auth.allowlistEmpty) {
      console.warn(
        "⚠️  OAuth login is on but the allowlist is empty — nobody can sign in. Set SKYNET_ALLOWED_EMAILS.",
      );
    }
  } else if (!password) {
    console.warn(
      "⚠️  No auth configured and no SKYNET_DASHBOARD_PASSWORD set — the dashboard is OPEN to anyone who can reach it. Fine for localhost; configure OAuth or a password before exposing it publicly.",
    );
  }
  if (!process.env.SKYNET_STORE_SECRET) {
    console.warn(
      "⚠️  No SKYNET_STORE_SECRET set — self-service credentials are stored UNENCRYPTED. Set it before exposing /add publicly.",
    );
  }

  const feedback = resolveFeedback(process.env);
  if (!feedback) {
    console.warn(
      "ℹ️  In-app feedback is off (no SKYNET_FEEDBACK_GITHUB_TOKEN) — the /feedback form renders but submissions won't file issues.",
    );
  }

  createDashboardServer({
    hub,
    password,
    ...(auth ? { auth } : {}),
    addParticipant: (input) => service.addParticipant(input),
    ...(feedback ? { submitFeedback: feedback } : {}),
    readHistory: (id) => history.list(id),
    ...(auditDir ? { readDecisions: (id: string) => new JsonlAuditStore(auditDir).list(id) } : {}),
  }).listen(PORT, () => {
    const gate = auth ? `OAuth (${auth.providerIds.join("+")})` : password ? "password" : "OPEN";
    console.log(
      `Observatory live on port ${PORT} [${dataSource.mode}] — auth: ${gate} — feedback: ${feedback ? "on" : "off"}`,
    );
    console.log(`Participants: ${roster.map((p) => p.displayName).join(", ")}`);
  });
}

main().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});
