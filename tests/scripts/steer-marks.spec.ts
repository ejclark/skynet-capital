import { describe, expect, it } from "@rstest/core";
import { OPENING_LINE, PENCIL, REVEAL_SHOW } from "../../scripts/steer/marks.mjs";
import { ROUND_INTRO, renderPage } from "../../scripts/steer/render.mjs";
import { fixture } from "./steer-fixture";
import {
  CLEAN,
  choose,
  marks,
  openingQuestion,
  pageOf,
  pressEscape,
  REC,
  TP,
  tapFrame,
  tpOf,
  view,
} from "./steer-marks-fixture";
import type { Docs } from "./steer-pins-harness";

// Eric, 2026-10-14, on round 0: "doesn't this create bias through the process out of the gate?"
// and "I'm redundantly navigating the same screenshots". An opening question shows Today clean —
// he taps any spot to mark it 👍 Like · 👎 Don't like · ✏︎ Would change, through the pins' own
// popover — and Claude's problems, all pinned on ONE Today frame, stay folded until he presses
// "Show what Claude found". A mark saves as `marks[<id>]` with its reaction and note under the
// same id, merged one key at a time like a pin; the press stamps `revealAt`.

const ID = /^today:phone:m[a-z0-9]+$/;
type Mark = { x: number; y: number; at: string; beforeReveal: boolean } | null;
const markMap = (docs: Docs) => (docs[REC]?.marks ?? {}) as Record<string, Mark>;
/** The one mark a map holds, as [id, mark]; throws on none or more. */
const only = (m: Record<string, Mark>): [string, Mark] => {
  const all = Object.entries(m);
  if (all.length !== 1) throw new Error(`expected one mark, found ${all.length}`);
  return all[0] as [string, Mark];
};
const html = pageOf();
const region = (v: { doc: Document }) => v.doc.getElementById("found-5200-q1");
const revealer = (v: { doc: Document }) => v.doc.getElementById("reveal-5200-q1");

describe("an opening question shows Today clean and folds Claude's problems away", () => {
  it("draws Today's frames with no pins, under the line that says to mark first", () => {
    const stage = html.slice(html.indexOf('class="opening"'), html.indexOf('class="revealer"'));
    expect(stage).toContain(OPENING_LINE);
    expect(stage).toContain('data-option="today" data-frame="phone"');
    expect(stage).toContain('data-option="today" data-frame="desk"');
    expect(stage).not.toContain('class="pin"');
    expect(stage).not.toContain("<a ");
    expect(html).toContain(ROUND_INTRO.opening);
  });

  it("shows Today's clean frames first when the manifest has them, the pinned ones after", () => {
    const today = { ...openingQuestion().today, clean: { phone: "today-clean.jpg" } };
    const page = pageOf(tpOf(openingQuestion({ today })));
    const stage = page.slice(page.indexOf('class="opening"'), page.indexOf('class="revealer"'));
    expect(stage).toContain('src="today-clean.jpg"');
    expect(stage).not.toContain('src="today-phone.jpg"');
    expect(page.slice(page.indexOf('id="found-5200-q1"'))).toContain('src="today-phone.jpg"');
  });

  it("keeps Claude's recommendation folded away with the problems", () => {
    const found = html.indexOf('id="found-5200-q1"');
    expect(html.indexOf("Recommended:")).toBeGreaterThan(found);
    expect(html.slice(0, found)).not.toContain("The score hides");
  });

  it("puts the pinned Today frame and the problem rows in a region the button opens", () => {
    expect(html).toMatch(
      /<button type="button" class="revealer" id="reveal-5200-q1" data-key="5200-q1" aria-expanded="false" aria-controls="found-5200-q1">/,
    );
    expect(html).toContain(REVEAL_SHOW);
    const found = html.slice(html.indexOf('id="found-5200-q1" hidden'));
    expect(found).toContain('class="shot phone pinned markable"');
    expect(found).toContain('data-pin="today:phone:2"');
  });

  it("draws each problem that names its pin as a row with only Fix this first", () => {
    const row = html.slice(html.indexOf('id="d-5200-q1-B"'), html.indexOf('id="d-5200-q1-C"'));
    expect(row).toContain('class="opt pinrow"');
    expect(row).toContain('<span class="okey">Pin 2</span>The score hides');
    expect(row).not.toContain("<img");
    expect(row).toContain("Fix this first");
    expect(row).not.toContain("Look closer");
    expect(row).not.toContain("Not a problem");
  });

  it("opens the region on a press and stamps revealAt once, merged alone", async () => {
    const docs: Docs = {};
    const writes: string[] = [];
    const v = await view(docs, { writes });
    expect(region(v)?.hidden).toBe(true);
    await v.click(revealer(v));
    expect(region(v)?.hidden).toBe(false);
    expect(revealer(v)?.getAttribute("aria-expanded")).toBe("true");
    expect(revealer(v)?.textContent).toContain("Hide what Claude found");
    const at = docs[REC]?.revealAt as string;
    expect(Number.isNaN(Date.parse(at))).toBe(false);
    await v.click(revealer(v));
    await v.click(revealer(v));
    expect(docs[REC]?.revealAt).toBe(at);
  });

  it("stays open on reload when the record holds revealAt", async () => {
    const v = await view({ [REC]: { revealAt: "2026-10-14T15:05:00Z", pins: {}, react: {} } });
    expect(region(v)?.hidden).toBe(false);
    expect(revealer(v)?.getAttribute("aria-expanded")).toBe("true");
  });

  it("still opens on a page with no store, stamping nothing", async () => {
    const v = await view(null);
    await v.click(revealer(v));
    expect(region(v)?.hidden).toBe(false);
  });
});

