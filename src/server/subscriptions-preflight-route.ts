import type { IncomingMessage, ServerResponse } from "node:http";
import { envNamedFor } from "../autonomous/house-roster-wire.js";
import { PLAYBOOK_MODES, type PlaybookMode } from "../domain/types.js";
import { findPlaybook } from "../playbooks/registry.js";
import { allocationRefusal } from "../subscriptions/strategy-budgets.js";
import { newSubscriptionRefusal } from "../subscriptions/subscribe-eligibility.js";
import { liveNeeds } from "../subscriptions/subscribe-live-needs.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { requireGet, sendJson } from "./page-shell.js";
import { subscribeLiveReads } from "./subscribe-live-reads.js";

/**
 * THE STORE'S PREFLIGHT (#4469 slice 3b part 2) — `GET /api/playbook-store/preflight?id=&playbookId=
 * &mode=&capital=`: what Subscribe would say to this pair at this budget, asked BEFORE the owner
 * submits. It runs exactly the checks a NEW subscription passes (`newSubscriptionRefusal`, the
 * strategy's allocation, then `liveNeeds` — the same functions subscribe calls, so the two cannot
 * drift) and writes nothing.
 *
 * It is a read the owner asks for by tapping "Check first", never one the page makes on load: the
 * live half costs broker calls (a price, the options level, a chain), and a Store row per pair per
 * page view would spend them by the dozen — the reason 3a left live refusals on subscribe alone.
 *
 * Owner-only, because the answer names the account's own options level and what its budget buys. The
 * delegation gates (bot account, the viewer's fog) are NOT repeated here: they are drawn on the row
 * before this control exists, and Subscribe still refuses them.
 *
 * An answer for an options pair carries one contract's cash and the share of the budget that leaves
 * idle (criterion 10). Outside the regular session no chain clears `liquid`, so there is no cash to
 * report and the answer says so by omission; the client words it as "checked at the open".
 */

const parseQuery = (url: URL) => {
  const id = url.searchParams.get("id");
  const playbookId = url.searchParams.get("playbookId");
  const mode = url.searchParams.get("mode") as PlaybookMode | null;
  const capital = Number(url.searchParams.get("capital"));
  const valid =
    id &&
    playbookId &&
    mode &&
    PLAYBOOK_MODES.includes(mode) &&
    url.searchParams.get("capital") !== null &&
    Number.isFinite(capital) &&
    capital >= 0;
  // A conviction the form has filled in; its text is judged when Subscribe is pressed, not here.
  const conviction = url.searchParams.get("conviction") === "1";
  return valid ? { id, playbookId, mode, capital, conviction } : undefined;
};

export async function servePreflight(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  if (!requireGet(req, res)) return;
  const query = parseQuery(new URL(req.url ?? "", "http://localhost"));
  if (!query) {
    sendJson(res, 400, { error: "malformed preflight query" });
    return;
  }
  if (!(config.auth && resolveOwnedIds(session, config).includes(query.id))) {
    sendJson(res, 200, { ok: false, error: "You can only check your own account." });
    return;
  }
  const held = config.subscriptions?.load()[query.id] ?? [];
  if (held.some((sub) => sub.playbookId === query.playbookId)) {
    sendJson(res, 200, { ok: true });
    return;
  }
  const envNamed = envNamedFor(config.readHouseRoster?.(), query.id);
  const needs = {
    playbookId: query.playbookId,
    subscriptions: held,
    asOfIso: (config.now?.() ?? new Date()).toISOString(),
    ...(query.conviction ? { conviction: true } : {}),
    ...(envNamed ? { envNamed } : {}),
  };
  const refusal =
    newSubscriptionRefusal(needs) ??
    allocationRefusal({
      playbookId: query.playbookId,
      capitalAllocated: query.capital,
      subscriptions: held,
      allocations: config.subscriptions?.loadAllocations()[query.id],
    });
  if (refusal) {
    sendJson(res, 200, { ok: false, error: refusal });
    return;
  }
  const live = await liveNeeds(
    { ...needs, mode: query.mode, capitalAllocated: query.capital },
    subscribeLiveReads(config, query.id),
  );
  if (live.refusal) {
    sendJson(res, 200, { ok: false, error: live.refusal });
    return;
  }
  const cash = live.oneContractCash;
  sendJson(res, 200, {
    ok: true,
    // Says "this pair sells options" so the client can word a missing cash as "judged at the open".
    ...(findPlaybook(query.playbookId)?.options ? { options: true } : {}),
    ...(cash === undefined
      ? {}
      : {
          oneContractCash: Math.round(cash),
          idleShare: query.capital > 0 ? Math.max(0, 1 - cash / query.capital) : 0,
        }),
  });
}
