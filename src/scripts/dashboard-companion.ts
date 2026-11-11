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
import { assembleChain } from "../adapters/alpaca-recommend-chain.js";
import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { resolveCompanionChat } from "../companion/companion-chat.js";
import type { CompanionDeskDeps } from "../companion/companion-tools.js";
import { marketDayKey } from "../domain/market-day.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import { rankStructures } from "../options/recommend.js";
import type { BotControlsStore } from "../server/bot-controls-store.js";
import { createCompanionMessageLogStore } from "../server/companion-message-log.js";
import { shelfAnswered } from "../server/discovery-answered.js";
import { createDiscoveryQueueStore } from "../server/discovery-queue-store.js";
import { opaqueMemberId } from "../server/feedback-issue.js";
import type { FeedbackLogStore } from "../server/feedback-log.js";
import { resolveSimilarFeedback } from "../server/feedback-similar.js";
import { createHouseResearchReader } from "../server/house-research.js";
import type { LadderEvidenceReader } from "../server/ladder-evidence.js";
import { shelfResearched } from "../server/member-campaign-store.js";
import type { ObservatoryHub } from "../server/observatory-hub.js";
import { logKeyFor } from "../server/owner-link-store.js";
import {
  createProgressionService,
  type ProgressionService,
} from "../server/progression-service.js";
import { createProgressionStore } from "../server/progression-store.js";
import { resolveRoadmap } from "../server/roadmap.js";
import { upcomingEvents } from "../server/upcoming-events.js";
import { resolveWhatMembersAsk } from "../server/what-members-ask.js";
import { resolveWorkStatus } from "../server/work-status.js";

export interface CompanionSetupDeps {
  readonly hub: ObservatoryHub;
  readonly readFills: (id: string) => Promise<readonly TradeActivityRecord[]>;
  /** What the ladder's two ledgers prove (`ladder-evidence.ts`) — held, advanced by appended lines. */
  readonly readEvidence: LadderEvidenceReader;
  /** What a member has filed — #567's original engagement evidence, kept only to grandfather a
   *  member who filed before the message log existed (`progression-service.ts`'s `readFeedback`
   *  doc). */
  readonly feedbackLog: FeedbackLogStore;
  /** The reverse lookup from a desk id to its owner's email (`owner-link-store.ts`) — both logs
   *  above are keyed by the OWNER's opaque id, never the desk id `progression.view` is asked
   *  about, so every read here crosses that seam via `logKeyFor`. */
  readonly ownerEmailFor: (participantId: string) => string | undefined;
  /** Mission Control's own store (#1672 slice 4) — read fresh on every turn for the owner's
   *  model dial, so a flip in the UI needs no redeploy. Optional: without it (offline/test
   *  wiring) the companion just runs `companion-model.ts`'s own default, same as before slice 4. */
  readonly botControls?: BotControlsStore;
  /** Resolves a participant's own linked options client — the recommender tool's data source.
   *  Optional, like `botControls`: without it, `get_structures_for_outlook` degrades to "not
   *  available" rather than throwing. */
  readonly optionsClientFor?: (participantId: string) => AlpacaOptionsClient | undefined;
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
    readEvidence: deps.readEvidence,
    readMessages: (id) => companionMessageLog.list(keyFor(id)),
    readFeedback: (id) => deps.feedbackLog.list(keyFor(id)),
    store: createProgressionStore(env, (m) => console.error(m)),
  });
  const optionsClientFor = deps.optionsClientFor;
  const findSimilarFeedback = resolveSimilarFeedback(env);
  const readWorkStatus = resolveWorkStatus(env);
  const readRoadmap = resolveRoadmap(env);
  // A read-only second handle on the research list's file (the access wiring holds the writing
  // one, `dashboard-access.ts`); the store reads the file fresh on each load, so a new ask shows
  // up on the next turn. The shelf is read fresh per call too, the way the ask route reads it, and
  // an ask the shelf already answers is dropped the way every other reader of the list drops it.
  const researchList = createDiscoveryQueueStore(env, (m) => console.error(m));
  const readResearchOn = createHouseResearchReader({
    shelf: () => shelfResearched(),
    queue: () => researchList.load(),
    answered: shelfAnswered(),
    today: () => marketDayKey(new Date().toISOString()),
  });
  const tools: CompanionDeskDeps = {
    snapshotFor: (id) => deps.hub.getState().participants.find((p) => p.id === id),
    readTradeActivity: deps.readFills,
    progression,
    // League-wide counts only (#7286 slice 4): the research list and question log on the volume,
    // and the feedback log this boot already holds. Never a name, a key or a member's words.
    readWhatMembersAsk: resolveWhatMembersAsk(env, deps.feedbackLog, (m) => console.error(m)),
    ...(findSimilarFeedback ? { findSimilarFeedback } : {}),
    ...(readWorkStatus ? { readWorkStatus } : {}),
    ...(readRoadmap ? { readRoadmap } : {}),
    // The calendar and the ledgers are baked into the image, so this is always wired; the market
    // day is New York's, so an evening question doesn't read tomorrow's fortnight.
    readUpcomingEvents: (held, underlying) =>
      upcomingEvents({
        asOf: marketDayKey(new Date().toISOString()),
        held,
        ...(underlying ? { underlying } : {}),
      }),
    // The ledgers, campaigns and lessons are checked in; the research list is on the volume.
    readResearchOn,
    ...(optionsClientFor
      ? {
          rankFor: async (participantId, outlook) => {
            const client = optionsClientFor(participantId);
            if (!client) return undefined;
            const today = new Date().toISOString().slice(0, 10);
            const assembled = await assembleChain(client, outlook.symbol, today);
            if (!assembled) return undefined;
            return rankStructures(
              outlook,
              { spot: assembled.spot, volatility: assembled.volatility },
              assembled.chain,
            );
          },
        }
      : {}),
  };
  const companion = resolveCompanionChat(
    env,
    tools,
    deps.botControls ? () => deps.botControls?.load().companionModel : undefined,
    (line) => console.log(line),
  );
  if (!companion) {
    console.warn(
      "ℹ️  The trading companion is off (no ANTHROPIC_API_KEY) — /api/companion answers 'not switched on yet'.",
    );
  }
  return { companion, progression, companionMessageLog };
}