describe("a tap on a frame leaves a mark that opens the pins' popover", () => {
  it("places a small mark where he tapped, offering Like · Don't like · Would change", async () => {
    const v = await view({});
    await tapFrame(v, 42, 30);
    const [m] = marks(v);
    expect(m?.dataset.pin).toMatch(ID);
    expect(m?.style.left).toBe("42%");
    expect(m?.style.top).toBe("30%");
    expect(m?.getAttribute("aria-label")).toBe("Your mark, 42% across, 30% down");
    expect(v.pop()?.hidden).toBe(false);
    expect(v.choices().map((c) => c.textContent?.trim())).toEqual([
      "👍 Like",
      "👎 Don't like",
      `${PENCIL} Would change`,
    ]);
    expect(PENCIL).toBe("✏︎");
  });

  it("saves its spot, beforeReveal and its reaction with the first word on it", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await tapFrame(v, 42, 30);
    expect(docs[REC]).toBeUndefined();
    await choose(v, "Don't like");
    const [id, mark] = only(markMap(docs));
    expect(id).toMatch(ID);
    expect(mark).toMatchObject({ x: 42, y: 30, beforeReveal: true });
    expect(docs[REC]?.pins).toEqual({ [id as string]: "down" });
    expect(marks(v)[0]?.querySelector(".pg")?.textContent).toBe("👎");
    expect(v.line()).toContain("1 of 1 answered");
  });

  it("saves a note on a mark under its id, and records a mark after the reveal as such", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await v.click(revealer(v));
    await tapFrame(v, 10, 90);
    await v.click(v.doc.querySelector(".pinpop .pna"));
    const t = v.doc.querySelector<HTMLTextAreaElement>(".pinpop .pnt") as HTMLTextAreaElement;
    t.value = "this footer is fine";
    t.dispatchEvent(new v.window.Event("input", { bubbles: true }));
    await pressEscape(v);
    const [id, mark] = only(markMap(docs));
    expect(mark).toMatchObject({ x: 10, y: 90, beforeReveal: false });
    expect(docs[REC]?.pinNotes).toEqual({ [id as string]: "this footer is fine" });
  });

  it("merges one key at a time: another view's mark survives this view's", async () => {
    const other = "today:phone:mzzother";
    const docs: Docs = {
      [REC]: {
        pins: { [other]: "up" },
        marks: { [other]: { x: 5, y: 5, at: "2026-10-14T15:01:00Z", beforeReveal: true } },
      },
    };
    const writes: string[] = [];
    const v = await view(docs, { writes });
    expect([...new Set(marks(v).map((m) => m.dataset.pin))]).toEqual([other]);
    await tapFrame(v, 60, 60);
    await choose(v, "Like");
    expect(writes).toContain(`update ${REC}`);
    expect(Object.keys(markMap(docs))).toHaveLength(2);
    expect(markMap(docs)[other]).toMatchObject({ x: 5, y: 5 });
    expect(docs[REC]?.pins).toMatchObject({ [other]: "up" });
  });

  it("removes a mark closed with nothing said, writing nothing", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await tapFrame(v, 42, 30);
    await pressEscape(v);
    expect(marks(v)).toHaveLength(0);
    expect(docs[REC]).toBeUndefined();
  });

  it("writes a saved mark emptied and closed as null", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await tapFrame(v, 42, 30);
    await choose(v, "Like");
    const id = marks(v)[0]?.dataset.pin as string;
    await v.click(marks(v)[0]);
    await choose(v, "Like"); // the same choice again clears it, and the popover closes
    expect(marks(v)).toHaveLength(0);
    expect(markMap(docs)[id]).toBeNull();
    expect(v.line()).toContain("0 of 1 answered");
  });

  it("paints marks back from the record on every frame they name", async () => {
    const id = "today:phone:mabc123";
    const v = await view({
      [REC]: {
        pins: { [id]: "mixed" },
        marks: { [id]: { x: 20, y: 40, at: "2026-10-14T15:01:00Z", beforeReveal: true } },
      },
    });
    const painted = marks(v);
    expect(painted).toHaveLength(2); // the clean frame and the pinned one
    expect(painted.every((m) => m.querySelector(".pg")?.textContent === PENCIL)).toBe(true);
    expect(painted[0]?.closest(CLEAN)).not.toBeNull();
  });

  it("takes no mark on a locked page", async () => {
    const v = await view(null);
    await tapFrame(v, 42, 30);
    expect(marks(v)).toHaveLength(0);
  });

  it("takes marks on a shape round's frames too, and they never navigate", async () => {
    const design = tpOf(
      {
        q: 1,
        title: "What leads the card?",
        rec: "A",
        today: { phone: "t.jpg", source: "scripts/redesign/shoot.mjs", caption: "Today." },
        options: [
          { key: "A", name: "Score first", delta: "The score moves up.", phone: "a.jpg" },
          { key: "B", name: "Nothing moves", delta: "The control.", phone: "b.jpg" },
        ],
      },
      1,
    );
    const page = pageOf(design);
    expect(page).not.toContain("<a class=");
    const docs: Docs = {};
    const v = await view(docs, { html: page });
    const frame = '.markable[data-option="B"][data-frame="phone"]';
    await tapFrame(v, 50, 50, frame);
    await choose(v, "Would change");
    const rec = docs[`tp/${design.id}/decisions/5200-q1`];
    const [id, mark] = only((rec?.marks ?? {}) as Record<string, Mark>);
    expect(id).toMatch(/^B:phone:m/);
    expect(mark).toMatchObject({ beforeReveal: false });
    expect(rec?.pins).toEqual({ [id as string]: "mixed" });
  });
});

describe("the twice-a-day steering page is left as it was", () => {
  it("keeps its pictures as links and takes no marks or page notes", () => {
    expect(TP.designOnly).toBe(true);
    const steering = renderPage(fixture());
    expect(steering).not.toMatch(/class="shot [a-z ]*markable"/);
    expect(steering).not.toContain('<button type="button" class="ghost" id="pnote"');
    expect(steering).toContain('<a class="shot');
  });
});
