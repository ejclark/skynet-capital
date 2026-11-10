import { type FeedbackStatus, statusFromIssue } from "../../src/domain/feedback-status.js";
import { type Waiting, waitingOn } from "../../src/domain/work-waiting.js";

/**
 * What an open filing waits on (the Moneypenny operator plan, slice filing-wait-explained). The
 * table pins one row per label state a member can meet; the agreement test below proves the
 * waiting line never contradicts the status words the Feedback row already shows.
 */

type Row = readonly [
  name: string,
  state: string,
  labels: readonly string[],
  openPullRequests: readonly number[],
  on: Waiting["on"] | undefined,
];

const ROWS: readonly Row[] = [
  ["no labels", "open", [], [], "nobody has picked it"],
  ["only feedback", "open", ["feedback"], [], "nobody has picked it"],
  ["needs-eric", "open", ["feedback", "needs-eric"], [], "a decision from Eric"],
  ["needs-eric outranks ready", "open", ["ready", "needs-eric"], [], "a decision from Eric"],
  ["needs-eric outranks an open PR", "open", ["needs-eric"], [12], "a decision from Eric"],
  ["needs-info", "open", ["needs-info"], [], "an answer from the person who filed it"],
  [
    "needs-info outranks in-progress",
    "open",
    ["in-progress", "needs-info"],
    [],
    "an answer from the person who filed it",
  ],
  ["ready, no PR", "open", ["ready"], [], "a free build session"],
  ["ready with an open PR", "open", ["ready"], [77], "nothing: a build session has it"],
  ["in-progress", "open", ["ready", "in-progress"], [], "nothing: a build session has it"],
  ["open PR, no labels", "open", [], [5], "nothing: a build session has it"],
  ["needs-session", "open", ["ready", "needs-session"], [], "a person opening a working session"],
  ["closed", "closed", ["ready"], [], undefined],
  ["closed with next-slice", "closed", ["next-slice"], [], undefined],
  ["merged pull request", "merged", [], [], undefined],
];

describe("what an open filing waits on", () => {
  it.each(ROWS)("%s", (_name, state, labels, prs, on) => {
    expect(waitingOn(state, labels, prs)?.on).toBe(on);
  });

  it("tells a member a chat filing is not built automatically, and what gets one picked", () => {
    const w = waitingOn("open", ["feedback"], []);
    expect(w?.why).toContain("A filing from the chat is not built automatically");
    expect(w?.next).toContain("says what done looks like");
  });

  it("never shows a bare label name or a date to the member", () => {
    for (const [, state, labels, prs] of ROWS) {
      const w = waitingOn(state, labels, prs);
      if (!w) continue;
      const words = `${w.on} ${w.why} ${w.next}`;
      expect(words).not.toMatch(/needs-eric|needs-info|needs-session|in-progress|\bready\b label/);
      expect(words).not.toMatch(/\b\d{4}-\d{2}-\d{2}\b|\bby (Monday|Friday|next week|tomorrow)\b/i);
    }
  });

  it("names Eric's decision and the filer's answer plainly", () => {
    expect(waitingOn("open", ["needs-eric"], [])?.why).toBe(
      "It waits on a decision only Eric can make.",
    );
    expect(waitingOn("open", ["needs-info"], [])?.next).toBe(
      "Answer the question on the issue thread.",
    );
  });
});

/** Which waiting answers each status may sit beside. An open PR can move a waiting or ready
 *  filing to "being built" (the reader's status words say "Being built — PR #N open" too). */
const AGREES: Record<FeedbackStatus, readonly (Waiting["on"] | undefined)[]> = {
  open: [
    "nobody has picked it",
    "a person opening a working session",
    "nothing: a build session has it",
  ],
  "up-next": [
    "a free build session",
    "a person opening a working session",
    "nothing: a build session has it",
  ],
  building: ["nothing: a build session has it"],
  "needs-eric": ["a decision from Eric"],
  "needs-info": ["an answer from the person who filed it"],
  // Closed with next-slice: the first slice shipped and nothing is waiting on this issue.
  "next-slice": [
    undefined,
    "nobody has picked it",
    "a free build session",
    "a person opening a working session",
    "nothing: a build session has it",
  ],
  shipped: [undefined],
  "not-built": [undefined],
};

describe("agreement with the Feedback row's status", () => {
  it.each(ROWS)("%s: waiting never contradicts statusFromIssue", (_name, state, labels, prs) => {
    // statusFromIssue knows open and closed; a merged pull request is closed to it.
    const status = statusFromIssue(state === "merged" ? "closed" : state, labels);
    expect(AGREES[status]).toContain(waitingOn(state, labels, prs)?.on);
  });
});
