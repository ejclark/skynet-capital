import { execFileSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";
import { buildIssue } from "../../scripts/steer/filings.mjs";

// #7078: a Build pick's issue dropped the notes Eric tapped onto the picked option's frames (on
// #7018 round 1 both build drafts said "No note — the pick is the whole answer" while his note
// asking for progressive disclosure sat on the comment alone). The build body now carries each
// mark on the picked option, word for word, at the part of the screen it sits on.

const NOTE =
  "This eats up a TON of real estate out of the gate.\nApply progressive disclosure to withold the bulk.";
const sections = [{ label: "The lead story", x: 0, y: 20, w: 100, h: 40 }];
const d = {
  key: "7018-q4",
  issue: 7018,
  round: 1,
  title: "The landing page's news",
  options: [
    {
      key: "C",
      name: "News, mission narrator",
      delta: "the day's news first",
      pictures: [{ src: "c.jpg", alt: "Option C", size: "phone", sections }],
    },
    {
      key: "B",
      name: "News, plain",
      delta: "",
      pictures: [{ src: "b.jpg", alt: "Option B", size: "phone", sections }],
    },
  ],
};
const record = (marks: Record<string, unknown>, notes: Record<string, string>) => ({
  pick: "C",
  marks,
  pinNotes: notes,
});
// biome-ignore lint/suspicious/noExplicitAny: a minimal decision, only the fields the body reads
const body = (r: unknown) => buildIssue(d as any, r as any, "design-7018-r1").body;

describe("a Build pick's issue carries Eric's marks on the picked option", () => {
  const r = record(
    {
      "C:phone:mmw746bwzq45j": { x: 50, y: 30, at: "2026-11-08T15:00:00Z" },
      "B:phone:mother1": { x: 50, y: 30, at: "2026-11-08T15:01:00Z" },
    },
    { "C:phone:mmw746bwzq45j": NOTE, "B:phone:mother1": "only on the comment" },
  );

  it("quotes the note word for word, naming the part of the screen it sits on", () => {
    expect(body(r)).toContain(
      "- Option C, phone · on “The lead story” (50% across, 30% down) — “This eats up a TON of real estate out of the gate.\n  Apply progressive disclosure to withold the bulk.”",
    );
  });

  it("never says the pick was the whole answer when he left a note on the option", () => {
    expect(body(r)).not.toContain("No note — the pick is the whole answer.");
  });

  it("keeps marks on other options on the comment only", () => {
    expect(body(r)).not.toContain("only on the comment");
  });

  it("still lints clean as a capsule", () => {
    const out = execFileSync(
      "node",
      ["scripts/issue-lint.mjs", "--stdin", "--json", "--title", "Build"],
      { input: body(r), encoding: "utf8" },
    );
    expect(JSON.parse(out).problems).toEqual([]);
  });

  it("says the pick is the whole answer when he marked nothing on it", () => {
    const bare = body(record({}, {}));
    expect(bare).toContain("No note — the pick is the whole answer.");
    expect(bare).not.toContain("Eric's marks on this option");
  });
});
