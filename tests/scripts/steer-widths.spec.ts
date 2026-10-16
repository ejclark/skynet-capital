import { createRequire } from "node:module";
import { describe, expect, it } from "@rstest/core";
import { type LintEnv, lintDesign } from "../../scripts/redesign/lint-rules.mjs";
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";
import { WIDTH_WORDS, widthsProblems } from "../../scripts/steer/widths.mjs";
import { sized } from "./steer-marks-fixture";
import { type Docs, open, question, settle } from "./steer-pins-harness";

// #5417 (Eric picked A on #5350 round 4: "One picture, switch width in place", with B's "desktop
// when it differs" kept as a hint). A question with `"widths": true` gives each holder one picture
// slot and a Phone · Desktop switch, phone first. A mark inside an area belongs to the area: it is
// drawn on both widths and read back once. A mark outside every area stays with its width.
//
// Area 3 is drawn at both widths (phone {20, 40, 60, 20}, desktop {10, 20, 30, 10}); area 5 only
// on the phone frame. Option A says its desktop layout only widens the phone one.

const NOW = "2026-10-15T18:00:00Z";
const AREAS = [
  {
    n: 3,
    box: { phone: [20, 40, 60, 20], desk: [10, 20, 30, 10] },
    label: "Order card",
    problem: "P2 · the total is hard to find",
    words: "Total reads first",
  },
  { n: 5, box: { phone: [0, 0, 100, 10] }, problem: "P4 · the header crowds the name" },
];
const widthsQuestion = (over: Record<string, unknown> = {}) => {
  const q = question({ widths: true, areas: AREAS, active: [3], ...over });
  return { ...q, options: q.options.map((o) => (o.key === "A" ? { ...o, deskSame: true } : o)) };
};
const roundOf = (q: Record<string, unknown>) =>
  designRound({ 5150: designDecisions([q], { issue: 5150, round: 4 }) }, { now: NOW });
const pageOf = (q: Record<string, unknown>) =>
  renderPage(roundOf(q), { img: (p) => ("src" in p ? p.src : null) });
const ROUND = roundOf(widthsQuestion());
const HTML = pageOf(widthsQuestion());
const REC = `tp/${ROUND.id}/decisions/5150-q1`;

const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string) => { window: Window };
};
const parsed = (html = HTML) => new JSDOM(html).window.document;
const slot = (doc: Document, holder: string) =>
  doc.querySelector<HTMLElement>(
    holder === "today" ? ".opt.today .wsw" : `#d-5150-q1-${holder} .wsw`,
  ) as HTMLElement;
const widthButton = (s: HTMLElement, w: string) =>
  s.querySelector<HTMLButtonElement>(`.wsw-b .cmp-b[data-width="${w}"]`) as HTMLButtonElement;

describe("a question without widths", () => {
  it("renders exactly as it did — no switch, both pictures side by side", () => {
    const plain = pageOf(question());
    expect(plain).not.toContain('class="wsw"');
    expect(pageOf(question({ widths: false }))).toBe(plain);
    expect(roundOf(question()).decisions[0]).not.toHaveProperty("widths");
  });
});

describe("a question with widths: true", () => {
  it("gives each holder one picture slot with the switch, phone pressed first", () => {
    const doc = parsed();
    for (const holder of ["today", "A", "B"]) {
      const s = slot(doc, holder);
      expect(s.dataset.width).toBe("phone");
      expect(widthButton(s, "phone").textContent).toBe(`${WIDTH_WORDS.glyphs.phone} Phone`);
      expect(widthButton(s, "phone").getAttribute("aria-pressed")).toBe("true");
      expect(widthButton(s, "desk").getAttribute("aria-pressed")).toBe("false");
      expect(s.querySelector('.wsw-pic[data-w="phone"] .shot.phone')).not.toBeNull();
      expect(s.querySelector('.wsw-pic[data-w="desk"] .shot.desk')).not.toBeNull();
    }
    expect(doc.querySelectorAll(".wsw")).toHaveLength(3);
    expect(doc.querySelectorAll(".opt > .pics > .shot")).toHaveLength(0);
  });

  it("labels the desktop 'same layout' when the option says so, and keeps it tappable", () => {
    const doc = parsed();
    const same = widthButton(slot(doc, "A"), "desk");
    expect(same.textContent).toBe(`${WIDTH_WORDS.glyphs.desk} Desktop · same layout`);
    expect(same.disabled).toBe(false);
    expect(widthButton(slot(doc, "B"), "desk").textContent).toBe(
      `${WIDTH_WORDS.glyphs.desk} Desktop`,
    );
  });

  it("leaves a holder with one width as a plain frame", () => {
    const q = widthsQuestion({
      today: { phone: "today-phone.jpg", source: "x", caption: "Today." },
    });
    const doc = parsed(pageOf(q));
    expect(doc.querySelector(".opt.today .wsw")).toBeNull();
    expect(doc.querySelector(".opt.today .shot.phone")).not.toBeNull();
  });

  it("refuses a manifest that isn't a switch", () => {
    expect(() => roundOf(question({ widths: "yes" }))).toThrow(/"widths" is true or false/);
    const loose = question();
    const stray = { ...loose, options: [{ ...loose.options[0], deskSame: true }] };
    expect(() => roundOf(stray)).toThrow(/"deskSame" labels the width switch/);
    expect(widthsProblems(widthsQuestion(), "q1")).toEqual([]);
  });

  it("is named by the manifest lint too", () => {
    const env: LintEnv = {
      pictureSize: () => 1024,
      sourcesFor: () => "",
      ui: { text: "", lower: "" },
    };
    const out = lintDesign({ issue: 5150, round: 4, questions: [question({ widths: 1 })] }, env);
    expect(out).toContain('q1: "widths" is true or false');
  });
});

