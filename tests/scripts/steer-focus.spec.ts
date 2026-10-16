import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
import { designDecisions } from "../../scripts/steer/design.mjs";
import {
  cropOf,
  FOCUS_HOW,
  FOCUS_LABEL,
  focusBoxProblems,
  focusFor,
  imageRatio,
  inFocus,
  matchSection,
} from "../../scripts/steer/focus.mjs";
import { ADD_TO_SCOPE, IN_FOCUS, OUT_OF_FOCUS } from "../../scripts/steer/marks.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { HOW_SUMMARY, ROUND_INTRO, ROUND_LINE } from "../../scripts/steer/render.mjs";
import { focusQuestion, pageOf, REC, ROUND, roundOf, SECTIONS } from "./steer-focus-fixture";

// Eric, 2026-10-14: "I liked the outline of the sections under the microscope to narrow focus..
// without that, it's easy to spend time giving feedback on things out of scope for the task at
// hand" — and "simple and elegant design that is free of distraction". A question's `focus` (a
// section's label, or a box per frame) opens each frame cropped to that part; the read-back keeps
// the marks outside it for the scope, never drops them.

const dir = mkdtempSync(join(tmpdir(), "steer-focus-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("resolving a focus on a picture", () => {
  const phone = { size: "phone" as const, sections: SECTIONS };

  it("takes the smallest section whose label matches exactly, case aside", () => {
    expect(focusFor("ORDER CARD", phone)).toEqual({
      x: 20,
      y: 40,
      w: 60,
      h: 20,
      label: "Order card",
    });
    expect(focusFor("order", phone)).toBeNull();
    const twins = [
      { label: "Row", x: 0, y: 0, w: 50, h: 10 },
      { label: "row", x: 0, y: 20, w: 50, h: 10 },
      { label: "Row", x: 0, y: 40, w: 90, h: 10 },
    ];
    expect(matchSection(twins, "row")).toBe(twins[0]);
  });

  it("takes an explicit box for its own frame size, labelled as the round's focus", () => {
    expect(focusFor({ phone: [10, 20, 30, 40] }, phone)).toEqual({
      x: 10,
      y: 20,
      w: 30,
      h: 40,
      label: FOCUS_LABEL,
    });
    expect(focusFor({ desk: [10, 20, 30, 40] }, phone)).toBeNull();
    expect(FOCUS_LABEL).toBe("this round's focus");
  });

  it("refuses a box outside 0–100, without a size, or past the frame's edge", () => {
    expect(focusBoxProblems([0, 0, 50, 50], "q1")).toEqual([]);
    expect(focusBoxProblems([-1, 0, 50, 50], "q1")[0]).toMatch(/0–100/);
    expect(focusBoxProblems([0, 0, 0, 50], "q1")[0]).toMatch(/width and a height/);
    expect(focusBoxProblems([60, 0, 50, 50], "q1")[0]).toMatch(/past the frame's edge/);
    expect(focusBoxProblems([1, 2, 3], "q1")[0]).toMatch(/\[x, y, w, h\]/);
  });

  it("crops to the box plus 4% a side, clamped to the frame", () => {
    expect(cropOf({ x: 20, y: 40, w: 60, h: 20 })).toEqual({ x: 16, y: 36, w: 68, h: 28 });
    expect(cropOf({ x: 2, y: 0, w: 97, h: 98 })).toEqual({ x: 0, y: 0, w: 100, h: 100 });
  });

  it("says whether a spot is in the box, edges included", () => {
    const f = { x: 20, y: 40, w: 60, h: 20 };
    expect([inFocus(f, 20, 40), inFocus(f, 80, 60), inFocus(f, 19.9, 50)]).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("reads a picture's height ÷ width from a PNG or JPEG header", () => {
    const png = Buffer.alloc(32);
    png.writeUInt32BE(0x89504e47, 0);
    png.writeUInt32BE(390, 16);
    png.writeUInt32BE(844, 20);
    expect(imageRatio(png)).toBeCloseTo(844 / 390);
    // SOI, an APP0 segment of 16 bytes, then SOF0 with height 844 and width 390.
    const jpg = Buffer.from([
      0xff,
      0xd8,
      0xff,
      0xe0,
      0x00,
      0x10,
      ...Array(14).fill(0),
      0xff,
      0xc0,
      0x00,
      0x11,
      0x08,
      0x03,
      0x4c,
      0x01,
      0x86,
      ...Array(12).fill(0),
    ]);
    expect(imageRatio(jpg)).toBeCloseTo(844 / 390);
    expect(imageRatio(Buffer.from("not a picture at all, no header"))).toBeNull();
  });
});

describe("a manifest question's focus, resolved per picture", () => {
  it("puts focus on each frame that names the section, and nothing on one that doesn't", () => {
    const [d] = ROUND.decisions;
    expect(d?.today?.pictures[0]?.focus).toEqual({
      x: 20,
      y: 40,
      w: 60,
      h: 20,
      label: "Order card",
    });
    expect(d?.options.every((o) => o.pictures?.every((p) => !p.focus))).toBe(true);
  });

  it("reads the picture's ratio when it can, so the crop is sized before it loads", () => {
    const [d] = designDecisions([focusQuestion()], { issue: 5300, ratioOf: () => 2 });
    expect(d?.today?.pictures[0]?.ratio).toBe(2);
  });

  it("throws on a malformed box, naming the question and the frame", () => {
    expect(() =>
      designDecisions([focusQuestion({ focus: { phone: [50, 0, 60, 10] } })], { issue: 5300 }),
    ).toThrow(/q1 focus phone: the box runs past/);
    expect(() =>
      designDecisions([focusQuestion({ focus: { tablet: [0, 0, 10, 10] } })], { issue: 5300 }),
    ).toThrow(/"tablet" isn't a frame/);
  });

  it("reads the sections file a manifest names, through loadDesign", async () => {
    const { loadDesign } = await import("../../scripts/steer/design.mjs");
    writeFileSync(join(dir, "t.jpg"), "jpg");
    writeFileSync(join(dir, "t.sections.json"), JSON.stringify(SECTIONS));
    const file = join(dir, "manifest.json");
    const q = focusQuestion({
      today: { phone: "t.jpg", sections: "t.sections.json", source: "s", caption: "c" },
      options: [],
    });
    writeFileSync(file, JSON.stringify({ issue: 5300, round: 2, questions: [q] }));
    const [d] = loadDesign(file);
    expect(d?.today?.pictures[0]?.focus?.label).toBe("Order card");
    expect(d?.today?.pictures[0]?.ratio).toBeUndefined(); // "jpg" is no picture: the page measures
  });
});

describe("the focused view on the page", () => {
  const html = pageOf();
  const today = html.slice(html.indexOf('data-option="today"'), html.indexOf('id="d-5300-q1-A"'));

  it("opens cropped, with the line and the one button above the picture", () => {
    expect(today).toContain(
      'data-view="focus" data-fbox="20,40,60,20" data-crop="16,36,68,28" style="--cx:16;--cy:36;--cw:68;--ch:28"',
    );
    expect(today).toContain('<span class="flabel">This round: Order card</span>');
    expect(today).toContain(
      '<button type="button" class="ftoggle" aria-pressed="false">Show the whole screen</button>',
    );
  });

  it("crops the same picture by CSS, its pins inside the plane with their % unchanged", () => {
    const plane = today.slice(today.indexOf('class="fplane"'));
    expect(plane).toContain('<img src="today-phone.jpg"');
    expect(plane).toContain(
      'data-pin="today:phone:1" data-name="Pin 1: the order line" style="left:50%;top:50%"',
    );
    expect(plane).toContain('data-pin="today:phone:2"');
    expect(plane).toContain(
      '<div class="fbox" style="left:20%;top:40%;width:60%;height:20%" aria-hidden="true"><span class="ftag">This round: Order card</span>',
    );
  });

  it("writes the crop's shape when it knows the picture's ratio", () => {
    const [d] = designDecisions([focusQuestion()], { issue: 5300, ratioOf: () => 2 });
    const tp = { ...ROUND, decisions: [{ ...ROUND.decisions[0], ...d }] } as typeof ROUND;
    expect(pageOf(tp)).toContain("--ch:28;--fa:1.214");
  });

  it("leaves a question with no focus exactly as it was", () => {
    const plain = pageOf(roundOf(focusQuestion({ focus: undefined })));
    expect(plain).not.toContain(' data-view="focus" data-fbox');
    expect(plain).not.toContain('<div class="fplane">');
    expect(plain).toContain('<div class="frame"><img src="today-phone.jpg"');
  });
});

describe("the round page's intro", () => {
  const html = pageOf();

  it("is one short line saying what to do, the how-to folded under it", () => {
    for (const line of Object.values(ROUND_LINE))
      expect(line.split(/\s+/).length).toBeLessThanOrEqual(20);
    expect(html).toContain(`<p class="lede" id="intro">${ROUND_LINE.design}</p>`);
    const how = html.slice(html.indexOf('<details class="how">'));
    expect(how).toContain(`<summary>${HOW_SUMMARY}</summary>`);
    expect(how).toContain(ROUND_INTRO.design);
    expect(how).toContain(FOCUS_HOW);
    expect(html.indexOf('<details class="how">')).toBeLessThan(html.indexOf("<img"));
  });

  it("says nothing of a focus on a round without one", () => {
    expect(pageOf(roundOf(focusQuestion({ focus: undefined })))).not.toContain(FOCUS_HOW);
  });
});

describe("the read-back splits his marks by the round's focus", () => {
  const IN = "today:phone:min1";
  const OUT = "today:phone:mout1";
  const OLD = "today:phone:mold1";
  const outMark = { x: 50, y: 95, at: "2026-10-14T18:02:00Z", beforeReveal: false, inFocus: false };
  const saved = {
    pins: { [IN]: "down", [OUT]: "up", [OLD]: "mixed" },
    pinNotes: { [OUT]: "the footer link is too small" },
    marks: {
      [IN]: { x: 50, y: 50, at: "2026-10-14T18:01:00Z", beforeReveal: false, inFocus: true },
      [OUT]: outMark,
      // saved before marks recorded inFocus: placed by its spot against the focus box
      [OLD]: { x: 50, y: 5, at: "2026-10-14T18:03:00Z", beforeReveal: false },
    },
    react: {},
  };
  const records = { [REC]: saved };
  const plan = readback(ROUND, records);
  const body = plan.actions.find((a) => a.kind === "comment")?.body ?? "";

  it("lists the marks in focus, then the ones outside it as added to the scope", () => {
    expect(IN_FOCUS).toBe("In this round's focus:");
    expect(OUT_OF_FOCUS).toBe("Outside this round's focus — added to the scope for later:");
    expect(body).toContain(
      [IN_FOCUS, "- Today, phone · on “Order card” (50% across, 50% down) — 👎 don't like"].join(
        "\n",
      ),
    );
    expect(body).toContain(
      [
        OUT_OF_FOCUS,
        "- Today, phone · on “Footer” (50% across, 95% down) — 👍 like — “the footer link is too small”",
        "- Today, phone · 50% across, 5% down — ✏︎ would change",
      ].join("\n"),
    );
    expect(body).not.toContain("Your marks:");
  });

  it("applies only the marks in focus next round, and adds the rest to the scope", () => {
    const [next] = plan.nextRound;
    expect(next?.instruction).toContain(
      "Apply his marks: Today, phone on “Order card” (50% across, 50% down): don't like.",
    );
    expect(next?.instruction).toContain(
      `${ADD_TO_SCOPE} Today, phone on “Footer” (50% across, 95% down): like: “the footer link is too small”; Today, phone at 50% across, 5% down: would change.`,
    );
  });

  it("reads every mark as in focus on a round with none, and keeps one list", () => {
    const plain = roundOf(focusQuestion({ focus: undefined }));
    const rec = `tp/${plain.id}/decisions/5300-q1`;
    const p = readback(plain, { [rec]: saved });
    const b = p.actions.find((a) => a.kind === "comment")?.body ?? "";
    expect(b).toContain("Your marks:");
    expect(b).not.toContain(IN_FOCUS);
    expect(p.nextRound[0]?.instruction).not.toContain(ADD_TO_SCOPE);
  });

  it("still asks the next round to bank them when every mark is outside the focus", () => {
    const only = { [REC]: { ...saved, marks: { [OUT]: outMark } } };
    const p = readback(ROUND, only);
    expect(p.nextRound[0]?.instruction).toContain(ADD_TO_SCOPE);
    expect(p.nextRound[0]?.instruction).not.toContain("Apply his marks");
    expect(p.followUps.map((f) => f.kind)).not.toContain("read-note");
  });
});
