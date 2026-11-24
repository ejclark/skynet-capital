import { describe, expect, it } from "@rstest/core";
import { rowsFromComments } from "../../../scripts/moneypenny/answer-readback.mjs";
import type {
  DecisionsIntent,
  NeedsYouRow,
  PageIssue,
} from "../../../scripts/moneypenny/decisions-page.mjs";
import {
  isDecisionsReply,
  nextState,
  PAGE_MARKER,
  planDecisions,
  REUSE_AFTER_MS,
  stateOf,
} from "../../../scripts/moneypenny/decisions-page.mjs";
import {
  executeDecisions,
  receiptComment,
  routeDecisions,
} from "../../../scripts/moneypenny/decisions-run.mjs";
import { routeSweep } from "../../../scripts/moneypenny/events.mjs";
import { route } from "../../../scripts/moneypenny/index.mjs";

// #7939 slice 2: every open ask reaches Eric on ONE standing issue, answered in one reply. The
// page body is regenerated each tick; his reply fans out through answer-readback's own path.
const NOW = Date.parse("2026-11-22T15:00:00Z"); // after the 14:00Z batch start
const callout = (q: string, opts = ["A (predicted, medium): one", "B: two"]) =>
  [
    "**Ask.**",
    "",
    "> [!IMPORTANT]",
    "> **Needs from you**",
    `> 1. ${q}`,
    ...opts.map((o) => `>    - ${o}`),
    ">    - On silence: nothing is built",
  ].join("\n");
const issue = (number: number, over: Partial<PageIssue> = {}): PageIssue => ({
  number,
  title: `ask ${number}`,
  body: callout(`Shape for ${number}?`),
  state: "open",
  labels: [{ name: "needs-eric" }],
  ...over,
});
const row = (number: number, criterion = 1): NeedsYouRow => ({ number, criterion, decision: "x" });
const BOT = { type: "Bot", login: "skynet-envoy[bot]" };
const page = (over: Partial<PageIssue> = {}): PageIssue => ({
  number: 900,
  title: "Decisions for Eric",
  body: `${PAGE_MARKER}\nold`,
  state: "open",
  created_at: "2026-11-22T00:00:00Z",
  labels: [{ name: "decisions-page" }],
  assignees: [{ login: "ejclark" }],
  user: BOT,
  ...over,
});
const his = (id: number, body: string, at = "2026-11-22T14:30:00Z") => ({
  id,
  body,
  created_at: at,
  author_association: "OWNER",
  user: { type: "User", login: "ejclark" },
});
const kinds = (intents: { kind: string }[]) => intents.map((i) => i.kind);

describe("the page body", () => {
  const { intents, body, state } = planDecisions({
    needsYou: [row(7669), row(7670), row(7424, 4)],
    issues: [issue(7669), issue(7670)],
    now: NOW,
  });

  it("opens the page, assigned to him, when none exists and an ask waits", () => {
    expect(kinds(intents)).toEqual(["decisions-open"]);
    expect(state.entries.map((e) => [e.n, e.issue])).toEqual([
      [1, 7669],
      [2, 7670],
    ]);
  });

  it("numbers each ask with its question, letters and prediction", () => {
    expect(body).toContain("**2 decisions wait on you. One reply answers all of them.**");
    expect(body).toContain("**1 · #7669** ask 7669");
    expect(body).toContain("Shape for 7669?");
    expect(body).toContain("- **A** _(predicted, medium)_ one");
    expect(body).toContain("_On silence: nothing is built_");
  });

  it("lists held PRs one per line, and never offers a reply as the merge", () => {
    expect(body).toContain("**Held for your merge: 1.**");
    // A row with no clock (no hours) is a bare link: nothing is claimed that was not read.
    expect(body).toContain("\n- #7424\n");
    expect(body).toContain("no reply here is read as a merge");
  });

  it("puts an issue that asks for a merge on the held line, never as a letter", () => {
    const merge = issue(7548, { body: callout("Merge held platter #7424?") });
    const out = planDecisions({ needsYou: [row(7548)], issues: [merge], now: NOW });
    expect(out.state.entries).toEqual([]);
    expect(out.body).toContain("**Held for your merge: 1.**");
    expect(out.body).toContain("- #7548 ask 7548");
  });

  it("carries its state, so the next tick keeps every number", () => {
    expect(stateOf(body).entries).toEqual(state.entries);
    expect(stateOf("no state here")).toEqual({
      entries: [],
      retired: [],
      pinged: [],
      pingedAt: 0,
      heldPinged: [],
    });
  });

  it("changes nothing on a tick where nothing changed", () => {
    const again = planDecisions({
      needsYou: [row(7669), row(7670), row(7424, 4)],
      issues: [issue(7669), issue(7670)],
      page: page({ body }),
      now: NOW + 60_000,
    });
    expect(again.intents).toEqual([]);
  });
});

