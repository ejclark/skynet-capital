import { describe, expect, it } from "@rstest/core";
import fc from "fast-check";
import { notPullable, notPullableReason } from "../../../scripts/moneypenny/labels.mjs";
import {
  boardItemsFromProjectItems,
  cardFieldValues,
  FIELDS,
  IN_COLUMN_SINCE,
  KIND,
  KIND_OPTIONS,
  NEXT_NEEDS_APPROVAL,
  WAITING_ON,
} from "../../../scripts/moneypenny/projects.mjs";
import {
  CARD_FIELD_WRITES_PER_SWEEP,
  describeCardFields,
  planCardFieldDrift,
  planCardFields,
  waitingOnFor,
  wantedCardFields,
  wantedKindOf,
} from "../../../scripts/moneypenny/projects-fields.mjs";
import { mergeDrift, reconcileBoard } from "../../../scripts/moneypenny/projects-reconcile.mjs";
import {
  createBoardContext,
  readBoardItemsFromGh,
  readIssueItemsFromGh,
  wantedCard,
  wantedColumn,
} from "../../../scripts/moneypenny/projects-sync.mjs";
import { KINDS, kindOf } from "../../../scripts/rank.mjs";

// #6871 slice 3 — THE CARD'S THREE EXTRA FIELDS (board design §5, criteria in §12(b)):
//   Kind                 what sort of work, the order inside a priority lane
//   Waiting on           who acts next on a card that cannot be pulled
//   In this column since the day Status last really changed
// Written by the sync from labels and the column, never by hand. The criteria this file guards
// hardest: WHEN the sync's Status equals the stored Status, THEN it SHALL NOT write the day; and
// every card that cannot be pulled SHALL say who acts next.

const labels = (...names: string[]) => names.map((name) => ({ name }));
const issue = (number: number, names: string[] = [], extra: Record<string, unknown> = {}) => ({
  number,
  state: "open",
  labels: labels(...names),
  ...extra,
});
const URL = (n: number) => `https://github.com/ejclark/skynet-capital/issues/${n}`;
const ALL = { [KIND]: true, [WAITING_ON]: true, [IN_COLUMN_SINCE]: true };

describe("Kind: written from the card's own labels, in the order a lane sorts by", () => {
  it("the board's option list is rank's, name for name and in order", () => {
    expect(KIND_OPTIONS).toEqual(KINDS);
    expect(FIELDS.find((f) => f.name === KIND)?.options).toEqual(KINDS);
  });

  it("routes each label to its kind, strongest first", () => {
    expect(kindOf({ labels: ["fast-track", "bug"] })).toBe("Fix first");
    expect(kindOf({ labels: ["bug", "bottleneck"] })).toBe("Bug");
    expect(kindOf({ labels: ["plan"], blocks: [4] })).toBe("Blocks other work");
    expect(kindOf({ labels: ["bottleneck"] })).toBe("Slows delivery");
    expect(kindOf({ labels: ["feedback", "member-sam"] })).toBe("Member asked");
    expect(kindOf({ labels: ["plan"] })).toBe("Improvement");
    expect(kindOf({ labels: ["idea"] })).toBe("Idea");
    expect(kindOf({ labels: ["plan"], horizon: "Later" })).toBe("Idea");
  });

  it("a hand-set P label moves the lane, never the Kind", () => {
    expect(kindOf({ labels: ["bug", "P3"] })).toBe("Bug");
  });

  it("any label snapshot lands on one of the board's options", () => {
    const pool = ["fast-track", "bug", "bottleneck", "idea", "member-x", "plan", "P0", "P3"];
    fc.assert(
      fc.property(
        fc.subarray(pool),
        fc.nat(3),
        fc.constantFrom(null, "Later", "Now"),
        (names, blocking, horizon) => {
          const kind = kindOf({ labels: names, blocks: Array(blocking).fill(0), horizon });
          expect(KIND_OPTIONS).toContain(kind);
        },
      ),
    );
  });

  it("reads blocking from the REST issue's dependency summary, and Later from the triage", () => {
    expect(wantedKindOf(issue(1, ["plan"], { issue_dependencies_summary: { blocking: 2 } }))).toBe(
      "Blocks other work",
    );
    expect(wantedKindOf(issue(7, ["plan"]), { horizons: { "7": "Later" } })).toBe("Idea");
  });
});

