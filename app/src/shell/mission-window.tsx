import { useNavigate } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { type MissionWindow, parseWindow, useTrail, WINDOW_LABEL, WINDOWS } from "../live/mission";

/**
 * MISSION CONTROL'S CHROME (#7487 slice 1). The pieces every Campaign window shares, drawn from the
 * handoff's `Campaign Mission Control.dc.html`: the TRAIL above the window (this session's path —
 * it is Back), the WAYPOINTS rail beside it from the tablet width (on a phone its contents wait for
 * slice 4's menu; Overview's rows and the trail reach every window meanwhile), and the WINDOW
 * itself — a header (glyph, title, sub line, one mono figure), the LINKED row of dashed ⤳ pills to
 * the windows it connects to, then its body.
 *
 * Every mark is a shape plus a word, never a colour alone (BRAND.md → Accessibility): the current
 * trail pill and waypoint are bold and outlined as well as tinted, and a linked waypoint carries
 * the ⤳ glyph with its own label.
 *
 * The slide (built with the vendored `/animate` skill): spatial consistency, so the window comes in
 * 40px from the side it sits on in the trail, `transform` + `opacity` only, on the house's
 * `--dur-spatial` / `--ease-spatial` tokens, which `prefers-reduced-motion` collapses to 0ms — the
 * window then appears at once, as the handoff asks. A keyframe, not a transition, is right here:
 * each window is a fresh element keyed by its id, so there is nothing to retarget from.
 */

/** Open `next` from `cur`: step the trail, then make it the page's address. */
export function useOpenWindow(cur: MissionWindow): (next: MissionWindow) => void {
  const navigate = useNavigate();
  const step = useTrail((s) => s.step);
  return (next) => {
    if (next === cur) return;
    step(cur, next);
    void navigate({
      to: "/",
      search: (prev: Record<string, unknown>) => ({ ...prev, w: parseWindow(next) }),
    });
  };
}

/** One pill per window reached this session, joined by hairlines; the current one outlined. */
export function Trail({
  cur,
  open,
}: {
  readonly cur: MissionWindow;
  readonly open: (w: MissionWindow) => void;
}): ReactElement {
  const order = useTrail((s) => s.trail.order);
  const shown = order.includes(cur) ? order : [...order, cur];
  return (
    <nav className="mctl-trail" aria-label="Windows opened this session">
      <ol>
        {shown.map((w) => (
          <li key={w}>
            <button
              type="button"
              className="mctl-trail-pill"
              aria-current={w === cur ? "page" : undefined}
              onClick={() => open(w)}
            >
              <span className="mctl-glyph" aria-hidden="true">
                {WINDOW_LABEL[w].glyph}
              </span>
              {WINDOW_LABEL[w].label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The waypoints: every window, its one figure, and ⤳ where the open window links to it. */
export function Waypoints({
  cur,
  open,
  figures,
  linked,
}: {
  readonly cur: MissionWindow;
  readonly open: (w: MissionWindow) => void;
  readonly figures: Readonly<Partial<Record<MissionWindow, string>>>;
  readonly linked: readonly MissionWindow[];
}): ReactElement {
  return (
    <nav className="mctl-rail" aria-label="Waypoints">
      <p className="mctl-eyebrow">Waypoints</p>
      <ul>
        {WINDOWS.map((w) => (
          <li key={w}>
            <button
              type="button"
              className="mctl-way"
              aria-current={w === cur ? "page" : undefined}
              onClick={() => open(w)}
            >
              <span className="mctl-glyph" aria-hidden="true">
                {WINDOW_LABEL[w].glyph}
              </span>
              <span className="mctl-way-label">{WINDOW_LABEL[w].label}</span>
              {figures[w] ? <span className="mctl-fig">{figures[w]}</span> : null}
              {linked.includes(w) && w !== cur ? (
                <span className="mctl-linked-mark" title="Linked to the open window">
                  <span aria-hidden="true">⤳</span>
                  <span className="visually-hidden">linked</span>
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface WindowLink {
  readonly label: string;
  readonly to: MissionWindow;
}

/** The window on the stage. Keyed by its id at the call site, so each opening slides in fresh. */
export function MissionWindowFrame({
  id,
  title,
  sub,
  figure,
  links,
  open,
  children,
}: {
  readonly id: MissionWindow;
  readonly title: string;
  readonly sub: string;
  readonly figure?: string;
  readonly links: readonly WindowLink[];
  readonly open: (w: MissionWindow) => void;
  readonly children: ReactNode;
}): ReactElement {
  // Read once at mount: the side this window came in from. Later trail steps belong to the next one.
  const [side] = useState(() => useTrail.getState().side);
  const from = useTrail((s) => s.trail.from[id]);
  return (
    <section
      className="mctl-window"
      data-side={side === 1 ? "right" : "left"}
      aria-labelledby={`mctl-title-${id}`}
    >
      <header className="mctl-window-head">
        <span className="mctl-glyph" aria-hidden="true">
          {WINDOW_LABEL[id].glyph}
        </span>
        <div className="mctl-window-names">
          <h1 id={`mctl-title-${id}`} className="mctl-window-title">
            {title}
          </h1>
          <p className="mctl-window-sub">{sub}</p>
        </div>
        {figure ? <span className="mctl-window-fig">{figure}</span> : null}
      </header>
      {links.length > 0 ? (
        <nav className="mctl-linked" aria-label="Linked windows">
          <span className="mctl-eyebrow">
            {from ? `Opened from ${WINDOW_LABEL[from].label} · linked` : "Linked"}
          </span>
          {links.map((k) => (
            <button
              key={k.label}
              type="button"
              className="mctl-link-pill"
              onClick={() => open(k.to)}
            >
              <span className="mctl-link-mark" aria-hidden="true">
                ⤳
              </span>{" "}
              {k.label}
            </button>
          ))}
        </nav>
      ) : null}
      <div className="mctl-window-body">{children}</div>
    </section>
  );
}

/** A section head inside a window: small caps over a hairline. */
export function MissionHead({ children }: { readonly children: ReactNode }): ReactElement {
  return <h2 className="mctl-head">{children}</h2>;
}

/** One 44px row: mark, title over its sub line, a word tag, a mono figure, and › when it opens. */
export function MissionRow({
  mark,
  title,
  sub,
  tag,
  figure,
  onOpen,
}: {
  readonly mark?: string;
  readonly title: string;
  readonly sub?: string;
  readonly tag?: string;
  readonly figure?: string;
  readonly onOpen?: () => void;
}): ReactElement {
  const body = (
    <>
      <span className="mctl-row-mark" aria-hidden="true">
        {mark ?? ""}
      </span>
      <span className="mctl-row-text">
        <span className="mctl-row-title">{title}</span>
        {sub ? <span className="mctl-row-sub">{sub}</span> : null}
      </span>
      {tag ? <span className="mctl-row-tag">{tag}</span> : null}
      {figure ? <span className="mctl-row-fig">{figure}</span> : null}
      {onOpen ? (
        <span className="mctl-row-go" aria-hidden="true">
          ›
        </span>
      ) : null}
    </>
  );
  if (onOpen)
    return (
      <li>
        <button type="button" className="mctl-row mctl-row--go" onClick={onOpen}>
          {body}
        </button>
      </li>
    );
  return (
    <li>
      <div className="mctl-row">{body}</div>
    </li>
  );
}
