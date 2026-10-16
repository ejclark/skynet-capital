import { describe, expect, it } from "@rstest/core";
import { isAnswered } from "../../scripts/steer/model.mjs";
import { MAX_PIN_NOTE } from "../../scripts/steer/pins.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { type Docs, open, REC, ROUND, settle } from "./steer-pins-harness";

// Eric, in a redesign session on 2026-10-11: "i wish the thumbs up/down/mixed signal form/process
// also allowed for commentary to expand on context". Each pin's popover carries an optional note
// under its three choices — a small "Add a note" that opens a field (≤280 characters). It saves in
// the decision's own record as `pinNotes: { "<option>:<phone|desk>:<n>": "<text>" }`, merged one
// key at a time like the reactions (an emptied note is null), and the read-back quotes it word for
// word under that pin. #5243: a tap held while the store connects merges into the stored record.

type View = Awaited<ReturnType<typeof open>>;
const field = (v: View) => v.doc.querySelector<HTMLTextAreaElement>(".pinpop .pnt");
const addNote = (v: View) => v.doc.querySelector<HTMLButtonElement>(".pinpop .pna");
const counter = (v: View) => v.doc.querySelector<HTMLElement>(".pinpop .pcount");
/** Type into the open note field, as a person does: the value, then an input event. */
const type = (v: View, text: string) => {
  const t = field(v);
  if (!t) throw new Error("no note field open");
  t.value = text;
  t.dispatchEvent(new v.window.Event("input", { bubbles: true }));
};
/** Open a pin's popover, open its note field and type. */
async function note(v: View, id: string, text: string) {
  if (v.pop()?.hidden !== false || v.pin(id).getAttribute("aria-expanded") !== "true")
    await v.click(v.pin(id));
  if (field(v)?.closest<HTMLElement>("[hidden]")) await v.click(addNote(v));
  type(v, text);
}
const pressEscape = async (v: View) => {
  v.key("Escape");
  await settle();
};
const more = (v: View, opt = "A") =>
  v.click(v.doc.querySelector(`.react[data-opt="${opt}"] .rb[data-v="more"]`));