// #7317: every held PR due his merge, as one ask — named, timed from green, what it blocks, what
// silence does — and pinged once, never one card per PR.
describe("held PRs as one ask (#7317)", () => {
  const green = (number: number, hours: number, blocks: NeedsYouRow["blocks"] = []) => ({
    number,
    title: `held ${number}`,
    criterion: 4,
    why: `held PR green ${hours}h`,
    green: true,
    hours,
    blocks,
  });
  const plan6871 = [{ number: 6871, title: "plan", plan: true }];
  const heldOnly = (over: Record<string, unknown> = {}) =>
    planDecisions({ needsYou: [green(7030, 26, plan6871), green(7211, 5)], now: NOW, ...over });

  it("names each PR, how long it has been green, what it blocks and what silence does", () => {
    const { body } = heldOnly();
    expect(body).toContain("**2 held PRs wait on your merge.**");
    expect(body).toContain(
      "- #7030 held 7030 — green 26h · blocks plan #6871 · _On silence: it stays open, and plan #6871 keeps waiting._",
    );
    expect(body).toContain("- #7211 held 7211 — green 5h · _On silence: it stays open._");
    expect(body).not.toContain("Nothing waits on you");
  });

  it("says a held PR is not green when only the 12h backstop made it due", () => {
    const row = { number: 7080, criterion: 4, green: false, hours: 13 };
    expect(planDecisions({ needsYou: [row], now: NOW }).body).toContain(
      "- #7080 — open 13h, checks not green",
    );
  });

  it("opens the page for held PRs alone, and the assignment is the push", () => {
    const { intents, state } = heldOnly();
    expect(kinds(intents)).toEqual(["decisions-open"]);
    expect(state.heldPinged.map((h) => h.n)).toEqual([7030, 7211]);
  });

  it("pings once for every new held PR, in one comment, when he is already on the page", () => {
    const { intents } = heldOnly({ page: page() });
    const sync = intents[0] as Extract<DecisionsIntent, { kind: "decisions-sync" }>;
    expect(sync.assign).toBe(false);
    expect(sync.ping).toContain(
      "2 held PRs ready for your merge: #7030 (green 26h, blocks plan #6871); #7211 (green 5h)",
    );
  });

  it("never pings the same held PR twice inside a day, even if it left the list meanwhile", () => {
    const first = heldOnly({ page: page() });
    const sync = first.intents[0] as Extract<DecisionsIntent, { kind: "decisions-sync" }>;
    const body = sync.body ?? "";
    // A push restarted 7030's checks: it is off the list for a tick, then back in the next window.
    const off = planDecisions({
      needsYou: [green(7211, 6)],
      page: page({ body }),
      now: NOW + 36e5,
    });
    const offBody =
      (off.intents[0] as Extract<DecisionsIntent, { kind: "decisions-sync" }> | undefined)?.body ??
      body;
    const back = planDecisions({
      needsYou: [green(7030, 4, plan6871), green(7211, 13)],
      page: page({ body: offBody }),
      now: Date.parse("2026-11-22T22:00:00Z"), // past the 21:30Z batch start
    });
    for (const i of back.intents) expect((i as { ping?: string | null }).ping ?? null).toBeNull();
  });

  it("takes him off the page once nothing is held and nothing is asked", () => {
    const { body } = heldOnly();
    const { intents } = planDecisions({ needsYou: [], page: page({ body }), now: NOW + 60_000 });
    const sync = intents[0] as Extract<DecisionsIntent, { kind: "decisions-sync" }>;
    expect(sync.unassign).toBe(true);
  });
});

