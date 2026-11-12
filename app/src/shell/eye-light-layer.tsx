import { useRouterState } from "@tanstack/react-router";
import {
  type CSSProperties,
  type ReactElement,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { CALENDAR_ANCHOR } from "../../../src/domain/edition-keys";
import {
  BEAM_HOLD_MS,
  type BeamLine,
  beamLine,
  beamTip,
  crossing,
  fullyInView,
  lightOrigin,
  type Origin,
  type Rect,
  reachAt,
  ringLabel,
  SPATIAL_FALLBACK_MS,
  scrollToFit,
  tokenMs,
  useEyeLight,
  type ViewArea,
  viewArea,
} from "./eye-light";
import { visiblePositionTarget } from "./position-anchor";
import { glanceMessage, postTo, prefersStill, useTowerBus } from "./tower-bus";

/**
 * THE EYE'S LIGHT, DRAWN (#7216 slice 2; the arithmetic and Eric's words are `eye-light.ts`). One
 * layer above the page and outside the tower's canvas, mounted once by the shell beside the tower
 * frame. A tap on one of Moneypenny's links into the page (`mp-message.tsx`), or the Eye noticing
 * something (`eye-notice.ts`), asks for the light; this waits for the item to render and settle (the
 * page's own landing, `landing.ts`, scrolls and opens it, and anything it left off screen is
 * scrolled into view here), then plays the beam.
 *
 * THE BEAM, BEHIND THE CARDS (#7487 slice 5, the spec's § "5. The Eye"). The layer sits above the
 * page, so "behind" is drawn, not stacked: the beam is masked out of every card it crosses and shows
 * only in the gaps between them; inside each crossed card a dim, screened copy of it (the pass)
 * glows through from behind as the tip arrives; the card it lands in glows round its edge, lit from
 * behind; and then the ring and its label stay on the item. A card is anything marked
 * `data-eye-card` (Campaign's window and waypoints); on a page that marks none, the item is its own
 * card. The motion is CSS on the house's tokens (`eye-light.css`): the reach is `transform` only on
 * `--dur-spatial` / `--ease-spatial`, and every glow is `opacity`.
 *
 * Never over the text once it lands: the ring is drawn outside the item's edge, with its label on
 * that edge. The ring is a shape and a label, never a colour alone (docs/BRAND.md → Accessibility):
 * a night line and an amber line, so one of the two holds contrast in either palette. It stays until
 * the member taps elsewhere on the page, leaves the page, or follows another link. Under reduced
 * motion no beam plays and only the ring shows, and where no Eye is drawn (no column at this width,
 * no brand Eye) the ring shows alone too.
 *
 * Before any of it plays, the item is brought wholly into the part of the window the member can see
 * (#7227; Eric on #7018 round 9: "The content the eye gazes upon needs to be in view"): under the
 * topbar, inside the window, and clear of Moneypenny's dock — and when her History covers the whole
 * page on a phone, the light waits for it to close.
 */

/** How long the light waits for its item to render (a page loads its rows late) before giving up. */
const WAIT_MS = 8000;
/** The item's box must hold still this long — the landing's scroll and the opened row's growth done. */
const STILL_MS = 160;
/** A beam crosses at most this many cards; more would be a beam drawn across the whole page. */
const MAX_PASSES = 6;

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

const laidOut = (el: Element): boolean => el.getClientRects().length > 0;

/** How far down the sticky topbar reaches. */
const topbarBottom = (): number =>
  document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 0;

/** Moneypenny's dock (and her History over it) across the bottom of the page, else null: the light
 *  never lands an item under it (#7487 slice 2; a full-width bar, so `viewArea` clips the bottom). */
function chatBox(): Rect | null {
  const chat = document.querySelector(".mp-dock");
  return chat && laidOut(chat) ? rectOf(chat) : null;
}

/** The part of the window the page shows through right now (`viewArea`). */
const seen = () =>
  viewArea(topbarBottom(), { width: window.innerWidth, height: window.innerHeight }, chatBox());

/** The light travels to an item wholly in view (#7216 criterion 7, #7227 criterion 3): under the
 *  topbar, inside the window and clear of the chat. The window scrolls it there; an item in a
 *  scroller of its own, which the window cannot move, is centred by the browser instead. */
function bringIntoView(el: Element, r: Rect, area: ViewArea): void {
  const y = window.scrollY;
  window.scrollBy?.({ top: scrollToFit(r, area) });
  if (window.scrollY === y) el.scrollIntoView?.({ block: "center" });
}

/** An element's own corner, so the ring and the beam's holes follow its outline. */
function radiusOf(el: Element): number {
  const r = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
  return Number.isFinite(r) ? r : 0;
}

/** Where the light starts on this page, at this moment (`lightOrigin`). */
function originFor(): Origin | undefined {
  const frame = useTowerBus.getState().frame;
  const shown = frame?.getAttribute("data-shown") === "true" ? rectOf(frame) : null;
  const brand = document.querySelector(".brand-eye");
  const brandBox = brand && laidOut(brand) ? rectOf(brand) : null;
  return lightOrigin(shown, brandBox, topbarBottom());
}

/** `--dur-spatial` as it stands (0 under reduced motion, `theme.css`). */
function spatialMs(): number {
  return tokenMs(
    getComputedStyle(document.documentElement).getPropertyValue("--dur-spatial"),
    SPATIAL_FALLBACK_MS,
  );
}

interface Lit {
  readonly el: HTMLElement;
  readonly path: string;
  /** The item's corner radius. */
  readonly radius: number;
  readonly reason?: string;
}

/** A card the beam crosses: its box, its corner, and when the tip reaches it (ms into the reach). */
interface Pass {
  readonly box: Rect;
  readonly radius: number;
  readonly at: number;
}

interface Beam {
  readonly line: BeamLine;
  readonly passes: readonly Pass[];
  /** The card the item sits in, lit from behind as the beam lands. */
  readonly home: Pass;
  /** The topbar's foot: nothing of the beam is drawn over the topbar. */
  readonly clear: number;
}

/**
 * The beam's cards: every marked card it crosses, and the item's own card, each with the moment the
 * eased tip reaches it. The item's card always counts — the tip ends inside it.
 */
function beamFor(origin: Origin, el: HTMLElement, spatial: number): Beam {
  const home = el.closest<HTMLElement>("[data-eye-card]") ?? el;
  const to = beamTip(rectOf(el));
  const pass = (card: HTMLElement): Pass | undefined => {
    const box = rectOf(card);
    const share = crossing(origin, to, box);
    if (share === undefined) return undefined;
    return { box, radius: radiusOf(card), at: Math.round(reachAt(share) * spatial) };
  };
  const homePass = pass(home) ?? { box: rectOf(home), radius: radiusOf(home), at: spatial };
  const others = [...document.querySelectorAll<HTMLElement>("[data-eye-card]")]
    .filter((c) => c !== home && !c.contains(home) && laidOut(c))
    .flatMap((c) => pass(c) ?? []);
  return {
    line: beamLine(origin, to),
    passes: [...others.slice(0, MAX_PASSES - 1), homePass],
    home: homePass,
    clear: topbarBottom(),
  };
}

/** Track an element's box in the viewport while `el` is set. */
function useLiveRect(el: HTMLElement | undefined): Rect | undefined {
  const [rect, setRect] = useState<Rect | undefined>(undefined);
  useEffect(() => {
    if (!el) {
      setRect(undefined);
      return;
    }
    let raf = 0;
    const measure = () => {
      raf = 0;
      setRect(el.isConnected ? rectOf(el) : undefined);
    };
    const soon = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(soon);
    ro?.observe(el);
    ro?.observe(document.documentElement);
    window.addEventListener("scroll", soon, { capture: true, passive: true });
    window.addEventListener("resize", soon);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", soon, { capture: true });
      window.removeEventListener("resize", soon);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [el]);
  return rect;
}

/** The ring's gap outside the item's edge. */
const RING_GAP = 3;

/** Held: the ring outside the item's edge and the label naming the Eye, and why it looks, on it. */
export function EyeRing({
  el,
  radius = 0,
  reason,
}: {
  readonly el: HTMLElement;
  readonly radius?: number;
  readonly reason?: string;
}): ReactElement | null {
  const rect = useLiveRect(el);
  if (!rect) return null;
  return (
    <div
      className="eye-ring"
      data-eye-ring=""
      aria-hidden="true"
      style={{
        top: rect.top - RING_GAP,
        left: rect.left - RING_GAP,
        width: rect.width + 2 * RING_GAP,
        height: rect.height + 2 * RING_GAP,
        borderRadius: radius + RING_GAP,
      }}
    >
      <span className="eye-ring-label">
        <span className="eye-ring-glyph">◉</span> {ringLabel(reason)}
      </span>
    </div>
  );
}

/** The reach's own transform, set on the element that moves (never inherited by its children). */
const reachStyle = (line: BeamLine): CSSProperties =>
  ({
    "--beam-x": `${line.x}px`,
    "--beam-y": `${line.y}px`,
    "--beam-a": `${line.angle}deg`,
  }) as CSSProperties;

/** The wedge, narrow at the Eye and `half` wide either side of the line at its tip. */
const wedge = (length: number, half: number, root: number): string =>
  `0,${-root} ${length},${-half} ${length},${half} 0,${root}`;

/** The beam: the Eye's pool and the wedge in the gaps, the pass inside each card it crosses, and
 *  the glow round the card it lands in. Drawn once; CSS plays it (`eye-light.css`). */
function BeamLayer({ beam }: { readonly beam: Beam }): ReactElement {
  const id = useId().replace(/:/g, "");
  const { line, passes, home, clear } = beam;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const hole = (b: Rect, r: number, fill: string, key?: string) => (
    <rect key={key} x={b.left} y={b.top} width={b.width} height={b.height} rx={r} fill={fill} />
  );
  return (
    <svg
      className="eye-beam"
      data-eye-beam=""
      data-eye-beam-passes={passes.length}
      aria-hidden="true"
      focusable="false"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      <defs>
        <clipPath id={`${id}-below`}>
          <rect x="0" y={clear} width={w} height={Math.max(0, h - clear)} />
        </clipPath>
        <mask id={`${id}-gaps`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
          <rect width={w} height={h} fill="#fff" />
          {passes.map((p, i) => hole(p.box, p.radius, "#000", String(i)))}
        </mask>
        {passes.map((p, i) => (
          <clipPath key={String(i)} id={`${id}-card-${String(i)}`}>
            {hole(p.box, p.radius, "#fff")}
          </clipPath>
        ))}
        <linearGradient id={`${id}-core`}>
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="0.35" stopColor="#ffc24d" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ff9e3d" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`${id}-outer`}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.7" />
          <stop offset="0.3" stopColor="#ffc24d" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff7a2e" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`${id}-pool`}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#ffc24d" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff7a2e" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${id}-haze`} x="-30%" y="-300%" width="160%" height="700%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <g className="eye-beam-all" clipPath={`url(#${id}-below)`}>
        <g mask={`url(#${id}-gaps)`}>
          {/* The card it lands in, lit from behind: a glow that shows only round its edge. */}
          <rect
            className="eye-beam-back"
            data-eye-beam-back=""
            x={home.box.left - 4}
            y={home.box.top - 4}
            width={home.box.width + 8}
            height={home.box.height + 8}
            rx={home.radius + 4}
            fill="#ff9e3d"
            fillOpacity="0.5"
            filter={`url(#${id}-haze)`}
          />
          <circle
            className="eye-beam-pool"
            cx={line.x}
            cy={line.y}
            r="28"
            fill={`url(#${id}-pool)`}
          />
          <g className="eye-beam-reach" style={reachStyle(line)}>
            <polygon
              points={wedge(line.length, 32, 4)}
              fill={`url(#${id}-outer)`}
              filter={`url(#${id}-soft)`}
            />
            <polygon points={wedge(line.length, 9, 1)} fill={`url(#${id}-core)`} />
          </g>
        </g>
        {passes.map((p, i) => (
          <g
            key={String(i)}
            className="eye-beam-pass"
            data-eye-pass-at={p.at}
            clipPath={`url(#${id}-card-${String(i)})`}
            style={{ animationDelay: `${String(p.at)}ms` }}
          >
            <g className="eye-beam-reach" style={reachStyle(line)}>
              <polygon
                points={wedge(line.length, 60, 20)}
                fill="#ffc24d"
                fillOpacity="0.2"
                filter={`url(#${id}-haze)`}
              />
              <polygon
                points={wedge(line.length, 11, 3)}
                fill="#ffc24d"
                fillOpacity="0.42"
                filter={`url(#${id}-soft)`}
              />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Mounted once from `RootShell`, beside the tower frame. `root` is the app column. */
export function EyeLight({
  root,
}: {
  readonly root: RefObject<HTMLElement | null>;
}): ReactElement | null {
  const request = useEyeLight((s) => s.request);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [lit, setLit] = useState<Lit | undefined>(undefined);
  const [beam, setBeam] = useState<{ readonly beam: Beam; readonly seq: number } | undefined>(
    undefined,
  );
  // The page the light lands on: read when it lands, after a link to another page has moved there.
  const here = pathname.replace(/^\/app(?=\/|$)/, "") || "/";
  const page = useRef(here);
  page.current = here;

  // A light requested: wait for its item, scroll it into view if the landing left it off screen,
  // then play the beam. A newer request (or unmounting) cancels this one where it stands.
  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setLit(undefined);
    setBeam(undefined);
    // Her link to the whole calendar only scrolls (#7337; `landing.css` says why: a ring round the
    // whole calendar marks nothing). It still lets go of an earlier ring, as any newer link does, but
    // lights nothing and never re-centres the section over the landing's top-aligned scroll.
    if (request.anchor === CALENDAR_ANCHOR) return;
    let begun = performance.now();
    let lastTop: number | undefined;
    let stillSince = 0;
    let scrolled = false;

    const play = (el: HTMLElement) => {
      const landed: Lit = {
        el,
        path: page.current,
        radius: radiusOf(el),
        ...(request.reason ? { reason: request.reason } : {}),
      };
      const spatial = spatialMs();
      const origin = prefersStill() || spatial === 0 ? undefined : originFor();
      if (!origin) {
        setLit(landed);
        return;
      }
      // The Eye turns toward the item as the beam leaves it (the scene's glance, `tower-bus.ts`).
      const frame = useTowerBus.getState().frame;
      if (origin.kind === "tower" && frame)
        postTo(frame, glanceMessage(frame.getBoundingClientRect(), el.getBoundingClientRect()));
      setBeam({ beam: beamFor(origin, el, spatial), seq: request.seq });
      // The ring lands with the tip; the beam lets go once it has held and faded.
      timers.push(setTimeout(() => !cancelled && setLit(landed), spatial));
      timers.push(
        setTimeout(() => !cancelled && setBeam(undefined), spatial + BEAM_HOLD_MS + spatial),
      );
    };

    const wait = () => {
      raf = 0;
      const now = performance.now();
      if (cancelled || now - begun > WAIT_MS) return;
      const el = visiblePositionTarget(document, request.anchor);
      if (el) {
        const r = rectOf(el);
        const area = seen();
        if (!area) {
          // The phone's chat covers the whole page: nothing here is in view, so the light waits
          // for the member to close it (#7227 criterion 3), however long they keep reading.
          begun = now;
          lastTop = undefined;
        } else if (lastTop !== r.top) {
          lastTop = r.top;
          stillSince = now;
        } else if (now - stillSince >= STILL_MS) {
          if (scrolled || fullyInView(r, area)) {
            play(el);
            return;
          }
          scrolled = true;
          lastTop = undefined;
          bringIntoView(el, r, area);
        }
      }
      raf = requestAnimationFrame(wait);
    };
    raf = requestAnimationFrame(wait);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      for (const t of timers) clearTimeout(t);
    };
  }, [request]);

  // Leaving the page lets the ring go; the light that brought the member here lit after the move.
  const litHere = lit && lit.path === here ? lit : undefined;

  // The item's own edge lifts while it is lit (`eye-light.css` → `[data-eye-lit]`), and settles
  // back when the ring lets go.
  useEffect(() => {
    if (!litHere) return;
    const el = litHere.el;
    el.setAttribute("data-eye-lit", "");
    return () => el.removeAttribute("data-eye-lit");
  }, [litHere]);

  // A tap elsewhere on the page lets it go; a tap on the item itself (its chevron) keeps it, and
  // so does anything in the chat, where the member is reading her answer.
  useEffect(() => {
    if (!litHere) return;
    const app = root.current;
    if (!app) return;
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof Node && litHere.el.contains(e.target)) return;
      setLit(undefined);
    };
    app.addEventListener("pointerdown", onDown);
    return () => app.removeEventListener("pointerdown", onDown);
  }, [litHere, root]);

  return (
    <>
      {beam ? <BeamLayer key={beam.seq} beam={beam.beam} /> : null}
      {litHere ? (
        <EyeRing
          el={litHere.el}
          radius={litHere.radius}
          {...(litHere.reason ? { reason: litHere.reason } : {})}
        />
      ) : null}
    </>
  );
}