describe("a pin's popover offers a note under its three choices", () => {
  it("starts as a small Add a note control that opens a field, focused, capped at 280", async () => {
    const v = await open({});
    await v.click(v.pin("B:phone:1"));
    expect(addNote(v)?.textContent).toBe("✎ Add a note");
    expect(addNote(v)?.getAttribute("aria-expanded")).toBe("false");
    expect(field(v)?.closest("[hidden]")).not.toBeNull();
    await v.click(addNote(v));
    expect(field(v)?.closest("[hidden]")).toBeNull();
    expect(addNote(v)?.hidden).toBe(true);
    expect(v.doc.activeElement).toBe(field(v));
    expect(field(v)?.maxLength).toBe(MAX_PIN_NOTE);
    expect(MAX_PIN_NOTE).toBe(280);
    expect(field(v)?.getAttribute("aria-label")).toBe("Note on pin 1: range strip");
  });

  it("shows a counter only near the limit", async () => {
    const v = await open({});
    await note(v, "B:phone:1", "x".repeat(200));
    expect(counter(v)?.hidden).toBe(true);
    type(v, "x".repeat(250));
    expect(counter(v)?.hidden).toBe(false);
    expect(counter(v)?.textContent).toBe("30 characters left");
  });

  it("leaves the arrow keys to the field while it has focus", async () => {
    const v = await open({});
    await note(v, "B:phone:1", "range");
    v.key("ArrowLeft");
    expect(v.doc.activeElement).toBe(field(v));
  });

  it("keeps the field open, and its text, when a choice is tapped while writing", async () => {
    const docs: Docs = {};
    const v = await open(docs);
    await note(v, "B:phone:1", "too tall");
    await v.click(v.choices().find((c) => c.textContent?.includes("Change")));
    expect(docs[REC]?.pins).toEqual({ "B:phone:1": "down" });
    expect(v.pop()?.hidden).toBe(false);
    expect(field(v)?.value).toBe("too tall");
    expect(v.choices()[1]?.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("a note saves in the decision's record, one key at a time", () => {
  it("merges only its key on close, keeping the pick, the note and the pins", async () => {
    const docs: Docs = { [REC]: { pick: "B", note: "closer", pins: { "B:phone:1": "down" } } };
    const writes: string[] = [];
    const v = await open(docs, { writes });
    await note(v, "B:phone:1", "too tall");
    await pressEscape(v);
    expect(docs[REC]).toMatchObject({
      pick: "B",
      note: "closer",
      pins: { "B:phone:1": "down" },
      pinNotes: { "B:phone:1": "too tall" },
    });
    expect(writes.filter((w) => w.endsWith(REC))).toEqual([`update ${REC}`]);
  });

  it("saves on a pause in typing, without a close", async () => {
    const docs: Docs = { [REC]: { pins: {} } };
    const v = await open(docs);
    await note(v, "B:phone:2", "keep this one");
    expect(docs[REC]?.pinNotes).toBeUndefined();
    await new Promise((r) => setTimeout(r, 1000));
    expect(docs[REC]?.pinNotes).toEqual({ "B:phone:2": "keep this one" });
    expect(v.pop()?.hidden).toBe(false);
  });

  it("keeps the text through Escape, and shows it again when the pin reopens", async () => {
    const v = await open({});
    await note(v, "B:phone:1", "too tall");
    await pressEscape(v);
    expect(v.pop()?.hidden).toBe(true);
    expect(v.doc.activeElement).toBe(v.pin("B:phone:1"));
    await v.click(v.pin("B:phone:1"));
    expect(field(v)?.closest("[hidden]")).toBeNull();
    expect(field(v)?.value).toBe("too tall");
    expect(addNote(v)?.hidden).toBe(true);
  });

  it("marks the badge ✎ and counts a note with no reaction as an answer", async () => {
    const v = await open({});
    expect(v.line()).toMatch(/0 of 1 answered$/);
    await note(v, "B:phone:1", "too tall");
    await v.click(v.doc.querySelector("h1"));
    const b = v.pin("B:phone:1");
    expect(b.dataset.noted).toBeDefined();
    expect(b.querySelector(".pk")?.textContent).toBe("✎");
    expect(b.getAttribute("aria-label")).toBe("Pin 1: range strip — with a note");
    expect(v.line()).toMatch(/1 of 1 answered$/);
    await v.choose("B:phone:1", "Keep");
    expect(b.getAttribute("aria-label")).toBe("Pin 1: range strip — Keep, with a note");
  });

  it("stores an emptied note as null, and the mark goes", async () => {
    const docs: Docs = { [REC]: { pinNotes: { "B:phone:1": "too tall" } } };
    const v = await open(docs);
    expect(v.pin("B:phone:1").dataset.noted).toBeDefined();
    await note(v, "B:phone:1", "");
    await pressEscape(v);
    expect(docs[REC]?.pinNotes).toEqual({ "B:phone:1": null });
    expect(v.pin("B:phone:1").dataset.noted).toBeUndefined();
    expect(v.line()).toMatch(/0 of 1 answered$/);
  });

  it("is saved by Done when the popover is still open", async () => {
    const docs: Docs = {};
    const v = await open(docs);
    await note(v, "B:phone:2", "keep this one");
    await v.click(v.doc.getElementById("done"));
    expect(docs[REC]?.pinNotes).toEqual({ "B:phone:2": "keep this one" });
  });

  it("never erases a note another view saved, even when this view rewrites the record", async () => {
    const docs: Docs = { [REC]: { pick: null, react: {}, note: "", pins: {}, pinNotes: {} } };
    const v = await open(docs);
    (docs[REC] as { pinNotes: Record<string, string> }).pinNotes["B:phone:2"] = "theirs";
    await note(v, "B:phone:1", "mine");
    await pressEscape(v);
    expect(docs[REC]?.pinNotes).toEqual({ "B:phone:1": "mine", "B:phone:2": "theirs" });
    (docs[REC] as { pinNotes: Record<string, string> }).pinNotes["B:phone:2"] = "theirs, later";
    await more(v);
    expect(docs[REC]).toMatchObject({ react: { A: "more" } });
    expect(docs[REC]?.pinNotes).toEqual({ "B:phone:1": "mine", "B:phone:2": "theirs, later" });
  });

  it("carries the note in Copy as text", async () => {
    const written: string[] = [];
    const v = await open(
      { [REC]: { pins: { "B:phone:1": "down" }, pinNotes: { "B:phone:1": "too\ntall" } } },
      {
        before: (w) =>
          Object.defineProperty(w.navigator, "clipboard", {
            value: { writeText: (t: string) => Promise.resolve(written.push(t)) },
          }),
      },
    );
    await v.click(v.doc.getElementById("copy"));
    expect(written[0]).toContain("pin B:phone:1 down “too tall”");
  });
});

// A republished round can keep a note on a pin it no longer shows: the page ignores it, the same
// rule #5240 set for reactions.
describe("only the pins this page shows carry notes", () => {
  it("ignores a note on a pin the page no longer shows", async () => {
    const v = await open({ [REC]: { pinNotes: { "B:phone:9": "old spot" } } });
    expect(v.line()).toMatch(/0 of 1 answered$/);
    expect(v.doc.querySelectorAll(".pin[data-noted]")).toHaveLength(0);
  });

  it("locks the pins, and so the field, in a view with no store", async () => {
    const v = await open(null);
    const pins = [...v.doc.querySelectorAll<HTMLButtonElement>(".pin")];
    expect(pins.every((p) => p.disabled)).toBe(true);
    await v.click(pins[0]);
    expect(field(v)).toBeNull();
  });
});

// #5243: until the store answers, a tap is held. Once it answers, the tap merges into the record
// the store holds — never a blank copy plus the tap over his earlier pick, note, pins and notes.
describe("a tap held while the store connects merges into the stored record (#5243)", () => {
  const saved = () => ({
    pick: "B",
    react: {},
    verdict: null,
    note: "closer",
    pins: { "B:phone:1": "down" },
    pinNotes: { "B:phone:1": "too tall" },
  });
  const slow = async (docs: Docs, writes: string[] = []) => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const v = await open(docs, { gate, writes });
    const answer = async () => {
      release();
      await settle();
    };
    return { v, release: answer };
  };

  it("keeps the pick, note, pin reaction and pin note the store held", async () => {
    const docs: Docs = { [REC]: saved() };
    const { v, release } = await slow(docs);
    expect(v.line()).toBe("Loading your answers…");
    await more(v);
    await v.choose("B:phone:2", "Keep");
    await note(v, "B:phone:2", "and here");
    await pressEscape(v);
    expect(v.line()).toBe("Sending once your answers load");
    await release();
    expect(docs[REC]).toMatchObject({
      pick: "B",
      note: "closer",
      react: { A: "more" },
      pins: { "B:phone:1": "down", "B:phone:2": "up" },
      pinNotes: { "B:phone:1": "too tall", "B:phone:2": "and here" },
    });
    expect(
      v.doc.querySelector('.react[data-opt="B"] .rb[data-v="build"]')?.getAttribute("aria-pressed"),
    ).toBe("true");
    expect(v.line()).toMatch(/1 of 1 answered$/);
  });

  it("writes only the held pin's key when that is all he tapped", async () => {
    const docs: Docs = { [REC]: saved() };
    const writes: string[] = [];
    const { v, release } = await slow(docs, writes);
    await v.choose("B:phone:2", "Mixed");
    await release();
    expect(writes.filter((w) => w.endsWith(REC))).toEqual([`update ${REC}`]);
    expect(docs[REC]).toEqual({
      ...saved(),
      pins: { ...saved().pins, "B:phone:2": "mixed" },
      at: expect.any(String),
    });
  });

  it("saves a note typed while loading, when the store answers before the pause", async () => {
    const docs: Docs = { [REC]: saved() };
    const { v, release } = await slow(docs);
    await note(v, "B:phone:1", "shorter");
    await release();
    expect(docs[REC]?.pinNotes).toEqual({ "B:phone:1": "too tall" });
    await new Promise((r) => setTimeout(r, 1000));
    expect(docs[REC]).toMatchObject({ pick: "B", pinNotes: { "B:phone:1": "shorter" } });
  });

  it("writes a held reaction and note on one pin in a single merge", async () => {
    const docs: Docs = { [REC]: saved() };
    const writes: string[] = [];
    const { v, release } = await slow(docs, writes);
    await v.choose("B:phone:2", "Keep");
    await note(v, "B:phone:2", "and here");
    await pressEscape(v);
    await release();
    expect(writes.filter((w) => w.endsWith(REC))).toEqual([`update ${REC}`]);
    expect(docs[REC]).toMatchObject({
      pins: { "B:phone:2": "up" },
      pinNotes: { "B:phone:2": "and here" },
    });
  });

  it("lets a Not tapped while loading clear the stored pick on that option", async () => {
    const docs: Docs = { [REC]: saved() };
    const { v, release } = await slow(docs);
    await v.click(v.doc.querySelector('.react[data-opt="B"] .rb[data-v="not"]'));
    await release();
    expect(docs[REC]).toMatchObject({ pick: null, react: { B: "not" }, note: "closer" });
  });

  it("still writes a record the store doesn't hold whole", async () => {
    const docs: Docs = {};
    const { v, release } = await slow(docs);
    await more(v);
    await release();
    expect(docs[REC]).toMatchObject({ round: ROUND.id, key: "5150-q1", react: { A: "more" } });
  });
});

// ── the read-back ────────────────────────────────────────────────────────────────────────────

const META = { [`tp/${ROUND.id}`]: { openedAt: "2026-10-11T18:00:00Z", doneAt: null, taps: [] } };
const bodyOf = (plan: ReturnType<typeof readback>, kind = "comment") => {
  const a = plan.actions.find((x) => x.kind === kind);
  return a && "body" in a ? a.body : "";
};

describe("the read-back quotes each note word for word under its pin", () => {
  const rec = {
    pins: { "B:phone:1": "down" },
    pinNotes: { "B:phone:1": "too tall — move it under the price", "B:phone:2": "keep this one" },
  };
  const plan = readback(ROUND, { ...META, [REC]: rec });

  it("puts it after the reaction, or alone when he only wrote", () => {
    expect(bodyOf(plan)).toContain(
      [
        "Per pin:",
        "- Option B · pin 1 (range strip) — 👎 change — “too tall — move it under the price”",
        "- Option B · pin 2 (order line) — “keep this one”",
      ].join("\n"),
    );
  });

  it("carries it into the next round's instruction, on that spot", () => {
    expect(plan.nextRound[0]?.instruction).toBe(
      "Round 2 on #5150, per pin: " +
        "Option B · pin 1 (range strip): replace with a new direction; " +
        "apply his note on that spot: “too tall — move it under the price”. " +
        "Option B · pin 2 (order line): apply his note on that spot: “keep this one”.",
    );
  });

  it("keeps a note's lines inside its pin's list item", () => {
    const two = readback(ROUND, { ...META, [REC]: { pinNotes: { "B:phone:2": "one\ntwo" } } });
    expect(bodyOf(two)).toContain("- Option B · pin 2 (order line) — “one\n  two”");
  });

  it("carries the picked option's notes into the build it files", () => {
    const built = readback(ROUND, { ...META, [REC]: { pick: "B", ...rec } });
    expect(bodyOf(built, "issue")).toContain("— 👎 change — “too tall — move it under the price”");
  });

  it("counts a note as an answer only on a pin the page shows, and never a blank one", () => {
    const d = ROUND.decisions[0];
    expect(isAnswered({ pinNotes: { "B:phone:2": "here" } }, d)).toBe(true);
    expect(isAnswered({ pinNotes: { "B:phone:9": "gone" } }, d)).toBe(false);
    expect(isAnswered({ pinNotes: { "B:phone:2": null } }, d)).toBe(false);
    expect(isAnswered({ pinNotes: { "B:phone:2": "  " } }, d)).toBe(false);
    const stale = readback(ROUND, { ...META, [REC]: { pinNotes: { "B:phone:9": "gone" } } });
    expect(stale.rollover.map((x) => x.key)).toEqual(["5150-q1"]);
    expect(bodyOf(stale)).toBe("");
  });
});