describe("the page's width switch", () => {
  it("shows the desktop picture in the same slot on a press, and only in that slot", async () => {
    const v = await open(null, { html: HTML });
    const a = slot(v.doc, "A");
    await v.click(widthButton(a, "desk"));
    expect(a.dataset.width).toBe("desk");
    expect(widthButton(a, "desk").getAttribute("aria-pressed")).toBe("true");
    expect(widthButton(a, "phone").getAttribute("aria-pressed")).toBe("false");
    expect(slot(v.doc, "B").dataset.width).toBe("phone");
    await v.click(widthButton(a, "phone"));
    expect(a.dataset.width).toBe("phone");
  });
});

describe("a mark on an area is answered once", () => {
  const marksOn = (doc: Document, frame: string) => [
    ...doc.querySelectorAll<HTMLElement>(`.opt.today .markable[data-frame="${frame}"] .pin.mark`),
  ];
  const IN = "today:phone:min1";
  const OFF = "today:desk:moff2";

  it("draws a mark inside an area on both widths, at its place in each width's outline", async () => {
    const v = await open(
      {
        [REC]: {
          pins: { [IN]: "down", [OFF]: "up" },
          marks: {
            [IN]: { x: 50, y: 50, at: "2026-10-15T18:01:00Z", beforeReveal: false },
            [OFF]: { x: 90, y: 90, at: "2026-10-15T18:02:00Z", beforeReveal: false },
          },
        },
      },
      { html: HTML },
    );
    const phone = marksOn(v.doc, "phone");
    const desk = marksOn(v.doc, "desk");
    expect(phone.map((m) => m.dataset.pin)).toEqual([IN]);
    expect(desk.map((m) => m.dataset.pin).sort()).toEqual([IN, OFF].sort());
    const mirrored = desk.find((m) => m.dataset.pin === IN) as HTMLElement;
    expect([mirrored.style.left, mirrored.style.top]).toEqual(["25%", "25%"]);
  });

  it("puts a mark tapped on the phone frame onto the desktop one once it is saved", async () => {
    const docs: Docs = {};
    const v = await open(docs, { html: HTML, before: sized });
    const img = v.doc.querySelector('.opt.today .markable[data-frame="phone"] .frame img');
    img?.dispatchEvent(
      new v.window.MouseEvent("click", { bubbles: true, clientX: 50 * 4, clientY: 50 * 8 }),
    );
    await settle();
    await v.click(v.choices().find((c) => c.textContent?.includes("Like")));
    const id = Object.keys((docs[REC]?.marks ?? {}) as object)[0];
    expect(id).toMatch(/^today:phone:m/);
    expect(marksOn(v.doc, "desk").map((m) => m.dataset.pin)).toEqual([id]);
  });

  it("reads back each area once, never per width, and says which width an off-area mark is on", () => {
    const DESK_IN = "today:desk:mdesk3";
    const FAINT = "today:phone:mfaint";
    const plan = readback(ROUND, {
      [REC]: {
        pins: { [IN]: "down", [DESK_IN]: "mixed", [OFF]: "up", [FAINT]: "up" },
        pinNotes: { [DESK_IN]: "the total still hides" },
        marks: {
          [IN]: { x: 50, y: 50, at: "2026-10-15T18:01:00Z", beforeReveal: false },
          [DESK_IN]: { x: 20, y: 25, at: "2026-10-15T18:02:00Z", beforeReveal: false },
          [OFF]: { x: 90, y: 90, at: "2026-10-15T18:03:00Z", beforeReveal: false },
          [FAINT]: { x: 50, y: 5, at: "2026-10-15T18:04:00Z", beforeReveal: false },
        },
        react: {},
      },
    });
    const body = plan.actions.find((a) => a.kind === "comment")?.body ?? "";
    expect(body).toContain(
      [
        "Your marks:",
        "- Today · on area 3, “Order card”, which this round asks about — 👎 don't like; ✏︎ would change — “the total still hides”",
        "- Today, desktop only · 90% across, 90% down — 👍 like",
        "- Today, phone only · on area 5, outlined but not asked about this round (50% across, 5% down) — 👍 like",
      ].join("\n"),
    );
    expect(body.match(/area 3/g)).toHaveLength(1);
    expect(plan.nextRound[0]?.instruction).toContain(
      "Today on area 3, “Order card”, which this round asks about: don't like: would change: “the total still hides”",
    );
  });
});
