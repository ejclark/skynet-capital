/**
 * THE QUALITY DIAL — how much the tower spends per frame (plan #3807 slice 3a-2; the design panel's
 * §4 frame-time budget). Pure, no three.js: `scene-main.ts` and `env.ts` read the numbers.
 *
 *   · `full` (the default) — the standalone `/tower` and the character card: the scene as designed.
 *   · `presence` (`?quality=presence`, sent by the band crest) — a small window with the Eye's slow
 *     sweep, not a showpiece, so it spends less: 30 draws a second, one device pixel per CSS pixel,
 *     no shadow map, and fewer embers. Motion speed is unchanged — the fire clock still reads real
 *     time; only the number of pictures taken of it drops.
 *
 * There is no post-processing to turn off: the scene renders straight to the canvas (tone mapping
 * and fog are in the materials' own shaders, not extra passes).
 */

export type QualityName = "full" | "presence";

export interface Quality {
  readonly name: QualityName;
  /** Most draws per second, or `null` for one per display refresh. */
  readonly fpsCap: number | null;
  /** The renderer's pixel ratio is `min(devicePixelRatio, this)`. */
  readonly pixelRatioCap: number;
  /** The key light's shadow map edge in texels, or 0 for no shadow map at all. */
  readonly shadowMapSize: number;
  /** Ember count as a fraction of the standing's own count. */
  readonly emberScale: number;
}

export const FULL: Quality = {
  name: "full",
  fpsCap: null,
  pixelRatioCap: 2,
  shadowMapSize: 2048,
  emberScale: 1,
};

/**
 * The crest's setting. Shadows are OFF, not 512: at the crest's framing (the crown and the Eye in a
 * 248×150 box, `?frame=crown`) the `crown` and `crown-presence` poses shot in one run differ on
 * 0.15% of pixels — the halved embers — against ~2% between two runs of the unchanged scene
 * (docs/shots/tower-crest-budget/). No shadow a member could point to, while every fragment of a
 * shadow-receiving material samples the map on every draw, drawn once or not.
 *
 * DPR 1 is the visible trade: on a 2× screen the crest is drawn at 248×150 and scaled up, a
 * touch softer. The design panel's line was 1.5; this is one number to move if the soft edge shows.
 */
export const PRESENCE: Quality = {
  name: "presence",
  fpsCap: 30,
  pixelRatioCap: 1,
  shadowMapSize: 0,
  emberScale: 0.5,
};

/** The dial from a query string (`?quality=presence`); anything else is `full`. */
export function qualityFromSearch(search: string): Quality {
  try {
    return new URLSearchParams(search).get("quality") === "presence" ? PRESENCE : FULL;
  } catch {
    return FULL;
  }
}

/** The pixel ratio the renderer should use on a `dpr` display under `q`. */
export function pixelRatioFor(q: Quality, dpr: number): number {
  return Math.min(Number.isFinite(dpr) && dpr > 0 ? dpr : 1, q.pixelRatioCap);
}

/**
 * The crest's rest (`?rest=still`, slice 3a-3): at rest the scene draws one frame and stops; a
 * glance or a regard runs it until the gaze is home again (kit/loop.ts). Slice 3a-2 measured that the
 * crest's own draw passes its budget but the page's frame interval degrades whenever a frame animates
 * constantly — so the second option animates only while it is looking at something. Anything else
 * (`rest=live`, absent) is today's constant sweep.
 */
export function restStillFromSearch(search: string): boolean {
  try {
    return new URLSearchParams(search).get("rest") === "still";
  } catch {
    return false;
  }
}
