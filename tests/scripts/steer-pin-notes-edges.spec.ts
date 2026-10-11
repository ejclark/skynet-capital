import { describe, expect, it } from "@rstest/core";
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { isAnswered } from "../../scripts/steer/model.mjs";
import { MAX_PIN_NOTE } from "../../scripts/steer/pins.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { type Docs, open, question, REC, ROUND, settle, type Win } from "./steer-pins-harness";

// The edges of a pin's note (#5251, verified after merge): switching pins mid-note, a store that
// fails or turns out view-only after he typed, a paste past the limit, and what the read-back does
// with a stored note no page would write — over the limit, or carrying invisible characters.

type View = Awaited<ReturnType<typeof open>>;
const field = (v: View) => v.doc.querySelector<HTMLTextAreaElement>(".pinpop .pnt");
const type = (v: View, text: string) => {
  const t = field(v);
  if (!t) throw new Error("no note field open");
  t.value = text;
  t.dispatchEvent(new v.window.Event("input", { bubbles: true }));
};
async function note(v: View, id: string, text: string) {
  if (v.pin(id).getAttribute("aria-expanded") !== "true") await v.click(v.pin(id));
  if (field(v)?.closest<HTMLElement>("[hidden]"))
    await v.click(v.doc.querySelector(".pinpop .pna"));
  type(v, text);
}
const pause = () => new Promise((r) => setTimeout(r, 1000));
type Claude = { use: (name: string) => Promise<unknown> };
type Store = { collection: (p: string) => { get: () => Promise<unknown> } };

/** A store that waits for `release` — its reads, or (`late`) the store itself — wrapped by `wrap`
 *  (a failing read, a view-only user). */
async function slow(
  docs: Docs,
  wrap: (base: Claude) => Claude,
  writes: string[] = [],
  { late = false } = {},
) {
  let release: () => void = () => undefined;
  const wait = new Promise<void>((r) => {
    release = r;
  });
  const before = (w: Win) => {
    w.claude = wrap(w.claude as Claude);
  };
  const v = await open(docs, { ...(late ? { late: wait } : { gate: wait }), writes, before });
  return {
    v,
    release: async () => {
      release();
      await settle();
    },
  };
}

describe("switching pins mid-note", () => {
  it("saves the first pin's note as its one key, and opens the next pin empty", async () => {
    const docs: Docs = { [REC]: { pick: "B", pins: { "B:phone:2": "up" } } };
    const writes: string[] = [];
    const v = await open(docs, { writes });
    await note(v, "B:phone:1", "too tall");
    await v.click(v.pin("B:phone:2"));
    expect(writes.filter((w) => w.endsWith(REC))).toEqual([`update ${REC}`]);
    expect(docs[REC]).toMatchObject({
      pick: "B",
      pins: { "B:phone:2": "up" },
      pinNotes: { "B:phone:1": "too tall" },
    });
    expect(field(v)?.value).toBe("");
    expect(field(v)?.closest("[hidden]")).not.toBeNull();
    expect(v.pin("B:phone:1").getAttribute("aria-label")).toBe("Pin 1: range strip — with a note");
  });

  it("stores no more than the limit when a paste runs past it", async () => {
    const docs: Docs = { [REC]: { pins: {} } };
    const v = await open(docs);
    await note(v, "B:phone:1", "y".repeat(MAX_PIN_NOTE + 20));
    v.key("Escape");
    await settle();
    const notes = docs[REC]?.pinNotes as Record<string, string> | undefined;
    expect(notes?.["B:phone:1"]).toHaveLength(MAX_PIN_NOTE);
  });
});

