import { useRouterState } from "@tanstack/react-router";
import { type ReactElement, type RefObject, useEffect, useId, useRef, useState } from "react";
import { CALENDAR_ANCHOR } from "../../../src/domain/edition-keys";
import {
  centre,
  DIM_MAX,
  type LightFrame,
  lightAt,
  lightOrigin,
  type Origin,
  type Rect,
  useEyeLight,
} from "./eye-light";
import { visiblePositionTarget } from "./position-anchor";
import { glanceMessage, postTo, prefersStill, useTowerBus } from "./tower-bus";

/**
 * THE EYE'S LIGHT, DRAWN (#7216 slice 2; the arithmetic and Eric's words are `eye-light.ts`). One
 * layer above the page and outside the tower's canvas, mounted once by the shell beside the tower
 * frame. A tap on one of Moneypenny's links into the page (`moneypenny-rail.tsx`) asks for the light;
 * this waits for the item to render and settle (the page's own landing, `landing.ts`, scrolls and
 * opens it, and anything it left off screen is scrolled into view here), then plays the four steps.
 *
 * Never over the text once it lands: the dim is a frame around the item, and the ring is drawn
 * outside its edge, with its label sitting on that edge. The ring is a shape and a label, never a
 * colour alone (docs/BRAND.md → Accessibility): a night line and an amber line, so one of the two
 * holds contrast in either palette. It stays until the member taps elsewhere on the page, leaves
 * the page, or follows another of her links. Under reduced motion only the ring shows, and where no
 * Eye is drawn (no column at this width, no brand Eye) the ring shows alone too.
 */

/** How long the light waits for its item to render (a page loads its rows late) before giving up. */
const WAIT_MS = 8000;
/** The item's box must hold still this long — the landing's scroll and the opened row's growth done. */
const STILL_MS = 160;

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

/** How far down the sticky topbar reaches. */
const topbarBottom = (): number =>
  document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 0;

/** Wholly in the part of the window the topbar leaves visible. */
const inView = (r: Rect, clear: number): boolean =>
  r.top >= clear && r.top + r.height <= window.innerHeight;

/** Where the light starts on this page, at this moment (`lightOrigin`). */
function originFor(): Origin | undefined {
  const frame = useTowerBus.getState().frame;
  const shown = frame?.getAttribute("data-shown") === "true" ? rectOf(frame) : null;
  const brand = document.querySelector(".brand-eye");
  const brandBox = brand && brand.getClientRects().length > 0 ? rectOf(brand) : null;
  return lightOrigin(shown, brandBox, topbarBottom());
}

interface Lit {
  readonly el: HTMLElement;
  readonly path: string;
}

