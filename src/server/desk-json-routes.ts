import type { ServerResponse } from "node:http";
import { decisionCyclesView } from "../observatory/decision-json-view.js";
import { deskActivityView, deskView } from "../observatory/desk-json-view.js";
import { orderOriginIndex } from "../observatory/order-origin.js";
import { deskPulseView } from "../observatory/pulse-json-view.js";
import { botLandmarkProminence } from "../observatory/standings.js";
import { empireHealth, projectEmpire } from "../universe/project.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/** The desk as data (#738 phases 2c–3a) — same gate, same formatters as /u/:id's own views.
 *  `/api/desk/:id` is the blotter; `/activity` the fill timeline; `/decisions` the bot's mind;
 *  `/pulse` the Insights-style recap (equity curve, weekly realized, the doubling race). */
export async function serveDeskJson(
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
): Promise<void> {
  const rest = decodeURIComponent(path.slice("/api/desk/".length));
  const sub = ["activity", "decisions", "pulse"].find((name) => rest.endsWith(`/${name}`));
  const id = sub ? rest.slice(0, -(sub.length + 1)) : rest;
  const state = config.hub.getState();
  const found = state.participants.find((p) => p.id === id);
  if (!found) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "no such desk" }));
    return;
  }
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  if (sub === "activity") {
    // No ledger wired (offline runs without SKYNET_ACTIVITY_DIR) says so — never an empty lie.
    // The audit lines ride alongside so each row can say who PLACED it (#782); with no audit log
    // wired the index is empty and every row classifies `unknown`, i.e. unmarked.
    const [records, audit] = await Promise.all([
      config.readTradeActivity?.(id),
      config.readOrderAudit?.(id),
    ]);
    const origins = orderOriginIndex(audit, found.kind === "bot" ? "bot" : "human");
    res.end(
      JSON.stringify(
        records
          ? { available: true, activity: deskActivityView(records, origins) }
          : { available: false, activity: [] },
      ),
    );
    return;
  }
  if (sub === "decisions") {
    // Bots only, and only when an audit trail is wired — both absences say so plainly.
    if (found.kind !== "bot") {
      res.end(JSON.stringify({ available: false, kind: found.kind, cycles: [] }));
      return;
    }
    const records = await config.readDecisions?.(id);
    res.end(
      JSON.stringify(
        records
          ? { available: true, kind: "bot", cycles: decisionCyclesView(records) }
          : { available: false, kind: "bot", cycles: [] },
      ),
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
  res.end(
    JSON.stringify({
      generatedAt: state.generatedAt,
      desk: deskView(found),
      ...(empire.landmark
        ? { landmark: { power: empire.landmark.prominence, health: empireHealth(found) } }
        : {}),
    }),
  );
}
