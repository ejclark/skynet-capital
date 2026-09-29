import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import {
  DEFAULT_MOOD,
  flareTower,
  glanceMessage,
  postTo,
  REGARD_TARGETS,
  regardMessage,
  replayToVantage,
  setVantageFrame,
  type TowerMessage,
  useCardFrame,
  useTowerBus,
  useTowerMood,
  useTowerRegard,
  useTowerRun,
} from "../../src/shell/tower-bus";

/**
 * The page's half of the tower contract (#3807 slice 3a). What crosses into a `/tower` frame is a
 * point, two dials or a run switch — always to our own origin — and the Eye regards only what a
 * POINTER hovers, never what keyboard focus lands on.
 */
const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height }) as DOMRect;

/** A stand-in frame whose window records what was posted and to which origin. */
function fakeFrame(box = rect(1100, 60, 160, 96)) {
  const sent: { message: TowerMessage; origin: string }[] = [];
  const frame = document.createElement("iframe");
  Object.defineProperty(frame, "contentWindow", {
    value: {
      postMessage: (message: TowerMessage, origin: string) => sent.push({ message, origin }),
    },
  });
  frame.getBoundingClientRect = () => box;
  return { frame, sent, types: () => sent.map((s) => s.message.type) };
}

afterEach(() => setVantageFrame(null));

describe("the message shapes", () => {
  it("a glance points at the control's centre, measured from the frame's top-left", () => {
    expect(glanceMessage(rect(1200, 240, 360, 440), rect(700, 250, 40, 20))).toEqual({
      type: "tower:glance",
      x: -480,
      y: 20,
    });
  });

  it("a regard carries nothing but its type and the point", () => {
    const m = regardMessage(rect(1100, 60, 160, 96), rect(300, 100, 40, 40));
    expect(Object.keys(m).sort()).toEqual(["type", "x", "y"]);
    expect(m).toEqual({ type: "tower:regard", x: -780, y: 60 });
  });
});

describe("postTo", () => {
  it("posts to our own origin, never to any origin", () => {
    const f = fakeFrame();
    expect(postTo(f.frame, { type: "tower:release" })).toBe(true);
    expect(f.sent).toEqual([
      { message: { type: "tower:release" }, origin: window.location.origin },
    ]);
  });

  it("does nothing without a frame", () => {
    expect(postTo(null, { type: "tower:release" })).toBe(false);
  });
});

describe("useTowerRegard — pointer hover only", () => {
  function mount() {
    const root = document.createElement("div");
    root.innerHTML =
      '<button class="eh-day" id="d1">1</button><button class="eh-day" id="d2">2</button><p id="text">x</p>';
    document.body.append(root);
    const ref = createRef<HTMLDivElement>() as { current: HTMLDivElement | null };
    ref.current = root;
    const f = fakeFrame();
    setVantageFrame(f.frame);
    const hook = renderHook(() => useTowerRegard(ref));
    const over = (id: string, pointerType: string) =>
      root
        .querySelector(`#${id}`)
        ?.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType }));
    const out = (id: string, to: string | null, pointerType = "mouse") =>
      root.querySelector(`#${id}`)?.dispatchEvent(
        new PointerEvent("pointerout", {
          bubbles: true,
          pointerType,
          relatedTarget: to ? root.querySelector(`#${to}`) : null,
        }),
      );
    return { root, f, hook, over, out };
  }

  it("names only calendar days and blotter rows as targets", () => {
    expect(REGARD_TARGETS).toBe('.eh-day, tr[id^="pos-"]');
  });

  it("regards a hovered day, once per day, and releases when the pointer leaves it", () => {
    const m = mount();
    m.over("d1", "mouse");
    m.over("d1", "mouse");
    m.out("d1", "d2");
    m.over("d2", "mouse");
    m.out("d2", "text");
    expect(m.f.types()).toEqual(["tower:regard", "tower:release", "tower:regard", "tower:release"]);
    m.hook.unmount();
    m.root.remove();
  });

  it("ignores a touch (a tap is not a hover) and keyboard focus", () => {
    const m = mount();
    m.over("d1", "touch");
    (m.root.querySelector("#d1") as HTMLButtonElement).focus();
    m.root.querySelector("#d1")?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(m.f.sent).toEqual([]);
    m.hook.unmount();
    m.root.remove();
  });

  it("ignores hovers on anything that is not a target", () => {
    const m = mount();
    m.over("text", "mouse");
    expect(m.f.sent).toEqual([]);
    m.hook.unmount();
    m.root.remove();
  });
});