describe("numbers are stable", () => {
  const prior = nextState(stateOf(""), [{ issue: 10 }, { issue: 20 }], 0);

  it("keeps a waiting ask's number and gives a new ask the lowest free one, in rank order", () => {
    const s = nextState(prior, [{ issue: 20 }, { issue: 40, rank: 3 }, { issue: 30, rank: 1 }], 1);
    expect(s.entries.map((e) => [e.n, e.issue])).toEqual([
      [2, 20],
      [3, 30],
      [4, 40],
    ]);
    expect(s.retired.map((r) => [r.n, r.issue, r.until])).toEqual([[1, 10, 1]]);
  });

  it("reuses a freed number only once a day has passed", () => {
    const left = nextState(prior, [{ issue: 20 }], 1);
    expect(nextState(left, [{ issue: 20 }, { issue: 50 }], 2).entries.at(-1)?.n).toBe(3);
    const later = nextState(left, [{ issue: 20 }, { issue: 50 }], 2 + REUSE_AFTER_MS);
    expect(later.entries[0]).toMatchObject({ n: 1, issue: 50 });
  });
});

describe("his reply fans out through answer-readback's path", () => {
  const feedback = issue(7669, { labels: [{ name: "needs-eric" }, { name: "feedback" }] });
  const deps = (comments: unknown[]) => {
    const first = planDecisions({
      needsYou: [row(7669), row(7670)],
      issues: [feedback, issue(7670)],
      now: 0,
    });
    return {
      needsYou: [row(7669), row(7670)],
      issues: [feedback, issue(7670)],
      page: page({ body: first.body }),
      comments: comments as never[],
      now: NOW,
    };
  };

  it("reads `1A 2 not now` into one read-back per ask, then a page without them", () => {
    const { intents } = planDecisions(deps([his(55, "1A 2 not now")]));
    expect(kinds(intents)).toEqual(["decisions-answer", "decisions-sync"]);
    const answer = intents[0] as Extract<DecisionsIntent, { kind: "decisions-answer" }>;
    expect(answer.readbacks.map((r) => [r.number, r.said])).toEqual([
      [7669, "A"],
      [7670, "not now"],
    ]);
    const first = answer.readbacks[0];
    expect(first?.body).toContain("Read as: A (your reply on #900).");
    expect(first?.body).toContain("Alignment ledger: match");
    // its ledger row is keyed to this reply, so a retry never scores it twice
    expect(rowsFromComments([{ body: first?.body, user: BOT }])[0]?.key).toBe("7669/55/0");
    const sync = intents[1] as Extract<DecisionsIntent, { kind: "decisions-sync" }>;
    expect(sync.body).toContain("**Nothing waits on you.**");
    expect(sync.unassign).toBe(true);
  });

  it("puts `ready` on a feedback issue for a letter — never for not now", () => {
    const { intents } = planDecisions(deps([his(55, "1A 2 not now")]));
    const answer = intents[0] as Extract<DecisionsIntent, { kind: "decisions-answer" }>;
    expect(answer.readbacks.map((r) => r.ready)).toEqual([true, false]);
    const deferred = planDecisions(deps([his(56, "1 not now")])).intents[0] as typeof answer;
    expect(deferred.readbacks[0]?.ready).toBe(false);
  });

  it("echoes what it could not read", () => {
    const { intents } = planDecisions(deps([his(57, "1A 2 maybe")]));
    const answer = intents[0] as Extract<DecisionsIntent, { kind: "decisions-answer" }>;
    expect(answer.readbacks.map((r) => r.number)).toEqual([7669]);
    expect(answer.unread[0]?.raw).toBe("2 maybe");
  });

  it("reads only his unfooted text: not a session under his login, not a stranger", () => {
    const footed = his(58, "1A\n\n_Generated by [Claude Code](https://claude.ai/code)_");
    const stranger = {
      ...his(59, "1A"),
      author_association: "NONE",
      user: { type: "User", login: "x" },
    };
    expect(kinds(planDecisions(deps([footed, stranger])).intents)).toEqual([]);
  });

  // #7957: tick 1's sync used to retire an answered ask before the answer was applied. When the
  // answer intent then failed (a 502, or a busy lease), tick 2 read his reply against the retired
  // entry as "cleared before this was read", receipted it, and lost the answer.
  describe("an answer that did not land (#7957)", () => {
    const tick1 = planDecisions(deps([his(55, "1A")]));
    const sync = tick1.intents[1] as Extract<DecisionsIntent, { kind: "decisions-sync" }>;

    it("keeps the answered ask's number in the page's state until the ask leaves", () => {
      expect(stateOf(sync.body ?? "").entries.map((e) => [e.n, e.issue])).toEqual([
        [1, 7669],
        [2, 7670],
      ]);
      expect(stateOf(sync.body ?? "").retired).toEqual([]);
    });

    it("still draws the page without it, the tick he answered", () => {
      expect(sync.body).toContain("**1 decision waits on you.");
      expect(sync.body).not.toContain("**1 · #7669**");
      expect(sync.body).toContain("**2 · #7670**");
    });

    it("re-reads the unreceipted reply next tick and answers it again", () => {
      const tick2 = planDecisions({
        ...deps([his(55, "1A")]),
        page: page({ body: sync.body ?? "" }),
        now: NOW + 60_000,
      });
      const ans = tick2.intents[0] as Extract<DecisionsIntent, { kind: "decisions-answer" }>;
      expect(ans.kind).toBe("decisions-answer");
      expect(ans.readbacks.map((r) => r.number)).toEqual([7669]);
      expect(ans.unread).toEqual([]);
      expect(tick2.state.entries.map((e) => [e.n, e.issue])).toEqual([
        [1, 7669],
        [2, 7670],
      ]);
    });

    it("retires the number once the answer landed and the ask left", () => {
      const receipt = { body: receiptComment({ replyId: 55 }), user: BOT };
      const tick2 = planDecisions({
        needsYou: [row(7670)],
        issues: [issue(7670)],
        page: page({ body: sync.body ?? "" }),
        comments: [his(55, "1A"), receipt] as never[],
        now: NOW + 60_000,
      });
      expect(tick2.state.entries.map((e) => e.issue)).toEqual([7670]);
      expect(tick2.state.retired.map((r) => [r.n, r.issue, r.until])).toEqual([
        [1, 7669, NOW + 60_000],
      ]);
    });
  });

  it("never answers a reply twice, and says nothing to a note with no number in it", () => {
    const receipt = {
      body: receiptComment({ replyId: 55 }),
      user: BOT,
      created_at: "2026-11-22T14:31:00Z",
    };
    expect(kinds(planDecisions(deps([his(55, "1A"), receipt])).intents)).toEqual([]);
    expect(kinds(planDecisions(deps([his(60, "thinking about these")])).intents)).toEqual([]);
  });
});

