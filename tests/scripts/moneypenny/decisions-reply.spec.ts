import { describe, expect, it } from "@rstest/core";
import type { PageEntry } from "../../../scripts/moneypenny/decisions-reply.mjs";
import {
  readDecisionsReply,
  saidOf,
  segmentReply,
} from "../../../scripts/moneypenny/decisions-reply.mjs";

// #7939 slice 2: one reply on the decisions page answers many asks. What parses unambiguously is
// applied; everything else is echoed back with its reason, and nothing is ever guessed.
const ABC = { items: [{ keys: ["A", "B", "C"] }] };
const PAGE: PageEntry[] = [
  { n: 1, issue: 7669, since: 0, card: ABC },
  { n: 2, issue: 7670, since: 0, card: ABC },
  { n: 3, issue: 7671, since: 0, card: ABC },
  { n: 4, issue: 5452, since: 0, card: { items: [{ keys: [] }] } },
  { n: 5, issue: 5730, since: 0, card: { items: [{ keys: ["A", "B"] }, { keys: ["A", "C"] }] } },
];
const read = (text: string, entries = PAGE, replyAt = 1_000) =>
  readDecisionsReply(text, { entries, replyAt });
/** `[issue, said]` per applied answer — the shape a reader checks at a glance. */
const applied = (text: string, entries = PAGE, at = 1_000) =>
  read(text, entries, at).applied.map((a) => [a.issue, saidOf(a.answer)]);

describe("by the number on the page", () => {
  it("reads a letter per number, and `not now`", () => {
    expect(applied("1A 2B 3 not now")).toEqual([
      [7669, "A"],
      [7670, "B"],
      [7671, "not now"],
    ]);
  });

  it("takes the usual separators between a number and its letter", () => {
    for (const text of ["1: A", "1) A", "1. A", "1=A", "1 - A", "1 → A", "1 -> A", "**1A**"]) {
      expect(applied(text), text).toEqual([[7669, "A"]]);
    }
  });

  it("takes lowercase, commas, semicolons and one part per line", () => {
    expect(applied("1a, 2b; 3c")).toEqual([
      [7669, "A"],
      [7670, "B"],
      [7671, "C"],
    ]);
    expect(applied("1A\n2B")).toEqual([
      [7669, "A"],
      [7670, "B"],
    ]);
  });

  it("ignores a lead-in and the joining words", () => {
    expect(applied("Answers: 1A and 2B, thanks")).toEqual([
      [7669, "A"],
      [7670, "B"],
    ]);
  });

  it("reads later, park and defer as not now", () => {
    expect(applied("1 later 2 park it 3 defer").map(([, s]) => s)).toEqual([
      "not now",
      "not now",
      "not now",
    ]);
  });
});

describe("by issue number", () => {
  it("reads `7669 A, 7670 B` and `#7671: C`", () => {
    expect(applied("7669 A, 7670 B")).toEqual([
      [7669, "A"],
      [7670, "B"],
    ]);
    expect(applied("#7671: C")).toEqual([[7671, "C"]]);
  });

  it("mixes both kinds in one reply", () => {
    expect(applied("1A 7670 B")).toEqual([
      [7669, "A"],
      [7670, "B"],
    ]);
  });

  it("refuses an issue that is not on the page", () => {
    expect(read("#9999 A").unread).toEqual([{ raw: "#9999 A", why: "#9999 is not on the page" }]);
    expect(read("12 A").unread[0]?.why).toBe("nothing on the page is numbered 12");
  });

  it("refuses a number that is both an issue and a page number, rather than pick one", () => {
    const clash: PageEntry[] = [
      { n: 1, issue: 3, since: 0, card: ABC },
      { n: 3, issue: 9, since: 0, card: ABC },
    ];
    const r = read("3 A", clash);
    expect(r.applied).toEqual([]);
    expect(r.unread[0]?.why).toMatch(/both an issue and a number/);
    expect(applied("#3 A", clash)).toEqual([[3, "A"]]);
  });
});

