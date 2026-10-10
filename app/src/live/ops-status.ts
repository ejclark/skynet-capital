/**
 * FLEET OPS STATUS, AS THE GROUP SEES IT (#1296) — the client model for `/api/ops-status`.
 *
 * It used to be `/api/admin/ops-status`, owner-only, and it answered `{owner:false}` to everyone
 * else (`admin.ts`). Eric's call (2026-09-04): fleet health "should be public for the group", so
 * the endpoint moved out of the admin family and the only gate left is the app's own sign-in.
 * `available:false` now means "this deployment has no ops panel wired", not "you may not look".
 */

export interface OpsSignal {
  readonly id: string;
  readonly label: string;
  readonly verdict: "ok" | "attention" | "unknown";
  readonly detail: string;
  readonly link?: { readonly href: string; readonly label: string };
}

export interface OpsStatus {
  readonly generatedAt: string;
  /** The deploy signals are running without a GitHub token — an honestly smaller panel, not an
   *  error. */
  readonly degraded: boolean;
  readonly signals: readonly OpsSignal[];
}

export type OpsStatusView =
  | { readonly available: false }
  | { readonly available: true; readonly status: OpsStatus };

export const fetchOpsStatus = async (): Promise<OpsStatusView> => {
  const res = await fetch("/api/ops-status", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`/api/ops-status ${res.status}`);
  return (await res.json()) as OpsStatusView;
};

/**
 * How many signals are asking for a human. Deliberately NOT an id allowlist: a new signal that
 * can alarm should reach the status line the day it ships, without anyone remembering it here.
 * `Bot activity` is the one that would cry wolf and it cannot — it only ever reads `unknown` by
 * construction (`src/server/ops-status-service.ts`, `ACTIVITY_QUIET_AFTER_MS`), because a day with
 * no bot orders is a quiet market, not an outage.
 */
export const opsAttentionCount = (view: OpsStatusView | undefined): number =>
  view?.available ? view.status.signals.filter((s) => s.verdict === "attention").length : 0;

/**
 * The alarm's sentence, or nothing at all. The live stream keeps its own row in the opened panel
 * (`shell/fleet-health.tsx`) — the two say different things (is this page current · is the fleet
 * healthy), and collapsing them into one string would make a healthy stream read as a healthy fleet.
 */
export const opsAttentionLabel = (count: number): string | undefined =>
  count > 0
    ? count === 1
      ? "1 ops signal needs attention"
      : `${count} ops signals need attention`
    : undefined;

/** What the fleet's half of the top bar's status line says (#5037 round 2, question 9). */
export interface FleetReading {
  readonly verdict: "ok" | "attention" | "unknown";
  /** Words for the line itself — present only when something is wrong or unreadable. */
  readonly line?: string;
  /** The opened panel's one-sentence summary, beside its Details control. */
  readonly summary: string;
}

/**
 * The fleet dot left the bar (#5037 round 2, question 9: "too many icons… competing for
 * attention"); what it said now rides the market's status line as WORDS, and only when there is
 * something to say. A healthy fleet adds nothing — the line is the market's. A degraded one is
 * counted in words. A read that FAILED is said too, even over an older answer still in the cache:
 * it fails closed (#1307, "silence is a fault, not health"), so an unreachable panel never passes
 * for a quiet one. The first read in flight and a deployment with no panel wired stay off the
 * line — neither is a fault of the fleet — and the opened panel says which it is.
 */
export function fleetReading(view: OpsStatusView | undefined, failed: boolean): FleetReading {
  if (failed) {
    return {
      verdict: "unknown",
      line: "fleet status unknown",
      summary: "Fleet health · no reading right now",
    };
  }
  if (!view) return { verdict: "unknown", summary: "Fleet health · reading…" };
  if (!view.available) {
    return { verdict: "unknown", summary: "Fleet health · not wired in this deployment" };
  }
  const count = opsAttentionCount(view);
  if (count > 0) {
    return {
      verdict: "attention",
      line: count === 1 ? "1 fleet alert" : `${count} fleet alerts`,
      summary: `Fleet health · ${opsAttentionLabel(count)}`,
    };
  }
  return { verdict: "ok", summary: "Fleet health · nothing needs attention" };
}
