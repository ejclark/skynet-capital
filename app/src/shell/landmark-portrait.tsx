import { type ReactElement, type RefObject, useEffect, useRef, useState } from "react";

/**
 * THE LANDMARK PORTRAIT (plan #3725): the account profile's picture. The live Barad-dûr scene,
 * framed by the scene itself (`/tower?frame=portrait`) to whatever box the grid gives it, so the
 * Eye fills the frame instead of hanging small in a 21:9 strip. Zoom is off in the embed, so the
 * scroll wheel keeps scrolling the page.
 *
 * THE GLANCE: when a filter on the page is clicked (a range chip, the league toggle, a lens, the
 * blotter's filter box), the Eye turns toward it for a moment. Only a point in the frame's own
 * pixels crosses the frame boundary, never page data, and only to our own origin. The scene caps
 * and times the turn (`src/three/kit/glance.ts`), so it stays subtle and ends within ~2.5 s.
 *
 * Continuous motion, so a reduced-motion viewer gets the doorway card instead, and no glances.
 */

/** The page controls that count as "filters" — every toggle chip and the free-text filter box. */
const FILTER_CONTROLS =
  '[aria-pressed], input[type="search"], input[type="text"], input:not([type]), select';

const prefersStill = (): boolean => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/** Post a glance at `control`'s centre, in the frame's own CSS pixels. Exported for the spec. */
export function glanceMessage(
  frame: DOMRect,
  control: DOMRect,
): { readonly type: "tower:glance"; readonly x: number; readonly y: number } {
  return {
    type: "tower:glance",
    x: control.left + control.width / 2 - frame.left,
    y: control.top + control.height / 2 - frame.top,
  };
}

/** Send a glance to `frame` whenever a filter control inside `scope` is clicked. */
function useGlance(frame: RefObject<HTMLIFrameElement | null>, scope: string): void {
  useEffect(() => {
    if (prefersStill()) return;
    const onClick = (e: MouseEvent): void => {
      const target = e.target instanceof Element ? e.target : null;
      const control = target?.closest(FILTER_CONTROLS);
      const iframe = frame.current;
      if (!(control && iframe?.contentWindow && control.closest(scope))) return;
      iframe.contentWindow.postMessage(
        glanceMessage(iframe.getBoundingClientRect(), control.getBoundingClientRect()),
        window.location.origin,
      );
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [frame, scope]);
}

/** @category hero */
export function LandmarkPortrait({
  name,
  power,
  health,
  scope,
}: {
  readonly name: string;
  readonly power: number;
  readonly health: number;
  /** CSS selector for the region whose filter clicks the Eye glances at. */
  readonly scope: string;
}): ReactElement {
  const [entered, setEntered] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useGlance(frame, scope);
  const src = `/tower?power=${power.toFixed(3)}&health=${health.toFixed(3)}&frame=portrait`;
  if (prefersStill() && !entered) {
    return (
      <div className="portrait portrait--still">
        <strong>{name}'s landmark stands live</strong>
        <span className="hero-card-sub">
          Barad-dûr, sized by standing and burning by P/L. It moves, so it waits for your click.
        </span>
        <button type="button" className="hero-enter" onClick={() => setEntered(true)}>
          Enter the tower →
        </button>
      </div>
    );
  }
  return (
    <figure className="portrait">
      <iframe ref={frame} src={src} title={`${name}'s landmark — Barad-dûr, live`} loading="lazy" />
      <figcaption className="portrait-caption num">
        power {power.toFixed(2)} · forge {health >= 0 ? "+" : ""}
        {health.toFixed(2)}
      </figcaption>
    </figure>
  );
}
