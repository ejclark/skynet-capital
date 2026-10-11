import { describe, expect, it } from "@rstest/core";
import { MIXED } from "../../scripts/steer/pins.mjs";
import {
  type Docs,
  open,
  pageOf,
  question,
  REC,
  ROUND,
  roundOf,
  settle,
  type Win,
} from "./steer-pins-harness";

// #5143, Eric 2026-10-11: thumbs up / down and "mixed" on each pin of a round's pictures. The page
// script opens three choices anchored to the pin, saves the reaction in the decision's own record
// (`pins: { "<option>:<phone|desk>:<n>": "up" | "down" | "mixed" }`) through the same chained write
// every answer takes — merged in one key at a time, so two views never erase each other's pins —
// counts it as an answer, and locks the pins wherever the store isn't. Mixed is ☯︎ (U+262F U+FE0E),
// Eric's pick over ◐.

describe("tapping a pin opens three choices anchored to it", () => {
  it("shows glyph and word for each, inside the pin's own picture, focus on the first", async () => {
    const v = await open({});
    const b = v.pin("B:phone:1");
    await v.click(b);
    expect(v.pop()?.hidden).toBe(false);
    expect(v.choices().map((c) => c.textContent?.trim())).toEqual([
      "👍 Keep",
      "👎 Change",
      `${MIXED} Mixed`,
    ]);
    expect(v.pop()?.parentElement).toBe(b.parentElement);
    expect(b.nextElementSibling).toBe(v.pop());
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(v.pop()?.getAttribute("aria-label")).toBe("Pin 1: range strip");
    expect(v.doc.activeElement).toBe(v.choices()[0]);
  });

  it("closes on Escape and hands focus back to the pin", async () => {
    const v = await open({});
    await v.click(v.pin("B:phone:2"));
    v.doc.dispatchEvent(new v.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(v.pop()?.hidden).toBe(true);
    expect(v.pin("B:phone:2").getAttribute("aria-expanded")).toBe("false");
    expect(v.doc.activeElement).toBe(v.pin("B:phone:2"));
  });

  it("closes on a tap outside it", async () => {
    const v = await open({});
    await v.click(v.pin("B:phone:1"));
    await v.click(v.doc.querySelector("h1"));
    expect(v.pop()?.hidden).toBe(true);
  });

  it("moves to the next pin tapped, one popover at a time", async () => {
    const v = await open({});
    await v.click(v.pin("B:phone:1"));
    await v.click(v.pin("B:phone:2"));
    expect(v.doc.querySelectorAll(".pinpop")).toHaveLength(1);
    expect(v.pin("B:phone:1").getAttribute("aria-expanded")).toBe("false");
    expect(v.pin("B:phone:2").nextElementSibling).toBe(v.pop());
  });

  it("offers a problem's words on a round-0 page", async () => {
    const zero = roundOf(question({ kind: "problems" }), 0);
    const v = await open({}, { html: pageOf(zero) });
    await v.click(v.pin("B:phone:1"));
    expect(v.choices().map((c) => c.textContent?.trim())).toEqual([
      "👍 Yes, a problem",
      "👎 Not a problem",
      `${MIXED} Partly`,
    ]);
  });

  it("moves between the choices with the arrow keys, wrapping round", async () => {
    const v = await open({});
    await v.click(v.pin("B:phone:1"));
    const key = (k: string) =>
      v.doc.dispatchEvent(new v.window.KeyboardEvent("keydown", { key: k, bubbles: true }));
    key("ArrowRight");
    expect(v.doc.activeElement).toBe(v.choices()[1]);
    key("ArrowLeft");
    key("ArrowLeft");
    expect(v.doc.activeElement).toBe(v.choices()[2]);
  });

  it("opens on the saved choice when the pin has one", async () => {
    const v = await open({ [REC]: { pins: { "B:phone:2": "mixed" } } });
    await v.click(v.pin("B:phone:2"));
    expect(v.doc.activeElement).toBe(v.choices()[2]);
    expect(v.choices()[2]?.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("a choice saves in the decision's own record and counts as an answer", () => {
  it("writes pins under the pin's id, shows its glyph on the badge, and counts 1 of 1", async () => {
    const docs: Docs = {};
    const v = await open(docs);
    expect(v.line()).toMatch(/0 of 1 answered$/);
    await v.choose("B:phone:1", "Keep");
    expect(docs[REC]?.pins).toEqual({ "B:phone:1": "up" });
    expect(v.line()).toMatch(/1 of 1 answered$/);
    const b = v.pin("B:phone:1");
    expect(b.dataset.r).toBe("up");
    expect(b.querySelector(".pg")?.textContent).toBe("👍");
    expect(b.getAttribute("aria-label")).toBe("Pin 1: range strip — Keep");
    expect(v.pop()?.hidden).toBe(true);
    expect(v.doc.activeElement).toBe(b);
  });

  it("clears it when the same choice is tapped again — written as null, so the clear merges too", async () => {
    const docs: Docs = {};
    const v = await open(docs);
    await v.choose("B:phone:2", "Mixed");
    expect(docs[REC]?.pins).toEqual({ "B:phone:2": "mixed" });
    await v.click(v.pin("B:phone:2"));
    const mixed = v.choices().find((c) => c.textContent?.includes("Mixed"));
    expect(mixed?.getAttribute("aria-pressed")).toBe("true");
    await v.click(mixed);
    expect(docs[REC]?.pins).toEqual({ "B:phone:2": null });
    expect(v.pin("B:phone:2").querySelector(".pg")?.textContent).toBe("");
    expect(v.line()).toMatch(/0 of 1 answered$/);
  });

  it("keeps the decision's pick, marks and note when a pin saves, and theirs keep the pins", async () => {
    const docs: Docs = {
      [REC]: { pick: "B", react: { A: "not" }, note: "closer", pins: { "B:phone:1": "down" } },
    };
    const v = await open(docs);
    expect(v.pin("B:phone:1").querySelector(".pg")?.textContent).toBe("👎");
    await v.choose("B:phone:2", "Keep");
    expect(docs[REC]).toMatchObject({
      pick: "B",
      react: { A: "not" },
      note: "closer",
      pins: { "B:phone:1": "down", "B:phone:2": "up" },
    });
    await v.click(v.doc.querySelector('.react[data-opt="A"] .rb[data-v="more"]'));
    expect(docs[REC]?.pins).toEqual({ "B:phone:1": "down", "B:phone:2": "up" });
  });

  it("writes a record the store lacks whole, then merges each pin into it", async () => {
    const docs: Docs = {};
    const writes: string[] = [];
    const v = await open(docs, { writes });
    await v.choose("B:phone:1", "Keep");
    await v.choose("B:phone:2", "Change");
    expect(writes.filter((w) => w.endsWith(REC))).toEqual([`set ${REC}`, `update ${REC}`]);
    expect(docs[REC]).toMatchObject({ round: ROUND.id, key: "5150-q1", issue: 5150 });
  });

  // The same page open on his phone and his laptop: each merges only the pin it touched.
  it("never erases a pin another view saved after this one loaded", async () => {
    const docs: Docs = { [REC]: { pick: null, react: {}, note: "", pins: {} } };
    const v = await open(docs);
    (docs[REC] as { pins: Record<string, string> }).pins["B:phone:2"] = "down";
    await v.choose("B:phone:1", "Keep");
    expect(docs[REC]?.pins).toEqual({ "B:phone:1": "up", "B:phone:2": "down" });
  });

  it("keeps another view's pins when this view's tap rewrites the whole record", async () => {
    const docs: Docs = { [REC]: { pick: null, react: {}, note: "", pins: {} } };
    const v = await open(docs);
    await v.choose("B:phone:1", "Change");
    (docs[REC] as { pins: Record<string, string> }).pins["B:phone:2"] = "up";
    await v.click(v.doc.querySelector('.react[data-opt="A"] .rb[data-v="more"]'));
    expect(docs[REC]).toMatchObject({ react: { A: "more" } });
    expect(docs[REC]?.pins).toEqual({ "B:phone:1": "down", "B:phone:2": "up" });
  });

  it("paints what the store holds when the page opens, a null as no reaction", async () => {
    const v = await open({ [REC]: { pins: { "B:phone:1": "down", "B:phone:2": null } } });
    expect(v.pin("B:phone:1").dataset.r).toBe("down");
    expect(v.pin("B:phone:2").dataset.r).toBeUndefined();
    expect(v.pin("B:phone:2").getAttribute("aria-label")).toBe("Pin 2: order line");
    expect(v.line()).toMatch(/1 of 1 answered$/);
  });

  it("carries the pin reactions in Copy as text", async () => {
    const written: string[] = [];
    const v = await open(
      { [REC]: { pins: { "B:phone:1": "up" } } },
      {
        before: (w) =>
          Object.defineProperty(w.navigator, "clipboard", {
            value: {
              writeText: (t: string) => {
                written.push(t);
                return Promise.resolve();
              },
            },
          }),
      },
    );
    await v.click(v.doc.getElementById("copy"));
    expect(written[0]).toContain("pin B:phone:1 up");
  });
});

// #5243: a tap while the bar says "Loading your answers…" — likelier now a pin invites one in the
// first second — was held as a blank record plus the tap, and written whole over the stored record
// once the store answered, erasing the pick and note it held. Each held change now lands on top.
describe("a tap held while the store connects merges into the stored record", () => {
  async function openSlow(docs: Docs, writes: string[] = []) {
    let arrive: () => void = () => undefined;
    const late = new Promise<void>((r) => {
      arrive = r;
    });
    const v = await open(docs, { writes, late });
    const answer = async () => {
      arrive();
      await settle();
    };
    return { ...v, answer };
  }
  const STORED = { pick: "B", react: {}, note: "closer", pins: { "B:phone:1": "down" } };

  it("keeps the stored pick, note and pins under a pin and a mark tapped before it answers", async () => {
    const docs: Docs = { [REC]: structuredClone(STORED) };
    const writes: string[] = [];
    const v = await openSlow(docs, writes);
    expect(v.line()).toBe("Loading your answers…");
    await v.choose("B:phone:2", "Keep");
    await v.click(v.doc.querySelector('.react[data-opt="A"] .rb[data-v="more"]'));
    expect(v.line()).toBe("Sending once your answers load");
    expect(writes).toEqual([]);
    await v.answer();
    expect(docs[REC]).toMatchObject({
      pick: "B",
      react: { A: "more" },
      note: "closer",
      pins: { "B:phone:1": "down", "B:phone:2": "up" },
    });
    expect(v.pin("B:phone:1").dataset.r).toBe("down");
    expect(v.doc.querySelector<HTMLTextAreaElement>("[data-note]")?.value).toBe("closer");
    expect(v.line()).toMatch(/1 of 1 answered$/);
  });

  it("lands a held press as the value it set, so pressing what the store already holds keeps it", async () => {
    const docs: Docs = { [REC]: structuredClone(STORED) };
    const v = await openSlow(docs);
    await v.click(v.doc.querySelector('.react[data-opt="B"] .rb[data-v="build"]'));
    await v.choose("B:phone:1", "Change");
    await v.answer();
    expect(docs[REC]).toMatchObject({
      pick: "B",
      note: "closer",
      pins: { "B:phone:1": "down" },
    });
    const build = v.doc.querySelector('.react[data-opt="B"] .rb[data-v="build"]');
    expect(build?.getAttribute("aria-pressed")).toBe("true");
  });
});

// A round republished with fewer or renumbered pins keeps the same records, so a record can hold a
// reaction on a pin the page no longer shows. The bar counts — and Copy as text carries — only the
// pins this page shows, with a value it offers: anything else is ignored, never a crash.
describe("only the pins this page shows count", () => {
  const copied = async (docs: Docs) => {
    const written: string[] = [];
    const v = await open(docs, {
      before: (w) =>
        Object.defineProperty(w.navigator, "clipboard", {
          value: { writeText: (t: string) => Promise.resolve(written.push(t)) },
        }),
    });
    await v.click(v.doc.getElementById("copy"));
    return { v, text: written[0] ?? "" };
  };

  it("doesn't count or copy a reaction on a pin the republished page no longer shows", async () => {
    const { v, text } = await copied({
      [REC]: { pins: { "B:phone:9": "up", "C:desk:1": "down" } },
    });
    expect(v.line()).toMatch(/0 of 1 answered$/);
    expect(v.doc.querySelectorAll(".pin[data-r]")).toHaveLength(0);
    expect(text).toContain("#5150 What leads the trade form at phone width?: —");
    expect(text).not.toContain("B:phone:9");
  });

  it("doesn't count a value the page never offers, and the next tap still saves", async () => {
    const docs: Docs = { [REC]: { pins: { "B:phone:1": "meh", "B:phone:2": 7 } } };
    const v = await open(docs);
    expect(v.line()).toMatch(/0 of 1 answered$/);
    await v.choose("B:phone:2", "Keep");
    expect(v.line()).toMatch(/1 of 1 answered$/);
    expect(docs[REC]?.pins).toEqual({ "B:phone:1": "meh", "B:phone:2": "up" });
  });

  it("reads a stored pins that isn't an object as none, and never writes it back in pieces", async () => {
    const docs: Docs = { [REC]: { pick: null, react: {}, note: "", pins: "up" } };
    const v = await open(docs);
    expect(v.line()).toMatch(/0 of 1 answered$/);
    await v.click(v.doc.querySelector('.react[data-opt="A"] .rb[data-v="more"]'));
    expect(docs[REC]).toMatchObject({ react: { A: "more" }, pins: {} });
  });
});

describe("the pins lock wherever the store isn't", () => {
  it("disables every pin in a view with no store, and opens nothing", async () => {
    const v = await open(null);
    const pins = [...v.doc.querySelectorAll<HTMLButtonElement>(".pin")];
    expect(pins).toHaveLength(2);
    expect(pins.every((p) => p.disabled)).toBe(true);
    await v.click(pins[0]);
    expect(v.pop()).toBeNull();
  });
});

describe("the popover never covers its pin, and never leaves the screen sideways", () => {
  type Box = { left: number; top: number; width: number; height: number };
  /** Lay the page out by hand (JSDOM has no layout): a 390 × 800 screen, the bar at 740. */
  const layout = (pinBox: Box) => (w: Win) => {
    const boxes = (el: Element): Box => {
      if (el.classList.contains("pin")) return pinBox;
      if (el.classList.contains("pinned")) return { left: 40, top: 100, width: 240, height: 520 };
      if (el.classList.contains("bar")) return { left: 0, top: 740, width: 390, height: 60 };
      return { left: 0, top: 0, width: 0, height: 0 };
    };
    w.Element.prototype.getBoundingClientRect = function (this: Element) {
      const b = boxes(this);
      return {
        ...b,
        x: b.left,
        y: b.top,
        right: b.left + b.width,
        bottom: b.top + b.height,
        toJSON: () => b,
      } as DOMRect;
    };
    Object.defineProperty(w.HTMLElement.prototype, "offsetWidth", {
      get(this: HTMLElement) {
        return this.classList.contains("pinpop") ? 300 : 0;
      },
    });
    Object.defineProperty(w.HTMLElement.prototype, "offsetHeight", {
      get(this: HTMLElement) {
        return this.classList.contains("pinpop") ? 60 : 0;
      },
    });
    Object.defineProperty(w.Element.prototype, "clientWidth", {
      get(this: Element) {
        return this === w.document.documentElement ? 390 : 0;
      },
    });
    Object.defineProperty(w, "innerHeight", { value: 800 });
  };
  const placed = async (pinBox: Box) => {
    const v = await open({}, { before: layout(pinBox) });
    await v.click(v.pin("B:phone:1"));
    const pop = v.pop() as HTMLElement;
    // Back to the screen: the popover sits in the picture's frame, at 40, 100.
    return {
      left: 40 + Number.parseFloat(pop.style.left),
      top: 100 + Number.parseFloat(pop.style.top),
      side: pop.dataset.side,
    };
  };

  it("opens below the pin, clamped inside the 8px screen gutter", async () => {
    const at = await placed({ left: 30, top: 200, width: 32, height: 32 });
    expect(at.side).toBe("below");
    expect(at.top).toBeGreaterThanOrEqual(232);
    expect(at.left).toBe(8);
    const right = await placed({ left: 350, top: 200, width: 32, height: 32 });
    expect(right.left + 300).toBeLessThanOrEqual(390 - 8);
  });

  it("opens above a pin near the bar, ending before the pin begins", async () => {
    const at = await placed({ left: 120, top: 690, width: 32, height: 32 });
    expect(at.side).toBe("above");
    expect(at.top + 60).toBeLessThanOrEqual(690);
  });
});
