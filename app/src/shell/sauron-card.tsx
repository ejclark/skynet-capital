import { type ReactElement, useId } from "react";
import { LeagueCard } from "./league-card";
import { useTowerMood } from "./tower-bus";

/**
 * SAURON'S CHARACTER CARD (plan #3727, design handoff 6a): the league, with Barad-dûr standing
 * over it. One card, top to bottom: the art column (the live tower, framed by the scene itself via
 * `/tower?frame=card` so the horns sit near the top and the Eye ~60% across), a shade where the
 * lit fortress wall dissolves through an ember-lit, noise-edged mist, then the league. The art
 * carries no text: only the scene, a thin accent frame with corner marks, grain and a vignette.
 *
 * The dials are honest: a persona-mapped bot's own landmark (power from standing, health from P/L)
 * drives its tower; any other view gets the scene's standalone defaults and claims nothing.
 *
 * THE GLANCE (#3725, carried over): clicking a filter on the page (a range chip, the league toggle,
 * a lens, the blotter's filter box) turns the Eye toward it for a moment. Only a point in the
 * frame's own pixels crosses the frame, and only to our own origin; the scene caps and times the
 * turn (`src/three/kit/glance.ts`). Reduced motion: the scene holds a still frame and the page
 * sends no glances, so the card is simply a picture. The glance lives in `tower-bus.ts` since
 * #3807 slice 3a — this card was its first consumer; the band's crest is the second. The card also
 * lends its landmark's dials to the crest (`useTowerMood`), so both towers burn alike, and its
 * frame hears a flare the way the crest does (`useCardFrame`, #3807 slice 3b-3).
 *
 * THE MEMBER'S MOTION SETTING (#3807 slice 3b-1): "Still" in Settings → Display stills this tower
 * too — the scene's `rest=still` works in any framing (one frame at rest, the loop only while a
 * glance plays.
 *
 * NO ART OF ITS OWN SINCE #8189 (#8161 stage 2; docs/IA.md §8.4). The tower stands on the home
 * screen only, so this card is the league under its mist, in the page's own flow at every width:
 * no frame mounts here and no WebGL context opens for it. Its landmark's dials still set the
 * tower's mood (`useTowerMood`), which the home's frame reads. The boxed art (#3727) and the
 * `under` card that stood under the frame's column (#3977) are retired with the column.
 */

/** The shade zone: the forge's ember seat, then mist with an uneven, organic top edge. */
function Shade(): ReactElement {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className="char-shade"
      viewBox="0 0 384 90"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={`${id}-soft`} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${id}-mist`} x="-10%" y="-60%" width="120%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022 0.035" numOctaves={4} seed={21} />
          <feDisplacementMap
            in="SourceGraphic"
            scale={56}
            xChannelSelector="R"
            yChannelSelector="G"
            result="d"
          />
          <feGaussianBlur in="d" stdDeviation="3" />
        </filter>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="char-mist-stop" stopOpacity="0" />
          <stop offset="0.45" className="char-mist-stop" stopOpacity="0.55" />
          <stop offset="0.8" className="char-mist-stop" stopOpacity="1" />
          <stop offset="1" className="char-mist-stop" stopOpacity="1" />
        </linearGradient>
      </defs>
      <ellipse
        className="char-ember"
        cx="242"
        cy="66"
        rx="90"
        ry="20"
        filter={`url(#${id}-soft)`}
      />
      <rect
        x="-20"
        y="4"
        width="424"
        height="100"
        fill={`url(#${id}-floor)`}
        filter={`url(#${id}-mist)`}
      />
      <rect className="char-floor" x="-20" y="60" width="424" height="32" />
    </svg>
  );
}

/** @category hero */
export function SauronCard({
  landmark,
  ownedIds,
  meId,
}: {
  /** The selected account's landmark dials, when it has one (persona-mapped bots). */
  readonly landmark?: { readonly power: number; readonly health: number };
  readonly ownedIds: readonly string[];
  readonly meId?: string;
}): ReactElement {
  useTowerMood(landmark);
  // No art sits above the card, so the shade has nothing to rise over: `--bare` drops its pull, or
  // its floor would paint over the controls above it (#4976).
  return (
    <section className="char-card char-card--under char-card--bare" aria-label="The league">
      <div className="char-blend">
        <Shade />
        <div className="char-body">
          <LeagueCard ownedIds={ownedIds} meId={meId} />
        </div>
      </div>
    </section>
  );
}
