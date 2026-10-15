import { createRequire } from "node:module";
import { describe, expect, it } from "@rstest/core";
import { type LintEnv, lintDesign } from "../../scripts/redesign/lint-rules.mjs";
import {
  COMPARE_CLIENT,
  COMPARE_WORDS,
  compareProblems,
  sameSize,
} from "../../scripts/steer/compare.mjs";
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { imageSize } from "../../scripts/steer/focus.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";
import { open, question, type Win } from "./steer-pins-harness";

// #5411 (Eric, #5350 round 3): an option's phone picture compared with Today's three ways — Flip
// (the default), Swipe and Divider — on a question that opts in with `"compare": true`. Option A's
// phone frame shares Today's pixel size, so it can take the divider; option B's is taller, so its
// divider button says why and stays disabled. Option B also carries the pins.

const NOW = "2026-10-15T18:00:00Z";
const SIZES: Record<string, { w: number; h: number }> = {
  "today-phone.jpg": { w: 390, h: 844 },
  "A-phone.jpg": { w: 390, h: 844 },
  "B-phone.jpg": { w: 390, h: 900 },
};
const sizeOf = (p: string) => SIZES[p] ?? null;
const roundOf = (q: Record<string, unknown>) =>
  designRound({ 5150: designDecisions([q], { issue: 5150, round: 3, sizeOf }) }, { now: NOW });
const pageOf = (q: Record<string, unknown>) =>
  renderPage(roundOf(q), { img: (p) => ("src" in p ? p.src : null) });
const COMPARED = pageOf(question({ compare: true }));

const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string) => { window: Window };
};
/** The page parsed, its scripts not run: what the HTML alone says. */
const parsed = (html = COMPARED) => new JSDOM(html).window.document;

const block = (doc: Document, opt: string) =>
  doc.querySelector<HTMLElement>(`#d-5150-q1-${opt} .cmp`) as HTMLElement;
const modeButton = (b: HTMLElement, mode: string) =>
  b.querySelector<HTMLButtonElement>(`.cmp-modes .cmp-b[data-mode="${mode}"]`) as HTMLButtonElement;

/** A localStorage stand-in: `null` makes every call throw, as a sandboxed frame's may. */
function storage(held: Record<string, string> | null) {
  return (w: Win) => {
    const fail = () => {
      throw new Error("SecurityError");
    };
    Object.defineProperty(w, "localStorage", {
      configurable: true,
      value: held
        ? {
            getItem: (k: string) => held[k] ?? null,
            setItem: (k: string, v: string) => {
              held[k] = String(v);
            },
          }
        : { getItem: fail, setItem: fail },
    });
  };
}

describe("a question without compare", () => {
  it("renders exactly as it did — no switch, no compare script data", () => {
    const plain = pageOf(question());
    expect(plain).not.toContain('class="cmp"');
    expect(plain).not.toContain('"compare":');
    expect(pageOf(question({ compare: false }))).toBe(plain);
    expect(roundOf(question()).decisions[0]).not.toHaveProperty("compare");
  });

  it("carries no pixel sizes on its pictures", () => {
    const d = roundOf(question()).decisions[0];
    expect(d?.today?.pictures.some((p) => p.px)).toBe(false);
  });
});

