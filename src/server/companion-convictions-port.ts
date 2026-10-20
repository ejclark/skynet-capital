import type {
  ChatConvictionsSummary,
  CompanionConvictions,
} from "../companion/companion-convictions.js";
import type { Session } from "./auth/session.js";
import { takesOver } from "./conviction-hand-over.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { judgeDraft, steerablePairs } from "./member-convictions-api-routes.js";

/**
 * MONEYPENNY'S CONVICTION READS, BOUND TO ONE SESSION (#5482 criterion 9). The chat route builds this
 * per turn, so the chat's two conviction tools read exactly what `GET /api/convictions/mine` and
 * `POST /api/convictions/draft` read for the same signed-in member — the session's own name, its own
 * bots, its own views — and never a body field or another member's.
 *
 * Reads only, on purpose: there is no save, hand-over or subscribe here. The member's tap on the
 * card posts to `/save` and `/hand-over` from the rail, and those judge the draft again.
 */
export function companionConvictionsFor(
  config: DashboardServerConfig,
  session: Session,
): CompanionConvictions {
  return {
    mine: (): ChatConvictionsSummary => ({
      label: "SIM",
      steerable: steerablePairs(config, session),
      views: (config.memberConvictions?.list(opaqueMemberId(session.email)) ?? []).map((r) => ({
        id: r.conviction.id,
        ...(r.conviction.title ? { title: r.conviction.title } : {}),
        status: r.status,
        steers: r.conviction.steers,
        checkOn: r.conviction.checkOn,
      })),
    }),
    draft: (input) => {
      const outcome = judgeDraft(input, config, session);
      if (!outcome.ok) return outcome;
      const over = takesOver(
        outcome.conviction,
        resolveOwnedIds(session, config),
        config.subscriptions?.load() ?? {},
      );
      return {
        ok: true,
        drafted: {
          draft: input,
          conviction: outcome.conviction,
          card: outcome.card,
          takesOver: over,
        },
      };
    },
  };
}
