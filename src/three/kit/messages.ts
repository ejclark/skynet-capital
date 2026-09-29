/**
 * THE MESSAGE CONTRACT between the page and the tower's frame (plan #3807 slice 3a; the design
 * panel's §4). Direction-only and dial-only: nothing about an account crosses the frame except two
 * dials (power, health) the page already bakes into `?power=&health=` today.
 *
 * A message counts only when it comes from OUR origin AND from the window that embeds us — a
 * same-origin popup or a sibling frame posting into this one is ignored (the origin check alone
 * used to let those through).
 *
 * Pure, no DOM: `readTowerMessage` takes the three fields of a `MessageEvent` it needs.
 */

import { FLARE_KINDS, type FlareKind } from "./flare.js";

/** Page → scene. */
export type TowerMessage =
  /** A click on a filter: look toward this point (the frame's CSS pixels; may lie outside). */
  | { readonly type: "tower:glance"; readonly x: number; readonly y: number }
  /** A pointer hovering a calendar day or a blotter row: look, capped by the glance's own hold. */
  | { readonly type: "tower:regard"; readonly x: number; readonly y: number }
  /** The pointer left: ease the regard out now. */
  | { readonly type: "tower:release" }
  /** Live dials — relight the forge without a reload. */
  | { readonly type: "tower:mood"; readonly power: number; readonly health: number }
  /** The frame is seen (`true`) or hidden/off-screen (`false`). */
  | { readonly type: "tower:run"; readonly on: boolean }
  /** Something good just happened (slice 3b-3): the Eye flares once. Unknown kinds are dropped. */
  | { readonly type: "tower:flare"; readonly kind: FlareKind };

/** Scene → page. */
export type TowerNotice = { readonly type: "tower:ready" };

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** The fields of a `MessageEvent` the check needs. */
export interface Envelope {
  readonly origin: string;
  readonly source: unknown;
  readonly data: unknown;
}

/** Where we are: our own origin, and the window that embeds us (`window.parent`). */
export interface Here {
  readonly origin: string;
  readonly parent: unknown;
}

/** The message, if it is well-formed and from the page that embeds us; otherwise `undefined`. */
export function readTowerMessage(e: Envelope, here: Here): TowerMessage | undefined {
  if (e.origin !== here.origin || e.source !== here.parent) return undefined;
  const d = e.data;
  if (typeof d !== "object" || d === null) return undefined;
  const m = d as Record<string, unknown>;
  switch (m.type) {
    case "tower:glance":
    case "tower:regard":
      return num(m.x) && num(m.y) ? { type: m.type, x: m.x, y: m.y } : undefined;
    case "tower:release":
      return { type: "tower:release" };
    case "tower:mood":
      return num(m.power) && num(m.health)
        ? { type: "tower:mood", power: m.power, health: m.health }
        : undefined;
    case "tower:run":
      return typeof m.on === "boolean" ? { type: "tower:run", on: m.on } : undefined;
    case "tower:flare":
      return FLARE_KINDS.includes(m.kind as FlareKind)
        ? { type: "tower:flare", kind: m.kind as FlareKind }
        : undefined;
    default:
      return undefined;
  }
}
