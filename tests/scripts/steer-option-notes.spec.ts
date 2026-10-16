import { describe, expect, it } from "@rstest/core";
import { type LintEnv, lintDesign } from "../../scripts/redesign/lint-rules.mjs";
import { parseReadback } from "../../scripts/redesign/retro.mjs";
import { isAnswered } from "../../scripts/steer/model.mjs";
import {
  OPTION_NOTE_LABEL,
  optionNotesSaid,
  QUESTION_NOTE_LABEL,
} from "../../scripts/steer/option-notes.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { type Docs, open, pageOf, question, roundOf, settle } from "./steer-pins-harness";

// #5429 (Eric, 2026-10-15, after the R&D Playbooks redesign, #5163): "I dislike how we have to
// scroll down so far to leave comments on each option, recall which option we were on and then
// scroll back up to find our position." A question with `"notesPer": "option"` gives each option a
// note box folded under its Build / More / Not buttons, saved as `optionNotes: { <key>: text }`;
// the question's own note stays at the end, relabelled. Without the field the page is unchanged.

const NOTED = roundOf(question({ notesPer: "option" }));
const HTML = pageOf(NOTED);
const REC = `tp/${NOTED.id}/decisions/5150-q1`;
const D = NOTED.decisions[0];
if (!D) throw new Error("no decision");

type View = Awaited<ReturnType<typeof open>>;
const box = (v: View | Document, opt: string) =>
  ("doc" in v ? v.doc : v).querySelector<HTMLElement>(`#d-5150-q1-${opt} details.onote`);
const field = (v: View, opt: string) =>
  box(v, opt)?.querySelector<HTMLTextAreaElement>("textarea") as HTMLTextAreaElement;
const type = (v: View, opt: string, text: string) => {
  const t = field(v, opt);
  t.value = text;
  t.dispatchEvent(new v.window.Event("input", { bubbles: true }));
};
/** The question's own note's label, as he reads it. */
const noteLabel = (doc: Document) =>
  doc.querySelector<HTMLElement>("#d-5150-q1 > label.note")?.textContent ?? null;
const pause = () => new Promise((r) => setTimeout(r, 1000));

describe("a question without notesPer", () => {
  it("renders exactly as it did — no box under any option, the question's note as before", async () => {
    const v = await open(null, { html: pageOf(roundOf(question())) });
    expect(v.doc.querySelector("details.onote, [data-onote]")).toBeNull();
    expect(noteLabel(v.doc)).toMatch(/^Your note, in your words \(optional\)/);
    expect(roundOf(question()).decisions[0]).not.toHaveProperty("notesPer");
  });
});

describe("a question with notesPer: option", () => {
  it("puts a folded note box directly under each option's buttons", async () => {
    const v = await open(null, { html: HTML });
    for (const opt of ["A", "B"]) {
      const b = box(v, opt);
      expect(b?.previousElementSibling?.classList.contains("react")).toBe(true);
      expect(b?.querySelector("summary")?.textContent).toBe(OPTION_NOTE_LABEL);
      expect(b?.hasAttribute("open")).toBe(false);
      expect(field(v, opt).dataset.opt).toBe(opt);
    }
  });

  it("keeps the question's own note at the end, relabelled as a note on the whole question", async () => {
    const v = await open(null, { html: HTML });
    expect(noteLabel(v.doc)?.startsWith(QUESTION_NOTE_LABEL)).toBe(true);
    const section = v.doc.getElementById("d-5150-q1");
    expect(section?.lastElementChild?.matches("label.note")).toBe(true);
  });

  it("refuses a value that isn't 'option', in the page build and the manifest lint", () => {
    expect(() => roundOf(question({ notesPer: "pin" }))).toThrow(/"notesPer" is "option"/);
    const env: LintEnv = {
      pictureSize: () => 1024,
      sourcesFor: () => "",
      ui: { text: "", lower: "" },
    };
    const out = lintDesign({ issue: 5150, round: 1, questions: [question({ notesPer: 1 })] }, env);
    expect(out.some((p) => p.includes('"notesPer" is "option"'))).toBe(true);
  });
});

describe("the page saves an option's note", () => {
  it("as one key of optionNotes, on a pause in typing, and counts it as an answer", async () => {
    const docs: Docs = {};
    const v = await open(docs, { html: HTML });
    type(v, "B", "the sentence reads well");
    await pause();
    await settle();
    expect(docs[REC]?.optionNotes).toEqual({ B: "the sentence reads well" });
    expect(docs[REC]?.note).toBe("");
    expect(v.line()).toContain("1 of 1 answered");
  });

  it("keeps another view's note on a different option", async () => {
    const docs: Docs = { [REC]: { optionNotes: { A: "from the phone" }, react: {} } };
    const v = await open(docs, { html: HTML });
    type(v, "B", "from the laptop");
    await pause();
    await settle();
    expect(docs[REC]?.optionNotes).toEqual({ A: "from the phone", B: "from the laptop" });
  });

  it("opens a box that already holds a note, with its words in it", async () => {
    const v = await open(
      { [REC]: { optionNotes: { A: "keep the chain" }, react: {} } },
      { html: HTML },
    );
    expect(box(v, "A")?.hasAttribute("open")).toBe(true);
    expect(field(v, "A").value).toBe("keep the chain");
    expect(box(v, "B")?.hasAttribute("open")).toBe(false);
  });
});

describe("the read-back", () => {
  const rec = { optionNotes: { A: "keep the chain", B: "move it\nhigher" }, react: { B: "more" } };

  it("counts an option note as an answer, but not one on an option the page doesn't show", () => {
    expect(isAnswered({ optionNotes: { A: "yes" } }, D)).toBe(true);
    expect(isAnswered({ optionNotes: { Z: "gone" } }, D)).toBe(false);
    expect(optionNotesSaid(D, { optionNotes: { A: "  ", B: "x" } })).toEqual([["B", "x"]]);
  });

  it("quotes each option's note word for word on that option's line", () => {
    const plan = readback(NOTED, { [REC]: rec });
    const body = plan.actions.find((a) => a.kind === "comment")?.body ?? "";
    expect(body).toContain(
      [
        "Per option:",
        "- Option A (The chain first) — “keep the chain”",
        "- Option B (The order sentence first) — more of this — “move it",
        "  higher”",
      ].join("\n"),
    );
    expect(plan.nextRound[0]?.instruction).toContain("option A: apply his note “keep the chain”");
  });

  it("carries the picked option's note into the build it files", () => {
    const plan = readback(NOTED, { [REC]: { ...rec, pick: "A" } });
    const issue = plan.actions.find((a) => a.kind === "issue");
    expect(issue?.body).toContain("Eric's note on this option:\n\n> keep the chain");
  });

  it("is read by the retro as a note on that option", () => {
    const plan = readback(NOTED, { [REC]: rec });
    const body = plan.actions.find((a) => a.kind === "comment")?.body ?? "";
    const parsed = parseReadback({ at: "2026-10-15T18:00:00Z", body });
    expect(parsed?.notes).toEqual([
      { on: "Option A (The chain first)", reaction: null, text: "keep the chain" },
      {
        on: "Option B (The order sentence first)",
        reaction: "more of this",
        text: "move it\nhigher",
      },
    ]);
  });
});