describe("held to each ask's card, the way readAnswer holds a reply", () => {
  it("refuses a letter the card does not offer", () => {
    expect(read("1 D").unread[0]?.why).toBe("#7669: option D is not on its card");
  });

  it("takes yes and no only where no letter is offered", () => {
    expect(applied("4 yes")).toEqual([[5452, "yes"]]);
    expect(applied("4 no")).toEqual([[5452, "no"]]);
    expect(read("1 yes").unread[0]?.why).toMatch(/asks for a letter/);
    expect(read("4 A").unread[0]?.why).toMatch(/offers no letters/);
  });

  it("takes one letter per question, in order, for an ask with several", () => {
    for (const text of ["5 AC", "5 A C", "5AC"]) {
      expect(read(text).applied[0]?.answer, text).toEqual({
        kind: "option",
        picks: [
          { item: 0, key: "A" },
          { item: 1, key: "C" },
        ],
      });
    }
    expect(read("5 A").unread[0]?.why).toMatch(/asks 2 questions; give one letter for each/);
    expect(read("5 C A").unread[0]?.why).toMatch(/option C is not on its card for that question/);
  });

  it("refuses two letters for one question, two words, or a letter and a word", () => {
    expect(read("1 A B").unread[0]?.why).toMatch(/asks 1 question/);
    expect(read("4 yes no").unread[0]?.why).toMatch(/more than one answer/);
    expect(read("1 A yes").unread[0]?.why).toMatch(/mixes a letter and a word/);
    expect(read("1").unread[0]?.why).toMatch(/no answer follows/);
  });
});

describe("never guess", () => {
  it("leaves a part touched by words it cannot read unread, and applies the rest", () => {
    const r = read("don't do 1A, 2B");
    expect(r.applied.map((a) => a.issue)).toEqual([7670]);
    expect(r.unread[0]?.raw).toBe("1A");
  });

  it("reads a condition or a question mark after a letter as not an answer", () => {
    expect(read("1A but only if cheap").applied).toEqual([]);
    expect(read("1A?").applied).toEqual([]);
    expect(read("2B keep it simple").applied).toEqual([]);
  });

  it("reads two lowercase letters as a word, not two options", () => {
    expect(read("1 be").applied).toEqual([]);
  });

  it("applies one ask answered twice the same way once, and neither of two different answers", () => {
    expect(applied("1A 7669 A")).toEqual([[7669, "A"]]);
    const r = read("1A 1B 2C");
    expect(r.applied.map((a) => a.issue)).toEqual([7670]);
    expect(r.unread[0]?.why).toBe("#7669 is answered twice, differently");
  });

  it("is no answer at all when no number is named — and says which lines it set aside", () => {
    const r = read("let me think about these over the weekend");
    expect(r.referenced).toBe(false);
    expect(r.applied).toEqual([]);
    expect(r.notes).toEqual(["let me think about these over the weekend"]);
  });

  it("reads the numbered lines and sets aside a prose line beside them", () => {
    const r = read("1A\nAlso, can we chat about the chart later?");
    expect(r.applied.map((a) => a.issue)).toEqual([7669]);
    expect(r.notes).toEqual(["Also, can we chat about the chart later?"]);
  });

  it("skips a quoted line, so quoting the page back is never read as his answer", () => {
    expect(applied("> 1A\n2B")).toEqual([[7670, "B"]]);
  });
});

describe("numbers are read as of the reply", () => {
  const swapped: PageEntry[] = [
    { n: 1, issue: 100, since: 0, until: 50, card: ABC },
    { n: 1, issue: 200, since: 60, card: ABC },
  ];

  it("reads a number as the ask it named when he wrote it", () => {
    expect(applied("1A", swapped, 70)).toEqual([[200, "A"]]);
  });

  it("refuses a number whose ask was cleared after he wrote it, rather than move it to the new one", () => {
    const r = read("1A", swapped, 40);
    expect(r.applied).toEqual([]);
    expect(r.unread[0]?.why).toBe("#100 was cleared before this was read");
  });
});

describe("segmentReply", () => {
  it("splits a reply into numbered parts, keeping the raw text for the echo", () => {
    const { segments } = segmentReply("1A, #7670: b");
    expect(segments.map((s) => [s.ref, s.hash, s.keys, s.raw])).toEqual([
      [1, false, ["A"], "1A"],
      [7670, true, ["B"], "#7670 b"],
    ]);
  });
});