describe("notPullable: the coded reason is the sentence's twin", () => {
  const cases: [string, Record<string, unknown>, string | null][] = [
    ["no issue", {}, "no-ready"],
    ["ready", { labels: labels("ready") }, null],
    ["parked", { labels: labels("ready", "needs-eric") }, "parked"],
    ["in progress", { labels: labels("ready", "in-progress") }, "in-progress"],
    ["needs-session", { labels: labels("ready", "needs-session") }, "needs-session"],
    [
      "blocked",
      { labels: labels("ready"), issue_dependencies_summary: { blocked_by: 2 } },
      "blocked",
    ],
    ["closed", { state: "closed", labels: labels("ready") }, "closed"],
  ];
  for (const [name, extra, code] of cases) {
    it(`${name}: code ${code ?? "null"}, and notPullableReason is its text`, () => {
      const i = { number: 5, ...extra };
      expect(notPullable(i)?.code ?? null).toBe(code);
      expect(notPullableReason(i)).toBe(notPullable(i)?.text ?? null);
    });
  }

  it("a held platter is coded `platter`", () => {
    const why = notPullable(issue(8, ["ready"]), { boardedOn: new Map([[8, 99]]) });
    expect(why?.code).toBe("platter");
    expect(why?.text).toContain("#99");
  });
});

describe("Waiting on: every card that cannot be pulled says who acts next", () => {
  const wait = (names: string[], card = {}, extra = {}) =>
    waitingOnFor(issue(1, names, extra), { status: "Backlog", ...card });

  it("names the person a label asks for", () => {
    expect(wait(["needs-eric"])).toBe("Eric to decide");
    expect(wait(["needs-info"])).toBe("The filer to answer");
    expect(wait(["needs-design"])).toBe("Eric to open a design session");
    expect(wait(["needs-session"], { status: "Waiting on a person" })).toBe(
      "Someone to run it live",
    );
    expect(wait(["hold-merge"])).toBe("Eric to release the merge hold");
  });

  it("a needs-eric with no written ask is a session's job, not Eric's (#3913)", () => {
    expect(wait(["needs-eric"], { decisionCalloutMissing: true })).toBe(
      "A session to write Eric's question",
    );
  });

  it("a card being built that also waits on someone still names the person", () => {
    expect(wait(["in-progress", "needs-eric"], { status: "Building now" })).toBe("Eric to decide");
  });

  it("Backlog names the pull rule's first failing check", () => {
    expect(wait(["plan"])).toBe("Approval to build");
    expect(wait(["ready"], {}, { issue_dependencies_summary: { blocked_by: 1 } })).toBe(
      "An open blocking issue to close",
    );
    expect(wait(["ready"], {}, { issue_dependencies_summary: { blocked_by: 3 } })).toBe(
      "3 open blocking issues to close",
    );
    expect(wait(["ready"], { boardedOn: new Map([[1, 50]]) })).toBe(
      "Eric to merge the held platter",
    );
    expect(wait(["ready"], { namedByOpenPr: true })).toBe("Its open PR to merge");
  });

  it("a plan whose next part needs approval says so", () => {
    expect(wait(["plan", "next-slice"], { status: NEXT_NEEDS_APPROVAL })).toBe(
      "Next part to be approved",
    );
  });

  it("is blank wherever nothing stops a build", () => {
    expect(wait(["ready"], { status: "Ready" })).toBe("");
    expect(wait(["plan", "next-slice"], { status: "Next part queued" })).toBe("");
    expect(wait(["in-progress"], { status: "Building now" })).toBe("");
  });

  it("agrees with the column the sync picks, end to end through wantedCard", () => {
    const cases = [
      issue(1, ["ready"]),
      issue(2, ["plan"]),
      issue(3, ["needs-info"]),
      issue(4, ["ready", "in-progress"]),
      issue(5, ["ready"], { issue_dependencies_summary: { blocked_by: 1 } }),
    ];
    const want = [
      "",
      "Approval to build",
      "The filer to answer",
      "",
      "An open blocking issue to close",
    ];
    cases.forEach((c, i) => {
      const card = wantedCard(c);
      expect(card).not.toBeNull();
      expect(wantedColumn(c)).toBe(card?.status);
      expect(wantedCardFields(c, card ?? {}).waitingOn).toBe(want[i]);
    });
  });
});

