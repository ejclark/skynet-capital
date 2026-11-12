import { create } from "zustand";

/**
 * THE EYE'S LIGHT (#7216 slice 2; Eric's Build picks on #7018: round 5 "The Eye's light"). When one
 * of Moneypenny's links, or the Eye itself (`eye-notice.ts`), points at an item on the page, the
 * light travels from the Eye to it. His words: "We need visual effects for the light beam to
 * manifest across the view to land on it's target - this helps the user move their attention along
 * the animation and what it focuses on", and "The eye effectively needs line of sight to perform
 * this task."
 *
 * THE BEAM (#7487 slice 5; the Campaign mission control spec § "5. The Eye", and the handoff's
 * `reference/Campaign Hub Prototype v2.dc.html`). It replaced the spark that arced over the page
 * (#7216's round 6 B and round 8 "spark, then spotlight"): a short STRAIGHT beam extends from the
 * Eye to the item — no sweep — and runs BEHIND the cards. It shows in the gaps between them, each
 * card it crosses glows through from behind as the beam's tip reaches it (no border flash), and the
 * card it lands in is lit from behind; then the ring and its label stay on the item:
 * `◉ THE EYE · <reason>`. The spec's timing, about 220 ms to extend, 200 ms held and 240 ms to fade,
 * is mapped onto the house's tokens (`theme.css`): the extend and the fade run on `--dur-spatial`
 * and `--ease-spatial`, and the hold is `BEAM_HOLD_MS`, a pause rather than a third speed. Under
 * reduced motion no beam plays and the ring shows at once. Declined, never to be re-proposed (the
 * spec's list): a sweeping cone of light, and the Eye on the chat panel's edge.
 *
 * This module is the light's arithmetic, pure so a spec can drive it: where the light starts, the
 * line it runs along, which cards it crosses and when its tip reaches each. `eye-light-layer.tsx`
 * draws it on a layer above the page, outside the tower's canvas.
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

/** How long the beam holds on the item before it fades: the spec's 200 ms. A pause, not a speed, so
 *  it is no third duration token (docs/vendor/emil-kowalski-skills.md → House rules). */
export const BEAM_HOLD_MS = 200;

/** `--dur-spatial` when the stylesheet cannot be read (a spec's DOM): `theme.css`'s value. */
export const SPATIAL_FALLBACK_MS = 260;

/** `--dur-quick` when the stylesheet cannot be read (a spec's DOM): `theme.css`'s value. */
export const QUICK_FALLBACK_MS = 140;

/** A motion token's value in ms: "260ms" → 260, "0.26s" → 260; anything unreadable → `fallback`. */
export function tokenMs(raw: string, fallback: number): number {
  const m = /^\s*(-?[\d.]+)\s*(ms|s)\s*$/.exec(raw);
  if (!m?.[1]) return fallback;
  const n = Number.parseFloat(m[1]) * (m[2] === "s" ? 1000 : 1);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

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

/** The beam's line on screen: it starts at `x`,`y` and runs `length` px at `angle` degrees
 *  (clockwise from the positive x axis, as CSS `rotate()` reads it). */
export interface BeamLine extends Point {
  readonly length: number;
  readonly angle: number;
}

export function beamLine(from: Point, to: Point): BeamLine {
  return {
    x: from.x,
    y: from.y,
    length: Math.hypot(to.x - from.x, to.y - from.y),
    angle: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
  };
}

/** Where the beam ends on its item: the centre, across a row; on a tall item (a card), no lower
 *  than 60 px under its top, so the tip lands where the eye reads first (the Hub prototype's rule). */
export const beamTip = (item: Rect): Point => ({
  x: item.left + item.width / 2,
  y: item.top + Math.min(item.height / 2, 60),
});

/** One edge of the Liang–Barsky clip: the part `[t0, t1]` of the segment still inside after the
 *  edge with direction term `p` and distance term `q`, or undefined once none is. */
function clipEdge(
  [t0, t1]: readonly [number, number],
  p: number,
  q: number,
): readonly [number, number] | undefined {
  if (p === 0) return q < 0 ? undefined : [t0, t1];
  const r = q / p;
  if (p < 0) return r > t1 ? undefined : [Math.max(t0, r), t1];
  return r < t0 ? undefined : [t0, Math.min(t1, r)];
}

/**
 * How far along the beam (0–1) its tip enters `box`, or undefined when the beam never crosses it
 * (the Liang–Barsky clip of the segment `from`→`to` against the box). A beam that starts inside the
 * box enters it at 0.
 */
export function crossing(from: Point, to: Point, box: Rect): number | undefined {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let span: readonly [number, number] | undefined = [0, 1];
  const edges: readonly (readonly [number, number])[] = [
    [-dx, from.x - box.left],
    [dx, box.left + box.width - from.x],
    [-dy, from.y - box.top],
    [dy, box.top + box.height - from.y],
  ];
  for (const [p, q] of edges) {
    span = span && clipEdge(span, p, q);
    if (!span) return undefined;
  }
  const [t0, t1] = span ?? [1, 0];
  return t0 <= t1 ? t0 : undefined;
}

/** `--ease-spatial`, `cubic-bezier(0.2, 0.8, 0.2, 1)`: progress at time share `u` (0–1). */
export function easeSpatial(u: number): number {
  const [x1, y1, x2, y2] = [0.2, 0.8, 0.2, 1];
  const at = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  // x(s) rises monotonically for these control points, so bisection finds the s whose x is u.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (at(x1, x2, mid) < u) lo = mid;
    else hi = mid;
  }
  return at(y1, y2, (lo + hi) / 2);
}

/** The share (0–1) of the extend at which the eased tip reaches `share` of the beam's length: when
 *  a crossed card starts to glow, so it lights exactly as the tip gets there. */
export function reachAt(share: number): number {
  const goal = Math.min(1, Math.max(0, share));
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (easeSpatial(mid) < goal) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The ring's label: the Eye, and why it looks when it has a reason (spec: `◉ THE EYE · <reason>`;
 *  the stylesheet sets it in capitals, so screen readers read the words as written). */
export const ringLabel = (reason?: string): string =>
  reason?.trim() ? `the Eye · ${reason.trim()}` : "the Eye";

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
  /** Why the Eye looks, for the ring's label (`ringLabel`): absent, the label names the Eye alone. */
  readonly reason?: string;
}

interface LightStore {
  readonly request: LightRequest | undefined;
}

export const useEyeLight = create<LightStore>(() => ({ request: undefined }));

/** Light the item `path`'s hash names (`/accounts#pos-NVDA`); a path with no hash lights nothing.
 *  `reason` goes on the ring's label (#7487 slice 5: "◉ THE EYE · <reason>"). */
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
