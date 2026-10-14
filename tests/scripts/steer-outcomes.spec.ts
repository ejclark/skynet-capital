import { describe, expect, it } from "@rstest/core";
import { isAnswered } from "../../scripts/steer/model.mjs";
import {
  addedOutcomes,
  CLASSIFY,
  MAX_OUTCOME,
  OUTCOME_WORDS,
  OUTCOMES_HEAD,
} from "../../scripts/steer/outcomes.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";
import { fixture } from "./steer-fixture";
import { focusQuestion, pageOf, REC, ROUND, roundOf, view } from "./steer-focus-fixture";
import { type Docs, settle } from "./steer-pins-harness";

// Eric, 2026-10-14: "the redesign process must offer 'integrate this outcome' capabilities too …
// the current design may not have that, and redesign/rearchitecture may be necessary to achieve
// said outcomes." Under a question's scope, "＋ Add an outcome" takes one line of his words; each
// saves as one key of `outcomesAdded`, merged like a mark, and the read-back quotes it and hands it
// to the session to classify — reachable by today's design, or a plan issue.

const scoped = roundOf(
  focusQuestion({
    scope: {
      goal: "The order card reads in one glance.",
      outcomes: [{ id: "O1", text: "The total reads first.", met: false }],
    },
    options: [
      { key: "A", name: "Total first", delta: "Up.", phone: "a.jpg", serves: ["O1"] },
      { key: "B", name: "Nothing moves", delta: "Control.", phone: "b.jpg", serves: ["O1"] },
    ],
  }),
);
const SREC = `tp/${scoped.id}/decisions/5300-q1`;
type Added = Record<string, { text: string; at: string } | null>;
const addedIn = (docs: Docs, rec = REC) => (docs[rec]?.outcomesAdded ?? {}) as Added;
type V = Awaited<ReturnType<typeof view>>;
const rows = (v: V) => [...v.doc.querySelectorAll<HTMLLIElement>(".addout .added li")];
async function add(v: V, text: string, how: "save" | "enter" = "save") {
  await v.click(v.doc.querySelector(".addout .oadd"));
  const field = v.doc.querySelector<HTMLInputElement>(".addout .otext") as HTMLInputElement;
  field.value = text;
  if (how === "enter") {
    field.dispatchEvent(new v.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
  } else await v.click(v.doc.querySelector(".addout .osave"));
}

describe("the control on the page", () => {
  it("sits under the scope's list on a round's own page", () => {
    const html = pageOf(scoped);
    const scope = html.slice(html.indexOf('<div class="scope">'));
    expect(scope.indexOf('<ul class="outcomes"')).toBeLessThan(scope.indexOf('class="addout"'));
    expect(scope).toContain(
      `<button type="button" class="oadd" aria-expanded="false" aria-controls="oform-5300-q1">${OUTCOME_WORDS.add}</button>`,
    );
    expect(scope).toContain(`maxlength="${MAX_OUTCOME}"`);
    expect(MAX_OUTCOME).toBe(200);
  });

  it("is there on a question with no scope, its heading waiting for the first outcome", () => {
    const html = pageOf();
    expect(html).toContain(
      '<div class="scope"><div class="addout" data-key="5300-q1" data-noscope>',
    );
    expect(html).toContain(`<p class="ohead" hidden><b>${OUTCOME_WORDS.head}</b></p>`);
    expect(OUTCOME_WORDS.head).toBe("Outcomes you want:");
  });

  it("is not on the twice-a-day steering page", () => {
    expect(renderPage(fixture())).not.toContain('class="addout"');
  });
});

describe("adding and removing an outcome", () => {
  it("saves his words as one key of outcomesAdded and lists them as added by him", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await add(v, "See what the order would cost");
    const entries = Object.entries(addedIn(docs));
    expect(entries).toHaveLength(1);
    const [id, entry] = entries[0] as [string, { text: string; at: string }];
    expect(id).toMatch(/^o[a-z0-9]+$/);
    expect(entry.text).toBe("See what the order would cost");
    expect(Number.isNaN(Date.parse(entry.at))).toBe(false);
    expect(rows(v).map((r) => r.textContent)).toEqual([
      "＋See what the order would cost (added by you)×",
    ]);
    expect(rows(v)[0]?.querySelector(".orm")?.getAttribute("aria-label")).toBe(
      "Remove: See what the order would cost",
    );
    expect(v.doc.querySelector<HTMLElement>(".addout .oform")?.hidden).toBe(true);
    expect(v.line()).toContain("1 of 1 answered");
  });

  it("shows the heading on a question with no scope once there is one", async () => {
    const v = await view({});
    await add(v, "Undo a sent order", "enter");
    expect(v.doc.querySelector<HTMLElement>(".addout .ohead")?.hidden).toBe(false);
  });

  it("saves nothing from an empty field or Cancel, and Escape folds the field", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await add(v, "   ");
    await v.click(v.doc.querySelector(".addout .oadd"));
    (v.doc.querySelector(".addout .otext") as HTMLInputElement).value = "not this";
    await v.click(v.doc.querySelector(".addout .ocancel"));
    await v.click(v.doc.querySelector(".addout .oadd"));
    const field = v.doc.querySelector(".addout .otext") as HTMLInputElement;
    field.dispatchEvent(new v.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(docs[REC]).toBeUndefined();
    expect(v.doc.querySelector<HTMLElement>(".addout .oform")?.hidden).toBe(true);
  });

  it("writes a removed outcome as null and takes it off the list", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await add(v, "First");
    await add(v, "Second");
    const [first] = Object.keys(addedIn(docs));
    await v.click(rows(v)[0]?.querySelector(".orm"));
    expect(addedIn(docs)[first as string]).toBeNull();
    expect(rows(v).map((r) => r.querySelector(".otx")?.firstChild?.textContent)).toEqual([
      "Second ",
    ]);
  });

  it("merges one key at a time: another view's outcome survives this view's", async () => {
    const other = { text: "Theirs", at: "2026-10-14T18:00:00Z" };
    const docs: Docs = { [SREC]: { outcomesAdded: { oother1: other }, react: {} } };
    const writes: string[] = [];
    const { open } = await import("./steer-pins-harness");
    const v = await open(docs, { html: pageOf(scoped), writes });
    expect(rows(v)).toHaveLength(1);
    await add(v, "Mine");
    expect(writes).toContain(`update ${SREC}`);
    expect(addedIn(docs, SREC).oother1).toEqual(other);
    expect(Object.keys(addedIn(docs, SREC))).toHaveLength(2);
  });

  it("disables the control on a locked page", async () => {
    const v = await view(null);
    expect(v.doc.querySelector<HTMLButtonElement>(".addout .oadd")?.disabled).toBe(true);
    await v.click(v.doc.querySelector(".addout .oadd"));
    expect(v.doc.querySelector<HTMLElement>(".addout .oform")?.hidden).toBe(true);
  });
});