describe("planCardFields: the day moves only with Status, and goes first", () => {
  const wanted = { kind: "Bug", waitingOn: "" };

  it("WHEN Status equals the stored Status, THEN the day is not written", () => {
    const writes = planCardFields({
      have: { status: "Backlog", kind: "Bug", waitingOn: "" },
      wanted,
      status: "Backlog",
      today: "2026-11-07",
      present: ALL,
    });
    expect(writes).toEqual([]);
  });

  it("WHEN Status really changes, THEN the day is written, ahead of every other field", () => {
    const writes = planCardFields({
      have: { status: "Backlog" },
      wanted: { kind: "Bug", waitingOn: "Eric to decide" },
      status: "Waiting on a person",
      today: "2026-11-07",
      present: ALL,
    });
    expect(writes.map((w) => w.kind)).toEqual(["date", "select", "text"]);
    expect(writes[0]).toEqual({ field: IN_COLUMN_SINCE, kind: "date", value: "2026-11-07" });
  });

  it("a card new to the board has no Status, so its first column starts the clock", () => {
    const writes = planCardFields({
      have: {},
      wanted,
      status: "Ready",
      today: "2026-11-07",
      present: ALL,
    });
    expect(writes[0]?.field).toBe(IN_COLUMN_SINCE);
  });

  it("clears Waiting on when nothing waits any more, and only when it was set", () => {
    const set = planCardFields({
      have: { status: "Ready", kind: "Bug", waitingOn: "Eric to decide" },
      wanted,
      status: "Ready",
      today: "2026-11-07",
      present: ALL,
    });
    expect(set).toEqual([{ field: WAITING_ON, kind: "clear", value: "" }]);
    const unset = planCardFields({
      have: { status: "Ready", kind: "Bug" },
      wanted,
      status: "Ready",
      today: "2026-11-07",
      present: ALL,
    });
    expect(unset).toEqual([]);
  });

  it("skips a field the board does not carry yet — setup has not run, which is not an error", () => {
    const writes = planCardFields({
      have: { status: "Backlog" },
      wanted: { kind: "Bug", waitingOn: "Eric to decide" },
      status: "Ready",
      today: "2026-11-07",
      present: { [KIND]: true },
    });
    expect(writes).toEqual([{ field: KIND, kind: "select", value: "Bug" }]);
  });

  it("describes what it wrote", () => {
    expect(describeCardFields(3, [])).toBe("#3: card fields in step");
    expect(
      describeCardFields(3, [
        { field: WAITING_ON, kind: "clear", value: "" },
        { field: KIND, kind: "select", value: "Bug" },
      ]),
    ).toBe('#3: Waiting on cleared; Kind → "Bug"');
  });
});

