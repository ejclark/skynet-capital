import type { IncomingMessage, ServerResponse } from "node:http";
import { COURSES, type CourseLevel, graduatingLevel } from "../domain/curriculum.js";
import { regularSessionOpen } from "../domain/market-session.js";
import { deriveOnboarding, ONBOARDING_MILESTONE } from "../domain/onboarding.js";
import { TRADE_TYPES } from "../domain/trade-types.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { requireGet, sendJson } from "./page-shell.js";

/**
 * MILESTONE M·01 AS DATA — `GET /api/onboarding`, the shell's Onboarding page (the Claude Design
 * canvas "Alpaca onboarding process streamline", 2026-09-02; IA in #1119; step 2's bar lowered
 * 2026-09-03 from a filed issue to a message). Three steps, each read from the ledger that
 * already proves it, never from the browser:
 *
 *   connect       — the session owns a HUMAN account on the board (`resolveOwnedIds` + hub state)
 *   first-message — the progression service's engagement track (a real message-log entry)
 *   first-trade   — at least one ladder milestone earned (a real fill)
 *
 * The account block rides along when connected — equity and cash from the live board snapshot,
 * rungs earned of the ladder — so the page's tiles and the milestone come from one read. Money is
 * the viewer's OWN account only: the id comes from the session, and a bot the member owns never
 * counts as "connected" (the canvas's step is your own paper account, the one you trade yourself).
 */

export interface OnboardingView {
  /** False when auth isn't configured — there is no member to onboard. */
  readonly linked: boolean;
  /** The signed-in member's name from the session, for "Welcome to the league, <name>" before
   *  any account exists to carry a display name. Absent without auth or a nameless session. */
  readonly viewerName?: string;
  /** The member's opaque id (the feedback log's own key) — what the rail keys its thread by, so
   *  a shared device never shows one member another's conversation. Absent without a session. */
  readonly viewerId?: string;
  /** The server's regular-session clock, so the intro's steer and the model agree. */
  readonly marketOpen: boolean;
  readonly milestone: typeof ONBOARDING_MILESTONE;
  readonly steps: ReturnType<typeof deriveOnboarding>["steps"];
  readonly done: number;
  readonly total: number;
  readonly points: number;
  readonly totalPoints: number;
  readonly complete: boolean;
  /** Present exactly when the connect step is done. */
  readonly account?: {
    readonly id: string;
    readonly displayName: string;
    readonly equity: number;
    readonly cash: number;
    /** True when the last account read failed — the tiles then say so instead of showing zeros. */
    readonly stale: boolean;
    readonly rungsEarned: number;
    readonly rungsTotal: number;
    /** The next rung's code and title, when the ladder isn't finished. */
    readonly nextUp?: { readonly code: string; readonly title: string };
    /**
     * Present exactly when a freshly-earned, not-yet-claimed milestone just graduated a whole
     * course (#469 slice 4) — the companion's cue to congratulate on next open
     * (`companion-context.ts`). Clears the moment the member claims the banner
     * (`progression-service.ts`'s `acknowledge`), same lifetime as the banner itself.
     */
    readonly freshGraduation?: { readonly level: CourseLevel; readonly title: string };
  };
}

export async function onboardingView(
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<OnboardingView> {
  const linked = Boolean(config.auth && session);
  const board = config.hub.getState().participants;
  const owned = linked ? resolveOwnedIds(session, config) : [];
  const human = owned
    .map((id) => board.find((p) => p.id === id))
    .find((p) => p !== undefined && p.kind === "human");
  // The journey resolves exactly as /api/learn does — the session's own progression, nobody else's.
  const journeyId = linked ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  // The feedback log is keyed by the email hash, not the account id (#1171) — pass both.
  const progression =
    journeyId && config.progression
      ? await config.progression.view(
          journeyId,
          session ? opaqueMemberId(session.email) : undefined,
        )
      : undefined;
  const messaged = (progression?.engagementEarned ?? []).some(
    (m) => m.milestoneId === "first-message",
  );
  const rungsEarned = progression?.earned.length ?? 0;
  const progress = deriveOnboarding({
    connected: human !== undefined,
    messaged,
    firstFillEarned: rungsEarned > 0,
  });
  const next = progression?.nextUp
    ? TRADE_TYPES.find((t) => t.code === progression.nextUp)
    : undefined;
  // The first still-celebrating earn that graduated a course — same "fresh, unclaimed" window the
  // milestone banner itself uses, so this clears the instant the member claims it. Checked against
  // the REAL earned set (never just this one milestone's position) — seeded/imported history can
  // hold a course's last milestone without an earlier one (`graduatingLevel`'s own doc).
  const earnedIds = new Set((progression?.earned ?? []).map((m) => m.milestoneId));
  const graduatedLevel = (progression?.celebrating ?? [])
    .map((m) => graduatingLevel(m.milestoneId, earnedIds))
    .find((level): level is CourseLevel => level !== undefined);
  const graduatedCourse = graduatedLevel && COURSES.find((c) => c.level === graduatedLevel);
  return {
    linked,
    ...(session?.name ? { viewerName: session.name } : {}),
    ...(session?.email ? { viewerId: opaqueMemberId(session.email) } : {}),
    marketOpen: regularSessionOpen(),
    milestone: ONBOARDING_MILESTONE,
    ...progress,
    ...(human
      ? {
          account: {
            id: human.id,
            displayName: human.displayName,
            equity: human.equity,
            cash: human.cash,
            stale: Boolean(human.error),
            rungsEarned,
            rungsTotal: TRADE_TYPES.length,
            ...(next ? { nextUp: { code: next.code, title: next.name } } : {}),
            ...(graduatedCourse
              ? { freshGraduation: { level: graduatedCourse.level, title: graduatedCourse.title } }
              : {}),
          },
        }
      : {}),
  };
}

/** Handle `GET /api/onboarding`. Returns true when the request was answered. */
export async function serveOnboardingApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/onboarding") return false;
  if (!requireGet(req, res)) return true;
  sendJson(res, 200, await onboardingView(config, session));
  return true;
}
