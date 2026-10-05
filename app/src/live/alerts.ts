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

/**
 * Delivery — whether these same alerts also reach the member when the page is closed (#3407 P4
 * slice 3). `available: false` always carries a `reason` sentence the panel prints verbatim: a
 * deployment with no mail credential, or a sign-in that never gave us an address. The destination
 * is NEVER sent from here — the server reads it off the session, so this side cannot name a
 * recipient at all.
 */
export type DeliveryChannel = "off" | "email";

export interface AlertDelivery {
  readonly available: boolean;
  readonly reason?: string;
  readonly channels: readonly DeliveryChannel[];
  readonly channel: DeliveryChannel;
  readonly minPriority: AlertPriority;
  readonly destination?: string;
  /** Who it would arrive from, so a member knows what to look for before they opt in. */
  readonly from?: string;
}

export type SaveDeliveryResult = {
  readonly ok: boolean;
  readonly refusals?: readonly string[];
};

export async function fetchAlertDelivery(participantId: string): Promise<AlertDelivery> {
  const res = await fetch(
    `/api/trade/alerts/delivery?participantId=${encodeURIComponent(participantId)}`,
    { credentials: "same-origin" },
  );
  if (!res.ok) throw new Error(`GET /api/trade/alerts/delivery → ${res.status}`);
  return (await res.json()) as AlertDelivery;
}

export const saveAlertDelivery = (
  participantId: string,
  channel: DeliveryChannel,
  minPriority: AlertPriority,
): Promise<SaveDeliveryResult> =>
  postJson("/api/trade/alerts/delivery", { participantId, channel, minPriority });
