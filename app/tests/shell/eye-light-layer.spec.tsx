import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { CALENDAR_ANCHOR } from "../../../src/domain/edition-keys";
import { requestLight, useEyeLight } from "../../src/shell/eye-light";
import { EyeLight } from "../../src/shell/eye-light-layer";
import { setVantageFrame } from "../../src/shell/tower-bus";
import css from "../../src/styles/eye-light.css?raw";

// #7216 slice 2 — the ring and its label stay on the item her link names. happy-dom draws no Eye
// (no tower frame, no laid-out brand Eye), so these exercise the ring alone: the reduced-motion
// path and the no-Eye path are the same one.

function Shell() {
  const app = useRef<HTMLDivElement>(null);
  return (
    <div ref={app}>
      <Outlet />
      <EyeLight root={app} />
    </div>
  );
}

async function mount() {
  const root = createRootRoute({ component: Shell });
  const accounts = createRoute({
    getParentRoute: () => root,
    path: "/accounts",
    component: () => (
      <>
        <table data-eye-card="">
          <tbody>
            <tr id="pos-NVDA">
              <td>NVDA</td>
            </tr>
            <tr id="pos-AAPL">
              <td>
                <button type="button">AAPL</button>
              </td>
            </tr>
          </tbody>
        </table>
        {/* The landing calendar's section, by its real anchor (#7337). */}
        <section id={CALENDAR_ANCHOR}>
          <h2>the calendar</h2>
        </section>
      </>
    ),
  });
  const trade = createRoute({
    getParentRoute: () => root,
    path: "/trade",
    component: () => <p>the ticket</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([accounts, trade]),
    basepath: "/app",
    history: createMemoryHistory({ initialEntries: ["/app/accounts"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByText("NVDA");
  return router;
}

/** happy-dom lays nothing out; give every element one box so the light finds its item. */
function layOut(): () => void {
  const rects = Element.prototype.getClientRects;
  const box = Element.prototype.getBoundingClientRect;
  Element.prototype.getClientRects = () => [{}] as unknown as DOMRectList;
  Element.prototype.getBoundingClientRect = () =>
    ({ top: 300, left: 400, width: 600, height: 40, bottom: 340, right: 1000 }) as DOMRect;
  return () => {
    Element.prototype.getClientRects = rects;
    Element.prototype.getBoundingClientRect = box;
  };
}

/** The ring still held, not one fading out after it was let go. */
const heldRing = () => document.querySelector("[data-eye-ring]:not([data-eye-ring-leaving])");

describe("EyeLight · the ring on the item her link names", () => {
  let restore: () => void;
  beforeEach(() => {
    useEyeLight.setState({ request: undefined });
    restore = layOut();
  });
  afterEach(() => restore());

  it("rings the item and names the Eye on it", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-NVDA"));
    const ring = await waitFor(() => {
      const el = document.querySelector("[data-eye-ring]");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(ring).toHaveTextContent(/the Eye/i);
    // Outside the item's edge, never over it.
    expect(ring.style.top).toBe("297px");
    expect(ring.style.width).toBe("606px");
  });

  it("keeps the ring through a tap on the item itself, and lets it go on a tap elsewhere", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-AAPL"));
    await waitFor(() => expect(document.querySelector("[data-eye-ring]")).not.toBeNull());
    fireEvent.pointerDown(screen.getByRole("button", { name: "AAPL" }));
    expect(document.querySelector("[data-eye-ring]")).not.toBeNull();
    fireEvent.pointerDown(screen.getByText("NVDA"));
    // Let go, it fades from where it is on --dur-quick (never pops), then goes.
    expect(heldRing()).toBeNull();
    expect(document.querySelector("[data-eye-ring-leaving]")).not.toBeNull();
    await waitFor(() => expect(document.querySelector("[data-eye-ring]")).toBeNull());
  });

  it("lets the ring go when the member leaves the page", async () => {
    const router = await mount();
    act(() => requestLight("/accounts#pos-NVDA"));
    await waitFor(() => expect(document.querySelector("[data-eye-ring]")).not.toBeNull());
    await act(() => router.navigate({ to: "/trade" }));
    await screen.findByText("the ticket");
    expect(document.querySelector("[data-eye-ring]")).toBeNull();
  });
});

// #7337 — her `[N more on the calendar](/#calendar)` link only scrolls (`landing.css` says why: an
// outline round the whole calendar would mark nothing). The light neither rings the section nor
// re-centres it over the landing's top-aligned scroll.
describe("EyeLight · her link to the whole calendar", () => {
  let restore: () => void;
  let blocks: unknown[];
  const scrollIntoView = Element.prototype.scrollIntoView;
  beforeEach(() => {
    useEyeLight.setState({ request: undefined });
    restore = layOut();
    // The calendar is taller than the window and starts below it, as on a phone: the light's own
    // "wholly in view" check fails, which is what made it call `scrollIntoView({block:"center"})`.
    const box = Element.prototype.getBoundingClientRect;
    const tall = { top: 900, left: 400, width: 600, height: 1400, bottom: 2300, right: 1000 };
    Element.prototype.getBoundingClientRect = function (this: Element) {
      return this.id === CALENDAR_ANCHOR ? (tall as DOMRect) : box.call(this);
    };
    blocks = [];
    Element.prototype.scrollIntoView = function (this: Element, arg?: unknown) {
      if (this.id === CALENDAR_ANCHOR) blocks.push((arg as ScrollIntoViewOptions)?.block ?? arg);
    };
  });
  afterEach(() => {
    restore();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  /** Long enough for the light to find the section, see it hold still, and act on it. */
  const settle = () => act(() => new Promise((r) => setTimeout(r, 600)));

  it("draws no ring round the calendar and never re-centres it", async () => {
    await mount();
    act(() => requestLight(`/#${CALENDAR_ANCHOR}`));
    await settle();
    expect(blocks).not.toContain("center");
    expect(document.querySelector("[data-eye-ring]")).toBeNull();
  });

  it("lets go of a ring on an earlier item, as any newer link of hers does", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-NVDA"));
    await waitFor(() => expect(document.querySelector("[data-eye-ring]")).not.toBeNull());
    act(() => requestLight(`/#${CALENDAR_ANCHOR}`));
    await settle();
    expect(document.querySelector("[data-eye-ring]")).toBeNull();
  });
});

// #7227 — the item the Eye lands on lifts its own edge, and is wholly in view first: with the
// chat over the whole page (the dock with its History open, on a phone) nothing is, so the light
// waits for the chat to close.
describe("EyeLight · the landing, articulated, on an item in view", () => {
  let restore: () => void;
  let chat: HTMLElement | undefined;
  beforeEach(() => {
    useEyeLight.setState({ request: undefined });
    restore = layOut();
    const box = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (!this.classList.contains("mp-dock")) return box.call(this);
      const w = window.innerWidth;
      const h = window.innerHeight;
      return { top: 0, left: 0, width: w, height: h, bottom: h, right: w } as DOMRect;
    };
  });
  afterEach(() => {
    chat?.remove();
    chat = undefined;
    restore();
  });

  /** Long enough for the light to find the item, see it hold still, and act on it. */
  const settle = () => act(() => new Promise((r) => setTimeout(r, 600)));

  it("lifts the item's own edge while the ring holds it, and lets it settle when it goes", async () => {
    await mount();
    const row = document.getElementById("pos-NVDA") as HTMLElement;
    act(() => requestLight("/accounts#pos-NVDA"));
    await waitFor(() => expect(row).toHaveAttribute("data-eye-lit"));
    fireEvent.pointerDown(screen.getByRole("button", { name: "AAPL" }));
    expect(row).not.toHaveAttribute("data-eye-lit");
  });

  it("waits while the chat covers the whole page, and lands once it closes", async () => {
    await mount();
    chat = document.createElement("div");
    chat.className = "mp-dock";
    document.body.append(chat);
    act(() => requestLight("/accounts#pos-NVDA"));
    await settle();
    expect(document.querySelector("[data-eye-ring]")).toBeNull();
    chat.remove();
    await waitFor(() => expect(document.querySelector("[data-eye-ring]")).not.toBeNull());
  });
});

// #7487 slice 5 — the beam: with the tower's Eye on screen, a straight beam runs from it to the item,
// behind the cards it crosses, and the ring lands with its tip carrying the Eye's reason. happy-dom
// reads no stylesheet, so the extend runs on the spatial token's fallback (260 ms).
describe("EyeLight · the beam from the tower's Eye", () => {
  let restore: () => void;
  let frame: HTMLIFrameElement;
  beforeEach(() => {
    useEyeLight.setState({ request: undefined });
    restore = layOut();
    frame = document.createElement("iframe");
    frame.setAttribute("data-shown", "true");
    // The scene's glance goes to the frame's window; here a stand-in takes it.
    Object.defineProperty(frame, "contentWindow", { value: { postMessage: () => undefined } });
    document.body.append(frame);
    setVantageFrame(frame);
  });
  afterEach(() => {
    setVantageFrame(null);
    frame.remove();
    restore();
  });

  it("plays the beam through the item's card, then rings the item with the reason", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-NVDA", "left its usual range"));
    const beam = await waitFor(() => {
      const el = document.querySelector("[data-eye-beam]");
      expect(el).not.toBeNull();
      return el as SVGElement;
    });
    // The item's own card (the table marked data-eye-card) is crossed and lit from behind.
    expect(Number(beam.getAttribute("data-eye-beam-passes"))).toBeGreaterThanOrEqual(1);
    expect(beam.querySelector("[data-eye-beam-back]")).not.toBeNull();
    // No ring until the tip lands.
    expect(document.querySelector("[data-eye-ring]")).toBeNull();
    const ring = await waitFor(() => {
      const el = document.querySelector("[data-eye-ring]");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(ring).toHaveTextContent("◉ the Eye · left its usual range");
    // Held, faded, gone; the ring stays.
    await waitFor(() => expect(document.querySelector("[data-eye-beam]")).toBeNull());
    expect(document.querySelector("[data-eye-ring]")).not.toBeNull();
  });

  it("under reduced motion plays no beam, and the ring shows at once", async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce") })) as typeof matchMedia;
    try {
      await mount();
      act(() => requestLight("/accounts#pos-NVDA"));
      await waitFor(() => expect(document.querySelector("[data-eye-ring]")).not.toBeNull());
      expect(document.querySelector("[data-eye-beam]")).toBeNull();
    } finally {
      window.matchMedia = matchMedia;
    }
  });
});

// #7487 slice 5 review — the beam is composite-only, lets go when the page moves under it, and a
// newer light fades the older beam out from where it is instead of cutting it off.
describe("EyeLight · the beam, reviewed", () => {
  let restore: () => void;
  let frame: HTMLIFrameElement;
  beforeEach(() => {
    useEyeLight.setState({ request: undefined });
    restore = layOut();
    frame = document.createElement("iframe");
    frame.setAttribute("data-shown", "true");
    Object.defineProperty(frame, "contentWindow", { value: { postMessage: () => undefined } });
    document.body.append(frame);
    setVantageFrame(frame);
  });
  afterEach(() => {
    setVantageFrame(null);
    frame.remove();
    restore();
  });

  const beamUp = () =>
    waitFor(() => {
      const el = document.querySelector<HTMLElement>("[data-eye-beam]:not([data-leaving])");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

  it("moves only HTML boxes; the SVG it draws (blurs, masks, clips) never animates", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-NVDA"));
    const beam = await beamUp();
    expect(beam).toBeInstanceOf(HTMLDivElement);
    for (const cls of ["eye-beam-window", "eye-beam-unslide", "eye-beam-pass", "eye-beam-back"])
      expect(beam.querySelector(`.${cls}`)).toBeInstanceOf(HTMLDivElement);
    // No animated class sits on an SVG element.
    for (const el of beam.querySelectorAll("svg, svg *"))
      expect(el.getAttribute("class") ?? "").not.toMatch(/eye-beam/);
    // Every blur's region is bounded in user space, never a share of a long line's box.
    const filters = [...beam.querySelectorAll("filter")];
    expect(filters.length).toBeGreaterThan(0);
    for (const f of filters) expect(f.getAttribute("filterUnits")).toBe("userSpaceOnUse");
  });

  it("animates only transform and opacity (eye-light.css), with no blend mode", () => {
    const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g)];
    expect(keyframes.length).toBeGreaterThan(0);
    for (const [, , body] of keyframes) {
      const props = [...(body ?? "").matchAll(/([\w-]+)\s*:/g)].map((m) => m[1]);
      for (const p of props) expect(["transform", "opacity"]).toContain(p);
    }
    // The layer is its own stacking context: a blend has nothing of the page behind it.
    expect(css).not.toMatch(/mix-blend-mode/);
  });

  it("lets the beam go when the page scrolls under it, and keeps the ring", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-NVDA"));
    const beam = await beamUp();
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(beam).toHaveAttribute("data-leaving");
    await waitFor(() => expect(document.querySelector("[data-eye-beam]")).toBeNull());
    await waitFor(() => expect(heldRing()).not.toBeNull());
  });

  it("fades an older beam from where it is when a newer light arrives", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-NVDA"));
    const first = await beamUp();
    act(() => requestLight("/accounts#pos-AAPL"));
    // Still on screen, now leaving, its fade starting from the opacity it had.
    expect(first.isConnected).toBe(true);
    expect(first).toHaveAttribute("data-leaving");
    expect(first.style.opacity).not.toBe("");
    await waitFor(() => expect(first.isConnected).toBe(false));
  });
});
