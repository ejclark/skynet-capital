import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
import { designDecisions, designRound, loadDesign } from "../../scripts/steer/design.mjs";
import { isAnswered } from "../../scripts/steer/model.mjs";
import { MIXED, PIN_INTRO } from "../../scripts/steer/pins.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";

// #5143, Eric 2026-10-11: "i wish the process had thumbs up/down and 'mixed' icons to give
// granular feedback at the comment level for the iterations." Round pictures carry numbered pins
// baked in by pin.mjs; the page puts a button on each badge, a tap offers 👍 Keep · 👎 Change ·
// ☯︎ Mixed (glyph and word, never colour alone), the reaction saves in the decision's own record,
// and the read-back lists every pin — the ones he left alone as "no signal", never a default.

const NOW = "2026-10-11T08:00:00Z";
const pic = (p: string) => ({ phone: `${p}-phone.jpg`, desk: `${p}-desk.jpg` });
const pin = (n: number, x: number, y: number, label: string) => ({ n, x, y, label });

const question = (over: Record<string, unknown> = {}) => ({
  q: 1,
  topic: "/trade · app/src/routes/trade.tsx",
  title: "What leads the options chain at phone width?",
  ask: "This round varies only what sits above the strikes.",
  rec: "B",
  conf: "low",
  wrong: "He marks the range strip Change by 2026-10-18.",
  saw: ["H6 · recognition over recall, severity 3"],
  today: {
    ...pic("today"),
    source: "scripts/redesign/shoot.mjs",
    caption: "Today, real screenshot.",
    pins: [pin(1, 20, 30, "strikes start here")],
  },
  options: [
    { key: "A", name: "Nothing moves", delta: "The control.", ...pic("a") },
    {
      key: "B",
      name: "The range strip on top",
      delta: "A range strip sits above the strikes.",
      ...pic("b"),
      pins: [pin(2, 50, 12, "range strip"), pin(1, 70, 40, "order line")],
      pinsDesk: { pins: [pin(1, 30, 20, "range strip, wide")], tag: "illustrative values" },
    },
  ],
  ...over,
});
const dir = mkdtempSync(join(tmpdir(), "steer-pins-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const decisions = (q = question(), round: number | string = 1) =>
  designDecisions([q], { issue: 5150, round });
const tp = designRound({ 5150: decisions() }, { now: NOW });
const html = renderPage(tp, { img: (p) => ("src" in p ? p.src : null) });
/** The JSON the page hands its script. */
const data = (page: string) =>
  JSON.parse(
    /<script type="application\/json" id="tp-data">([\s\S]*?)<\/script>/.exec(page)?.[1] ?? "{}",
  );

describe("a manifest option carries the pins its frame was drawn with", () => {
  it("puts `pins` on the phone picture and `pinsDesk` on the desktop one, Today included", () => {
    const [d] = decisions();
    const b = d?.options.find((o) => o.key === "B");
    expect(b?.pictures?.find((p) => p.size === "phone")?.pins).toEqual([
      pin(2, 50, 12, "range strip"),
      pin(1, 70, 40, "order line"),
    ]);
    expect(b?.pictures?.find((p) => p.size === "desk")?.pins).toEqual([
      pin(1, 30, 20, "range strip, wide"),
    ]);
    expect(d?.today?.pictures.find((p) => p.size === "phone")?.pins).toEqual([
      pin(1, 20, 30, "strikes start here"),
    ]);
    expect(d?.options.find((o) => o.key === "A")?.pictures?.[0]).not.toHaveProperty("pins");
  });

  it("numbers a pin with no `n` by its place in the list, as pin.mjs draws its badge", () => {
    const q = question({
      options: [
        { key: "A", name: "A", delta: "x", ...pic("a"), pins: [{ x: 1, y: 2, label: "first" }] },
        { key: "B", name: "B", delta: "y", ...pic("b") },
      ],
    });
    expect(decisions(q)[0]?.options[0]?.pictures?.[0]?.pins).toEqual([pin(1, 1, 2, "first")]);
  });

  it("refuses a pin number used twice on one frame, an x/y off the frame and a long label", () => {
    const q = question({
      options: [
        {
          key: "B",
          name: "B",
          delta: "y",
          ...pic("b"),
          pins: [pin(2, 50, 12, "range strip"), pin(2, 101, 4, "x".repeat(61))],
        },
        { key: "A", name: "A", delta: "x", ...pic("a") },
      ],
    });
    expect(() => decisions(q)).toThrow(
      /q1 option B pins pin 2 \("x+"\): number 2 is used twice\nq1 option B pins pin 2 \("x+"\): x and y are % of the frame, 0–100\nq1 option B pins pin 2: label is 61 characters — keep it to 60/,
    );
  });

  it("refuses pins on a frame the option has no picture for", () => {
    const q = question({
      options: [
        { key: "B", name: "B", delta: "y", phone: "b.jpg", pinsDesk: [pin(1, 5, 5, "here")] },
        { key: "A", name: "A", delta: "x", ...pic("a") },
      ],
    });
    expect(() => decisions(q)).toThrow(
      /q1 option B: pinsDesk names pins on a desk picture it doesn't have/,
    );
  });

  it("reads a pins path as the very file pin.mjs drew from, beside the manifest", () => {
    mkdirSync(join(dir, "pins"));
    for (const f of ["today-phone.jpg", "today-desk.jpg", "a-phone.jpg", "b-phone.jpg"])
      writeFileSync(join(dir, f), "jpg");
    writeFileSync(
      join(dir, "pins", "b-phone.json"),
      JSON.stringify({ pins: [{ x: 50, y: 12, n: 2, label: "range strip", side: "left" }] }),
    );
    const file = join(dir, "manifest.json");
    const options = [
      { key: "A", name: "A", delta: "x", phone: "a-phone.jpg" },
      { key: "B", name: "B", delta: "y", phone: "b-phone.jpg", pins: "pins/b-phone.json" },
    ];
    const today = { phone: "today-phone.jpg", source: "s", caption: "c" };
    writeFileSync(
      file,
      JSON.stringify({ issue: 5150, round: 1, questions: [{ q: 1, today, options }] }),
    );
    expect(loadDesign(file)[0]?.options[1]?.pictures?.[0]?.pins).toEqual([
      pin(2, 50, 12, "range strip"),
    ]);
  });
});

describe("each pin on the page is a button on its badge", () => {
  const b2 = /<button type="button" class="pin" data-pin="B:phone:2"[^>]*>/.exec(html)?.[0] ?? "";

  it("sits on the badge by %, so it tracks the scaled picture, and names the pin", () => {
    expect(b2).toContain('style="left:50%;top:12%"');
    expect(b2).toContain('aria-label="Pin 2: range strip"');
    expect(b2).toContain('aria-expanded="false"');
    expect(html).toContain('data-pin="B:desk:1"');
    expect(html).toContain('data-pin="today:phone:1"');
  });

  it("hands the page script each choice as a glyph AND a word — never colour alone", () => {
    expect(data(html).pins).toEqual({
      glyph: { up: "👍", down: "👎", mixed: "\u262F\uFE0E" },
      words: {
        design: { up: "Keep", down: "Change", mixed: "Mixed" },
        problems: { up: "Yes, a problem", down: "Not a problem", mixed: "Partly" },
      },
    });
    expect(MIXED).toBe("\u262F\uFE0E");
  });

  it("keeps a picture without pins exactly as it was", () => {
    expect(html).toContain('<a class="shot phone" href="a-phone.jpg"');
  });

  it("tells him in the intro that a pin can be tapped", () => {
    expect(html).toContain(PIN_INTRO.design);
  });

  it("is a 32px tap target at least", () => {
    const css = /\n\.pin \{([^}]*)\}/.exec(html)?.[1] ?? "";
    expect(css).toMatch(/width: 32px/);
    expect(css).toMatch(/height: 32px/);
  });

  it("says on a round-0 page that a pin asks whether it is a problem", () => {
    const problems = designRound({ 5150: decisions(question({ kind: "problems" }), 0) });
    const page = renderPage(problems, { img: (p) => ("src" in p ? p.src : null) });
    expect(page).toContain(PIN_INTRO.problems);
    expect(PIN_INTRO.problems).toContain(`${MIXED} Partly`);
  });

  it("leaves a page with no pins without the pins' words", () => {
    const plain = question({ today: { ...question().today, pins: undefined } });
    const page = renderPage(
      designRound({ 5150: decisions({ ...plain, options: plain.options.slice(0, 1) }) }),
      { img: (p) => ("src" in p ? p.src : null) },
    );
    expect(data(page).pins).toBeUndefined();
    expect(page).not.toContain(PIN_INTRO.design);
  });
});

// The page script's half (the popover, saving, locking) is steer-pins-client.spec.ts.
const REC = `tp/${tp.id}/decisions/5150-q1`;

// ── the read-back ────────────────────────────────────────────────────────────────────────────

const meta = { [`tp/${tp.id}`]: { openedAt: NOW, doneAt: NOW, taps: [] } };
const bodyOf = (plan: ReturnType<typeof readback>) => {
  const c = plan.actions.find((a) => a.kind === "comment" && a.issue === 5150);
  return c && "body" in c ? c.body : "";
};

describe("the read-back lists every pin, word for word", () => {
  const pins = { "B:phone:2": "up", "B:phone:1": "down", "today:phone:1": "mixed" };
  const plan = readback(tp, { ...meta, [REC]: { pins } });

  it("counts a pin reaction as an answer", () => {
    expect(isAnswered({ pins: { "B:phone:2": "up" } })).toBe(true);
    expect(isAnswered({ pins: {} })).toBe(false);
    expect(plan.rollover).toEqual([]);
  });

  it("posts a Per pin list on the issue, the ones he left alone as no signal", () => {
    expect(bodyOf(plan)).toContain(
      [
        "Per pin:",
        `- Today · pin 1 (strikes start here) — ${MIXED} mixed`,
        "- Option B · pin 1 (order line) — 👎 change",
        "- Option B · pin 2 (range strip) — 👍 keep",
        "- Option B, desktop · pin 1 (range strip, wide) — no signal",
      ].join("\n"),
    );
  });

  it("turns them into the next round's instructions, and files nothing", () => {
    expect(plan.actions.filter((a) => a.kind === "issue")).toEqual([]);
    const instruction =
      "Round 2 on #5150, per pin: " +
      "Today · pin 1 (strikes start here): draw a closer look (variants of just that element). " +
      "Option B · pin 1 (order line): replace with a new direction. " +
      "Option B · pin 2 (range strip): keep as drawn. " +
      "No signal, so no default: Option B, desktop · pin 1 (range strip, wide).";
    expect(plan.nextRound).toEqual([{ issue: 5150, key: "5150-q1", pick: null, instruction }]);
    expect(plan.followUps).toContainEqual({
      kind: "next-round",
      issue: 5150,
      key: "5150-q1",
      why: instruction,
    });
    expect(plan.followUps.map((f) => f.kind)).not.toContain("read-note");
  });

  it("ignores a saved value for a pin the page never showed, or a value it never offers", () => {
    const odd = readback(tp, {
      ...meta,
      [REC]: { pins: { "C:phone:9": "up", "B:phone:2": "meh" } },
    });
    expect(bodyOf(odd)).toContain("- Option B · pin 2 (range strip) — no signal");
    expect(bodyOf(odd)).not.toContain("C:phone:9");
    expect(odd.nextRound).toEqual([]);
  });

  it("carries the picked option's pin reactions into the build it files", () => {
    const built = readback(tp, { ...meta, [REC]: { pick: "B", pins } });
    const issue = built.actions.find((a) => a.kind === "issue");
    const body = issue && "body" in issue ? issue.body : "";
    expect(body).toContain("Per pin:\n- Option B · pin 1 (order line) — 👎 change");
    expect(body).not.toContain("Today · pin 1");
    expect(built.nextRound).toEqual([]);
  });
});

describe("a round-0 page's pins read back as whether each is a problem", () => {
  const problems = designRound({ 5150: decisions(question({ kind: "problems" }), 0) });
  const pins = { "B:phone:2": "up", "B:phone:1": "down", "today:phone:1": "mixed" };
  const plan = readback(problems, {
    [`tp/${problems.id}`]: { openedAt: NOW },
    [`tp/${problems.id}/decisions/5150-q1`]: { pins },
  });

  it("says yes, a problem · not a problem · partly, and still files nothing", () => {
    expect(bodyOf(plan)).toContain(`- Today · pin 1 (strikes start here) — ${MIXED} partly`);
    expect(bodyOf(plan)).toContain("- Option B · pin 1 (order line) — 👎 not a problem");
    expect(bodyOf(plan)).toContain("- Option B · pin 2 (range strip) — 👍 yes, a problem");
    expect(plan.actions.map((a) => a.kind)).toEqual(["comment"]);
  });

  it("folds them into the next round's instruction", () => {
    expect(plan.nextRound[0]?.instruction).toBe(
      "No problem picked on #5150: the next round asks again. Per pin: " +
        "Today · pin 1 (strikes start here): partly. " +
        "Option B · pin 1 (order line): not a problem. " +
        "Option B · pin 2 (range strip): yes, a problem. " +
        "No signal, so no default: Option B, desktop · pin 1 (range strip, wide). " +
        "Nothing is filed.",
    );
  });
});
