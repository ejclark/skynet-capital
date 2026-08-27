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
import { reconcileBrokerActivity } from "../observatory/activity-backfill.js";
import {
  createBootActivityStore,
  type TradeActivityRecord,
} from "../observatory/activity-store.js";
import { createBrokerSync } from "../observatory/broker-sync.js";
import { CeremonyChannel } from "../observatory/ceremony-channel.js";
import { buildDashboardData } from "../observatory/dashboard-data.js";
import {
  createBootHistoryStore,
  rehydrateHistory,
  seedSampleRecorder,
} from "../observatory/history-boot.js";
import { startHistorySampler } from "../observatory/history-sampler.js";
import { TransitionBaseline } from "../observatory/transition-baseline.js";
import { mergeRoster } from "../participants/participant.js";
import { createParticipantStore } from "../participants/participant-store.js";
import { resolveDataSource } from "../runtime/data-source.js";
import { volumePersistenceWarnings } from "../runtime/volume-guard.js";
import { createAccountService } from "../server/account-service.js";
import { ownerEmails } from "../server/auth/resolve-auth.js";
import { toClaimAccounts } from "../server/claim-form.js";
import { createDashboardServer } from "../server/dashboard-server.js";
import { ObservatoryHub } from "../server/observatory-hub.js";
import { createOrderAuditLog } from "../server/order-audit-log.js";
import { ParticipantService } from "../server/participant-service.js";
import { createProgressionService } from "../server/progression-service.js";
import { createProgressionStore } from "../server/progression-store.js";
import { resolvePort } from "../server/resolve-port.js";
import { resolveDeskTrading } from "../server/trade-service.js";
import { setupAccess } from "./dashboard-access.js";
import { setupFeedback } from "./dashboard-feedback.js";
import { startInsightsBridge } from "./dashboard-insights-bridge.js";

const PORT = resolvePort(process.env);

