import type { IncomingMessage, ServerResponse } from "node:http";
import { parseActivityType, parseActivityWindow } from "../observatory/activity-store.js";
import { type DeskNotice, type DeskTab, parseDeskTab } from "../observatory/desk-tabs.js";
import { orderOriginIndex } from "../observatory/order-origin.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import {
  type PerformanceViewOptions,
  renderPerformanceBody,
} from "../observatory/performance-view.js";
import { renderPositionsBody } from "../observatory/positions-view.js";
import {
  type NavContext,
  type NavView,
  renderIndividualBody,
} from "../observatory/render-dashboard.js";
import { botLandmarkProminence } from "../observatory/standings.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { Session } from "./auth/session.js";
import { handleDeskSettings } from "./controls-form.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { shellDocument } from "./page-shell.js";

/** Notices are looked up by CODE, never echoed from the URL — a reflected message is an attack. */
const TRADE_NOTICES: Record<string, DeskNotice> = {
  submitted: {
    kind: "ok",
    message: "Order sent to the broker. It appears in Active and History as it fills.",
  },
  refused: {
    kind: "error",
    message: "That order didn't go through. Nothing was sent — review it and try again.",
  },
};

/** One desk tab → its renderer. Every tab takes the same options; only Performance reads history. */
function renderDeskTab(
  tab: Exclude<DeskTab, "overview" | "settings">,
  snapshot: ParticipantSnapshot,
  options: PerformanceViewOptions,
): string {
  if (tab === "positions") return renderPositionsBody(snapshot, options);
  return renderPerformanceBody(snapshot, options);
}

/**
 * Assemble one non-overview desk tab: gather the reads that tab needs — the durable trade ledger
 * and the decision audit for Performance's folded order ledger "why" — and render. Split from
 * `serveIndividualProfile` to keep that route inside its complexity budget.
 */
async function deskTabBody(
  tab: Exclude<DeskTab, "overview" | "settings">,
  snapshot: ParticipantSnapshot,
  config: DashboardServerConfig,
  params: URLSearchParams,
  base: PerformanceViewOptions,
): Promise<string> {
  const tradeActivity =
    config.readTradeActivity && tab === "performance"
      ? await config.readTradeActivity(snapshot.id)
      : undefined;
  const decisions =
    config.readDecisions && tab === "performance" && snapshot.kind === "bot"
      ? await config.readDecisions(snapshot.id)
      : undefined;
  // The desk's own submit receipts, for the Alpaca-direct mark (#782). Read for humans only — a
  // bot's autonomous orders bypass the audited path, so its log can prove nothing either way.
  const audit =
    config.readOrderAudit && tab === "performance" && snapshot.kind === "human"
      ? await config.readOrderAudit(snapshot.id)
      : undefined;
  return renderDeskTab(tab, snapshot, {
    ...base,
    tradingEnabled: Boolean(config.tradingEnabled && config.submitTrade),
    activityWindow: parseActivityWindow(params.get("window")),
    activityType: parseActivityType(params.get("type")),
    ...(tradeActivity ? { tradeActivity } : {}),
    ...(decisions ? { decisions } : {}),
    orderOrigins: orderOriginIndex(audit, snapshot.kind),
  });
}

/** `/u/:id` — an individual's desk. `?tab=` selects the view; anything unknown falls to overview. */
export async function serveIndividualProfile(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  navFor: (active: NavView) => NavContext,
  session: Session | undefined,
): Promise<void> {
  const id = decodeURIComponent(path.slice(3));
  // Awaited, so a member who refreshes because a holding is missing gets the corrected board on
  // THAT response rather than the next one (#591).
  await config.refreshParticipant?.(id);
  const state = config.hub.getState();
  const snapshot = state.participants.find((p) => p.id === id);
  if (!snapshot) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }
  const params = new URL(url, "http://localhost").searchParams;
  const nav = navFor("you");
  const isSelf = nav.currentId === id;
  const deskNav = { ...nav, active: (isSelf ? "you" : "board") as NavView };
  // Owner-only tabs downgrade to the overview inside `parseDeskTab`, so a member asking for
  // `?tab=settings` is answered exactly like a typo — there is no owner-shaped tell to probe for.
  const tab = parseDeskTab(params.get("tab"), Boolean(nav.canControl));
  const notice = TRADE_NOTICES[params.get("n") ?? ""];

  if (tab === "settings" && config.controls) {
    // Mission Control (#475). `handleDeskSettings` re-checks owner status itself rather than
    // trusting this call site, and owns the POST path — the same layering /invite uses.
    await handleDeskSettings(req, res, req.method ?? "GET", session?.email, config.controls, {
      snapshot,
      options: { nav: deskNav, isSelf, generatedAt: state.generatedAt },
    });
    return;
  }

  const history = config.readHistory ? await config.readHistory(id) : undefined;

  if (tab !== "overview" && tab !== "settings") {
    const body = await deskTabBody(tab, snapshot, config, params, {
      nav: deskNav,
      isSelf,
      generatedAt: state.generatedAt,
      ...(notice && isSelf ? { notice } : {}),
      ...(history ? { history } : {}),
    });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument(`${escapeHtml(snapshot.displayName)} — Skynet Capital`, body));
    return;
  }

  const decisions =
    config.readDecisions && snapshot.kind === "bot" ? await config.readDecisions(id) : undefined;
  // Landmark dial from the shared standings producer, so this view's Eye shows real rank too.
  const prominence = botLandmarkProminence(state.participants).get(id);
  const body = renderIndividualBody(snapshot, {
    nav: deskNav,
    isSelf,
    generatedAt: state.generatedAt,
    ...(history ? { history } : {}),
    ...(decisions ? { decisions } : {}),
    ...(prominence !== undefined ? { prominence } : {}),
  });
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(shellDocument(`${escapeHtml(snapshot.displayName)} — Skynet Capital`, body));
}
