import type { IncomingMessage, ServerResponse } from "node:http";
import { deriveOnboarding, ONBOARDING_MILESTONE } from "../domain/onboarding.js";
import { TRADE_TYPES } from "../domain/trade-types.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { requireGet, sendJson } from "./page-shell.js";

/**
 * MILESTONE M·01 AS DATA — `GET /api/onboarding`, the shell's Onboarding page (the Claude Design
 * canvas "Alpaca onboarding process streamline", 2026-09-02; IA in #1119). Three steps, each read
 * from the ledger that already proves it, never from the browser:
 *
 *   connect        — the session owns a HUMAN account on the board (`resolveOwnedIds` + hub state)
 *   first-feedback — the progression service's engagement track (a real feedback-log entry)
 *   first-trade    — at least one ladder milestone earned (a real fill)
 *
 * The account block rides along when connected — equity and cash from the live board snapshot,
 * rungs earned of the ladder — so the page's tiles and the milestone come from one read. Money is
 * the viewer's OWN account only: the id comes from the session, and a bot the member owns never
 * counts as "connected" (the canvas's step is your own paper account, the one you trade yourself).
 */

export interface OnboardingView {
  /** False when auth isn't configured — there is no member to onboard. */
  readonly linked: boolean;
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
  const progression =
    journeyId && config.progression ? await config.progression.view(journeyId) : undefined;
  const feedbackFiled = (progression?.engagementEarned ?? []).some(
    (m) => m.milestoneId === "first-feedback",
  );
  const rungsEarned = progression?.earned.length ?? 0;
  const progress = deriveOnboarding({
    connected: human !== undefined,
    feedbackFiled,
    firstFillEarned: rungsEarned > 0,
  });
  const next = progression?.nextUp
    ? TRADE_TYPES.find((t) => t.code === progression.nextUp)
    : undefined;
  return {
    linked,
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