describe("one touch per cadence", () => {
  const base = planDecisions({ needsYou: [row(1)], issues: [issue(1)], now: 0 });
  const withNew = (now: number, labels = [{ name: "needs-eric" }]) =>
    planDecisions({
      needsYou: [row(1), row(2)],
      issues: [issue(1), issue(2, { labels })],
      page: page({ body: base.body }),
      now,
    }).intents[0] as Extract<DecisionsIntent, { kind: "decisions-sync" }>;

  it("pings once for asks he has not been told about, in a new batch window", () => {
    const sync = withNew(NOW);
    expect(sync.ping).toContain("1 new decision on this page: 2 · #2");
  });

  it("holds a new ask for the next window, unless it stops bots or production", () => {
    const sameWindow = Date.parse("1970-01-01T00:10:00Z");
    expect(withNew(sameWindow).ping).toBeNull();
    expect(withNew(sameWindow, [{ name: "needs-eric" }, { name: "fast-track" }]).ping).toContain(
      "#2",
    );
  });

  it("assigns him to the page when it fills again, and lets that be the push", () => {
    const sync = planDecisions({
      needsYou: [row(1)],
      issues: [issue(1)],
      page: page({ assignees: [] }),
      now: NOW,
    }).intents[0] as Extract<DecisionsIntent, { kind: "decisions-sync" }>;
    expect([sync.assign, sync.ping]).toEqual([true, null]);
  });
});

