import type { ServerResponse } from "node:http";
import { envNamedFor } from "../autonomous/house-roster-wire.js";
import { playbookStoreCatalog } from "../discovery/playbook-store.js";
import { regularSessionOpen } from "../domain/market-session.js";
import { activityNarrowing, type PlaybookOf } from "../observatory/activity-filter.js";
import {
  type BotHoldings,
  botHeartbeatView,
  latestVerdictPass,
  type RollCallRoster,
} from "../observatory/bot-heartbeat-view.js";
import {
  decisionCyclesView,
  expectancyView,
  funnelView,
} from "../observatory/decision-json-view.js";
import { deskLedger, realizedByOrder } from "../observatory/desk-data.js";
import { deskActivityView, deskView } from "../observatory/desk-json-view.js";
import { orderOriginIndex } from "../observatory/order-origin.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { deskPulseView } from "../observatory/pulse-json-view.js";
import { safeguardLadderView } from "../observatory/safeguard-ladder-view.js";
import { type SpreadOf, spreadLookup } from "../observatory/spread-activity.js";
import { botLandmarkProminence } from "../observatory/standings.js";
import { thesisView } from "../observatory/thesis-json-view.js";
import { reasoningForOrder, withoutOwnerReasoning } from "../observatory/wire-reasoning.js";
import { hypothesisVerdicts } from "../playbooks/cond-scout-verdict.js";
import { empireHealth, projectEmpire } from "../universe/project.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { readAccountDecisionsPage } from "./decision-account-view.js";
import {
  ownsDesk,
  withoutCycleOwnerFields,
  withoutHeartbeatPlaybookIds,
  withoutLadderPlaybookIds,
  withoutThesisOwnerFields,
} from "./desk-owner-gate.js";
import { MAX_PAGE_SIZE, resolvePageSize } from "./pagination.js";

/** A bot's activity rows each carry the decision that placed them (#3687 slice 4), via the same
 *  exact order-id join the wire feed and the Thesis tab use. Human rows pass through untouched.
 *  A non-owner's copy carries the decision without its playbook (#885) or the broker's words
 *  (`desk-owner-gate.ts`). */
function withDecisions<V extends { readonly activity: readonly { readonly orderId: string }[] }>(
  kind: string,
  view: V,
  config: DashboardServerConfig,
  owner: boolean,
): V {
  if (kind !== "bot" || !config.findByOrderId) return view;
  return {
    ...view,
    activity: view.activity.map((event) => {
      const reasoning = reasoningForOrder(event.orderId, config);
      if (!reasoning) return event;
      return { ...event, reasoning: owner ? reasoning : withoutOwnerReasoning(reasoning) };
    }),
  };
}

/** A bot's spread fills arrive one per leg, under each leg's own order id: the store's leg
 *  map hops each to the spread's decision, so Activity can fold them into the spread's row. A human
 *  desk, or a deployment without the store, folds nothing. */
function botSpreadLookup(kind: string, config: DashboardServerConfig): SpreadOf | undefined {
  const { findSpreadLeg, findByOrderId } = config;
  if (kind !== "bot" || !(findSpreadLeg && findByOrderId)) return undefined;
  return spreadLookup({ findSpreadLeg, findByOrderId });
}

/** The playbook that placed an order, for the bot's OWNER alone (#885: "we do not show what
 *  playbooks others are using"). Filtering a non-owner's copy by playbook would name it by
 *  inference, so anyone else gets no lookup and their `?playbook=` is ignored. Memoised: the
 *  filter and the chip list read the same order ids, one indexed lookup each. */
function ownerPlaybookOf(
  kind: string,
  config: DashboardServerConfig,
  owner: boolean,
): PlaybookOf | undefined {
  const { findByOrderId } = config;
  if (kind !== "bot" || !owner || !findByOrderId) return undefined;
  const seen = new Map<string, string | undefined>();
  return (orderId) => {
    if (!seen.has(orderId)) seen.set(orderId, findByOrderId(orderId)?.intent.playbookId);
    return seen.get(orderId);
  };
}

/** `/api/desk/:id/activity` — the account's orders, newest first, keyset-paged by `before`, and
 *  narrowed BEFORE the page is cut (#4650): `?symbol=` to one stock (an option or a spread by its
 *  underlying), `?playbook=` to one playbook's orders for the bot's owner only. No ledger wired
 *  (offline runs without SKYNET_ACTIVITY_DIR) says so — never an empty lie. The audit lines ride
 *  alongside so each row can say who PLACED it; with no audit log wired every row is `unknown`. */
