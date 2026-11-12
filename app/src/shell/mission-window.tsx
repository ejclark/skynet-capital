import { useNavigate } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  type MissionWindow,
  parseWindow,
  slideSide,
  stepTrail,
  useTrail,
  WAYPOINTS,
  WINDOW_LABEL,
  WORKBENCH,
} from "../live/mission";
import type { PromptTag } from "../live/prompt-tags";
import { TagMark } from "./tag-mark";

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
 *
 * The window and the waypoints are the stage's CARDS for the Eye's beam (`data-eye-card`, #7487
 * slice 5): it runs behind them, shows in the gaps, and glows through each one it crosses.
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
      // A pivot (`?show=`) belongs to the calendar; leaving it leaves the pivot behind, so the
      // address never names a window and a pivot that would open a different one.
      search: (prev: { readonly show?: string }) => ({
        ...prev,
        w: parseWindow(next),
        show: next === "calendar" ? prev.show : undefined,
      }),
    });
  };
}

/** The side the window on screen slid in from: 0 on arriving at the page (the page's own rise is
 *  its entrance, so the window does not slide on top of it), else +1 from the right or −1 from the
 *  left, worked out from the window that was on screen before. Any change of window counts — a tap,
 *  Back and Forward, a link — and one the trail has not seen joins it after the one it left. */
export function useSlideSide(cur: MissionWindow): 0 | 1 | -1 {
  const trail = useTrail((s) => s.trail);
  const step = useTrail((s) => s.step);
  const [prev, setPrev] = useState(cur);
  const [side, setSide] = useState<0 | 1 | -1>(0);
  if (prev !== cur) {
    // React's "adjust state while rendering" pattern: the new window reads its side on this render.
    setPrev(cur);
    setSide(slideSide(stepTrail(trail, prev, cur), prev, cur));
  }
  const last = useRef(cur);
  useEffect(() => {
    if (last.current === cur) return;
    step(last.current, cur);
    last.current = cur;
  }, [cur, step]);
  return side;
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

/** The waypoints: every window, its one figure, and ⤳ where the open window links to it. The
 *  journeys come first under "Waypoints"; the draft ticket sits under its own "Workbench" head
 *  (#7487 slice 6, spec § 1), since it is a tool the member works at, not a place they visit. */
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
  const item = (w: MissionWindow) => (
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
  );
  return (
    <nav className="mctl-rail" aria-label="Waypoints" data-eye-card="">
      <p className="mctl-eyebrow">Waypoints</p>
      <ul>{WAYPOINTS.map(item)}</ul>
      <p className="mctl-eyebrow">Workbench</p>
      <ul>{WORKBENCH.map(item)}</ul>
    </nav>
  );
}

export interface WindowLink {
  readonly label: string;
  readonly to: MissionWindow;
  /** Runs before the window opens: a pill that pre-fills it ("Trade: NVDA reports Tue, Nov 17"
   *  puts NVDA on the ticket, #7487 slice 6). */
  readonly prefill?: () => void;
}

/** The window the Eye is about to open on its own, whose frame must not take focus. */
let quietWindow: MissionWindow | undefined;

/** The next opening of `w` is the Eye's, not the member's: its frame leaves focus where it is. */
export function quietNextWindow(w: MissionWindow): void {
  quietWindow = w;
}

/** Whether this frame's opening was the Eye's; any frame's mount spends the mark either way, so a
 *  stale one never quiets a later switch the member made. */
function takeQuiet(id: MissionWindow): boolean {
  const quiet = quietWindow === id;
  quietWindow = undefined;
  return quiet;
}

/** The window on the stage. Keyed by its id at the call site, so each opening slides in fresh. */
export function MissionWindowFrame({
  id,
  side,
  title,
  sub,
  figure,
  links,
  open,
  children,
}: {
  readonly id: MissionWindow;
  /** From `useSlideSide`: 0 = no slide (arriving at the page), else the side it comes in from. */
  readonly side: 0 | 1 | -1;
  readonly title: string;
  readonly sub: string;
  readonly figure?: string;
  readonly links: readonly WindowLink[];
  readonly open: (w: MissionWindow) => void;
  readonly children: ReactNode;
}): ReactElement {
  // A window the member switched to takes focus at its heading, so keyboard and screen-reader focus
  // never falls to <body> when the control they used (a row, a Linked pill) unmounts with the old
  // one. Arriving at the page (side 0) leaves focus where the browser put it, and so does a switch
  // the Eye made on its own (`quietNextWindow`): the member asked for nothing, so focus is not moved
  // from under them (WCAG 3.2.1) — Moneypenny's line in the dock's live region says what changed.
  const heading = useRef<HTMLHeadingElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: on mount only; the frame is keyed by id
  useEffect(() => {
    const quiet = takeQuiet(id);
    if (side !== 0 && !quiet) heading.current?.focus({ preventScroll: true });
  }, []);
  const from = useTrail((s) => s.trail.from[id]);
  return (
    <section
      className="mctl-window"
      data-eye-card=""
      data-side={side === 0 ? undefined : side === 1 ? "right" : "left"}
      aria-labelledby={`mctl-title-${id}`}
    >
      <header className="mctl-window-head">
        <span className="mctl-glyph" aria-hidden="true">
          {WINDOW_LABEL[id].glyph}
        </span>
        <div className="mctl-window-names">
          <h1 id={`mctl-title-${id}`} className="mctl-window-title" ref={heading} tabIndex={-1}>
            {title}
          </h1>
          <p className="mctl-window-sub">{sub}</p>
        </div>
        {figure ? <span className="mctl-window-fig">{figure}</span> : null}
        <TagMark tag={{ label: WINDOW_LABEL[id].label }} size="window" />
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
              onClick={() => {
                k.prefill?.();
                open(k.to);
              }}
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
  about,
}: {
  readonly mark?: string;
  readonly title: string;
  readonly sub?: string;
  readonly tag?: string;
  readonly figure?: string;
  readonly onOpen?: () => void;
  /** The row as a ✎ tag ("Party · Tony"), when it can be talked about (#7487 slice 3). */
  readonly about?: PromptTag;
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
  // ✎ sits beside the row, never inside it: a button in a button is no control at all, and its tap
  // must never open what the row opens.
  const mark_ = about ? <TagMark tag={about} /> : null;
  if (onOpen)
    return (
      <li className="mctl-row-item">
        <button type="button" className="mctl-row mctl-row--go" onClick={onOpen}>
          {body}
        </button>
        {mark_}
      </li>
    );
  return (
    <li className="mctl-row-item">
      <div className="mctl-row">{body}</div>
      {mark_}
    </li>
  );
}
