// One GET through the server's REAL route handlers, in-process (#4943 slice 2) — the composer's
// way of asking production code for a payload without a listening server, a cookie or a broker.
// Area-agnostic: it knows the server's read families, never a page.
//
// The chain is `dashboard-server.ts`'s own dispatch order for the families that answer GETs
// (`serveJsonApi`, then its `serveWriteApis` families), minus the auth gate — the session is handed in
// directly, which is exactly what the gate would have handed each route. Streams, posts and admin
// families are left out: a study world composes reads, and records writes without sending them.

import { serveAlertDeliveryApi } from "../../src/server/alert-delivery-route.ts";
import { serveCompanionApi } from "../../src/server/companion-routes.ts";
import { serveJsonApi } from "../../src/server/content-api-routes.ts";
import { serveControlsApi } from "../../src/server/controls-api-routes.ts";
import { serveCouncilApi } from "../../src/server/council-api-routes.ts";
import { serveDeskAlertsApi } from "../../src/server/desk-alerts-route.ts";
import { serveJoinApi } from "../../src/server/join-api-routes.ts";
import { serveLearnApi } from "../../src/server/learn-api-routes.ts";
import { serveOnboardingApi } from "../../src/server/onboarding-api-routes.ts";
import { serveOptionApi } from "../../src/server/option-api-routes.ts";
import { serveOptionLifecycleApi } from "../../src/server/option-lifecycle-route.ts";
import { serveOptionPositionsApi } from "../../src/server/option-positions-route.ts";
import { servePlaybooksApi } from "../../src/server/playbooks-api-routes.ts";
import { servePlaysApi } from "../../src/server/plays-api-routes.ts";
import { serveSavedPositionsApi } from "../../src/server/saved-positions-api-routes.ts";
import { serveSettingsApi } from "../../src/server/settings-api-routes.ts";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.ts";
import { serveTradeApi } from "../../src/server/trade-api-routes.ts";
import { serveTradeOrdersApi } from "../../src/server/trade-orders-routes.ts";
import { serveWatchlistApi } from "../../src/server/watchlist-route.ts";

/** A response that records what a handler wrote instead of sending it. */
function capture() {
  const out = { status: 0, text: "" };
  const res = {
    headersSent: false,
    writeHead(status) {
      out.status = status;
      res.headersSent = true;
      return res;
    },
    setHeader() {
      // Headers are not part of a composed payload; the status and body are.
    },
    end(body) {
      out.text = body === undefined ? "" : String(body);
    },
  };
  return { res, out };
}

/** The GET-answering families, in the server's own order. */
const FAMILIES = [
  serveTradeApi,
  serveTradeOrdersApi,
  serveOptionPositionsApi,
  serveOptionLifecycleApi,
  serveDeskAlertsApi,
  serveAlertDeliveryApi,
  serveWatchlistApi,
  serveOptionApi,
  servePlaysApi,
  serveSettingsApi,
  serveSubscriptionsApi,
  serveSavedPositionsApi,
  serveLearnApi,
  serveOnboardingApi,
  servePlaybooksApi,
  serveControlsApi,
  (req, res, path, config, session) => serveCouncilApi(req, res, path, config.council, session),
  serveCompanionApi,
  serveJoinApi,
];

/**
 * Ask the real handlers for one GET as one session.
 * @returns {Promise<{status: number, body: unknown} | undefined>} undefined when nothing claims it
 */
export async function serverRead(url, config, channel, session) {
  const path = url.split("?")[0];
  const { res, out } = capture();
  const req = { method: "GET", url, headers: {} };
  let claimed = await serveJsonApi(res, path, url, config, channel, session);
  for (const family of FAMILIES) {
    if (claimed) break;
    claimed = await family(req, res, path, config, session);
  }
  if (!claimed) return undefined;
  let body = null;
  try {
    body = out.text ? JSON.parse(out.text) : null;
  } catch {
    body = { text: out.text };
  }
  return { status: out.status || 200, body };
}