async function activityPayload(
  found: ParticipantSnapshot,
  config: DashboardServerConfig,
  params: URLSearchParams,
  owner: boolean,
): Promise<unknown> {
  const [records, audit] = await Promise.all([
    config.readTradeActivity?.(found.id),
    config.readOrderAudit?.(found.id),
  ]);
  if (!records) return { available: false, activity: [] };
  const origins = orderOriginIndex(audit, found.kind === "bot" ? "bot" : "human");
  // Realized P/L per closing order — from the round-trip matcher over the full merged ledger,
  // so a paginated activity page still carries P/L computed from the complete fill history.
  const realizedMap = realizedByOrder(deskLedger(found, records));
  const before = params.get("before");
  const view = deskActivityView(records, origins, {
    limit: resolvePageSize(params.get("per_page")),
    ...(before !== null ? { before } : {}),
    realizedByOrder: realizedMap,
    spreadOf: botSpreadLookup(found.kind, config),
    ...activityNarrowing(params, ownerPlaybookOf(found.kind, config, owner)),
  });
  return { available: true, ...withDecisions(found.kind, view, config, owner) };
}

/** How many passes to read per persona per page — the store's own max. A page of cycles then
 *  collapses quiet runs out of these, so one page can span far more time than `limit` rows. */
const DECISION_READ = 100;

/** `/api/desk/:id/decisions` — bots only, and only when an audit trail is wired; both absences
 *  say so plainly. Pooled across every persona that trades on this account (beta-scout keeps its
 *  own history under its own id), and paged through the store rather than a fixed newest window. */
async function decisionsPayload(
  found: { readonly id: string; readonly kind: string },
  config: DashboardServerConfig,
  limit: number,
  before: number | undefined,
  /** `?trades=none` (#3687 slice 4): only the passes that placed nothing — idle, refused, halted,
   *  rejected — which now live on the Heartbeat tab while trades carry their own decisions. */
  noTrades: boolean,
  /** False strips each outcome's playbook chip and the broker's words — a non-owner's copy. */
  owner: boolean,
): Promise<unknown> {
  if (found.kind !== "bot") return { available: false, kind: found.kind, cycles: [] };
  const page = await readAccountDecisionsPage(found.id, config, {
    limit: DECISION_READ,
    ...(before !== undefined ? { before } : {}),
  });
  if (!page) return { available: false, kind: "bot", cycles: [] };
  const records = noTrades
    ? page.records.filter((r) => !r.outcomes.some((o) => o.action === "placed"))
    : page.records;
  const view = decisionCyclesView(records, {
    limit,
    ...(before !== undefined ? { before } : {}),
    homePersonaId: found.id,
  });
  const nextCursor = view.nextCursor ?? page.horizon;
  // The funnel and expectancy are full-history aggregates, independent of the page the cycle
  // feed is on — neither lies about its totals just because the viewer scrolled back one page.
  const funnel = config.funnelFor?.(found.id);
  const retrospectives = config.listRetrospectives?.(found.id);
  return {
    available: true,
    kind: "bot",
    cycles: owner ? view.cycles : withoutCycleOwnerFields(view.cycles),
    ...(nextCursor !== undefined ? { nextCursor } : {}),
    ...(funnel ? { funnel: funnelView(funnel) } : {}),
    ...(retrospectives ? { expectancy: expectancyView(retrospectives) } : {}),
  };
}

/** This bot's Store subscriptions, on or paused, and the playbooks the bots app's own setting runs
 *  on it (#4650) — read once for the roll call and the unmanaged-lot line. Undefined when the store
 *  is unwired or its file unreadable: a read that failed would hide a paused playbook, so neither
 *  makes a claim from it. */
function botRoster(
  found: ParticipantSnapshot,
  config: DashboardServerConfig,
): RollCallRoster | undefined {
  const state = config.subscriptions?.loadIfReadable();
  if (!state) return undefined;
  const envNamed = envNamedFor(config.readHouseRoster?.(), found.id);
  return { subscriptions: state[found.id] ?? [], ...(envNamed ? { envNamed } : {}) };
}

/** The playbooks the desk's ideas leave out because the account already subscribes to them, on or
 *  paused (#4950). The owner's copy only: which playbooks a bot runs is the owner's alone (#885),
 *  and a non-owner's copy missing exactly those ideas would name them. An unwired or unreadable
 *  store filters nothing — the ideas read as they did before, never as a claim. */
