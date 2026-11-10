import { describe, expect, it } from "@rstest/core";
import { answered, commentsWith, META, openWith, settle } from "./steer-client-harness";
import { choose, META as MARKS_META, REC, tapFrame, view } from "./steer-marks-fixture";
import type { Docs } from "./steer-pins-harness";

// #7119, Eric 2026-11-09, on #7018 round 3: "The done button was already checked and did nothing..
// I reopned and closed to trigger the action". Done was read back at 21:50Z; he then added five
// marks and a More, and the bar still showed Done pressed with the old read-back line, so nothing
// reached the session until a Reopen and a second Done. One Done covers one set of answers: a change
// after the read-back re-arms Done and says so, and the press sends a fresh Done. Nothing is sent
// until he presses it.

const NEWER = "New answers since Claude read this back — press Done to send them.";
const SENT = "Done — sent to Claude. “Received” shows here once the session reads it.";
const READ_BACK = { readBackAt: "2026-10-10T22:30:00Z", readBackSummary: "1 pick posted" };
const DONE_AT = "2026-10-10T22:21:59Z";
const decision = `${META}/decisions`;

type View = Awaited<ReturnType<typeof openWith>>;
const firstRow = (v: View) =>
  v.doc.querySelector<HTMLButtonElement>('.react[data-sec="decisions"] .rb') as HTMLButtonElement;
/** Done as the bar shows it: armed (pressable) or pressed. */
const armed = (v: View) =>
  !(v.el("done") as HTMLButtonElement).disabled &&
  v.el("done").getAttribute("aria-pressed") === "false";

/** The page open after a Done the session has read back live, with the comments it sent. */
async function readBack(docs = answered()) {
  const c = commentsWith();
  const v = await openWith(docs, c.api);
  await v.press("done");
  await v.db.doc(META).update({ ...READ_BACK, readBackAt: new Date().toISOString() });
  await settle();
  return { v, c, docs };
}

describe("Done re-arms when an answer changes after its read-back (#7119)", () => {
  it("re-arms Done and says so when he changes an answer, sending nothing by itself", async () => {
    const { v, c } = await readBack();
    expect(v.told()).toMatch(/^Read back /);
    expect(armed(v)).toBe(false);
    firstRow(v).click();
    await settle();
    expect(v.told()).toBe(NEWER);
    expect(armed(v)).toBe(true);
    expect(v.el("done").textContent).toBe("I'm done");
    expect(v.el("reopen").hidden).toBe(true);
    expect(c.sent).toHaveLength(1);
  });

  it("sends a fresh Done with a new Pressed time when the re-armed Done is pressed", async () => {
    const { v, c, docs } = await readBack();
    const first = docs[META]?.doneAt as string;
    await new Promise((r) => setTimeout(r, 5)); // a later millisecond for the second press
    firstRow(v).click();
    await settle();
    await v.press("done");
    const second = docs[META]?.doneAt as string;
    expect(second).not.toBe(first);
    expect(c.sent).toHaveLength(2);
    expect(c.sent[1]?.text).toContain(`Pressed ${second}. Read it back.`);
    expect(v.told()).toBe(SENT);
    expect(armed(v)).toBe(false);
    // One press per batch: pressed again with nothing new, it sends nothing.
    await v.press("done");
    expect(c.sent).toHaveLength(2);
  });

  it("re-arms at the first key of a note, so a press mid-note saves it and sends", async () => {
    const { v, c, docs } = await readBack();
    const box = v.doc.querySelector<HTMLTextAreaElement>(
      "textarea[data-note]",
    ) as HTMLTextAreaElement;
    box.value = "one more thing";
    box.dispatchEvent(
      new (v.doc.defaultView as Window & typeof globalThis).Event("input", { bubbles: true }),
    );
    expect(v.told()).toBe(NEWER);
    await v.press("done");
    expect(c.sent).toHaveLength(2);
    const { sec, key } = box.dataset;
    expect(docs[`${META}/${sec}/${key}`]?.note).toBe("one more thing");
  });

  it("stays pressed while nothing changes after the read-back", async () => {
    const { v, c } = await readBack();
    await v.press("done");
    expect(c.sent).toHaveLength(1);
    expect(v.told()).toMatch(/^Read back /);
  });

  it("does not re-arm for a change after Done but before the read-back — the read-back reads it", async () => {
    const c = commentsWith();
    const v = await openWith(answered(), c.api);
    await v.press("done");
    firstRow(v).click();
    await settle();
    expect(v.told()).toBe(SENT);
    expect(armed(v)).toBe(false);
  });

  it("clears once a new read-back lands", async () => {
    const { v } = await readBack();
    firstRow(v).click();
    await settle();
    await v.db.doc(META).update({ readBackAt: new Date().toISOString(), readBackSummary: "again" });
    await settle();
    expect(v.told()).toMatch(/^Read back .+ · again$/);
    expect(armed(v)).toBe(false);
  });
});

