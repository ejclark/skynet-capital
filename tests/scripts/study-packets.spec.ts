import { describe, expect, it } from "@rstest/core";
import {
  countHits,
  lintPacket,
  overlapsKey,
  shingles,
  termList,
} from "../../scripts/study/lint.mjs";
import {
  dropHypotheses,
  dropLateSentences,
  memberCard,
  sections,
  stripRefs,
} from "../../scripts/study/packets.mjs";

// The member study's packets are the only thing a blind role ever reads, so what they let through is
// the experiment's integrity. Every term below is invented — no sealed word belongs in the repo.

const member = `# Someone — a member

Intro line that is not a section.

## 1. Who

A careful saver (2026-09-01: *"I check once a day."*). See \`src/x.ts\` for nothing.

- _hypothesis — they prefer mornings. Proves it wrong: an evening visit
  on any date._
- They read the first line only.

## 2. What they own

Fixture \`human-x\`, one position.

## 3. What they are trying to do

Know whether to act (CLAUDE.md → Rules). Later they said: *"too late"* (2026-10-09).

## 4. How they decide

By outcome, see [the doc](docs/a.md) and #1234.

## 5. What frustrates them

The zebra widget.
`;

describe("member cards", () => {
  it("splits a member file into its numbered sections", () => {
    expect(Object.keys(sections(member))).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("drops hypothesis bullets, including their continuation lines, and keeps the next bullet", () => {
    const out = dropHypotheses(sections(member)["1"] ?? "");
    expect(out).not.toContain("hypothesis");
    expect(out).not.toContain("evening visit");
    expect(out).toContain("They read the first line only.");
  });

  it("strips repo references: code spans, repo parentheticals, link targets and issue numbers", () => {
    const out = stripRefs(
      "Know it (CLAUDE.md → Rules). See `src/x.ts`, [the doc](docs/a.md) and #1234 (kept aside).",
    );
    expect(out).not.toMatch(/CLAUDE|src\/|docs\/|#1234|`/);
    expect(out).toContain("the doc");
    expect(out).toContain("(kept aside)");
  });

  it("drops a sentence dated on or after the cutoff and keeps earlier ones", () => {
    const out = dropLateSentences(
      'First said "early" (2026-09-01). Then said "late" (2026-10-09).',
      "2026-10-08",
    );
    expect(out).toContain("early");
    expect(out).not.toContain("late");
  });

  it("builds a card from §1, §3 and §4 only, never §2 or §5, with a stable hash", () => {
    const card = memberCard(member, { cutoff: "2026-10-08", name: "someone" });
    expect(card.text).toContain("## Who you are");
    expect(card.text).toContain("## How you decide");
    expect(card.text).not.toContain("human-x");
    expect(card.text).not.toContain("zebra");
    expect(card.text).not.toContain("too late");
    expect(card.sha256).toBe(memberCard(member, { cutoff: "2026-10-08", name: "someone" }).sha256);
  });
});

describe("the leak check", () => {
  const keywords = termList("zebra\n# a comment\nquiet lake\n\nscroll\n");
  const keyShingles = shingles("the members could not find the zebra panel anywhere on the page");

  it("reads a term list without blanks or comments", () => {
    expect(keywords).toEqual(["zebra", "quiet lake", "scroll"]);
  });

  it("matches whole words and phrases, case-insensitively, not substrings", () => {
    expect(countHits("A Zebra crossing by the quiet  lake", keywords)).toBe(2);
    expect(countHits("zebras and a lakeside", keywords)).toBe(0);
  });

  it("flags any five-word run shared with the sealed key", () => {
    expect(overlapsKey("Sadly could not find the zebra panel today", keyShingles)).toBe(true);
    expect(overlapsKey("could not see a panel", keyShingles)).toBe(false);
  });

  it("refuses a task naming a sealed word or an interface label, by item number only", () => {
    const raw = JSON.stringify([
      { scenario: "Find out how much you hold.", answer: "$10" },
      { scenario: "Look at the zebra.", answer: "x" },
      { scenario: "Open Overview.", answer: "y" },
    ]);
    const { problems } = lintPacket({
      file: "t.json",
      raw,
      kind: "task",
      keywords,
      labels: ["overview"],
      keyShingles,
    });
    expect(problems).toEqual([
      { file: "t.json", item: 2, kind: "sealed-word" },
      { file: "t.json", item: 3, kind: "interface-label" },
    ]);
  });

  it("lets a role prompt use an allowed action name and nothing else", () => {
    const ok = lintPacket({
      file: "r.md",
      raw: "Use `scroll` to move.",
      kind: "role",
      keywords,
      keyShingles,
      allow: ["scroll"],
    });
    expect(ok.problems).toEqual([]);
    const bad = lintPacket({
      file: "r.md",
      raw: "Ignore the zebra.",
      kind: "role",
      keywords,
      keyShingles,
      allow: ["scroll"],
    });
    expect(bad.problems).toEqual([{ file: "r.md", item: 1, kind: "sealed-word" }]);
  });

  it("counts a member card's own words as priming instead of refusing them", () => {
    const { problems, primes } = lintPacket({
      file: "c.md",
      raw: "I hate the zebra.\n\nOverview is fine.",
      kind: "card",
      keywords,
      labels: ["overview"],
      keyShingles,
    });
    expect(problems).toEqual([]);
    expect(primes).toBe(2);
  });
});
