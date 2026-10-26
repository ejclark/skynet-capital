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

import { createAlertDismissals } from "../adapters/jsonl-alert-dismissals.js";
import { createWatchlist } from "../adapters/jsonl-watchlist-store.js";
import { JsonlAuditStore } from "../autonomous/jsonl-audit-store.js";
import { signalWindows } from "../autonomous/signal-windows.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { reconcileBrokerActivity } from "../observatory/activity-backfill.js";
import {
  bootPublishingActivityStore,
  publishingFeedback,
  publishingMergedPullRequests,
} from "../observatory/activity-publishing.js";
import { FLOWS_SHOWN_FROM } from "../observatory/capital-flow.js";
import { CapitalFlowLedger } from "../observatory/capital-flow-ledger.js";
import { createBootCapitalFlowStore } from "../observatory/capital-flow-store.js";
import { CapitalFlowWatch, restartBaseline } from "../observatory/capital-flow-watch.js";
import { CeremonyChannel } from "../observatory/ceremony-channel.js";
import { buildDashboardData } from "../observatory/dashboard-data.js";
import {
  createBootHistoryStore,
  rehydrateHistory,
  seedSampleRecorder,
} from "../observatory/history-boot.js";
import type { EquitySample } from "../observatory/history-record.js";
import { startHistorySampler } from "../observatory/history-sampler.js";
import { TransitionBaseline } from "../observatory/transition-baseline.js";
import { mergeRoster } from "../participants/participant.js";
import { createParticipantStore } from "../participants/participant-store.js";
import { createIvHistoryStore } from "../research/iv-sampler.js";
import { createSpotChecks } from "../research/spot-checks.js";
import { resolveDataSource } from "../runtime/data-source.js";
import { ownerEmails } from "../server/auth/resolve-auth.js";
import { createBookHealthHistoryStore } from "../server/book-health-history-store.js";
import { startBookHealthSampler } from "../server/book-health-sampler.js";
import { toClaimAccounts } from "../server/claim-form.js";
import { createDashboardServer } from "../server/dashboard-server.js";
import type { DashboardServerConfig } from "../server/dashboard-server-config.js";
import { resolveDevelopmentActivity } from "../server/development-activity.js";
import { bootGithubToken } from "../server/github-token.js";
import { installGracefulShutdown } from "../server/graceful-shutdown.js";
import { ObservatoryHub } from "../server/observatory-hub.js";
import { ParticipantService } from "../server/participant-service.js";
import { recordPasses } from "../server/play-milestone-sync.js";
import { resolvePort } from "../server/resolve-port.js";
import { setupAccess } from "./dashboard-access.js";
import { buildAccountAdmin } from "./dashboard-account-admin.js";
import { wireAlertDelivery } from "./dashboard-alert-delivery.js";
import { warnAccountCollisions, warnUnpinnedVolumes } from "./dashboard-boot-warnings.js";
import { setupCompanion } from "./dashboard-companion.js";
import {
  wireAccountDeskAccess,
  wireDeskTrading,
  wireQuoteStream,
} from "./dashboard-desk-wiring.js";
import { setupFeedback } from "./dashboard-feedback.js";
import { wireLadderProgress } from "./dashboard-ladder-progress.js";
import { wireOpsStatus } from "./dashboard-ops-status.js";
import { wireOptionLifecycleSweep } from "./dashboard-option-lifecycle.js";
import { bootTelemetry } from "./dashboard-telemetry.js";
import { startIvClock } from "./iv-clock-wiring.js";

const PORT = resolvePort(process.env);