describe("useTowerMood", () => {
  it("sends a landmark's dials to the crest, and the scene's defaults on the way out", () => {
    const f = fakeFrame();
    setVantageFrame(f.frame);
    const hook = renderHook(() => useTowerMood({ power: 0.9, health: -0.4 }));
    hook.unmount();
    expect(f.sent.map((s) => s.message)).toEqual([
      { type: "tower:mood", power: 0.9, health: -0.4 },
      { type: "tower:mood", ...DEFAULT_MOOD },
    ]);
  });

  it("claims nothing for an account without a landmark", () => {
    const f = fakeFrame();
    setVantageFrame(f.frame);
    renderHook(() => useTowerMood(undefined)).unmount();
    expect(f.sent).toEqual([]);
  });
});

describe("useTowerRun", () => {
  it("pauses a crest that is not shown, and runs it once it is", () => {
    const f = fakeFrame();
    setVantageFrame(f.frame);
    const ref = { current: f.frame };
    const hook = renderHook(({ shown }) => useTowerRun(ref, shown), {
      initialProps: { shown: false },
    });
    hook.rerender({ shown: true });
    expect(f.sent.map((s) => s.message)).toEqual([
      { type: "tower:run", on: false },
      { type: "tower:run", on: true },
    ]);
    hook.unmount();
  });
});

describe("flareTower — the Eye brightens once (#3807 slice 3b-3)", () => {
  const flare = { type: "tower:flare", kind: "new-high" };
  /** happy-dom has no `matchMedia` (so motion is the default); install one that prefers reduced. */
  const reduceMotion = () =>
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (q: string) => ({ matches: q.includes("reduce"), media: q }),
    });
  afterEach(() => {
    useTowerBus.setState({ on: false, mood: DEFAULT_MOOD });
    Reflect.deleteProperty(window, "matchMedia");
  });

  function cardHook() {
    const card = fakeFrame(rect(900, 200, 384, 664));
    const ref = { current: card.frame };
    return { card, hook: renderHook(() => useCardFrame(ref)) };
  }

  it("posts once to the running crest and to a mounted character card, to our origin only", () => {
    const crest = fakeFrame();
    setVantageFrame(crest.frame);
    useTowerBus.setState({ on: true });
    const { card, hook } = cardHook();
    expect(flareTower("new-high")).toBe(2);
    expect(crest.sent).toEqual([{ message: flare, origin: window.location.origin }]);
    expect(card.sent).toEqual([{ message: flare, origin: window.location.origin }]);
    hook.unmount();
  });

  it("stops reaching the card once it unmounts", () => {
    const { card, hook } = cardHook();
    hook.unmount();
    expect(flareTower("new-high")).toBe(0);
    expect(card.sent).toEqual([]);
  });

  it("skips a paused crest — a flare is a moment, not something to play when next seen", () => {
    const crest = fakeFrame();
    setVantageFrame(crest.frame);
    expect(flareTower("new-high")).toBe(0);
    expect(crest.sent).toEqual([]);
  });

  it("sends nothing under reduced motion", () => {
    reduceMotion();
    const crest = fakeFrame();
    setVantageFrame(crest.frame);
    useTowerBus.setState({ on: true });
    const { card, hook } = cardHook();
    expect(flareTower("new-high")).toBe(0);
    expect(crest.types()).toEqual([]);
    expect(card.types()).toEqual([]);
    hook.unmount();
  });

  it("is never replayed: a frame that says tower:ready gets the dials and the run state only", () => {
    const crest = fakeFrame();
    setVantageFrame(crest.frame);
    useTowerBus.setState({ on: true });
    flareTower("new-high");
    const late = fakeFrame();
    setVantageFrame(late.frame);
    replayToVantage();
    expect(late.types()).toEqual(["tower:mood", "tower:run"]);
    expect(crest.types()).toEqual(["tower:flare"]);
  });
});