describe("planCardFieldDrift: which cards the sweep fills", () => {
  const numberOf = (item: { id: string }) => Number(item.id.replace("PVTI_", ""));
  const wantedFor = (i: { number: number }) => ({ kind: "Bug", waitingOn: `n${i.number}` });

  it("plans nothing while neither field is on the board", () => {
    const out = planCardFieldDrift({
      items: [{ id: "PVTI_1" }],
      openIssues: [issue(1)],
      numberOf,
      wantedFor,
      present: { [IN_COLUMN_SINCE]: true },
    });
    expect(out).toEqual({ drift: [], deferred: 0 });
  });

  it("skips cards that agree, closed or unknown issues, and the day entirely", () => {
    const out = planCardFieldDrift({
      items: [{ id: "PVTI_1", kind: "Bug", waitingOn: "n1" }, { id: "PVTI_2" }, { id: "PVTI_9" }],
      openIssues: [issue(1), issue(2)],
      numberOf,
      wantedFor,
      present: ALL,
    });
    expect(out.drift.map((d) => d.number)).toEqual([2]);
    expect(out.drift[0]?.writes.map((w) => w.field)).toEqual([KIND, WAITING_ON]);
  });

  it("caps a first fill and counts what is left for the next sweep", () => {
    const n = CARD_FIELD_WRITES_PER_SWEEP + 5;
    const items = Array.from({ length: n }, (_, i) => ({ id: `PVTI_${i + 1}` }));
    const out = planCardFieldDrift({
      items,
      openIssues: items.map((_, i) => issue(i + 1)),
      numberOf,
      wantedFor,
      present: ALL,
    });
    expect(out.drift).toHaveLength(CARD_FIELD_WRITES_PER_SWEEP);
    expect(out.deferred).toBe(5);
    expect(out.drift[0]?.number).toBe(1);
  });
});

describe("the board reads carry the three fields", () => {
  it("cardFieldValues keeps only what GitHub set", () => {
    expect(
      cardFieldValues({
        kind: { name: "Bug" },
        waiting: { text: "Eric to decide" },
        since: { date: "2026-11-07" },
      }),
    ).toEqual({ kind: "Bug", waitingOn: "Eric to decide", since: "2026-11-07" });
    expect(cardFieldValues({ kind: null, waiting: null, since: null })).toEqual({});
  });

  it("the per-issue lookup asks for all three and returns them on the item", () => {
    let query = "";
    const items = readIssueItemsFromGh(
      { number: 9, html_url: URL(9) },
      {
        gh: (argv: string[]) => {
          query = argv.join(" ");
          return JSON.stringify({
            data: {
              projectOwner: { projectV2: { id: "PVT_1" } },
              repository: {
                issue: {
                  projectItems: {
                    nodes: [
                      {
                        id: "PVTI_9",
                        project: { number: 2 },
                        kind: { name: "Idea" },
                        waiting: { text: "Approval to build" },
                        since: { date: "2026-11-01" },
                      },
                    ],
                  },
                },
              },
            },
          });
        },
      },
    );
    for (const f of [KIND, WAITING_ON, IN_COLUMN_SINCE]) {
      expect(query).toContain(`fieldValueByName(name:"${f}")`);
    }
    expect(items[0]).toMatchObject({
      kind: "Idea",
      waitingOn: "Approval to build",
      since: "2026-11-01",
    });
    expect(
      boardItemsFromProjectItems({
        nodes: [{ id: "PVTI_9", project: { number: 2 }, kind: { name: "Bug" } }],
        projectNumber: 2,
        issueUrl: URL(9),
      })[0],
    ).toMatchObject({ kind: "Bug" });
  });

  it("the whole-board read asks for all three and returns them on each card", () => {
    let query = "";
    const { items } = readBoardItemsFromGh({
      log: () => undefined,
      gh: (argv: string[]) => {
        query = argv.join(" ");
        return JSON.stringify({
          data: {
            user: {
              projectV2: {
                items: {
                  totalCount: 1,
                  pageInfo: { hasNextPage: false },
                  nodes: [
                    {
                      id: "PVTI_1",
                      isArchived: false,
                      content: { __typename: "Issue", url: URL(1) },
                      kind: { name: "Bug" },
                      waiting: { text: "Eric to decide" },
                      since: { date: "2026-11-07" },
                    },
                  ],
                },
              },
            },
          },
        });
      },
    });
    expect(query).toContain(`fieldValueByName(name:"${IN_COLUMN_SINCE}")`);
    expect(items[0]).toMatchObject({
      kind: "Bug",
      waitingOn: "Eric to decide",
      since: "2026-11-07",
    });
  });
});