describe("a question with compare: true", () => {
  it("wraps each option's phone frame in the switch, Flip pressed, and leaves desk frames alone", () => {
    const doc = parsed();
    for (const opt of ["A", "B"]) {
      const b = block(doc, opt);
      expect(b.dataset.mode).toBe("flip");
      const pressed = [...b.querySelectorAll(".cmp-modes .cmp-b")].map((x) => [
        x.textContent,
        x.getAttribute("aria-pressed"),
      ]);
      expect(pressed[0]).toEqual([`${COMPARE_WORDS.glyphs.flip} Flip`, "true"]);
      expect(pressed[1]).toEqual([`${COMPARE_WORDS.glyphs.swipe} Swipe`, "false"]);
      expect(b.querySelector('.cmp-cell[data-cell="option"] .shot.phone')).not.toBeNull();
      expect(b.querySelector('.cmp-cell[data-cell="today"] img')?.getAttribute("src")).toBe(
        "today-phone.jpg",
      );
    }
    expect(doc.querySelectorAll(".cmp")).toHaveLength(2);
    expect(doc.querySelectorAll(".cmp .shot.desk")).toHaveLength(0);
    expect(doc.querySelectorAll(".cmp-flip")[0]?.textContent).toBe("□ Today◆ Option A");
  });

  it("offers the divider only when both pictures share their pixel size", () => {
    const doc = parsed();
    expect(modeButton(block(doc, "A"), "divider").disabled).toBe(false);
    const b = modeButton(block(doc, "B"), "divider");
    expect(b.disabled).toBe(true);
    expect(b.textContent).toBe(`${COMPARE_WORDS.glyphs.divider} ${COMPARE_WORDS.differ}`);
    expect(sameSize({ src: "", alt: "", size: "phone" }, { src: "", alt: "", size: "phone" })).toBe(
      false,
    );
  });

  it("keeps the option's pins on the option's frame, never on Today's", () => {
    const b = block(parsed(), "B");
    expect(b.querySelectorAll('.cmp-cell[data-cell="option"] .pin')).toHaveLength(2);
    expect(b.querySelectorAll('.cmp-cell[data-cell="today"] .pin')).toHaveLength(0);
  });

  it("refuses a manifest that can't line Today up with the option", () => {
    expect(() => roundOf(question({ compare: "yes" }))).toThrow(/"compare" is true or false/);
    expect(() =>
      roundOf(question({ compare: true, today: { desk: "today-desk.jpg", source: "x" } })),
    ).toThrow(/needs Today's phone picture/);
    expect(() => roundOf(question({ compare: true, focus: { phone: [0, 0, 50, 50] } }))).toThrow(
      /not both/,
    );
    expect(compareProblems(question({ compare: true }), "q1")).toEqual([]);
  });
});

describe("the manifest lint agrees with the page", () => {
  const env: LintEnv = {
    pictureSize: () => 1024,
    sourcesFor: () => "",
    ui: { text: "", lower: "" },
  };
  it("names compare beside focus", () => {
    const q = question({ compare: true, focus: { phone: [0, 0, 50, 50] } });
    const out = lintDesign({ issue: 5150, round: 3, questions: [q] }, env);
    expect(out).toContain(
      'q1: compare with today, or narrow the round by "focus" or "areas" — not both',
    );
  });
});

describe("the page's compare script", () => {
  it("opens on Flip and swaps Today in the same spot on the toggle", async () => {
    const v = await open(null, { html: COMPARED, before: storage({}) });
    const b = block(v.doc, "A");
    expect(b.querySelector<HTMLElement>(".cmp-flip")?.hidden).toBe(false);
    expect(b.querySelector<HTMLElement>(".cmp-track")?.hidden).toBe(true);
    await v.click(b.querySelector('.cmp-flip .cmp-b[data-side="today"]'));
    expect(b.dataset.side).toBe("today");
    expect(
      b.querySelector('.cmp-flip .cmp-b[data-side="today"]')?.getAttribute("aria-pressed"),
    ).toBe("true");
    expect(block(v.doc, "B").dataset.side).toBe("option");
  });

  it("sets a pressed mode on every option and keeps it for next time", async () => {
    const held: Record<string, string> = {};
    const v = await open(null, { html: COMPARED, before: storage(held) });
    await v.click(modeButton(block(v.doc, "B"), "swipe"));
    for (const opt of ["A", "B"]) {
      expect(block(v.doc, opt).dataset.mode).toBe("swipe");
      expect(block(v.doc, opt).querySelector<HTMLElement>(".cmp-dots")?.hidden).toBe(false);
    }
    expect(held[COMPARE_CLIENT.store]).toBe("swipe");
    const again = await open(null, { html: COMPARED, before: storage(held) });
    expect(block(again.doc, "A").dataset.mode).toBe("swipe");
  });

  it("opens a kept Divider where it fits and Flip where the layouts differ", async () => {
    const v = await open(null, {
      html: COMPARED,
      before: storage({ [COMPARE_CLIENT.store]: "divider" }),
    });
    const a = block(v.doc, "A");
    expect(a.dataset.mode).toBe("divider");
    expect(block(v.doc, "B").dataset.mode).toBe("flip");
    const range = a.querySelector<HTMLInputElement>(".cmp-split") as HTMLInputElement;
    range.value = "30";
    range.dispatchEvent(new v.window.Event("input", { bubbles: true }));
    expect(a.style.getPropertyValue("--split")).toBe("30");
    expect(range.getAttribute("aria-valuetext")).toBe("30% Today, 70% Option A");
    await v.click(modeButton(block(v.doc, "B"), "divider"));
    expect(block(v.doc, "B").dataset.mode).toBe("flip");
  });

  it("still switches when the browser refuses storage", async () => {
    const v = await open(null, { html: COMPARED, before: storage(null) });
    const b = block(v.doc, "A");
    expect(b.dataset.mode).toBe("flip");
    await v.click(modeButton(b, "divider"));
    expect(b.dataset.mode).toBe("divider");
  });
});

describe("imageSize", () => {
  it("reads a PNG's pixel size from its header, and nothing from a non-picture", () => {
    const png = Buffer.alloc(32);
    png.writeUInt32BE(0x89504e47, 0);
    png.writeUInt32BE(390, 16);
    png.writeUInt32BE(844, 20);
    expect(imageSize(png)).toEqual({ w: 390, h: 844 });
    expect(imageSize(Buffer.from("not a picture at all, no header"))).toBeNull();
  });
});