async function main(): Promise<void> {
  warnUnpinnedVolumes(process.env);
  // Before anything resolves a GitHub-backed feature: a token saved from Settings beats the host secret.
  const githubToken = bootGithubToken(process.env);
  const dataSource = resolveDataSource(process.env);
  // E2E DETERMINISM (#4683): `freezePage` pins the browser's clock, but the Council computes its
  // week label from the server's own `new Date()`, so every baseline carrying it changed on
  // Mondays. playwright.config.ts passes its FIXED_CLOCK here. Offline only — a server holding
  // real accounts never reads a frozen clock, whatever its environment says.
  const fixedNowMs =
    dataSource.mode === "offline" ? Date.parse(process.env.SKYNET_FIXED_NOW ?? "") : Number.NaN;
  const councilClock = Number.isNaN(fixedNowMs) ? {} : { now: () => new Date(fixedNowMs) };
  // First, before any slow boot step: read whether the LAST run exited cleanly, then claim the
  // run marker for this one (#4618). The gauge and any incident start once we are listening.
  const telemetry = bootTelemetry(process.env, dataSource.mode);
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
  const booted = await buildDashboardData(roster, { clientFactory: dataSource.clientFactory });
  // The capital-flow watch compares across the restart gap, so it needs each participant's last
  // sample from BEFORE the boot samples below are written (#4563).
  const beforeBoot = await restartBaseline(history, booted.participants);
  const { initial, baseline } = await rehydrateHistory(history, booted);
  warnAccountCollisions(initial.collisions);

  const hub = new ObservatoryHub(initial);
  const ceremonies = new CeremonyChannel();

  const sink = (event: Parameters<typeof hub.apply>[0]) => hub.apply(event);
  const onStatus = (channel: string, status: string) => console.log(`[${channel}] ${status}`);

  // Durable trade-activity ledger (SKYNET_ACTIVITY_DIR → /data/activity in prod): every order
  // update from every account's trade_updates stream is journaled, so trade history survives the
  // broker's recent-order window. Boot banks that window first — the restart-gap net. `bus` also
  // gets every write, translated, for a future triage view / Moneypenny subscription (#1211).
  const { activity, bus: activityEventBus } = bootPublishingActivityStore(
    process.env,
    dataSource.mode,
  );
  // Ladder milestone auto-completion — never a client claim; see the wiring module.
  const {
    onActivity,
    sweep: sweepLadderProgress,
    readAll: readAllLadderProgress,
  } = wireLadderProgress(process.env, activity, activityEventBus);
  const reconciled = reconcileBrokerActivity(activity, initial.participants)
    .then((n) => {
      if (n > 0) console.log(`[activity] banked ${n} order update(s) from the broker window`);
      sweepLadderProgress(initial.participants);
    })
    .catch((e) => console.error("[activity] boot reconcile failed:", e));

  // The capital-flow detector (#4563): a paper-balance top-up is recorded as an inferred flow, and
  // the ledger can mark that member's standings row and equity curve (slice 2) — but only flows
  // from FLOWS_SHOWN_FROM on, which holds every mark back until a week of shadow lines tunes the
  // tolerance. Fire-and-forget, like every sample write. Seeded from before the restart and gated
  // on the reconcile, so the boot samples are compared against the last ones from before it once
  // the broker window's fills are in the journal. A ledger that cannot be read at boot marks
  // nothing it has not seen this run.
  const flowLedger = new CapitalFlowLedger(
    createBootCapitalFlowStore(process.env, dataSource.mode),
    { shownFrom: FLOWS_SHOWN_FROM },
  );
  await flowLedger.load().catch((e) => console.error("[flows] ledger load failed:", e));
  const flowWatch = new CapitalFlowWatch({
    activity,
    flows: flowLedger,
    baseline: beforeBoot,
    ready: reconciled,
  });
  const observeFlow = (sample: EquitySample) => {
    void flowWatch.observe(sample).then(
      (flow) =>
        flow &&
        console.log(`[flows] inferred ${flow.direction} ${flow.amount} for ${flow.participantId}`),
      (e) => console.error("[flows] watch failed:", e),
    );
  };
  for (const sample of baseline) observeFlow(sample);
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
    onSample: observeFlow,
  });

  // The IV clock: one at-the-money IV sample per tracked underlying per trading day, so IV rank
  // can exist a year from now (#3729). Host-configured credentials only — never a member's.
  const ivHistory = createIvHistoryStore(process.env);
  startIvClock(ivHistory, dataSource, envRoster);
  const spotChecks = createSpotChecks(process.env);

  // Autonomous decision audit trail (Phase 2.1) — the same JSONL the runner writes when
  // SKYNET_AUDIT_DIR is set. When present, bot profiles show the live "what it decided and why."
  const auditDir = process.env.SKYNET_AUDIT_DIR;

  dataSource.startStreams({ participants: roster, sink, onActivity, onStatus });

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

  // Account service + live-roster/findParticipant/clientFor helpers (dashboard-desk-wiring.ts).
  // Removing an account closes BOTH of its sockets — the fill stream and (if it is streaming a
  // quote right now) its market-data one, so a departed member's credential stops being used the
  // moment they leave. Declared before the hub it reads, and only ever called after boot.
  const { accounts, liveRoster, findParticipant, clientFor } = wireAccountDeskAccess({
    hub,
    store,
    envRoster,
    owners,
    clientFactory: dataSource.clientFactory,
    stopParticipantStream: (id) => {
      dataSource.stopParticipantStream(id);
      quoteStream.stopDesk(id);
    },
  });

  // Expiries and assignments fill no order, so neither the reconcile above nor the stream sees one:
  // after the reconcile, ask each account half-hourly, one page each (#4650).
  void wireOptionLifecycleSweep(dataSource.mode, reconciled, {
    participants: liveRoster,
    optionsClientFor: dataSource.optionsClientFactory,
    store: activity,
    onAppended: (id) => sweepLadderProgress([{ id }]),
  });

  // The underlying quote, pushed rather than polled (#3407 P4) — one market-data socket per member
  // on that member's own credential. Never the host's: the bot loop holds that account's single
  // allowed connection (`quote-stream-hub.ts` carries the full reason).
  const quoteStream = wireQuoteStream({
    findParticipant,
    optionsClientFactory: dataSource.optionsClientFactory,
  });

  // Guest list, Mission Control store, authenticator, and owner-link lookup (dashboard-access.ts).
  const {
    allowlist,
    botControls,
    settingsChanges,
    council,
    councilReplies,
    filingComments,
    subscriptions,
    savedPositions,
    authoredPlays,
    memberConvictions,
    playMilestones,
    knownPersonaIds,
    auth,
    password,
    ownerLinks,
    resolveOwnerIds,
    resolveOwnerId,
    ownerEmailFor,
  } = setupAccess(process.env, liveRoster);
  const credentialsBridge = { knownPersonaIds: [...knownPersonaIds], findParticipant };
  const { opsStatus, insightsBridge } = wireOpsStatus(
    process.env,
    botControls,
    { hub, activity, authConfigured: Boolean(auth), subscriptions },
    credentialsBridge,
  );
  // Broker slow-sync + per-order audit log + desk trading (dashboard-desk-wiring.ts).
  const { brokerSync, orderAudit, desk } = wireDeskTrading({
    env: process.env,
    hub,
    apply: sink,
    findParticipant,
    clientFactory: dataSource.clientFactory,
    optionsClientFactory: dataSource.optionsClientFactory,
    authConfigured: Boolean(auth),
    activityEventBus,
  });

  const {
    feedback,
    feedbackCoach,
    feedbackLog,
    feedbackStatus,
    feedbackFollowup,
    communityProgression,
  } = setupFeedback(process.env);
  // Feedback as the bus's second kind (#784 slice 2): a filing publishes `feedback.filed`, and the
  // GitHub status poll publishes `feedback.status-changed` on a real transition. Both wrap here
  // rather than in `setupFeedback` because the bus is booted above, with the trade ledger's.
  // Built ONCE at boot, not per request — the status wrapper remembers what it last published.
  const feedbackSinks = publishingFeedback(activityEventBus, { feedbackLog, feedbackStatus });
  // Development as the bus's third kind (#784 slice 4): a merged pull request publishes
  // `development.pr-merged`. A poll, not a webhook — nothing in this app receives one, and three
  // read-only GitHub polls already exist on this token. Built ONCE at boot like the status emitter
  // above, because the wrapper remembers which merges it has already published.
  const mergedPullRequests = resolveDevelopmentActivity(process.env);
  const developmentSink = mergedPullRequests
    ? publishingMergedPullRequests(mergedPullRequests, activityEventBus)
    : undefined;
  // Shares the coach's ANTHROPIC_API_KEY/cost dials; also builds the ProgressionService instance
  // and the ladder gate's message log (dashboard-companion.ts owns crossing the id seam).
  const {
    companion,
    progression: progressionService,
    companionMessageLog,
  } = setupCompanion(process.env, {
    hub,
    readFills: (id) => activity.list(id),
    readTags: (id) => orderAudit.list(id),
    feedbackLog,
    ownerEmailFor,
    botControls,
    // The same per-participant resolver the server config gets below — the recommender tool reads
    // its chain through the member's OWN linked options client, never a shared one.
    optionsClientFor: (id) => clientFor(id, dataSource.optionsClientFactory),
  });

  // Alert delivery (#3407 P4 slice 3) — the member's own switch, durable; plus the two triggers
  // that reach them when the Alerts strip is not on screen. Off (and said so in words) until the
  // mail credential is set, which is the one step that is Eric's.
  const alertDismissals = createAlertDismissals(process.env);
  // Prefer the replicated decision store (PR 4 — populated over the bots↔app `/decisions`
  // bridge, works regardless of which machine's volume this process runs on) over the JSONL
  // audit trail, which only ever had data when SKYNET_AUDIT_DIR happened to be set on THIS
  // machine — never true in prod, since that dir lives on the bots machine's own volume. Read
  // here once so the desk and the alert sweep's bot watch read the same store.
  const readDecisions: DashboardServerConfig["readDecisions"] =
    insightsBridge.readDecisions ??
    (auditDir ? (id: string) => new JsonlAuditStore(auditDir).list(id) : undefined);
  const alertDelivery = wireAlertDelivery({
    env: process.env,
    activityEvents: activityEventBus,
    ownerEmailFor,
    deps: () => ({
      hub,
      optionsClientFor: (id) => clientFor(id, dataSource.optionsClientFactory),
      activityLog: activityEventBus,
      alertDismissals,
      ...(readDecisions ? { readDecisions } : {}),
    }),
  });

  const healthHistory = createBookHealthHistoryStore(process.env, (m) => console.error(m));
  const dashboardConfig: DashboardServerConfig = {
    hub,
    healthHistory,
    logLine: (line) => console.log(line),
    // Ceremonies ride the board's seq-numbered patch stream as fire-once cues.
    ceremonies,
    capitalFlows: flowLedger,
    password,
    ...(auth ? { auth } : {}),
    addParticipant: (input) => service.addParticipant(input),
    rotateCredentials: (input) => service.rotateCredentials(input),
    accountAdmin: buildAccountAdmin(accounts, store),
    subscriptions,
    savedPositions,
    authoredPlays,
    memberConvictions,
    playMilestones,
    // The feed reads the ledger after posting any pass the bots have reported (#5457 slice 5).
    readPlayMilestones: () => {
      recordPasses(authoredPlays, playMilestones, insightsBridge.readAuthoredShadow());
      return playMilestones.list();
    },
    ...(auth
      ? {
          invite: { store: allowlist, isOwner: (email: string) => owners.has(email) },
          githubToken: githubToken.deps((email: string) => owners.has(email)),
          // The account-link table. Reads the live board so a just-added account is
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
            changes: settingsChanges,
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
    ...(opsStatus ? { opsStatus } : {}), // #666 — dashboard-ops-status.ts owns the wiring + gate
    ...(feedback ? { submitFeedback: feedback } : {}),
    ...(feedbackCoach ? { coachFeedback: feedbackCoach } : {}),
    recordFeedback: (entry) => feedbackSinks.log.record(entry),
    readFeedback: (id) => feedbackLog.list(id),
    ...(feedbackSinks.status ? { fetchFeedbackStatus: feedbackSinks.status } : {}),
    ...(feedbackFollowup ? { submitFollowup: feedbackFollowup } : {}),
    communityProgression,
    ...(companion ? { companion } : {}),
    // `/api/companion/ack`'s store — the caller there already has the session's own opaque id.
    readMessages: (id) => companionMessageLog.list(id),
    recordMessage: (id) => companionMessageLog.record(id),
    refreshParticipant: (id) => brokerSync.syncParticipant(id),
    readHistory: (id) => history.list(id),
    readTradeActivity: (id) => activity.list(id),
    readOrderAudit: (id) => orderAudit.list(id),
    recordOrderAudit: (entry) => orderAudit.record(entry),
    // `/wire`'s cross-participant feed: the same stores, called with no id. Activity's trade rows
    // are built from the bus's `ActivityEvent` envelope (#784 slice 1); the ledger rides alongside
    // it because the event log only starts at #1211's deploy and older fills live only on the
    // ledger (`mergeLedgerIntoEvents` dedupes the overlap on the deterministic event id).
    readAllActivityEvents: () => activityEventBus.list(),
    readAllTradeActivity: () => activity.list(),
    readAllFeedback: () => feedbackLog.list(),
    // Milestones, the fourth kind (#784 slice 5): logged earns from the ladder log, and the audit
    // trail the fill-derived ladder is classified from — the same two inputs the Learn page reads.
    readAllLadderProgress,
    readAllOrderAudit: () => orderAudit.list(),
    // Absent without a GitHub token: the feed then renders no development kind and says so, rather
    // than letting an empty list imply the league has never merged anything.
    ...(developmentSink ? { readMergedPullRequests: developmentSink } : {}),
    // The Sunday Council's weekly thesis line (issue #2224 shape 1) — on whenever the store is,
    // no separate switch, matching Mission Control's own always-on-when-wired posture.
    council: {
      ...councilClock,
      load: () => council.load(),
      submit: (week, memberId, text, at, playbookId) => {
        council.submit(week, memberId, {
          text,
          at: at.toISOString(),
          ...(playbookId ? { playbookId } : {}),
        });
      },
      retract: (week, memberId) => {
        council.retract(week, memberId);
      },
    },
    // Replies under each weekly Council line (#5097): the app's own store, reading the Council's
    // lines so a reply only hangs on one that is up — no GitHub, no companion in reach.
    councilReplies: {
      ...councilClock,
      load: () => councilReplies.load(),
      add: (week, lineId, reply) => {
        councilReplies.add(week, lineId, reply);
      },
      remove: (week, lineId, replyId, authorId) => {
        councilReplies.remove(week, lineId, replyId, authorId);
      },
      loadCouncil: () => council.load(),
    },
    // Comments on another member's filing (issue #2224 shape 3): the app's own store plus the
    // app's own feedback log — deliberately no GitHub client in reach.
    filingComments: {
      load: () => filingComments.load(),
      add: (issue, comment) => {
        filingComments.add(issue, comment);
      },
      remove: (issue, commentId, authorId) => {
        filingComments.remove(issue, commentId, authorId);
      },
      readFilings: () => feedbackLog.list(),
    },
    progression: progressionService,
    // The replicated decision store, else the JSONL audit trail (`readDecisions` above).
    ...(readDecisions ? { readDecisions } : {}),
    // The wire route's "why did that trade fire" join (PR 6) — no JSONL fallback: the fuzzy
    // symbol+side+time match (`decision-context.ts`) is a different code path entirely, and only
    // the replicated store supports an exact order-id index.
    ...(insightsBridge.findByOrderId ? { findByOrderId: insightsBridge.findByOrderId } : {}),
    ...(insightsBridge.personasOfOrders
      ? { personasOfOrders: insightsBridge.personasOfOrders }
      : {}),
    ...(insightsBridge.findSpreadLeg ? { findSpreadLeg: insightsBridge.findSpreadLeg } : {}),
    // The decision funnel (PR 7b) — same replicated store, same no-JSONL-fallback posture as
    // `findByOrderId`: a full-history SQL aggregation has no JSONL-store equivalent.
    ...(insightsBridge.funnelFor ? { funnelFor: insightsBridge.funnelFor } : {}),
    ...(insightsBridge.readCheckWeek ? { readCheckWeek: insightsBridge.readCheckWeek } : {}),
    ...(insightsBridge.readPlaybookFunnel
      ? { readPlaybookFunnel: insightsBridge.readPlaybookFunnel }
      : {}),
    // Expectancy-with-a-CI (PR 7c) reads the same replicated store, same no-JSONL-fallback posture.
    ...(insightsBridge.listRetrospectives
      ? { listRetrospectives: insightsBridge.listRetrospectives }
      : {}),
    readCondScout: insightsBridge.readCondScout,
    readAuthoredShadow: insightsBridge.readAuthoredShadow,
    readHouseRoster: insightsBridge.readHouseRoster,
    signalWindows: signalWindows(process.env),
    tradingEnabled: desk.enabled,
    submitTrade: desk.submit,
    submitOptionTrade: desk.submitOption,
    submitDraftOrder: desk.submitDraft,
    activityEvents: activityEventBus,
    activityLog: activityEventBus,
    // A member's alert dismissals, durable on the volume (#3407 P4 slice 1 follow-up).
    alertDismissals,
    alertDeliveryStore: alertDelivery.store,
    ...(alertDelivery.transport ? { alertDelivery: alertDelivery.transport } : {}),
    // The names a member chose to watch — member-authored truth nothing re-derives, so it is
    // durable on the same volume (#4332).
    watchlist: createWatchlist(process.env),
    optionsClientFor: (id) => clientFor(id, dataSource.optionsClientFactory),
    quoteStream,
    tradingClientFor: (id) => clientFor(id, dataSource.clientFactory),
    ...("store" in ivHistory ? { ivHistory: ivHistory.store } : {}),
    // Beside the IV history on the same volume, and off whenever it is (research/spot-checks.ts).
    ...(spotChecks ? { spotChecks } : {}),
  };
  const server = createDashboardServer(dashboardConfig);
  // Book-health history (#5493 slice 5): one sample of every account's findings an hour.
  startBookHealthSampler({
    config: dashboardConfig,
    participants: () => hub.getState().participants,
  });
  // Fly's deploy sends SIGTERM to the old machine: stop accepting, end SSE with a retry hint,
  // exit 0 inside kill_timeout (#4616). The one exit that clears the run marker (#4618).
  installGracefulShutdown(server, {
    log: (line) => console.log(line),
    exit: (code) => {
      telemetry.cleanExit();
      process.exit(code);
    },
  });
  server.listen(PORT, () => {
    const gate = auth ? `OAuth (${auth.providerIds.join("+")})` : password ? "password" : "OPEN";
    console.log(
      `Observatory live on port ${PORT} [${dataSource.mode}] — auth: ${gate} — feedback: ${feedback ? "on" : "off"}`,
    );
    console.log(`Participants: ${roster.map((p) => p.displayName).join(", ")}`);
    telemetry.listening();
  });
}

main().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});
