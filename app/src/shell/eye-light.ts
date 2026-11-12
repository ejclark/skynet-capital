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

/** The ring draws itself round the item from where the light touched it, starting the moment the
 *  spark lands and done inside 300 ms of it (#7227 criterion 1): it finishes as the dim peaks. */
export const RING_DRAW_MS = LAND_MS;

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
  /** Step 3 on: the ring and its label are on the item (it draws itself through step 3). */
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
  // The ring starts as the spark lands (#7227): it draws round the item while the page dims.
  if (ms < landEnd) return { step: 3, dim: DIM_MAX * clamp01((ms - arcEnd) / LAND_MS), ring: true };
  if (ms < LIGHT_MS)
    return { step: 4, dim: DIM_MAX * (1 - clamp01((ms - landEnd) / LIFT_MS)), ring: true };
  return { step: "done", ring: true };
}

/**
 * WHERE THE LIGHT TOUCHED THE ITEM (#7227 criterion 1): the spark comes down the arc's last leg,
 * from the arc's control point toward the item's centre, and crosses the item's edge on the way
 * in. The ring draws itself out both ways from there, so the motion starts where the eye followed
 * the spark to. Returned as a share (0–1) of the edge's length, clockwise from the top-left corner
 * — the way an SVG `<rect>`'s outline runs.
 */
export function touchShare(item: Rect, from: Point): number {
  const c = centre(item);
  const dx = from.x - c.x;
  const dy = from.y - c.y;
  const hw = item.width / 2;
  const hh = item.height / 2;
  const w = item.width;
  const h = item.height;
  const edge = 2 * (w + h);
  if (edge <= 0) return 0;
  // The ray from the centre toward `from` meets whichever edge it reaches first.
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  const p = Number.isFinite(t) ? { x: c.x + dx * t, y: c.y + dy * t } : { x: c.x, y: item.top };
  const x = Math.min(w, Math.max(0, p.x - item.left));
  const y = Math.min(h, Math.max(0, p.y - item.top));
  let along: number;
  if (y <= 0.5) along = x;
  else if (x >= w - 0.5) along = w + y;
  else if (y >= h - 0.5) along = w + h + (w - x);
  else along = 2 * w + h + (h - y);
  return (along / edge) % 1;
}

/** The part of the window the member can see the page through: under the sticky topbar, inside
 *  the window, and outside the chat panel. Undefined when the chat covers the whole page (the
 *  phone's full-screen chat): then nothing on the page is in view, and the light waits. */
export interface ViewArea {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export function viewArea(
  clear: number,
  win: { readonly width: number; readonly height: number },
  chat: Rect | null,
): ViewArea | undefined {
  let area: ViewArea = { top: clear, bottom: win.height, left: 0, right: win.width };
  if (!chat || chat.width <= 0 || chat.height <= 0) return area;
  const cr = chat.left + chat.width;
  const cb = chat.top + chat.height;
  // Clear of the page already (scrolled away, or off to one side of it).
  if (cr <= area.left || chat.left >= area.right || cb <= area.top || chat.top >= area.bottom)
    return area;
  if (chat.left > area.left) area = { ...area, right: chat.left };
  else if (cr < area.right) area = { ...area, left: cr };
  else if (chat.top > area.top) area = { ...area, bottom: chat.top };
  else if (cb < area.bottom) area = { ...area, top: cb };
  else return undefined;
  return area.right > area.left && area.bottom > area.top ? area : undefined;
}

/** The item wholly inside the area: nothing under the topbar, the chat or the window's edge. */
export const fullyInView = (r: Rect, a: ViewArea): boolean =>
  r.top >= a.top - 0.5 &&
  r.top + r.height <= a.bottom + 0.5 &&
  r.left >= a.left - 0.5 &&
  r.left + r.width <= a.right + 0.5;

/** How far to scroll the page down (negative: up) to bring the item into the area: centred when
 *  it fits, its top at the area's top when it is taller than the area. */
export function scrollToFit(r: Rect, a: ViewArea): number {
  const room = a.bottom - a.top;
  if (r.height >= room) return r.top - a.top;
  return r.top + r.height / 2 - (a.top + room / 2);
}

/** A request to light the item an anchor names (`pos-NVDA`): `seq` changes on every tap, so the
 *  same link tapped twice lights twice. */
export interface LightRequest {
  readonly anchor: string;
  readonly seq: number;
  /** Why the Eye lights it, in a few words for the ring's label (#7487 slice 7's tour). */
  readonly reason?: string;
}

interface LightStore {
  readonly request: LightRequest | undefined;
}

export const useEyeLight = create<LightStore>(() => ({ request: undefined }));

/** Light the item `path`'s hash names (`/accounts#pos-NVDA`); a path with no hash lights nothing.
 *  With `reason`, the ring's label says why the Eye holds it ("◉ the Eye · led the week"). */
export function requestLight(path: string, reason?: string): void {
  const hash = path.split("#")[1];
  if (!hash) return;
  let anchor = hash;
  try {
    anchor = decodeURIComponent(hash);
  } catch {
    // a malformed escape is still an anchor; match it as written
  }
  const seq = (useEyeLight.getState().request?.seq ?? 0) + 1;
  useEyeLight.setState({ request: { anchor, seq, ...(reason ? { reason } : {}) } });
}