interface Drawn {
  readonly frame: LightFrame;
  readonly origin: Origin;
  readonly target: Rect;
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

/** Step 4, held: the ring outside the item's edge and the label naming the Eye on it. */
export function EyeRing({ el }: { readonly el: HTMLElement }): ReactElement | null {
  const rect = useLiveRect(el);
  if (!rect) return null;
  return (
    <div
      className="eye-ring"
      data-eye-ring=""
      aria-hidden="true"
      style={{
        top: rect.top - 3,
        left: rect.left - 3,
        width: rect.width + 6,
        height: rect.height + 6,
      }}
    >
      <span className="eye-ring-label">
        <span className="eye-ring-glyph">◉</span> the Eye
      </span>
    </div>
  );
}

/** Steps 1–3 and the lift: the pool, the spark and its trail under a moving spotlight, the dim. */
function LightLayer({ drawn, root }: { readonly drawn: Drawn; readonly root: Rect }): ReactElement {
  const id = useId().replace(/:/g, "");
  const { frame, origin, target } = drawn;
  // The layer covers the app column (the chat beside it is never dimmed): page x → layer x.
  const x = (px: number) => px - root.left;
  const trail = frame.trail ?? [];
  const tail = trail[0];
  const head = trail[trail.length - 1];
  return (
    <svg
      className="eye-light"
      data-eye-light-step={frame.step}
      aria-hidden="true"
      focusable="false"
      style={{ left: root.left, width: root.width }}
    >
      <defs>
        <radialGradient id={`${id}-pool`}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#ffc24d" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff7a2e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-spot`}>
          <stop offset="0" stopColor="#ffc24d" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffc24d" stopOpacity="0" />
        </radialGradient>
        {tail && head ? (
          <linearGradient
            id={`${id}-trail`}
            gradientUnits="userSpaceOnUse"
            x1={x(tail.x)}
            y1={tail.y}
            x2={x(head.x)}
            y2={head.y}
          >
            <stop offset="0" stopColor="#ff7a2e" stopOpacity="0" />
            <stop offset="1" stopColor="#ffc24d" stopOpacity="0.9" />
          </linearGradient>
        ) : null}
        {frame.dim !== undefined ? (
          <mask id={`${id}-hole`}>
            <rect width="100%" height="100%" fill="#fff" />
            <rect
              x={x(target.left) - 6}
              y={target.top - 6}
              width={target.width + 12}
              height={target.height + 12}
              rx="10"
              fill="#000"
            />
          </mask>
        ) : null}
      </defs>
      {frame.dim !== undefined ? (
        <rect
          width="100%"
          height="100%"
          fill="#05070b"
          opacity={frame.dim}
          mask={`url(#${id}-hole)`}
          data-eye-dim={(frame.dim / DIM_MAX).toFixed(2)}
        />
      ) : null}
      {frame.pool ? (
        <circle
          cx={x(origin.x)}
          cy={origin.y}
          r={frame.pool.r}
          fill={`url(#${id}-pool)`}
          opacity={frame.pool.opacity}
        />
      ) : null}
      {frame.spark ? (
        <>
          <circle cx={x(frame.spark.x)} cy={frame.spark.y} r="150" fill={`url(#${id}-spot)`} />
          <polyline
            points={trail.map((p) => `${x(p.x)},${p.y}`).join(" ")}
            fill="none"
            stroke={`url(#${id}-trail)`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={x(frame.spark.x)} cy={frame.spark.y} r="9" fill={`url(#${id}-pool)`} />
          <circle cx={x(frame.spark.x)} cy={frame.spark.y} r="2.5" fill="#fff3d6" />
        </>
      ) : null}
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
  const [drawn, setDrawn] = useState<Drawn | undefined>(undefined);
  const [rootBox, setRootBox] = useState<Rect | undefined>(undefined);
  // The page the light lands on: read when it lands, after a link to another page has moved there.
  const here = pathname.replace(/^\/app(?=\/|$)/, "") || "/";
  const page = useRef(here);
  page.current = here;

  // A light requested: wait for its item, scroll it into view if the landing left it off screen,
  // then play the steps. A newer request (or unmounting) cancels this one where it stands.
  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    let raf = 0;
    setLit(undefined);
    setDrawn(undefined);
    // Her link to the whole calendar only scrolls (#7337; `landing.css` says why: a ring round the
    // whole calendar marks nothing). It still lets go of an earlier ring, as any newer link does, but
    // lights nothing and never re-centres the section over the landing's top-aligned scroll.
    if (request.anchor === CALENDAR_ANCHOR) return;
    const begun = performance.now();
    let lastTop: number | undefined;
    let stillSince = 0;
    let scrolled = false;

    const play = (el: HTMLElement) => {
      const path = page.current;
      const origin = prefersStill() ? undefined : originFor();
      if (!origin) {
        setLit({ el, path });
        return;
      }
      // The Eye turns toward the item as it focuses (the scene's glance, `tower-bus.ts`).
      const frame = useTowerBus.getState().frame;
      if (origin.kind === "tower" && frame)
        postTo(frame, glanceMessage(frame.getBoundingClientRect(), el.getBoundingClientRect()));
      const ceiling = topbarBottom();
      const start = performance.now();
      // `performance.now()`, never the frame's own timestamp: the two need not share an origin.
      const tick = () => {
        if (cancelled) return;
        const now = performance.now();
        const target = el.isConnected ? rectOf(el) : undefined;
        if (!target) {
          setDrawn(undefined);
          return;
        }
        const f = lightAt(now - start, origin, centre(target), ceiling);
        const box = root.current?.getBoundingClientRect();
        setRootBox(box ? { top: 0, left: box.left, width: box.width, height: 0 } : undefined);
        if (f.ring) setLit((prev) => (prev?.el === el ? prev : { el, path }));
        if (f.step === "done") {
          setDrawn(undefined);
          return;
        }
        setDrawn({ frame: f, origin, target });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const wait = () => {
      raf = 0;
      const now = performance.now();
      if (cancelled || now - begun > WAIT_MS) return;
      const el = visiblePositionTarget(document, request.anchor);
      if (el) {
        const r = rectOf(el);
        if (lastTop !== r.top) {
          lastTop = r.top;
          stillSince = now;
        } else if (now - stillSince >= STILL_MS) {
          if (scrolled || inView(r, topbarBottom())) {
            play(el);
            return;
          }
          // The light travels to an item on screen (#7216 criterion 7): scroll it there first.
          scrolled = true;
          lastTop = undefined;
          el.scrollIntoView?.({ block: "center" });
        }
      }
      raf = requestAnimationFrame(wait);
    };
    raf = requestAnimationFrame(wait);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [request, root]);

  // Leaving the page lets the ring go; the light that brought the member here lit after the move.
  const litHere = lit && lit.path === here ? lit : undefined;

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
      {drawn && rootBox ? <LightLayer drawn={drawn} root={rootBox} /> : null}
      {litHere ? <EyeRing el={litHere.el} /> : null}
    </>
  );
}