describe("routing", () => {
  const decisions = {
    needsYou: [row(7669)],
    issues: [issue(7669)],
    page: null,
    comments: [],
  };

  it("is a no-op without the gathered deps", () => {
    expect(routeDecisions({})).toEqual([]);
  });

  it("the push sweep sends no per-issue card: the page carries the ask (#7939)", () => {
    const intents = routeSweep({
      assignments: { issues: [issue(7669)], prs: [], markers: new Set() },
      decisions,
      now: NOW,
    }) as { kind: string }[];
    expect(kinds(intents)).toEqual(["decisions-open"]);
  });

  it("reads his reply on the page on the comment event itself", () => {
    const intents = route({ eventName: "issue_comment", payload: {} }, { decisions, now: NOW });
    expect(kinds(intents as { kind: string }[])).toEqual(["decisions-open"]);
  });

  it("knows his reply on the page from any other comment", () => {
    const onPage = { issue: page(), comment: his(1, "1A") };
    expect(isDecisionsReply(onPage)).toBe(true);
    expect(isDecisionsReply({ ...onPage, issue: page({ user: { type: "User" } }) })).toBe(false);
    expect(isDecisionsReply({ ...onPage, issue: page({ labels: [] }) })).toBe(false);
    expect(
      isDecisionsReply({ ...onPage, comment: his(1, "1A\n_Generated by [Claude Code](x)_") }),
    ).toBe(false);
  });
});

describe("executeDecisions", () => {
  const calls: string[] = [];
  const run = (_cmd: string, args: readonly string[]) => {
    calls.push(`${args[2]} ${String(args[3]).replace("repos/{owner}/{repo}/", "")}`);
    return "";
  };
  const io = (rest: (p: string) => unknown, read: (p: string) => unknown) => ({
    run,
    retry: <T>(fn: () => T) => fn(),
    rest,
    read,
  });
  const answer = (readbacks: { number: number; n: number }[]) =>
    ({
      kind: "decisions-answer",
      page: 900,
      replyId: 55,
      readbacks: readbacks.map((r) => ({
        kind: "readback-eric",
        ...r,
        title: "t",
        criterion: 1,
        why: "w",
        said: "A",
        body: "Read as: A",
        ready: r.number === 1,
      })),
      unread: [],
      notes: [],
      why: "w",
    }) as DecisionsIntent;

  it("answers each issue, readies a lane issue after its answer, and posts the receipt last", () => {
    calls.length = 0;
    const waiting = { state: "open", body: "", labels: [{ name: "needs-eric" }] };
    const line = executeDecisions(
      answer([
        { number: 1, n: 1 },
        { number: 2, n: 2 },
      ]),
      io(
        () => [],
        (p) => (p === "issues/2" ? { ...waiting, labels: [] } : waiting),
      ),
    );
    expect(calls).toEqual([
      "DELETE issues/1/labels/needs-eric",
      "DELETE issues/1/assignees",
      "POST issues/1/comments",
      "POST issues/1/labels",
      "POST issues/900/comments",
    ]);
    expect(line).toContain("Read: 1 → #1 A.");
    expect(line).toContain("#2 no longer waits on you");
  });

  it("does nothing for a reply the page already answered", () => {
    calls.length = 0;
    const done = [{ body: receiptComment({ replyId: 55 }), user: BOT }];
    executeDecisions(
      answer([{ number: 1, n: 1 }]),
      io(
        () => done,
        () => ({}),
      ),
    );
    expect(calls).toEqual([]);
  });

  it("opens the page with its label and his assignment, once", () => {
    calls.length = 0;
    const open = {
      kind: "decisions-open",
      title: "Decisions for Eric",
      body: "b",
      number: 0,
      why: "1",
    };
    executeDecisions(open as DecisionsIntent, {
      ...io(
        () => [],
        () => ({}),
      ),
      ensure: () => undefined,
    });
    expect(calls).toEqual(["POST issues"]);
    calls.length = 0;
    const exists = () => [page()];
    executeDecisions(open as DecisionsIntent, {
      ...io(exists, () => ({})),
      ensure: () => undefined,
    });
    expect(calls).toEqual([]);
  });
});
