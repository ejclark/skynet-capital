import { type ReactElement, type ReactNode, type RefObject, useEffect, useRef } from "react";
import { type FlareKind, flareTower } from "./tower-bus";

/**
 * THE TAKEOVER — the full-screen celebration shell, lifted out of the new-high ceremony (#3977
 * slice 3) so every "something big went right" moment shares one: the new all-time high today,
 * the level-up celebration next (#469), and the design's other triggers after it (beating the
 * S&P, a streak). A caller brings its own content and its own "seen" rule; the shell owns what
 * must not drift between them:
 *  - Matrix-rain glyphs under a vignette behind the content. Static under `prefers-reduced-motion`
 *    (`new-high.css`); the content itself never moves.
 *  - Leaving is one Escape, one click on the backdrop, or the caller's own button (`focus`, given
 *    focus on open).
 *  - Leaving is when the tower hears about it (`flare`): the Eye flares once as the page comes back
 *    into view. Not on opening: the backdrop is opaque from 70% out, so the tower's column sits
 *    under solid page colour, and on a fresh load its frame is not listening yet — a flare at open
 *    is spent where no one can see it. Once per takeover, never under reduced motion
 *    (`flareTower`).
 */

/** Deterministic glyph columns: the same rain every render, no Math.random in a render path. */
const GLYPHS = "01$▲◆✦%+ΔΘ";
const COLUMNS = Array.from({ length: 28 }, (_, c) =>
  Array.from({ length: 22 }, (_, r) => GLYPHS[(c * 7 + r * 3) % GLYPHS.length]).join("\n"),
);

export function Takeover({
  titleId,
  flare,
  focus,
  onLeave,
  children,
}: {
  /** The id of the heading that names the dialog. */
  readonly titleId: string;
  /** What the tower flares for when the member leaves. */
  readonly flare: FlareKind;
  /** The control focused on open — the caller's own way back. */
  readonly focus: RefObject<HTMLElement | null>;
  /** The member left: remember it's been seen, and close. The flare is the shell's. */
  readonly onLeave: () => void;
  /** The content; `leave` is the one way out a button inside it should call. */
  readonly children: (leave: () => void) => ReactNode;
}): ReactElement {
  const told = useRef(false);
  function leave(): void {
    onLeave();
    if (told.current) return;
    told.current = true;
    flareTower(flare);
  }

  useEffect(() => {
    focus.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") leave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="nh-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) leave();
      }}
      onKeyDown={() => undefined}
    >
      <div className="nh-rain" aria-hidden="true">
        {COLUMNS.map((col, i) => (
          <span key={col + String(i)} style={{ animationDelay: `${(i % 7) * -0.9}s` }}>
            {col}
          </span>
        ))}
      </div>
      <div className="nh-body">{children(leave)}</div>
    </div>
  );
}
