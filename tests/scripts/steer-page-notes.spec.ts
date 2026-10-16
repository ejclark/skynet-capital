import { describe, expect, it } from "@rstest/core";
import { PAGE_NOTE_ARMED, PAGE_NOTE_LABEL } from "../../scripts/steer/page-notes.mjs";
import { META, REC, view } from "./steer-marks-fixture";
import { type Docs, settle } from "./steer-pins-harness";

// Eric, 2026-10-14: "if i have an issue, I have the ability to organically provide feedback
// inline." The bar's "✎ Note about this page" arms one tap: the next tap anywhere opens a note at
// that spot and does nothing else — the button under his finger never fires. Save merges the note
// into the round's own document (`update`, never `set`) as `pageNotes[<id>] = { near, x, y, note,
// at }`; the bar counts the notes; Escape cancels; a locked page disables the button.

type View = Awaited<ReturnType<typeof view>>;
const toggle = (v: View) => v.doc.getElementById("pnote") as HTMLButtonElement;
const pop = (v: View) => v.doc.querySelector<HTMLElement>(".pnpop");
const field = (v: View) => v.doc.querySelector<HTMLTextAreaElement>(".pnpop .pnt");
const notes = (docs: Docs) =>
  Object.values((docs[META]?.pageNotes ?? {}) as Record<string, Record<string, unknown>>);
/** Arm the mode, tap `el`, write `text` in the note that opens. */
async function noteOn(v: View, el: Element | null, text: string) {
  await v.click(toggle(v));
  await v.click(el);
  const t = field(v) as HTMLTextAreaElement;
  t.value = text;
  t.dispatchEvent(new v.window.Event("input", { bubbles: true }));
}

describe("a note about the page, left where the friction is", () => {
  it("sits in the fixed bar as a toggle, off until pressed", async () => {
    const v = await view({});
    expect(toggle(v).closest(".bar")).not.toBeNull();
    expect(toggle(v).textContent).toBe(PAGE_NOTE_LABEL);
    expect(toggle(v).getAttribute("aria-pressed")).toBe("false");
    await v.click(toggle(v));
    expect(toggle(v).getAttribute("aria-pressed")).toBe("true");
    expect(toggle(v).textContent).toBe(PAGE_NOTE_ARMED);
    await v.click(toggle(v));
    expect(toggle(v).getAttribute("aria-pressed")).toBe("false");
  });

  it("swallows the next tap: the button under it never fires, and a note opens there", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    const reveal = v.doc.getElementById("reveal-5200-q1");
    await v.click(toggle(v));
    await v.click(reveal);
    expect(v.doc.getElementById("found-5200-q1")?.hidden).toBe(true);
    expect(docs[REC]).toBeUndefined();
    expect(pop(v)?.hidden).toBe(false);
    expect(v.doc.querySelector(".pnpop .pnnear")?.textContent).toBe(
      "Near the “Show what Claude found” button",
    );
    expect(toggle(v).getAttribute("aria-pressed")).toBe("false");
    expect(v.doc.activeElement).toBe(field(v));
  });

  it("saves through a merge into the round's document, with where it was left", async () => {
    const docs: Docs = {};
    const writes: string[] = [];
    const v = await view(docs, { writes });
    docs[META] = { ...docs[META], readBackSummary: "the session's line" };
    await noteOn(v, v.doc.querySelector("h1"), "the intro is too long");
    await v.click(v.doc.querySelector(".pnpop .pns"));
    await settle();
    expect(writes).toContain(`update ${META}`);
    const [n] = notes(docs);
    expect(n).toMatchObject({
      near: expect.stringMatching(/^1 decision/),
      note: "the intro is too long",
    });
    expect(typeof n?.x).toBe("number");
    expect(typeof n?.y).toBe("number");
    expect(Number.isNaN(Date.parse(String(n?.at)))).toBe(false);
    expect(docs[META]?.readBackSummary).toBe("the session's line");
    expect(pop(v)?.hidden).toBe(true);
    expect(v.doc.getElementById("pnote-count")?.textContent).toBe("1 note");
  });

  it("names the Done bar when the tap was on it", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await noteOn(v, v.doc.getElementById("save-state"), "the bar hides the last row");
    await v.click(v.doc.querySelector(".pnpop .pns"));
    await settle();
    expect(notes(docs)[0]?.near).toBe("the Done bar");
  });

  it("drops the note on Cancel or Escape, and on an empty Save", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    await noteOn(v, v.doc.querySelector("h1"), "never mind");
    await v.click(v.doc.querySelector(".pnpop .pnc"));
    await noteOn(v, v.doc.querySelector("h1"), "never mind");
    v.key("Escape");
    await settle();
    expect(pop(v)?.hidden).toBe(true);
    await noteOn(v, v.doc.querySelector("h1"), "   ");
    await v.click(v.doc.querySelector(".pnpop .pns"));
    await settle();
    expect(notes(docs)).toHaveLength(0);
  });

  it("turns off on Escape before a spot is chosen", async () => {
    const v = await view({});
    await v.click(toggle(v));
    v.key("Escape");
    await settle();
    expect(toggle(v).getAttribute("aria-pressed")).toBe("false");
  });

  it("counts the notes already left, and is disabled on a locked page", async () => {
    const note = (n: string) => ({
      near: "the page",
      x: 1,
      y: 1,
      note: n,
      at: "2026-10-14T15:00:00Z",
    });
    const v = await view({ [META]: { pageNotes: { a: note("one"), b: note("two"), c: null } } });
    expect(v.doc.getElementById("pnote-count")?.textContent).toBe("2 notes");
    const locked = await view(null);
    expect(toggle(locked).disabled).toBe(true);
  });
});
