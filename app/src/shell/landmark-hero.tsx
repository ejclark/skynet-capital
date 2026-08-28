import type { ReactElement } from "react";
import { useState } from "react";

/**
 * THE LANDMARK HERO (#738 phase 4c) — 3D embedded where lore earns it. A desk the world
 * projection gives a landmark frames its live Barad-dûr scene (`/tower`, the existing Babylon
 * bundle) with the SAME dials every renderer uses: power from real relative standing, health
 * from real P/L. The scene is continuous motion, so a reduced-motion viewer gets a doorway
 * card instead of an autoplaying world — the tower is opt-in there, never ambush.
 */

const prefersStill = (): boolean => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export function LandmarkHero({
  name,
  power,
  health,
}: {
  readonly name: string;
  readonly power: number;
  readonly health: number;
}): ReactElement {
  const [entered, setEntered] = useState(false);
  const src = `/tower?power=${power.toFixed(3)}&health=${health.toFixed(3)}`;
  if (prefersStill() && !entered) {
    return (
      <div className="hero-card">
        <span>
          <strong>{name}'s landmark stands live</strong>
          <span className="hero-card-sub">
            Barad-dûr, sized by standing and burning by P/L — a moving scene, so it waits for your
            click.
          </span>
        </span>
        <button type="button" className="hero-enter" onClick={() => setEntered(true)}>
          Enter the tower →
        </button>
      </div>
    );
  }
  return (
    <figure className="hero-frame">
      <iframe
        src={src}
        title={`${name}'s landmark — Barad-dûr, live`}
        loading="lazy"
        allow="fullscreen"
      />
      <figcaption className="hero-caption num">
        landmark · power {power.toFixed(2)} · forge {health >= 0 ? "+" : ""}
        {health.toFixed(2)} — sized by standing, burning by P/L
      </figcaption>
    </figure>
  );
}
