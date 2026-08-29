/**
 * Boot-time wiring for the trading companion (#467) — shares `ANTHROPIC_API_KEY` and its
 * envelope-protected round/size caps with the feedback coach; no new credential, no new Fly
 * secret. Also owns constructing the shared `ProgressionService` (the companion's curriculum
 * tool and the dashboard's own `/learn`/`/trade` gate read the exact same instance) so
 * `serve-dashboard.ts` doesn't carry two call sites for one service. Pulled into its own file for
 * the same reason `dashboard-feedback.ts` is: keep that file's own complexity budget
 * (`scripts/arch-scan.mjs`).
 */
import { resolveCompanionChat } from "../companion/companion-chat.js";
import type { CompanionDeskDeps } from "../companion/companion-tools.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import type { ObservatoryHub } from "../server/observatory-hub.js";
import type { OrderAuditRecord } from "../server/order-audit-log.js";
import {
  createProgressionService,
  type ProgressionService,
} from "../server/progression-service.js";
import { createProgressionStore } from "../server/progression-store.js";

export interface CompanionSetupDeps {
  readonly hub: ObservatoryHub;
  readonly readFills: (id: string) => Promise<readonly TradeActivityRecord[]>;
  readonly readTags: (id: string) => Promise<readonly OrderAuditRecord[]>;
}

export interface CompanionSetup {
  readonly companion: ReturnType<typeof resolveCompanionChat>;
  readonly progression: ProgressionService;
}

/** Resolve the companion turn (and the progression service its curriculum tool reads) for one
 *  boot, warning on the same env gap the coach warns on. */
export function setupCompanion(env: NodeJS.ProcessEnv, deps: CompanionSetupDeps): CompanionSetup {
  const progression = createProgressionService({
    readFills: deps.readFills,
    readTags: deps.readTags,
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
  return { companion, progression };
}
