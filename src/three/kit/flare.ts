/**
 * THE FLARE — the first thing the moving tower reacts to (plan #3807 slice 3b-3). Something good
 * happened to the member (a new all-time high), and the Eye's light and the embers near it rise
 * once and settle back while the sweep carries on underneath. It mirrors the glance (`glance.ts`):
 * attack, hold, release, and one slot.
 *
 *   · ONE rise and one fall, about two seconds — a swell, never a flash. WCAG 2.3.1 allows no more
 *     than three flashes a second; this is a single pulse, and nothing follows it.
 *   · Bounded: at the peak each light is `1 + FLARE_PEAK[x]` times its resting self, on the warm
 *     ramp the Eye already owns (docs/BRAND.md) — no new colour, only more of the Eye's own.
 *   · One slot: a flare arriving mid-flare restarts nothing.
 *   · Reduced motion: ignored, so the one still frame stays.
 *
 * Pure math, no three.js — unit-testable without a browser.
 */

/**
 * What a flare can be for. Anything else never gets here: `messages.ts` drops unknown kinds.
 *  · `new-high` — the member's account reached a new all-time high (slice 3b-3).
 *  · `fill` — an order the member placed just filled (#3977 slice 3). It plays the same flare as a
 *    new high today: a kind of its own look (a smaller swell for an everyday event) is scene work
 *    that waits for Eric's eye, and the page names the kind now so that look can land here alone.
 */
export type FlareKind = "new-high" | "fill";

export const FLARE_KINDS: readonly FlareKind[] = ["new-high", "fill"];

/** Rise, hold, settle — seconds. Total ≈ 2.05 s: shorter than a glance, and over sooner. */
export const FLARE = { attack: 0.25, hold: 0.6, release: 1.2 } as const;

/** The whole flare, rise to settle, in seconds. */
export const FLARE_SECONDS = FLARE.attack + FLARE.hold + FLARE.release;

/**
 * How far each light rises at the peak, as a fraction of its resting self: the Eye's own fire (its
 * warm ramp only — the electric lines stay as quiet as they were), the glow lights that light its
 * crown, the reach of the fire round its rim, and the embers shed off it.
 *
 * THE ENERGY GOES OUTWARD, NOT INTO THE CORE (Eric on #3972, 2026-09-29: "There is room to increase
 * the energy/glow from the eye"). A ladder was rendered and measured (the PR's picture): raising the
 * Eye's own fire past about ×2 only drives the iris toward white under ACES — the pupil fades, which
 * is the figure lost to the ground (docs/art/EYE.md) — and the brightest 2% of the crown frame gains
 * a few levels at most (231 → 249 of 255 from ×1.5 to ×4). What reads as more energy is light that
 * leaves the Eye: the glow lights on the horns and crown stone, the fire round the rim, the sparks.
 * So the core stays a modest lift and those three carry the flare.
 */
export const FLARE_PEAK = { body: 0.6, glow: 3.0, reach: 1.8, embers: 3.0 } as const;

const smooth = (x: number): number => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** 0..1: how high the flare stands, `since` seconds after it began. 0 before and after. */
export function flareWeight(since: number): number {
  const { attack, hold, release } = FLARE;
  if (since < 0) return 0;
  if (since < attack) return smooth(since / attack);
  if (since < attack + hold) return 1;
  return 1 - smooth((since - attack - hold) / release);
}

/** The multiplier on one light at flare weight `w` — 1 at rest, `1 + FLARE_PEAK[light]` at the peak. */
export function flareGain(w: number, light: keyof typeof FLARE_PEAK): number {
  return 1 + FLARE_PEAK[light] * Math.min(1, Math.max(0, w));
}

/** The scene's one flare slot, on the scene's own clock. */
export interface Flare {
  /** Begin a flare at scene time `at`. False (and nothing changes) mid-flare or under reduced motion. */
  start(at: number): boolean;
  /** 0..1 at scene time `now` — pure in `now`, so a seek draws the same frame every time. */
  weight(now: number): number;
  /** Whether a flare is still rising or settling at `now` — `rest=still` keeps its loop on until not. */
  playing(now: number): boolean;
}

export function createFlare(reduce: boolean): Flare {
  let at: number | undefined;
  const playing = (now: number): boolean =>
    at !== undefined && now - at >= 0 && now - at < FLARE_SECONDS;
  return {
    start(now) {
      if (reduce || playing(now)) return false;
      at = now;
      return true;
    },
    weight: (now) => (at === undefined ? 0 : flareWeight(now - at)),
    playing,
  };
}
