import { postJson } from "./post";

/**
 * The desk's alerts, client side (#3407 P4 slice 1) — types mirror `desk-alerts-route.ts`. The
 * server derives every alert from the member's own positions and subtracts what they dismissed;
 * this side renders and forwards a dismissal by fingerprint. Nothing is decided here.
 */

export type AlertPriority = "critical" | "warning" | "info";

export interface DeskAlert {
  readonly id: string;
  readonly at: number;
  readonly source: string;
  readonly priority: AlertPriority;
  readonly title: string;
  readonly symbol?: string;
  readonly body?: string;
  readonly fingerprint: string;
}

export type DeskAlerts =
  | {
      readonly available: true;
      readonly asOf: string;
      readonly alerts: readonly DeskAlert[];
      /** False when this deployment keeps no dismissals — the strip says so instead of a dead button. */
      readonly dismissable: boolean;
    }
  | {
      readonly available: false;
      readonly reason: string;
      readonly alerts: readonly [];
      readonly dismissable: false;
    };

export type DismissResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly refusals: readonly string[] };

export async function fetchDeskAlerts(participantId: string): Promise<DeskAlerts> {
  const res = await fetch(`/api/trade/alerts?participantId=${encodeURIComponent(participantId)}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`GET /api/trade/alerts → ${res.status}`);
  return (await res.json()) as DeskAlerts;
}

export const dismissDeskAlert = (
  participantId: string,
  fingerprint: string,
): Promise<DismissResult> => postJson("/api/trade/alerts/dismiss", { participantId, fingerprint });