describe("the read-back of his added outcomes", () => {
  const records = {
    [REC]: {
      outcomesAdded: {
        ob2: { text: "Undo a sent order\nwithin a minute", at: "2026-10-14T18:05:00Z" },
        oa1: { text: "See what the order would cost", at: "2026-10-14T18:01:00Z" },
        ogone: null,
        bad: { text: "not an outcome id", at: "2026-10-14T18:00:00Z" },
      },
      react: {},
    },
  };
  const plan = readback(ROUND, records);
  const body = plan.actions.find((a) => a.kind === "comment")?.body ?? "";

  it("quotes each word for word under Outcomes he added, oldest first", () => {
    expect(body).toContain(
      [
        OUTCOMES_HEAD,
        "- “See what the order would cost”",
        "- “Undo a sent order\n  within a minute”",
      ].join("\n"),
    );
    expect(body).not.toContain("not an outcome id");
  });

  it("hands each back for the session to classify", () => {
    expect(plan.outcomesAdded).toEqual([
      {
        issue: 5300,
        key: "5300-q1",
        text: "See what the order would cost",
        at: "2026-10-14T18:01:00Z",
      },
      {
        issue: 5300,
        key: "5300-q1",
        text: "Undo a sent order\nwithin a minute",
        at: "2026-10-14T18:05:00Z",
      },
    ]);
    expect(plan.followUps).toContainEqual({
      kind: "classify-outcomes",
      issue: 5300,
      key: "5300-q1",
      why: CLASSIFY,
    });
    expect(CLASSIFY).toContain("docs/IA.md §7, §10");
  });

  it("counts an added outcome as an answer, and a removed one as nothing", () => {
    expect(isAnswered(records[REC], ROUND.decisions[0])).toBe(true);
    expect(isAnswered({ outcomesAdded: { ogone: null } }, ROUND.decisions[0])).toBe(false);
    expect(plan.rollover).toEqual([]);
    expect(plan.followUps.map((f) => f.kind)).not.toContain("read-note");
  });

  it("cuts a hand-edited outcome past the limit, so the cut shows", () => {
    const long = "x".repeat(MAX_OUTCOME + 20);
    const [o] = addedOutcomes({ outcomesAdded: { olong: { text: long, at: "" } } });
    expect(o?.text).toHaveLength(MAX_OUTCOME);
    expect(o?.text.endsWith("…")).toBe(true);
  });

  it("reads an old round, with no outcomes, as none", () => {
    expect(readback(ROUND, {}).outcomesAdded).toEqual([]);
  });
});
