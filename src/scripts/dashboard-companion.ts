/**
 * Boot-time wiring for the trading companion — shares `ANTHROPIC_API_KEY` and its
 * envelope-protected round/size caps with the feedback coach; no new credential, no new Fly
 * secret. Also owns constructing the shared `ProgressionService` (the companion's curriculum
 * tool and the dashboard's own `/learn`/`/trade` gate read the exact same instance) and the
 * message log the ladder gate's low bar reads (companion-message-log.ts), so
 * `serve-dashboard.ts` doesn't carry two call sites for one service. Pulled into its own file for
 * the same reason `dashboard-feedback.ts` is: keep that file's own complexity budget
 * (`scripts/arch-scan.mjs`).
 */
import { resolveCompanionChat } from "../companion/companion-chat.js";
import type { CompanionDeskDeps } from "../companion/companion-tools.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import { createCompanionMessageLogStore } from "../server/companion-message-log.js";
import { opaqueMemberId } from "../server/feedback-issue.js";
import type { FeedbackLogStore } from "../server/feedback-log.js";
import type { ObservatoryHub } from "../server/observatory-hub.js";
import type { OrderAuditRecord } from "../server/order-audit-log.js";
import { logKeyFor } from "../server/owner-link-store.js";
import {
  createProgressionService,
  type ProgressionService,
} from "../server/progression-service.js";
import { createProgressionStore } from "../server/progression-store.js";

export interface CompanionSetupDeps {
  readonly hub: ObservatoryHub;
  readonly readFills: (id: string) => Promise<readonly TradeActivityRecord[]>;
  readonly readTags: (id: string) => Promise<readonly OrderAuditRecord[]>;
  /** What a member has filed — #567's original engagement evidence, kept only to grandfather a
   *  member who filed before the message log existed (`progression-service.ts`'s `readFeedback`
   *  doc). */
  readonly feedbackLog: FeedbackLogStore;
  /** The reverse lookup from a desk id to its owner's email (`owner-link-store.ts`) — both logs
   *  above are keyed by the OWNER's opaque id, never the desk id `progression.view` is asked
   *  about, so every read here crosses that seam via `logKeyFor`. */
  readonly ownerEmailFor: (participantId: string) => string | undefined;
}

export interface CompanionSetup {
  readonly companion: ReturnType<typeof resolveCompanionChat>;
  readonly progression: ProgressionService;
  /** What a member has said to Moneypenny, at all — the ladder gate's own evidence, and
   *  `/api/companion/ack`'s store (wired directly, by the session's own opaque id). */
  readonly companionMessageLog: ReturnType<typeof createCompanionMessageLogStore>;
}

/** Resolve the companion turn (and the progression service its curriculum tool reads) for one
 *  boot, warning on the same env gap the coach warns on. */
export function setupCompanion(env: NodeJS.ProcessEnv, deps: CompanionSetupDeps): CompanionSetup {
  const companionMessageLog = createCompanionMessageLogStore(env);
  const keyFor = (id: string) => logKeyFor(deps.ownerEmailFor, opaqueMemberId, id);
  const progression = createProgressionService({
    readFills: deps.readFills,
    readTags: deps.readTags,
    readMessages: (id) => companionMessageLog.list(keyFor(id)),
    readFeedback: (id) => deps.feedbackLog.list(keyFor(id)),
    store: createProgressionStore(env, (m) => console.error(m)),
  });
  const tools: CompanionDeskDeps = {
    snapshotFor: (id) => deps.hub.getState().participants.find((p) => p.id === id),
    readTradeActivity: deps.readFills,
    progression,
  };
  const companion = resolveCompanionChat(env, tools);
  if (!companion) {
    console.warn(
      "ℹ️  The trading companion is off (no ANTHROPIC_API_KEY) — /api/companion answers 'not switched on yet'.",
    );
  }
  return { companion, progression, companionMessageLog };
}
