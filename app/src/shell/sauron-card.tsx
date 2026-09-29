import { type ReactElement, useId, useRef } from "react";
import { PHONE_QUERY } from "./cockpit-clock";
import { LeagueCard } from "./league-card";
import { type CardPick, type Crest, usePrefs } from "./prefs";
import { useCardFrame, useTowerGlance, useTowerMood } from "./tower-bus";
import { useMediaQuery } from "./use-media";

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
 * glance plays). THE COMPARE (same slice, only under `?shell=watchtower`): beside the calendar
 * head's tower, `?card=league` drops the art at ≥861px so the page draws one tower, not two; on a
 * phone the head's tower is hidden, so the card keeps its art there. Eric picks by eye.
 */

/** The tower's URL: the card framing, the landmark's dials when this account has one, and the
 *  member's motion setting (`still` asks the scene for `rest=still`). */
export function towerSrc(
  landmark?: { readonly power: number; readonly health: number },
  crest: Crest = "live",
): string {
  const dials = landmark
    ? `&power=${landmark.power.toFixed(3)}&health=${landmark.health.toFixed(3)}`
    : "";
  return `/tower?frame=card${dials}${crest === "still" ? "&rest=still" : ""}`;
}

/** Whether the card draws its art: always, except the `league` pick beside the head's tower, on
 *  the flag, wider than a phone — the only place a second tower would stand next to the first. */
export function cardShowsArt(where: {
  readonly besideHead: boolean;
  readonly flag: boolean;
  readonly card: CardPick;
  readonly phone: boolean;
}): boolean {
  return !(where.besideHead && where.flag && where.card === "league" && !where.phone);
}

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

/** Film grain over the art: fractal noise, overlaid faintly. */
function Grain(): ReactElement {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="char-grain" aria-hidden="true" focusable="false">
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={2} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.9  0 0 0 0 0.93  0 0 0 0 0.95  0 0 0 0.5 -0.18"
        />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <rect width="100%" height="100%" fill="#fff" filter={`url(#${id}-grain)`} />
    </svg>
  );
}

/** @category hero */
export function SauronCard({
  landmark,
  ownedIds,
  meId,
  scope,
  besideHead = false,
}: {
  /** The selected account's landmark dials, when it has one (persona-mapped bots). */
  readonly landmark?: { readonly power: number; readonly health: number };
  readonly ownedIds: readonly string[];
  readonly meId?: string;
  /** CSS selector for the region whose filter clicks the Eye glances at. */
  readonly scope: string;
  /** The page also shows the calendar head's tower (the Profile page's Overview). */
  readonly besideHead?: boolean;
}): ReactElement {
  const frame = useRef<HTMLIFrameElement>(null);
  const crest = usePrefs((s) => s.crest);
  const flag = usePrefs((s) => s.shell) === "watchtower";
  const card = usePrefs((s) => s.card);
  const phone = useMediaQuery(PHONE_QUERY);
  const art = cardShowsArt({ besideHead, flag, card, phone });
  useTowerGlance(scope, frame);
  useTowerMood(landmark);
  useCardFrame(frame);
  if (!art)
    return (
      <section className="char-card char-card--league" aria-label="The league">
        <div className="char-body">
          <LeagueCard ownedIds={ownedIds} meId={meId} />
        </div>
      </section>
    );
  return (
    <section className="char-card" aria-label="Sauron's tower and the league">
      <div className="char-art">
        <div className="char-art-clip">
          <iframe
            ref={frame}
            src={towerSrc(landmark, crest)}
            title="Barad-dûr, Sauron's tower, live"
            loading="lazy"
            tabIndex={-1}
          />
        </div>
        <Grain />
        <div className="char-vignette" aria-hidden="true" />
        <div className="char-frame" aria-hidden="true">
          <span className="char-corner char-corner--left" />
          <span className="char-corner char-corner--right" />
        </div>
      </div>
      <div className="char-blend">
        <Shade />
        <div className="char-body">
          <LeagueCard ownedIds={ownedIds} meId={meId} />
        </div>
      </div>
    </section>
  );
}