function subscribedForIdeas(
  found: ParticipantSnapshot,
  config: DashboardServerConfig,
  owner: boolean,
): ReadonlySet<string> {
  const subs = owner ? (config.subscriptions?.loadIfReadable()?.[found.id] ?? []) : [];
  return new Set(subs.map((s) => s.playbookId));
}

/** The bot's book (the hub's broker read) and its Store subscriptions, enabled or paused — what the
 *  roll call's unmanaged-lot line judges from (#4777). Undefined, so no claim is made, when either
 *  is unreadable: a failed broker read carries no positions, and an unwired or unreadable
 *  subscriptions file would hide a paused playbook that still exits. */
function botHoldings(
  found: ParticipantSnapshot,
  roster: RollCallRoster | undefined,
): BotHoldings | undefined {
  if (found.error || !roster) return undefined;
  return {
    positions: found.positions,
    subscribedIds: roster.subscriptions.map((s) => s.playbookId),
  };
}

/** `/api/desk/:id/heartbeat` (#3687) — from the bot's OWN passes, not the pooled account view:
 *  beta-scout runs after every bot, so its records would make a dead loop look alive. */
async function heartbeatPayload(
  found: ParticipantSnapshot,
  config: DashboardServerConfig,
  owner: boolean,
): Promise<unknown> {
  const records = found.kind === "bot" ? await config.readDecisions?.(found.id) : undefined;
  if (!records) return { available: false, kind: found.kind };
  const roster = botRoster(found, config);
  const heartbeat = botHeartbeatView(
    records,
    new Date(),
    regularSessionOpen(),
    botHoldings(found, roster),
    roster,
    config.readCheckWeek?.(found.id),
  );
  return { available: true, heartbeat: owner ? heartbeat : withoutHeartbeatPlaybookIds(heartbeat) };
}

/**
 * `/api/desk/:id/probes` (#3651 slice 7a) — COND-SCOUT's shadow ledger, only on the bot account
 * the scout runs beside: open probes, recent retros, and a verdict per hypothesis. Every number
 * here is simulated (no order was ever sent); the Heartbeat labels it so. Absent snapshot, or a
 * different desk, says so plainly rather than showing an empty ledger.
 */
function probesPayload(found: { readonly id: string }, config: DashboardServerConfig): unknown {
  const snapshot = config.readCondScout?.();
  if (!snapshot || snapshot.hostPersonaId !== found.id) return { available: false };
  return {
    available: true,
    simulated: true,
    at: snapshot.at,
    open: snapshot.open,
    retros: snapshot.retros,
    verdicts: hypothesisVerdicts(snapshot.retros),
  };
}

/** The desk as data — same gate, same formatters as /u/:id's own views.
 *  `/api/desk/:id` is the blotter; `/activity` the fill timeline; `/decisions` the bot's mind;
 *  `/pulse` the Insights-style recap (equity curve, weekly realized, the doubling race).
 *  `/activity` and `/decisions` are keyset-paginated (`per_page`/`before`, PR 5 — issue #2287):
 *  a growing feed replaces its own hardcoded caps rather than truncating silently.
 *  Reads stay open inside the invite gate; a bot's playbook names are its owner's alone (#885). */