describe("a note typed while loading, on a view that can't keep it", () => {
  it("is dropped when the store can't be read: nothing marked, counted or written", async () => {
    const docs: Docs = {};
    const writes: string[] = [];
    const failing = (base: Claude): Claude => ({
      use: (name) =>
        name !== "db"
          ? base.use(name)
          : base.use(name).then((db) => ({
              ...(db as object),
              collection: (p: string) => ({
                get: () =>
                  (db as Store)
                    .collection(p)
                    .get()
                    .then(() => Promise.reject(new Error("unreadable"))),
              }),
            })),
    });
    const { v, release } = await slow(docs, failing, writes);
    await note(v, "B:phone:1", "too tall");
    await release();
    await pause();
    expect(v.line()).toMatch(/^Couldn't read your saved answers/);
    expect(v.doc.querySelectorAll(".pin[data-noted]")).toHaveLength(0);
    expect(writes).toEqual([]);
  });

  it("is dropped on a view-only page: nothing marked or written", async () => {
    const docs: Docs = {};
    const writes: string[] = [];
    const viewOnly = (base: Claude): Claude => ({
      use: (name) =>
        name === "user" ? Promise.resolve({ can: async () => false }) : base.use(name),
    });
    // The store itself is slow to arrive, so the page can't yet know he may only view.
    const { v, release } = await slow(docs, viewOnly, writes, { late: true });
    await note(v, "B:phone:1", "too tall");
    await release();
    await pause();
    expect(v.line()).toMatch(/^View only · 0 of 1 answered$/);
    expect(v.doc.querySelectorAll(".pin[data-noted]")).toHaveLength(0);
    expect(writes).toEqual([]);
  });
});

// ── the read-back ────────────────────────────────────────────────────────────────────────────

const META = { [`tp/${ROUND.id}`]: { openedAt: "2026-10-11T18:00:00Z", doneAt: null, taps: [] } };
const commentOf = (plan: ReturnType<typeof readback>) => {
  const a = plan.actions.find((x) => x.kind === "comment");
  return a && "body" in a ? a.body : "";
};

describe("the read-back on a stored note no page would write", () => {
  it("drops control and bidi characters, keeping every visible word and its lines", () => {
    const raw = "too\u0000 tall\u0007 ‮move it‬⁧ up⁩\r\nunder the price‏";
    const plan = readback(ROUND, { ...META, [REC]: { pinNotes: { "B:phone:1": raw } } });
    expect(commentOf(plan)).toContain(
      "- Option B · pin 1 (range strip) — “too tall move it up\n  under the price”",
    );
    expect(plan.nextRound[0]?.instruction).toContain(
      "apply his note on that spot: “too tall move it up\nunder the price”",
    );
  });

  it("treats a note of nothing but invisible characters as no note", () => {
    const d = ROUND.decisions[0];
    expect(isAnswered({ pinNotes: { "B:phone:1": "‮\u0000 " } }, d)).toBe(false);
  });

  it("cuts a note past the limit, and says it was cut", () => {
    const long = "z".repeat(MAX_PIN_NOTE + 50);
    const plan = readback(ROUND, { ...META, [REC]: { pinNotes: { "B:phone:1": long } } });
    expect(commentOf(plan)).toContain(`— “${"z".repeat(MAX_PIN_NOTE - 1)}…”`);
  });

  it("files nothing on a problems question, and carries his note into the next round", () => {
    const tp = designRound(
      { 5150: designDecisions([question({ kind: "problems" })], { issue: 5150, round: 0 }) },
      { now: "2026-10-11T18:00:00Z" },
    );
    const rec = `tp/${tp.id}/decisions/5150-q1`;
    const meta = { [`tp/${tp.id}`]: META[`tp/${ROUND.id}`] };
    const plan = readback(tp, {
      ...meta,
      [rec]: { pick: "B", pins: { "B:phone:1": "down" }, pinNotes: { "B:phone:1": "only here" } },
    });
    expect(plan.actions.map((a) => a.kind)).toEqual(["comment"]);
    expect(commentOf(plan)).toContain(
      "- Option B · pin 1 (range strip) — 👎 not a problem — “only here”",
    );
    expect(plan.nextRound[0]?.instruction).toContain("apply his note on that spot: “only here”");
    expect(plan.nextRound[0]?.instruction).toMatch(/Nothing is filed from this pick\.$/);
  });
});