describe("a page opened later finds the answers newer than the read-back (#7119)", () => {
  it("re-arms Done when a stored answer was saved after readBackAt", async () => {
    const docs = answered({ doneAt: DONE_AT, ...READ_BACK });
    const first = Object.keys(docs).find((p) => p.startsWith(decision)) as string;
    docs[first] = { ...docs[first], at: "2026-10-10T23:27:00Z" };
    const v = await openWith(docs);
    expect(v.told()).toBe(NEWER);
    expect(armed(v)).toBe(true);
  });

  it("re-arms Done for a page note saved after readBackAt", async () => {
    const note = {
      option: "today",
      frame: "phone",
      x: 1,
      y: 1,
      note: "n",
      at: "2026-10-10T23:40:00Z",
    };
    const v = await openWith(answered({ doneAt: DONE_AT, ...READ_BACK, pageNotes: { n1: note } }));
    expect(v.told()).toBe(NEWER);
    expect(armed(v)).toBe(true);
  });

  it("shows the read-back, Done pressed, when every answer predates it", async () => {
    const docs = answered({ doneAt: DONE_AT, ...READ_BACK });
    const first = Object.keys(docs).find((p) => p.startsWith(decision)) as string;
    docs[first] = { ...docs[first], at: "2026-10-10T22:20:00Z" };
    const v = await openWith(docs);
    expect(v.told()).toMatch(/^Read back .+ · 1 pick posted$/);
    expect(armed(v)).toBe(false);
  });

  // #6730: a read-back's guessed stamp can sit behind the press, yet the read-back came after it.
  it("keeps Done pressed for an answer saved just before the press, under a read-back stamped behind it", async () => {
    const docs = answered({
      doneAt: DONE_AT,
      readBackAt: "2026-10-10T22:21:00Z",
      readBackSummary: "1 pick posted",
    });
    const first = Object.keys(docs).find((p) => p.startsWith(decision)) as string;
    docs[first] = { ...docs[first], at: "2026-10-10T22:21:40Z" };
    const v = await openWith(docs);
    expect(v.told()).toMatch(/^Read back .+ · 1 pick posted$/);
    expect(armed(v)).toBe(false);
  });
});

describe("a mark saved after the read-back re-arms Done (#7119 criterion 3)", () => {
  const read = { doneAt: "2026-11-09T21:40:00Z", readBackAt: "2026-11-09T21:50:00Z" };

  it("finds Done re-armed and the line shown once the mark saves", async () => {
    const docs: Docs = { [MARKS_META]: { openedAt: "2026-11-09T21:30:00Z", taps: [], ...read } };
    const v = await view(docs);
    const done = v.doc.getElementById("done") as HTMLButtonElement;
    expect(done.disabled).toBe(true);
    await tapFrame(v, 42, 30);
    await choose(v, "Like");
    expect(Object.keys((docs[REC]?.marks ?? {}) as object)).toHaveLength(1);
    expect(v.doc.getElementById("told")?.textContent).toBe(NEWER);
    expect(done.disabled).toBe(false);
    expect(done.getAttribute("aria-pressed")).toBe("false");
  });

  it("finds the same on reload, from the mark's record saved after readBackAt", async () => {
    const docs: Docs = {
      [MARKS_META]: { openedAt: "2026-11-09T21:30:00Z", taps: [], ...read },
      [REC]: {
        marks: {
          "today:phone:ma1": { x: 4, y: 4, at: "2026-11-09T23:27:00Z", beforeReveal: true },
        },
        pins: { "today:phone:ma1": "up" },
        at: "2026-11-09T23:27:00Z",
      },
    };
    const v = await view(docs);
    expect(v.doc.getElementById("told")?.textContent).toBe(NEWER);
    expect((v.doc.getElementById("done") as HTMLButtonElement).disabled).toBe(false);
  });
});
