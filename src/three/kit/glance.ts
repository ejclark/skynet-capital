/**
 * THE GLANCE — the Eye's reaction to the page around it (plan #3725). When a member clicks a filter
 * on the profile, the Eye turns toward it and then goes back to its sweep. It is noticed, never
 * stared at: the turn is capped, eases in and out, and is over in about 2.5 seconds, so the
 * animation lives only near the click that caused it.
 *
 * Pure math, no three.js — unit-testable without a browser.
 */

export interface Gaze {
  readonly yaw: number;
  readonly pitch: number;
}

/** Ease in, hold, ease out — seconds. Total ≈ 2.55 s. */
export const GLANCE = { attack: 0.35, hold: 1.2, release: 1.0 } as const;
/** The furthest a glance may pull the gaze off its sweep, radians. Subtle, not a snap-to. */
export const GLANCE_CAP = 0.9;

const smooth = (x: number): number => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** 0..1: how strongly the glance holds, `since` seconds after the click. 0 before and after. */
export function glanceWeight(since: number): number {
  const { attack, hold, release } = GLANCE;
  if (since < 0) return 0;
  if (since < attack) return smooth(since / attack);
  if (since < attack + hold) return 1;
  return 1 - smooth((since - attack - hold) / release);
}

/**
 * Yaw/pitch that point the Eye's +z forward from `from` at `to`, in the Eye's 'YXZ' convention
 * (positive pitch looks down).
 */
export function aimAt(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
): Gaze {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(-dy, Math.hypot(dx, dz)) };
}

/** `a − b` wrapped into (−π, π], so a turn always takes the short way round. */
function angleDelta(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/** Pull `base` toward `target` by weight `w`, never further than `cap` on either axis. */
export function blendGaze(base: Gaze, target: Gaze, w: number, cap = GLANCE_CAP): Gaze {
  const pull = (b: number, t: number): number => {
    const d = Math.max(-cap, Math.min(cap, angleDelta(t, b)));
    return b + d * Math.min(1, Math.max(0, w));
  };
  return { yaw: pull(base.yaw, target.yaw), pitch: pull(base.pitch, target.pitch) };
}
