import type { ServerResponse } from "node:http";
import { playbookStoreCatalog } from "../discovery/playbook-store.js";
import { regularSessionOpen } from "../domain/market-session.js";
import { botHeartbeatView } from "../observatory/bot-heartbeat-view.js";
import {
  decisionCyclesView,
  expectancyView,
  funnelView,
} from "../observatory/decision-json-view.js";
import { deskLedger, realizedByOrder } from "../observatory/desk-data.js";
import { deskActivityView, deskView } from "../observatory/desk-json-view.js";
import { orderOriginIndex } from "../observatory/order-origin.js";
import { deskPulseView } from "../observatory/pulse-json-view.js";
import { botLandmarkProminence } from "../observatory/standings.js";
import { thesisView } from "../observatory/thesis-json-view.js";
import { empireHealth, projectEmpire } from "../universe/project.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { readAccountDecisions } from "./decision-account-view.js";
import { MAX_PAGE_SIZE, resolvePageSize } from "./pagination.js";

/** `/api/desk/:id/heartbeat` (#3687) — from the bot's OWN passes, not the pooled account view:
 *  beta-scout runs after every bot, so its records would make a dead loop look alive. */
async function heartbeatPayload(
  found: { readonly id: string; readonly kind: string },
  config: DashboardServerConfig,
): Promise<unknown> {
  const records = found.kind === "bot" ? await config.readDecisions?.(found.id) : undefined;
  return records
    ? { available: true, heartbeat: botHeartbeatView(records, new Date(), regularSessionOpen()) }
    : { available: false, kind: found.kind };
}

/** The desk as data — same gate, same formatters as /u/:id's own views.
 *  `/api/desk/:id` is the blotter; `/activity` the fill timeline; `/decisions` the bot's mind;
 *  `/pulse` the Insights-style recap (equity curve, weekly realized, the doubling race).
 *  `/activity` and `/decisions` are keyset-paginated (`per_page`/`before`, PR 5 — issue #2287):
 *  a growing feed replaces its own hardcoded caps rather than truncating silently. */
export async function serveDeskJson(
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
): Promise<void> {
  const rest = decodeURIComponent(path.slice("/api/desk/".length));
  const sub = ["activity", "decisions", "heartbeat", "pulse", "thesis"].find((name) =>
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
  const params = new URL(url, "http://localhost").searchParams;
  const limit = resolvePageSize(params.get("per_page"));
  const before = params.get("before");
  // A malformed `before` (not a finite epoch ms) is treated as absent — clamp, never error, same
  // posture `resolvePageSize` takes on a bad `per_page`.
  const beforeAt = before !== null && Number.isFinite(Number(before)) ? Number(before) : undefined;
  if (sub === "activity") {
    // No ledger wired (offline runs without SKYNET_ACTIVITY_DIR) says so — never an empty lie.
    // The audit lines ride alongside so each row can say who PLACED it; with no audit log
    // wired the index is empty and every row classifies `unknown`, i.e. unmarked.
    const [records, audit] = await Promise.all([
      config.readTradeActivity?.(id),
      config.readOrderAudit?.(id),
    ]);
    const origins = orderOriginIndex(audit, found.kind === "bot" ? "bot" : "human");
    // Realized P/L per closing order — from the round-trip matcher over the full merged ledger,
    // so a paginated activity page still carries P/L computed from the complete fill history.
    const realizedMap = records ? realizedByOrder(deskLedger(found, records)) : undefined;
    res.end(
      JSON.stringify(
        records
          ? {
              available: true,
              ...deskActivityView(records, origins, {
                limit,
                before: before ?? undefined,
                ...(realizedMap ? { realizedByOrder: realizedMap } : {}),
              }),
            }
          : { available: false, activity: [] },
      ),
    );
    return;
  }
  if (sub === "heartbeat") {
    res.end(JSON.stringify(await heartbeatPayload(found, config)));
    return;
  }
  if (sub === "decisions") {
    // Bots only, and only when an audit trail is wired — both absences say so plainly.
    if (found.kind !== "bot") {
      res.end(JSON.stringify({ available: false, kind: found.kind, cycles: [] }));
      return;
    }
    // Pooled across every persona that trades on this account, not just the one whose id matches
    // it — a fallback mechanism like beta-scout trades here while keeping its own decision history
    // under its own persona id (`decision-account-view.ts`).
    const records = await readAccountDecisions(id, config);
    // The funnel and expectancy are full-history aggregates, independent of the page the cycle
    // feed is on — neither lies about its totals just because the viewer scrolled back one page.
    const funnel = config.funnelFor?.(id);
    const retrospectives = config.listRetrospectives?.(id);
    res.end(
      JSON.stringify(
        records
          ? {
              available: true,
              kind: "bot",
              ...decisionCyclesView(records, { limit, before: beforeAt, homePersonaId: id }),
              ...(funnel ? { funnel: funnelView(funnel) } : {}),
              ...(retrospectives ? { expectancy: expectancyView(retrospectives) } : {}),
            }
          : { available: false, kind: "bot", cycles: [] },
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
    const activity = activityRecords
      ? deskActivityView(activityRecords, undefined, { limit: MAX_PAGE_SIZE }).activity
      : [];
    res.end(
      JSON.stringify({
        available: true,
        kind: "bot",
        thesis: thesisView(found.personaId, decisions, activity, samples, config.findByOrderId),
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
      desk: deskView(found, ledger, playbookStoreCatalog()),
      ...(empire.landmark
        ? { landmark: { power: empire.landmark.prominence, health: empireHealth(found) } }
        : {}),
    }),
  );
}
