import { type ReactElement, useId } from "react";

/**
 * THE STILL EYE IN THE BRAND SLOT (#3977, the phone face): at ≤860 the topbar's "SC" tile gives way
 * to the Eye — the tower's one warm focal point (docs/BRAND.md: the amber→orange→red ramp belongs
 * to the Eye and its beam, and this IS the Eye), drawn at rest on the scene's night ground. A
 * phone gets no WebGL until a real-device recheck (the issue's acceptance line), so this is the
 * tower's presence on a phone: one still picture, never a frame. From 861 the "SC" tile returns
 * and the moving tower stands in the page frame's column.
 *
 * Drawn, not rendered: at 28px a crop of the scene turns to mush, and an SVG stays crisp at any
 * density and costs no request. The parts, read from the scene's own anatomy (docs/art/EYE.md):
 * a flame corona, the lidded almond, the layered iris (white-hot core → amber → ember → red rim),
 * and the cat-slit pupil. The tile is the scene's ground in both themes — the tower is always at
 * night. Swapped by CSS alone (`shell.css`), so no width reads JS and nothing flashes on load.
 */
export function BrandEye(): ReactElement {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className="brand-eye"
      viewBox="0 0 28 28"
      width="28"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-corona`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff7a2e" stopOpacity="0.7" />
          <stop offset="0.6" stopColor="#ff7a2e" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ff7a2e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="0.3" stopColor="#ffc24d" />
          <stop offset="0.62" stopColor="#ff9e3d" />
          <stop offset="0.82" stopColor="#ff7a2e" />
          <stop offset="1" stopColor="#f85149" />
        </radialGradient>
      </defs>
      <rect width="28" height="28" rx="6" fill="#05070b" />
      <ellipse cx="14" cy="14" rx="13.5" ry="9" fill={`url(#${id}-corona)`} />
      <path d="M3.2 14 Q14 4.6 24.8 14 Q14 23.4 3.2 14 Z" fill={`url(#${id}-iris)`} />
      <path
        d="M3.2 14 Q14 4.6 24.8 14 Q14 23.4 3.2 14 Z"
        fill="none"
        stroke="#ffc24d"
        strokeOpacity="0.55"
        strokeWidth="0.6"
      />
      <path d="M14 7.6 Q15.7 14 14 20.4 Q12.3 14 14 7.6 Z" fill="#05070b" />
    </svg>
  );
}