export async function serveDeskJson(
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  session?: Session,
): Promise<void> {
  const rest = decodeURIComponent(path.slice("/api/desk/".length));
  const sub = ["activity", "decisions", "heartbeat", "probes", "pulse", "thesis"].find((name) =>
    rest.endsWith(`/${name}`),
  );
  const id = sub ? rest.slice(0, -(sub.length + 1)) : rest;
  const state = config.hub.getState();
  const found = state.participants.find((p) => p.id === id);
  if (!found) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "no such desk" }));
    return;
  }
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  const owner = ownsDesk(found.id, config, session);
  const params = new URL(url, "http://localhost").searchParams;
  const limit = resolvePageSize(params.get("per_page"));
  const before = params.get("before");
  // A malformed `before` (not a finite epoch ms) is treated as absent — clamp, never error, same
  // posture `resolvePageSize` takes on a bad `per_page`.
  const beforeAt = before !== null && Number.isFinite(Number(before)) ? Number(before) : undefined;
  if (sub === "activity") {
    res.end(JSON.stringify(await activityPayload(found, config, params, owner)));
    return;
  }
  // The bot's health panels — one lookup, so a new panel never adds a branch here.
  const panels: Record<string, () => Promise<unknown>> = {
    heartbeat: () => heartbeatPayload(found, config, owner),
    probes: () => Promise.resolve(probesPayload(found, config)),
  };
  const panel = panels[String(sub)];
  if (panel) {
    res.end(JSON.stringify(await panel()));
    return;
  }
  if (sub === "decisions") {
    res.end(
      JSON.stringify(
        await decisionsPayload(
          found,
          config,
          limit,
          beforeAt,
          params.get("trades") === "none",
          owner,
        ),
      ),
    );
    return;
  }
  if (sub === "thesis") {
    // A human desk has no persona/decision-cycle mind to show a thesis for — same gate as
    // `/decisions`, same honest absence rather than an empty-but-present payload.
    if (found.kind !== "bot") {
      res.end(JSON.stringify({ available: false, kind: found.kind }));
      return;
    }
    const [decisionRecords, activityRecords, samples] = await Promise.all([
      config.readDecisions?.(id),
      config.readTradeActivity?.(id),
      config.readHistory?.(id) ?? [],
    ]);
    const decisions = decisionRecords
      ? decisionCyclesView(decisionRecords, { limit: MAX_PAGE_SIZE })
      : { cycles: [] };
    // A spread's legs fold into one fill here as on Activity, so its marker carries the spread's
    // order id — the one its decision is filed under and its Activity row is anchored on (#4650).
    const activity = activityRecords
      ? deskActivityView(activityRecords, undefined, {
          limit: MAX_PAGE_SIZE,
          spreadOf: botSpreadLookup(found.kind, config),
        }).activity
      : [];
    // The safeguard ladder (#3194 slice 6a) — read off the plays the BOT's own newest
    // verdict-carrying pass reported, never this process's env (see `safeguard-ladder-view.ts`).
    // Null means "no pass on hand said which plays ran", which is never "no safeguards".
    const pass = latestVerdictPass(decisionRecords ?? []);
    const ladder = pass ? safeguardLadderView(pass.verdicts) : null;
    const view = thesisView(found.personaId, decisions, activity, samples, config.findByOrderId);
    res.end(
      JSON.stringify({
        available: true,
        kind: "bot",
        thesis: owner ? view : withoutThesisOwnerFields(view),
        ladder: ladder && (owner ? ladder : withoutLadderPlaybookIds(ladder)),
        // Dated, always: nothing bounds how old that pass is, and an undated safety readout reads
        // as current (the same reason `playbookLines` carries `since`).
        ...(pass ? { ladderAsOf: new Date(pass.at).toISOString() } : {}),
      }),
    );
    return;
  }
  if (sub === "pulse") {
    // Each pulse section owns its empty state (performance-view doctrine): no history wired means
    // a null curve that says "still accruing", never a missing page.
    const [samples, durable] = await Promise.all([
      config.readHistory?.(id) ?? [],
      config.readTradeActivity?.(id),
    ]);
    res.end(
      JSON.stringify({
        generatedAt: state.generatedAt,
        pulse: deskPulseView(found, samples, durable),
      }),
    );
    return;
  }
  // The landmark dials ride the blotter payload for desks that HAVE a landmark (the world
  // projection decides — persona-mapped bots only). Same producers as every other renderer:
  // prominence from real relative standing, health from real P/L, or the field stays absent.
  const power = botLandmarkProminence(state.participants).get(id);
  const empire = projectEmpire(found, power === undefined ? {} : { personaProminence: power });
  // The lot breakdown (#3186 slice 1) needs the same durable ledger `/activity` already reads —
  // absent with no ledger wired, same honest degrade every other branch here takes, and
  // `deskView` already renders lot-free positions when `ledger` is undefined.
  const durable = await config.readTradeActivity?.(id);
  const ledger = durable ? deskLedger(found, durable) : undefined;
  // The considerations rail (#3186 slice 3) folds house playbooks matching a held symbol into the
  // desk payload — `playbookStoreCatalog()` is a cheap, synchronous, in-memory walk of the playbook
  // registry (same cost `/api/playbook-store` pays per request), so no caching is added here.
  res.end(
    JSON.stringify({
      generatedAt: state.generatedAt,
      desk: deskView(
        found,
        ledger,
        playbookStoreCatalog(),
        config.now,
        subscribedForIdeas(found, config, owner),
      ),
      ...(empire.landmark
        ? { landmark: { power: empire.landmark.prominence, health: empireHealth(found) } }
        : {}),
    }),
  );
}
