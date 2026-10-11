import { createRequire } from "node:module";
import { describe, expect, it } from "@rstest/core";
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { MIXED } from "../../scripts/steer/pins.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";

// #5143, Eric 2026-10-11: thumbs up / down and "mixed" on each pin of a round's pictures. The page
// script opens three choices anchored to the pin, saves the reaction in the decision's own record
// (`pins: { "<option>:<phone|desk>:<n>": "up" | "down" | "mixed" }`) through the same chained write
// every answer takes — merged in one key at a time, so two views never erase each other's pins —
// counts it as an answer, and locks the pins wherever the store isn't. Mixed is ☯︎ (U+262F U+FE0E),
// Eric's pick over ◐.

type Win = Window & typeof globalThis & { claude?: unknown };
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (
    html: string,
    opts: { runScripts: "dangerously"; beforeParse: (w: Win) => void },
  ) => { window: Win };
};

const NOW = "2026-10-11T18:00:00Z";
const pic = (k: string) => ({ phone: `${k}-phone.jpg`, desk: `${k}-desk.jpg` });
const question = (over: Record<string, unknown> = {}) => ({
  q: 1,
  title: "What leads the trade form at phone width?",
  rec: "B",
  today: { ...pic("today"), source: "scripts/redesign/shoot.mjs", caption: "Today." },
  options: [
    { key: "A", name: "The chain first", delta: "Nothing moves.", ...pic("A") },
    {
      key: "B",
      name: "The order sentence first",
      delta: "The order sentence moves up.",
      ...pic("B"),
      pins: [
        { n: 1, x: 50, y: 12, label: "range strip" },
        { n: 2, x: 30, y: 40, label: "order line" },
      ],
    },
  ],
  ...over,
});
const roundOf = (q = question(), round = 1) =>
  designRound({ 5150: designDecisions([q], { issue: 5150, round }) }, { now: NOW });
const ROUND = roundOf();
const REC = `tp/${ROUND.id}/decisions/5150-q1`;

type Docs = Record<string, Record<string, unknown>>;
/** `update` as db.d.ts defines it: nested objects merge recursively, anything else replaces. */
function merge(into: Record<string, unknown>, body: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...into };
  for (const [k, v] of Object.entries(body)) {
    const was = out[k];
    const both = [v, was].every((x) => x && typeof x === "object" && !Array.isArray(x));
    out[k] = both ? merge(was as Record<string, unknown>, v as Record<string, unknown>) : v;
  }
  return out;
}
/** The store surface the page uses (db.d.ts): doc get / set / update / onSnapshot, collection get. */
function memoryStore(docs: Docs, writes: string[] = []) {
  const snap = (path: string) => ({ exists: path in docs, data: () => docs[path] });
  return {
    doc: (path: string) => ({
      get: () => Promise.resolve(snap(path)),
      set: (body: Record<string, unknown>) => {
        writes.push(`set ${path}`);
        docs[path] = JSON.parse(JSON.stringify(body));
        return Promise.resolve();
      },
      update: (body: Record<string, unknown>) => {
        writes.push(`update ${path}`);
        if (!(path in docs)) return Promise.reject({ code: "invalid_argument" });
        docs[path] = merge(docs[path] ?? {}, JSON.parse(JSON.stringify(body)));
        return Promise.resolve();
      },
      onSnapshot: () => () => undefined,
    }),
    collection: (path: string) => ({
      get: () =>
        Promise.resolve({
          docs: Object.entries(docs)
            .filter(([p]) => p.startsWith(`${path}/`) && !p.slice(path.length + 1).includes("/"))
            .map(([p, v]) => ({ id: p.slice(path.length + 1), data: () => v })),
        }),
    }),
  };
}
const claudeWith = (docs: Docs, writes: string[] = []) => ({
  use: (name: string) => Promise.resolve(name === "db" ? memoryStore(docs, writes) : null),
});
const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 5));
};

async function open(
  docs: Docs | null,
  {
    html = renderPage(ROUND, { img: (p) => ("src" in p ? p.src : null) }),
    before = (_w: Win): void => undefined,
    writes = [] as string[],
  } = {},
) {
  const { window } = new JSDOM(html, {
    runScripts: "dangerously",
    beforeParse(w) {
      if (docs) w.claude = claudeWith(docs, writes);
      before(w);
    },
  });
  await settle();
  const doc = window.document;
  const pin = (id: string) =>
    doc.querySelector<HTMLButtonElement>(`.pin[data-pin="${id}"]`) as HTMLButtonElement;
  const pop = () => doc.querySelector<HTMLElement>(".pinpop");
  const choices = () => [...doc.querySelectorAll<HTMLButtonElement>(".pinpop .pc")];
  const click = async (el: Element | null | undefined) => {
    (el as HTMLElement).click();
    await settle();
  };
  const choose = async (id: string, word: string) => {
    await click(pin(id));
    await click(choices().find((c) => c.textContent?.includes(word)));
  };
  const line = () => doc.getElementById("save-state")?.textContent ?? "";
  return { window, doc, pin, pop, choices, click, choose, line };
}

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
    const v = await open(
      {},
      { html: renderPage(zero, { img: (p) => ("src" in p ? p.src : null) }) },
    );
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
