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
 * can alarm should tint the pill the day it ships, without anyone remembering to add it here.
 * `Bot activity` is the one that would cry wolf and it cannot — it only ever reads `unknown` by
 * construction (`src/server/ops-status-service.ts`, `ACTIVITY_QUIET_AFTER_MS`), because a day with
 * no bot orders is a quiet market, not an outage.
 */
export const opsAttentionCount = (view: OpsStatusView | undefined): number =>
  view?.available ? view.status.signals.filter((s) => s.verdict === "attention").length : 0;

/**
 * The flag's sentence, or nothing at all. The pill's TEXT stays the live stream's own state — the
 * two say different things (is this page current · is the fleet healthy) and collapsing them into
 * one string would make a healthy stream read as a healthy fleet. The flag is an extra mark, so it
 * survives the phone layout, where `status.css` hides the pill's text and leaves only its dots.
 */
export const opsAttentionLabel = (count: number): string | undefined =>
  count > 0
    ? count === 1
      ? "1 ops signal needs attention"
      : `${count} ops signals need attention`
    : undefined;
