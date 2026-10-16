import {
  type CouncilRepliesDeps,
  councilRepliesView,
  MAX_REPLIES_PER_LINE,
  removeCouncilReply,
  submitCouncilReply,
} from "../../src/server/council-replies-form.js";
import type { CouncilReply } from "../../src/server/council-replies-store.js";
import type { CouncilEntry } from "../../src/server/council-store.js";

/**
 * Replies under a weekly Council line (#5097, #2224 option A) — what a valid reply is, and how the
 * league reads them. EARS:
 *  - WHEN a member replies to a line that is up this week, the system SHALL store it under that
 *    line in the app's own store and render it under that line for every member in the gate.
 *  - IF the line is not up this week, or changed since the member read it, the system SHALL refuse
 *    the reply and say why.
 *  - WHERE a line was edited after a reply was written, the reply SHALL say it answered an earlier
 *    version, never pass as an answer to the new words.
 *  - The system SHALL let only a reply's writer delete it.
 */

const WEEK = "2026-W41";
const NOW = new Date("2026-10-07T12:00:00.000Z");
const LINE_AT = "2026-10-05T09:00:00.000Z";

function depsWith(
  lines: Record<string, CouncilEntry> = { amy: { text: "GOOG chops all week", at: LINE_AT } },
  replies: Record<string, CouncilReply[]> = {},
) {
  let n = 0;
  // Only this week's threads exist here: a write keyed to any other week lands nowhere, so the
  // specs below would see it missing.
  const deps: CouncilRepliesDeps = {
    load: () => ({ weeks: { [WEEK]: replies } }),
    add: (week, lineId, r) => {
      if (week !== WEEK) return;
      replies[lineId] = [...(replies[lineId] ?? []), r];
    },
    remove: (week, lineId, replyId, authorId) => {
      if (week !== WEEK) return;
      replies[lineId] = (replies[lineId] ?? []).filter(
        (r) => !(r.id === replyId && r.authorId === authorId),
      );
    },
    loadCouncil: () => ({ weeks: { [WEEK]: lines } }),
    now: () => NOW,
    newId: () => `r${++n}`,
  };
  return { deps, replies, lines };
}

const stored = (over: Partial<CouncilReply> = {}): CouncilReply => ({
  id: "r0",
  authorId: "bob",
  text: "The ruling isn't until November",
  at: "2026-10-06T10:00:00.000Z",
  lineAt: LINE_AT,
  ...over,
});

describe("submitCouncilReply", () => {
  it("stores one trimmed line under a line that is up this week, stamped with the version read", () => {
    const { deps, replies } = depsWith();
    expect(
      submitCouncilReply("amy", LINE_AT, "  Disagree: the chop IS the trade  ", "bob", deps),
    ).toEqual({ ok: true });
    expect(replies.amy).toEqual([
      {
        id: "r1",
        authorId: "bob",
        text: "Disagree: the chop IS the trade",
        at: NOW.toISOString(),
        lineAt: LINE_AT,
      },
    ]);
  });

  it("lets a line's own writer answer under it", () => {
    const { deps, replies } = depsWith();
    expect(submitCouncilReply("amy", LINE_AT, "Fair — I'll size down", "amy", deps).ok).toBe(true);
    expect(replies.amy).toHaveLength(1);
  });

  it("refuses a line that isn't up this week, naming why", () => {
    const { deps, replies } = depsWith();
    for (const lineId of ["nobody", "__proto__", "constructor"]) {
      const result = submitCouncilReply(lineId, LINE_AT, "hi", "bob", deps);
      expect(result).toEqual({ ok: false, error: "That line isn't up this week." });
    }
    expect(replies).toEqual({});
  });

  it("refuses a reply to words that changed since the member read them", () => {
    const { deps, replies } = depsWith();
    const result = submitCouncilReply("amy", "2026-10-04T00:00:00.000Z", "hi", "bob", deps);
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toMatch(/edited/);
    expect(replies).toEqual({});
  });

  it("refuses empty and over-length text rather than clipping it", () => {
    const { deps, replies } = depsWith();
    expect(submitCouncilReply("amy", LINE_AT, "‮\n ", "bob", deps).ok).toBe(false);
    expect(submitCouncilReply("amy", LINE_AT, "x".repeat(501), "bob", deps)).toEqual({
      ok: false,
      error: "Keep it to 500 characters.",
    });
    expect(replies).toEqual({});
  });

  it("strips bidi overrides and folds control characters to one line", () => {
    const { deps, replies } = depsWith();
    submitCouncilReply("amy", LINE_AT, "a‮b\n\nc", "bob", deps);
    expect(replies.amy?.[0]?.text).toBe("ab c");
  });

  it("refuses once a line's thread is full", () => {
    const full = Array.from({ length: MAX_REPLIES_PER_LINE }, (_, i) => stored({ id: `f${i}` }));
    const { deps } = depsWith(undefined, { amy: full });
    expect(submitCouncilReply("amy", LINE_AT, "one more", "bob", deps)).toEqual({
      ok: false,
      error: "This line's thread is full.",
    });
  });
});

describe("councilRepliesView", () => {
  it("threads oldest first under lines that are up, with authorship only as mine / line's writer", () => {
    const { deps } = depsWith(undefined, {
      amy: [
        stored({ id: "r2", authorId: "amy", at: "2026-10-07T08:00:00.000Z", text: "Fair" }),
        stored({ id: "r1", authorId: "bob" }),
      ],
    });
    const view = councilRepliesView(deps, "bob");
    expect(view.week).toBe(WEEK);
    expect(view.replies.amy).toEqual([
      {
        id: "r1",
        text: "The ruling isn't until November",
        at: "2026-10-06T10:00:00.000Z",
        mine: true,
        byLineAuthor: false,
        earlierLine: false,
      },
      {
        id: "r2",
        text: "Fair",
        at: "2026-10-07T08:00:00.000Z",
        mine: false,
        byLineAuthor: true,
        earlierLine: false,
      },
    ]);
    // A reply's writer never leaves the server — only the two booleans do.
    expect(JSON.stringify(view)).not.toContain('"bob"');
  });

  it("says a reply answered an earlier version once its line is edited", () => {
    const { deps } = depsWith(
      { amy: { text: "GOOG breaks out instead", at: "2026-10-07T09:00:00.000Z" } },
      { amy: [stored()] },
    );
    expect(councilRepliesView(deps).replies.amy?.[0]?.earlierLine).toBe(true);
  });

  it("hides replies whose line was taken back — nothing to hang them on", () => {
    const { deps } = depsWith({}, { amy: [stored()] });
    expect(councilRepliesView(deps).replies).toEqual({});
  });

  it("marks nothing mine for a viewer with no session", () => {
    const { deps } = depsWith(undefined, { amy: [stored()] });
    expect(councilRepliesView(deps).replies.amy?.[0]?.mine).toBe(false);
  });
});

describe("removeCouncilReply", () => {
  it("deletes only the writer's own reply", () => {
    const { deps, replies } = depsWith(undefined, { amy: [stored({ id: "r9", authorId: "bob" })] });
    removeCouncilReply("amy", "r9", "carol", deps);
    expect(replies.amy).toHaveLength(1);
    expect(removeCouncilReply("amy", "r9", "bob", deps)).toEqual({ ok: true });
    expect(replies.amy).toEqual([]);
  });
});