async function main(): Promise<void> {
  // Boot-time backstop for drift the CI gate can't see (docs/LESSONS.md, "guest list … volume").
  for (const warning of volumePersistenceWarnings(process.env)) console.warn(warning);
  const dataSource = resolveDataSource(process.env);
  const store = createParticipantStore(process.env);
  const envRoster = dataSource.loadParticipants();
  const roster = mergeRoster(envRoster, store.load());
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
  const { initial, baseline } = await rehydrateHistory(
    history,
    await buildDashboardData(roster, { clientFactory: dataSource.clientFactory }),
  );
  // Collision check — see docs/LESSONS.md (2026-08-11). Two participants that resolve to the
  // SAME Alpaca account look completely healthy individually (both authenticate); nothing else
  // would ever notice. This must be checked at boot, every boot, because it's exactly the shape
  // of mistake a credential rotation can silently introduce.
  for (const collision of initial.collisions) {
    console.error(
      `[collision] ${collision.ids.join(" and ")} are BOTH pointed at Alpaca account ${collision.accountId} — positions/P&L will merge and be unattributable. Fix the credentials before trusting either account's numbers.`,
    );
  }

  const hub = new ObservatoryHub(initial);
  const ceremonies = new CeremonyChannel();

  const sink = (event: Parameters<typeof hub.apply>[0]) => hub.apply(event);
  const onStatus = (channel: string, status: string) => console.log(`[${channel}] ${status}`);

  // Durable trade-activity ledger (SKYNET_ACTIVITY_DIR → /data/activity in prod): every order
  // update from every account's trade_updates stream is journaled, so trade history survives the
  // broker's recent-order window. Boot banks that window first — the restart-gap net.
  const activity = createBootActivityStore(process.env, dataSource.mode);
  const onActivity = (record: TradeActivityRecord) => {
    void activity.record(record).catch((e) => console.error("[activity] write failed:", e));
  };
  void reconcileBrokerActivity(activity, initial.participants)
    .then((n) => {
      if (n > 0) console.log(`[activity] banked ${n} order update(s) from the broker window`);
    })
    .catch((e) => console.error("[activity] boot reconcile failed:", e));

  startHistorySampler({
    getState: () => hub.getState(),
    store: history,
    // Ceremony seam: transitions ride a dedicated channel that bypasses the state fold —
    // celebrating one must not repaint the whole board (visual treatment is a later, taste-gated
    // slice). Baselined on the boot samples so none of them span the restart gap.
    baseline: new TransitionBaseline(baseline),
    onTransitions: (transitions) => {
      for (const transition of transitions) ceremonies.emit(transition);
    },
  });

  // Autonomous decision audit trail (Phase 2.1) — the same JSONL the runner writes when
  // SKYNET_AUDIT_DIR is set. When present, bot profiles show the live "what it decided and why."
  const auditDir = process.env.SKYNET_AUDIT_DIR;

  const heldSymbols = [
    ...new Set(initial.participants.flatMap((p) => p.positions.map((pos) => pos.symbol))),
  ];
  dataSource.startStreams({ participants: roster, heldSymbols, sink, onActivity, onStatus });

  const owners = ownerEmails(process.env);
  const service = new ParticipantService({
    hub,
    store,
    clientFactory: dataSource.clientFactory,
    startStream: (participant) =>
      dataSource.startParticipantStream(participant, sink, onStatus, onActivity),
    // Founding record: capture the seed baseline the moment an account joins (fire-and-forget, and
    // idempotent — a re-onboarding member keeps the history they already have).
    recordSeedSample: seedSampleRecorder(history),
    baseUrl: process.env.ALPACA_PAPER_BASE_URL ?? ALPACA_PAPER_BASE_URL,
    // /add refuses these ids; /rotate falls back to them so a host-configured account's
    // regenerated key has a self-service home (owner-gated in the service under OAuth).
    findRosterParticipant: (id) => envRoster.find((p) => p.id === id),
    isOwnerEmail: (email) => owners.has(email.toLowerCase()),
  });

  // Day-2 account management (/account): profile edits + removal for self-service accounts.
  // Host-configured roster accounts are off-limits here — including a rotation's store row under
  // a roster id — so the same tier /rotate enforces is enforced on edit/remove too.
  const accounts = createAccountService({
    hub,
    store,
    clientFactory: dataSource.clientFactory,
    stopStream: (id) => dataSource.stopParticipantStream(id),
    findRosterParticipant: (id) => envRoster.find((p) => p.id === id),
    isOwnerEmail: (email) => owners.has(email.toLowerCase()),
  });

  // Desk trading is on whenever OAuth is configured — no separate kill switch (#466).
  // Resolved through the LIVE merge (not the boot-time `roster`) so a credential rotated at
  // runtime takes effect on the next order, not the next restart.
  const liveRoster = () => mergeRoster(envRoster, store.load());
  const findParticipant = (id: string) => liveRoster().find((p) => p.id === id);

  // Guest list, Mission Control store, authenticator, and owner-link lookup (dashboard-access.ts).
  const {
    allowlist,
    botControls,
    knownPersonaIds,
    auth,
    password,
    ownerLinks,
    resolveOwnerIds,
    resolveOwnerId,
  } = setupAccess(process.env, liveRoster);
  // The broker's last word (#591): the fill stream is the fast path, this is the authoritative slow
  // one that repairs whatever it missed — a socket gap, a restart, an order placed outside this app.
  // Reads the LIVE roster, so a runtime-added or rotated account is covered too.
  const brokerSync = createBrokerSync({
    getState: () => hub.getState(),
    apply: sink,
    findParticipant,
    clientFactory: dataSource.clientFactory,
  });
  brokerSync.start();

  const orderAudit = createOrderAuditLog(process.env);
  const desk = resolveDeskTrading({
    findParticipant,
    clientFactory: dataSource.clientFactory,
    optionsClientFactory: dataSource.optionsClientFactory,
    authConfigured: Boolean(auth),
    recordAudit: (entry) => orderAudit.record(entry),
  });

  const { feedback, feedbackCoach, feedbackLog, feedbackStatus, feedbackFollowup } = setupFeedback(
    process.env,
  );

  createDashboardServer({
    hub,
    // Ceremonies ride the board's seq-numbered patch stream as fire-once cues (#573).
    ceremonies,
    password,
    ...(auth ? { auth } : {}),
    addParticipant: (input) => service.addParticipant(input),
    rotateCredentials: (input) => service.rotateCredentials(input),
    accountAdmin: {
      updateProfile: accounts.updateProfile,
      removeAccount: accounts.removeAccount,
      profileFor: (id) => {
        const stored = store.load().find((p) => p.id === id);
        return stored
          ? {
              displayName: stored.displayName,
              ...(stored.timezone ? { timezone: stored.timezone } : {}),
            }
          : undefined;
      },
    },
    ...(auth
      ? {
          invite: { store: allowlist, isOwner: (email: string) => owners.has(email) },
          // The account-link table (#546). Reads the live board so a just-added account is
          // linkable immediately, and refuses any address that can't sign in — a link to
          // somebody outside the gate is a link nobody could ever use.
          claim: {
            store: ownerLinks,
            isOwner: (email: string) => owners.has(email),
            accounts: () => toClaimAccounts(liveRoster()),
            canSignIn: (email: string) => owners.has(email) || allowlist.emails().has(email),
          },
          resolveOwnerId,
          resolveOwnerIds,
          isOwnerEmail: (email: string) => owners.has(email.toLowerCase()),
          rosterIds: () => new Set(envRoster.map((p) => p.id)),
        }
      : {}),
    // Mission Control (Eric, 2026-08-21): the owner's switchboard for the autonomous fleet.
    // OAuth-only — owner identity comes from the signed session, so password mode has no one
    // to grant it to.
    ...(auth
      ? {
          controls: {
            store: botControls,
            isOwner: (email: string) => owners.has(email),
            // Roster restricted to KNOWN personas: a self-service /add can mint a kind:"bot"
            // row with any id, and a planted row must never appear on the switchboard as a
            // confusable twin of a real runner persona (security review, 2026-08-21).
            bots: () =>
              hub
                .getState()
                .participants.filter((p) => p.kind === "bot" && knownPersonaIds.has(p.id))
                .map((p) => ({ id: p.id, displayName: p.displayName })),
          },
        }
      : {}),
    ...(feedback ? { submitFeedback: feedback } : {}),
    ...(feedbackCoach ? { coachFeedback: feedbackCoach } : {}),
    recordFeedback: (entry) => feedbackLog.record(entry),
    readFeedback: (id) => feedbackLog.list(id),
    ...(feedbackStatus ? { fetchFeedbackStatus: feedbackStatus } : {}),
    ...(feedbackFollowup ? { submitFollowup: feedbackFollowup } : {}),
    refreshParticipant: (id) => brokerSync.syncParticipant(id),
    readHistory: (id) => history.list(id),
    readTradeActivity: (id) => activity.list(id),
    // `/wire`'s cross-participant feed: the same stores, called with no id.
    readAllTradeActivity: () => activity.list(),
    readAllFeedback: () => feedbackLog.list(),
    progression: createProgressionService({
      readFills: (id) => activity.list(id),
      readTags: (id) => orderAudit.list(id),
      store: createProgressionStore(process.env, (m) => console.error(m)),
    }),
    ...(auditDir ? { readDecisions: (id: string) => new JsonlAuditStore(auditDir).list(id) } : {}),
    tradingEnabled: desk.enabled,
    submitTrade: desk.submit,
    submitOptionTrade: desk.submitOption,
    optionsClientFor: (id) => {
      const participant = findParticipant(id);
      return participant ? dataSource.optionsClientFactory(participant) : undefined;
    },
    tradingClientFor: (id) => {
      const participant = findParticipant(id);
      return participant ? dataSource.clientFactory(participant) : undefined;
    },
  }).listen(PORT, () => {
    const gate = auth ? `OAuth (${auth.providerIds.join("+")})` : password ? "password" : "OPEN";
    console.log(
      `Observatory live on port ${PORT} [${dataSource.mode}] — auth: ${gate} — feedback: ${feedback ? "on" : "off"}`,
    );
    console.log(`Participants: ${roster.map((p) => p.displayName).join(", ")}`);
  });

  // Interim insight bridge (dashboard-insights-bridge.ts) — internal-only, private-net port for
  // the `bots` process to persist retrospectives and poll Mission Control through this process.
  startInsightsBridge(process.env, botControls);
}

main().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});
