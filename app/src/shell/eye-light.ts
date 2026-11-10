import { create } from "zustand";

/**
 * THE EYE'S LIGHT (#7216 slice 2; Eric's Build picks on #7018: round 5 "The Eye's light", round 6 B
 * "A spark along an arc", round 8 Q3 A "Spark, then spotlight"). When one of Moneypenny's links
 * names an item on the page, the light travels from the Eye to it, in four steps and about one
 * second: the Eye focuses under a small pool of light; a spark arcs over the page with a short
 * trail, lit by a moving spotlight; it lands as the page dims around the item; the dim lifts, and a
 * ring plus a label naming the Eye stay on the item. His words: "We need visual effects for the
 * light beam to manifest across the view to land on it's target - this helps the user move their
 * attention along the animation and what it focuses on", and "The eye effectively needs line of
 * sight to perform this task."
 *
 * This module is the light's arithmetic, pure so a spec can drive it: where the light starts, the
 * arc it flies, and what each step draws at a given moment. `eye-light-layer.tsx` draws it on a
 * layer above the page, outside the tower's canvas.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/** Where the Eye sits in the tower frame (`/tower?frame=card`, 384 × 664): measured on the built
 *  scene, 2026-11-09 — the iris centre at (230, 78). A share of the frame, so a resized slot keeps it. */
export const EYE_IN_FRAME: Point = { x: 0.6, y: 0.118 };

/** The four steps, in ms. Steps 1–3 take one second; the lift then hands over to the ring. */
export const FOCUS_MS = 200;
export const ARC_MS = 520;
export const LAND_MS = 280;
export const LIFT_MS = 320;
export const LIGHT_MS = FOCUS_MS + ARC_MS + LAND_MS + LIFT_MS;

/** How dark the page goes around the item at the height of the landing. */
export const DIM_MAX = 0.55;

/** Where the light starts. `tower`: the column's Eye, on screen. `brand`: the topbar's still Eye
 *  (the phone face, `brand-eye.tsx`). `edge`: the column's Eye is scrolled above the page, so the
 *  light breaks in under the topbar on the line from the Eye to the item. */
export type OriginKind = "tower" | "brand" | "edge";

export interface Origin extends Point {
  readonly kind: OriginKind;
}

/**
 * The light's start, or undefined when no Eye is drawn (no column at this width, and no brand Eye):
 * then only the ring shows, as under reduced motion.
 *
 * @param frame  the tower frame's box while it is shown, else null
 * @param brand  the topbar's Eye's box while it is laid out, else null
 * @param clear  how far down the sticky topbar reaches
 */
export function lightOrigin(
  frame: Rect | null,
  brand: Rect | null,
  clear: number,
): Origin | undefined {
  if (frame && frame.width > 0 && frame.height > 0) {
    const eye = {
      x: frame.left + frame.width * EYE_IN_FRAME.x,
      y: frame.top + frame.height * EYE_IN_FRAME.y,
    };
    if (eye.y >= clear) return { kind: "tower", ...eye };
    // Scrolled above the topbar: the light drops in under it, straight below the Eye, so it still
    // comes from the tower's side of the page.
    return { kind: "edge", x: eye.x, y: clear };
  }
  if (brand && brand.width > 0) return { kind: "brand", ...centre(brand) };
  return undefined;
}

export const centre = (r: Rect): Point => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/** The arc's control point: above the straight line's midpoint, by a share of its length, so the
 *  spark rises over the page and comes down onto the item rather than sliding across the text —
 *  but never above `ceiling` (the topbar's foot), so the whole flight stays in sight. */
export function arcControl(from: Point, to: Point, ceiling = 0): Point {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const lift = Math.min(260, dist * 0.35);
  return { x: (from.x + to.x) / 2, y: Math.max(ceiling, Math.min(from.y, to.y) - lift) };
}

/** The point `t` (0–1) along the quadratic arc from `from` to `to`, under `ceiling`. */
export function onArc(from: Point, to: Point, t: number, ceiling = 0): Point {
  const c = arcControl(from, to, ceiling);
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * c.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * c.y + t * t * to.y,
  };
}

/** Ease-in-out: the spark leaves the Eye gently and settles onto the item. */
const ease = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/** The trail behind the spark: this share of the arc. */
const TRAIL = 0.22;
const TRAIL_POINTS = 10;

/** What the light draws at one moment. Absent parts are not drawn. */
export interface LightFrame {
  readonly step: 1 | 2 | 3 | 4 | "done";
  /** Step 1: the pool of light at the Eye. */
  readonly pool?: { readonly r: number; readonly opacity: number };
  /** Step 2: the spark, its trail (oldest first) and the spotlight that follows it. */
  readonly spark?: Point;
  readonly trail?: readonly Point[];
  /** Steps 3–4: how dark the page is around the item. */
  readonly dim?: number;
  /** Step 4 on: the ring and its label are on the item. */
  readonly ring: boolean;
}

/** The light at `ms` after it starts, flying from `from` to `to` under `ceiling`. */
export function lightAt(ms: number, from: Point, to: Point, ceiling = 0): LightFrame {
  if (ms < FOCUS_MS) {
    const t = clamp01(ms / FOCUS_MS);
    return { step: 1, pool: { r: 10 + 26 * t, opacity: 0.35 + 0.5 * t }, ring: false };
  }
  const arcEnd = FOCUS_MS + ARC_MS;
  if (ms < arcEnd) {
    const t = ease(clamp01((ms - FOCUS_MS) / ARC_MS));
    const trail: Point[] = [];
    for (let i = 0; i <= TRAIL_POINTS; i++)
      trail.push(onArc(from, to, Math.max(0, t - TRAIL + (TRAIL * i) / TRAIL_POINTS), ceiling));
    return {
      step: 2,
      pool: { r: 36, opacity: 0.85 * (1 - t) },
      spark: onArc(from, to, t, ceiling),
      trail,
      ring: false,
    };
  }
  const landEnd = arcEnd + LAND_MS;
  if (ms < landEnd)
    return { step: 3, dim: DIM_MAX * clamp01((ms - arcEnd) / LAND_MS), ring: false };
  if (ms < LIGHT_MS)
    return { step: 4, dim: DIM_MAX * (1 - clamp01((ms - landEnd) / LIFT_MS)), ring: true };
  return { step: "done", ring: true };
}

/** A request to light the item an anchor names (`pos-NVDA`): `seq` changes on every tap, so the
 *  same link tapped twice lights twice. */
export interface LightRequest {
  readonly anchor: string;
  readonly seq: number;
}

interface LightStore {
  readonly request: LightRequest | undefined;
}

export const useEyeLight = create<LightStore>(() => ({ request: undefined }));

/** Light the item `path`'s hash names (`/accounts#pos-NVDA`); a path with no hash lights nothing. */
export function requestLight(path: string): void {
  const hash = path.split("#")[1];
  if (!hash) return;
  let anchor = hash;
  try {
    anchor = decodeURIComponent(hash);
  } catch {
    // a malformed escape is still an anchor; match it as written
  }
  const seq = (useEyeLight.getState().request?.seq ?? 0) + 1;
  useEyeLight.setState({ request: { anchor, seq } });
}
