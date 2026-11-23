// One GET through the server's REAL route handlers, in-process (#4943 slice 2) — the composer's
// way of asking production code for a payload without a listening server, a cookie or a broker.
// Area-agnostic: it knows the server's read families, never a page.
//
// The chain is `dashboard-server.ts`'s own dispatch order for the families that answer GETs
// (`serveJsonApi`, then its `serveWriteApis` families), minus the auth gate — the session is handed in
// directly, which is exactly what the gate would have handed each route. Streams and posts are
// left out: a study world composes reads, and records writes without sending them. The admin
// family answers its GETs (the owner's cards read `{owner:false}` for a member).
//
// FAMILIES NEWER THAN THE FIRST STUDY (#8005): quests, book waits, target splits, member views and
// the conviction records landed after the profile's pin. A pin is studied with TODAY's harness
// (pin.mjs), so each is imported dynamically and a pin without the module simply has no such
// family — exactly what that pin's server served. They sit where the pin's own dispatcher
// (`dashboard-server.ts` → `serveWriteApis`) puts them, so a read two families could claim goes
// to the one production asks first.

import { serveAdminApi } from "../../src/server/admin-api-routes.ts";
import { serveAlertDeliveryApi } from "../../src/server/alert-delivery-route.ts";
import { serveCompanionApi } from "../../src/server/companion-routes.ts";
import { serveJsonApi } from "../../src/server/content-api-routes.ts";
import { serveControlsApi } from "../../src/server/controls-api-routes.ts";
import { serveCouncilApi } from "../../src/server/council-api-routes.ts";
import { serveCouncilRepliesApi } from "../../src/server/council-replies-api-routes.ts";
import { serveDeskAlertsApi } from "../../src/server/desk-alerts-route.ts";
import { serveFeedbackApi } from "../../src/server/feedback-api-routes.ts";
import { serveFilingCommentsApi } from "../../src/server/filing-comments-api-routes.ts";
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

/** A route module a pin may predate: its namespace, or an empty one when the file is missing. */
const later = (path) => import(path).catch(() => ({}));
const [
  quests,
  questsTaken,
  bookWait,
  fastTrack,
  draftOrder,
  memberConvictions,
  memberCampaigns,
  memberChains,
  authoredPlays,
  targetSplit,
  convictions,
  handOver,
] = await Promise.all([
  later("../../src/server/quests-route.ts"),
  later("../../src/server/quests-taken-route.ts"),
  later("../../src/server/book-wait-routes.ts"),
  later("../../src/server/fast-track-route.ts"),
  later("../../src/server/draft-order-route.ts"),
  later("../../src/server/member-convictions-api-routes.ts"),
  later("../../src/server/member-campaigns-api-routes.ts"),
  later("../../src/server/member-chains-api-routes.ts"),
  later("../../src/server/authored-plays-api-routes.ts"),
  later("../../src/server/target-split-api-routes.ts"),
  later("../../src/server/convictions-api-routes.ts"),
  later("../../src/server/conviction-hand-over.ts"),
]);

/** A family a pin may lack, as one entry of the chain: claims nothing when it is missing. */
const family = (fn) => (typeof fn === "function" ? fn : async () => false);

/** `/api/convictions` as the pin's dispatcher serves it: the seeded records plus the members'
 *  views handed over (`servePlaybookReads`). */
const convictionRecords =
  typeof convictions.serveConvictionsApi === "function" &&
  typeof handOver.heldConvictions === "function"
    ? (req, res, path, config) =>
        path === "/api/convictions"
          ? convictions.serveConvictionsApi(
              req,
              res,
              path,
              handOver.heldConvictions(config.memberConvictions),
            )
          : false
    : async () => false;

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
  family(quests.serveQuestsApi),
  family(questsTaken.serveQuestsTakenApi),
  family(bookWait.serveBookWaitApi),
  family(fastTrack.serveFastTrackApi),
  serveAlertDeliveryApi,
  serveWatchlistApi,
  serveOptionApi,
  family(draftOrder.serveDraftOrderApi),
  servePlaysApi,
  serveSettingsApi,
  serveSubscriptionsApi,
  family(memberConvictions.serveMemberConvictionsApi),
  family(memberCampaigns.serveMemberCampaignsApi),
  family(memberChains.serveMemberChainsApi),
  family(authoredPlays.serveAuthoredPlaysApi),
  serveSavedPositionsApi,
  family(targetSplit.serveTargetSplitApi),
  serveLearnApi,
  serveOnboardingApi,
  servePlaybooksApi,
  convictionRecords,
  serveControlsApi,
  (req, res, path, config, session) => serveCouncilApi(req, res, path, config.council, session),
  (req, res, path, config, session) =>
    serveCouncilRepliesApi(req, res, path, config.councilReplies, session),
  (req, res, path, config, session) =>
    serveFilingCommentsApi(req, res, path, config.filingComments, session),
  serveFeedbackApi,
  serveCompanionApi,
  serveAdminApi,
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