describe("mergeDrift and the sweep: field fills ride the same single sync per issue", () => {
  it("adds the fill to an entry that already moves, or makes its own", () => {
    const writes = [{ field: KIND, kind: "select" as const, value: "Bug" }];
    expect(
      mergeDrift([{ number: 1, have: "Backlog", want: "Ready" }], [], [{ number: 1, writes }]),
    ).toEqual([{ number: 1, have: "Backlog", want: "Ready", fields: writes }]);
    expect(mergeDrift([], [], [{ number: 2, writes }])).toEqual([{ number: 2, fields: writes }]);
  });

  const fields = [
    { id: "F_status", name: "Status", options: [] },
    { id: "F_kind", name: KIND, options: [] },
    { id: "F_wait", name: WAITING_ON },
  ];
  const board = (items: Record<string, unknown>[], list = fields) =>
    createBoardContext({
      readItems: () => ({ items: items as never, totalCount: items.length }),
      readFields: () => list as never,
      readProject: () => ({ id: "PVT_1", number: 2 }),
    });
  const run = (list = fields) => {
    const lines: string[] = [];
    const synced: number[] = [];
    const result = reconcileBoard({
      board: board(
        [
          { id: "PVTI_1", status: "Backlog", content: { type: "Issue", url: URL(1) } },
          {
            id: "PVTI_2",
            status: "Backlog",
            priority: "P2",
            syncedPriority: "P2",
            kind: "Improvement",
            waitingOn: "Approval to build",
            content: { type: "Issue", url: URL(2) },
          },
        ],
        list,
      ),
      readOpenIssues: () => [issue(1, ["bug"]), issue(2, ["plan"])],
      rateLimit: () => ({ remaining: 5000 }),
      ensureColumns: () => ["Backlog", "Ready"],
      readMode: () => ({ position: "normal", caps: { inFlightCap: 3, startedPlanCap: 4 } }),
      buildContext: () => ({}),
      horizons: {},
      // Priority is not under test: card 2 already carries its own.
      sync: (n) => {
        synced.push(n);
        return { status: "Backlog", fields: [] };
      },
      log: (l) => lines.push(l),
    });
    return { lines, synced, result };
  };

  it("syncs the card whose Kind and Waiting on are blank, not the one that agrees", () => {
    const { synced, lines, result } = run();
    expect(synced).toContain(1);
    expect(synced).not.toContain(2);
    expect(result.drift.find((d) => d.number === 1)?.fields?.map((w) => w.field)).toEqual([
      KIND,
      WAITING_ON,
    ]);
    expect(lines.join("\n")).toMatch(/1 card field fill\(s\)/);
    expect(lines.join("\n")).toMatch(/board fields not made yet: In this column since/);
  });

  it("before the setup dispatch it says what is missing and plans no field fill", () => {
    const { lines, result } = run([{ id: "F_status", name: "Status", options: [] }]);
    expect(lines.join("\n")).toContain(
      `board fields not made yet: ${KIND}, ${WAITING_ON}, ${IN_COLUMN_SINCE}`,
    );
    expect(result.drift.every((d) => !d.fields)).toBe(true);
  });
});

describe("the setup creates the three fields", () => {
  it("FIELDS carries each with the type the sync writes", () => {
    const by = Object.fromEntries(FIELDS.map((f) => [f.name, f.dataType]));
    expect(by[KIND]).toBe("SINGLE_SELECT");
    expect(by[WAITING_ON]).toBe("TEXT");
    expect(by[IN_COLUMN_SINCE]).toBe("DATE");
  });
});
