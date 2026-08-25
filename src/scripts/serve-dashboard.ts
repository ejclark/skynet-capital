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
import { createInsightStore } from "../autonomous/jsonl-insight-store.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { reconcileBrokerActivity } from "../observatory/activity-backfill.js";
import {
  createBootActivityStore,
  type TradeActivityRecord,
} from "../observatory/activity-store.js";
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
import { createDefaultPersonas } from "../personas/registry.js";
import { resolveDataSource } from "../runtime/data-source.js";
import { volumePersistenceWarnings } from "../runtime/volume-guard.js";
import { createAccountService } from "../server/account-service.js";
import { createAllowlistStore } from "../server/auth/allowlist-store.js";
import { ownerEmails, resolveAuth } from "../server/auth/resolve-auth.js";
import { createBotControlsStore } from "../server/bot-controls-store.js";
import { toClaimAccounts } from "../server/claim-form.js";
import { createDashboardServer } from "../server/dashboard-server.js";
import { resolveFeedbackCoach } from "../server/feedback-coach.js";
import { createFeedbackLogStore } from "../server/feedback-log.js";
import { resolveFeedback } from "../server/feedback-service.js";
import { createInsightsListener, resolveInsightsBridgePort } from "../server/insights-listener.js";
import { ObservatoryHub } from "../server/observatory-hub.js";
import { createOrderAuditLog } from "../server/order-audit-log.js";
import { createOwnerLinkStore, resolveOwnedId } from "../server/owner-link-store.js";
import { ParticipantService } from "../server/participant-service.js";
import { resolvePort } from "../server/resolve-port.js";
import { resolveDeskTrading } from "../server/trade-service.js";

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
  });

  // The guest list lives on the mounted volume, encrypted at rest, and is unioned with the env
  // allowlist inside resolveAuth. Built here so the /invite route and the authenticator read the
  // exact same store — two sources of truth for who may sign in is the bug worth designing out.
  const allowlist = createAllowlistStore(process.env, (m) => console.error(m));
  // Mission Control state, on the volume beside the other member data (SKYNET_CONTROLS_FILE →
  // /data/bot-controls.json in prod). Plain JSON — switches, not secrets.
  const botControls = createBotControlsStore(process.env, (m) => console.error(m));
  const knownPersonaIds = new Set(createDefaultPersonas().map((p) => p.id));
  const auth = resolveAuth(process.env, undefined, allowlist);
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
      "⚠️  No SKYNET_STORE_SECRET set — self-service onboarding (/add) is DISABLED so credentials are never written unencrypted. Set it to enable onboarding.",
    );
  }

  // Desk trading is on whenever OAuth is configured — no separate kill switch (#466).
  // Resolved through the LIVE merge (not the boot-time `roster`) so a credential rotated at
  // runtime takes effect on the next order, not the next restart.
  const liveRoster = () => mergeRoster(envRoster, store.load());
  const findParticipant = (id: string) => liveRoster().find((p) => p.id === id);
  // Owner links for accounts that carry no `ownerEmail` of their own — every env-declared roster
  // row without a stamp, and anything added before the connect form existed (#546). Plain JSON on
  // the volume beside bot-controls.json: an id and an already-admitted email, no credentials.
  const ownerLinks = createOwnerLinkStore(process.env, (m) => console.error(m));
  // The owner link: session email -> the account(s) it owns. Never exposed on ParticipantSnapshot.
  // Every stamped `ownerEmail` match wins outright (multiple, when the host stamps more than one
  // env id to the same address); only when NONE is stamped does a volume link fill the gap — the
  // same "a stamp always beats a link" precedence `resolveOwnedId` specifies, generalized to a
  // roster that can hand back more than one id.
  const resolveOwnerIds = (email: string): string[] => {
    const participants = liveRoster();
    const stampedIds = participants
      .filter((p) => p.ownerEmail?.toLowerCase() === email.toLowerCase())
      .map((p) => p.id);
    if (stampedIds.length > 0) return stampedIds;
    const linkedId = resolveOwnedId(participants, ownerLinks.load().links, email);
    return linkedId ? [linkedId] : [];
  };
  const resolveOwnerId = (email: string): string | undefined => resolveOwnerIds(email)[0];
  const orderAudit = createOrderAuditLog(process.env);
  const desk = resolveDeskTrading({
    findParticipant,
    clientFactory: dataSource.clientFactory,
    optionsClientFactory: dataSource.optionsClientFactory,
    authConfigured: Boolean(auth),
    recordAudit: (entry) => orderAudit.record(entry),
  });

  const feedback = resolveFeedback(process.env);
  if (!feedback) {
    console.warn(
      "ℹ️  In-app feedback is off (no SKYNET_FEEDBACK_GITHUB_TOKEN) — the /feedback form renders but submissions won't file issues.",
    );
  }
  const feedbackCoach = resolveFeedbackCoach(process.env);
  if (!feedbackCoach) {
    console.warn(
      "ℹ️  The feedback coach is off (no ANTHROPIC_API_KEY) — the plain /feedback form still works.",
    );
  }
  // What a member filed, correlated to the issue it became (#429).
  const feedbackLog = createFeedbackLogStore(process.env);

  createDashboardServer({
    hub,
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
    readHistory: (id) => history.list(id),
    readTradeActivity: (id) => activity.list(id),
    ...(auditDir ? { readDecisions: (id: string) => new JsonlAuditStore(auditDir).list(id) } : {}),
    tradingEnabled: desk.enabled,
    submitTrade: desk.submit,
    submitOptionTrade: desk.submitOption,
    optionsClientFor: (id) => {
      const participant = findParticipant(id);
      return participant ? dataSource.optionsClientFactory(participant) : undefined;
    },
  }).listen(PORT, () => {
    const gate = auth ? `OAuth (${auth.providerIds.join("+")})` : password ? "password" : "OPEN";
    console.log(
      `Observatory live on port ${PORT} [${dataSource.mode}] — auth: ${gate} — feedback: ${feedback ? "on" : "off"}`,
    );
    console.log(`Participants: ${roster.map((p) => p.displayName).join(", ")}`);
  });

  // Interim insight bridge (docs/plans/trade-insights-loop.md, slice 2) — internal-only, so the
  // `bots` process (no Fly Volume of its own) can persist retrospectives through this process's
  // mounted volume. Bound to a port deliberately NOT in fly.toml's [http_service]: unreachable
  // from the public internet, reachable only over Fly's private 6PN network. See
  // src/server/insights-listener.ts for the full reasoning + what was verified.
  const insights = createInsightStore(process.env);
  const insightsPort = resolveInsightsBridgePort(process.env);
  createInsightsListener({
    record: (entry) => insights.record(entry),
    // The bots process polls Mission Control state over the same private-net bridge.
    controls: () => botControls.load(),
  }).listen(insightsPort, () => {
    console.log(`[insights-bridge] internal listener on port ${insightsPort} (private-net only)`);
  });
}

main().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});
