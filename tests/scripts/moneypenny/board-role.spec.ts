import { describe, expect, it } from "@rstest/core";
import fc from "fast-check";
import { cardFieldValues, ROLE } from "../../../scripts/moneypenny/projects.mjs";
import { planCardFields, wantedCardFields } from "../../../scripts/moneypenny/projects-fields.mjs";
import {
  ensureRoleField,
  reconcileBoard,
} from "../../../scripts/moneypenny/projects-reconcile.mjs";
import {
  liveRole,
  readSeatRegistry,
  roleFieldOptions,
  roleFieldUpdate,
  roleOptionNames,
  wantedRoleOf,
} from "../../../scripts/moneypenny/projects-role.mjs";
import {
  createBoardContext,
  createSingleSelectField,
  readBoardItemsFromGh,
  wantedLiveFields,
} from "../../../scripts/moneypenny/projects-sync.mjs";

// #6886 slice 1b — THE BOARD'S ROLE FIELD. EARS: WHEN projects-sync / projects-reconcile touch an
// open issue, THEY SHALL write a single-select Role derived from the seat registry
// (docs/agents/seats.json) and the issue's labels, the same IO pattern as Priority. A role is a
// seat, not a file: the registry is the one source, read here for real so a registry edit that
// breaks a lane fails this spec, not the board.

const seats = readSeatRegistry();
const labels = (...names: string[]) => names.map((name) => ({ name }));
const issue = (number: number, names: string[] = []) => ({
  number,
  state: "open",
  labels: labels(...names),
});
const URL = (n: number) => `https://github.com/ejclark/skynet-capital/issues/${n}`;

describe("wantedRoleOf: the seat whose queue the card sits in", () => {
  const role = (...names: string[]) => wantedRoleOf({ labels: names }, seats);

  it("routes each lane's label to its seat, the split the retry sweep makes", () => {
    expect(role("plan")).toBe("Plan builds");
    expect(role("feedback")).toBe("Feedback builds");
    expect(role("bug")).toBe("Feedback builds");
    // Any ready issue that is not a plan goes to the feedback lane (index.mjs `lane`).
    expect(role("enhancement", "ready")).toBe("Feedback builds");
    expect(role("bottleneck")).toBe("Bottleneck research");
    expect(role("handoff")).toBe("Design builds");
    expect(role("needs-design")).toBe("Design builds");
    expect(role("event-research")).toBe("Event research");
  });

  it("the first seat in roleOrder wins when labels match more than one", () => {
    expect(role("plan", "ready")).toBe("Plan builds");
    expect(role("plan", "needs-session")).toBe("Live sessions");
    expect(role("feedback", "needs-session")).toBe("Live sessions");
    // A bottleneck the research routed to a build is the build lane's now.
    expect(role("bottleneck", "feedback")).toBe("Feedback builds");
  });

  it("who acts first is not the Role: a needs-eric plan stays in Plan builds", () => {
    expect(role("plan", "needs-eric")).toBe("Plan builds");
  });

  it("a card no seat pulls gets no Role (the board's No Role lane)", () => {
    expect(role("enhancement")).toBe("");
    expect(role()).toBe("");
    expect(wantedRoleOf(issue(1, ["idea"]), seats)).toBe("");
  });

  it("any label snapshot lands on one of the field's options, or none", () => {
    const pool = [
      "plan",
      "feedback",
      "bug",
      "ready",
      "bottleneck",
      "needs-session",
      "needs-design",
      "needs-eric",
      "enhancement",
      "P0",
    ];
    const options = roleOptionNames(seats);
    fc.assert(
      fc.property(fc.subarray(pool), (names) => {
        const r = wantedRoleOf({ labels: names }, seats);
        expect(r === "" || options.includes(r)).toBe(true);
      }),
    );
  });

  it("the options are the registry's roles, in roleOrder", () => {
    const byId = new Map((seats.seats ?? []).map((s) => [s.id, s.role]));
    expect(roleOptionNames(seats)).toEqual((seats.roleOrder ?? []).map((id) => byId.get(id)));
    expect(roleFieldOptions(seats).every((o) => o.description.length > 0)).toBe(true);
  });
});

describe("liveRole: a seat the board has no option for yet is left alone, never an error", () => {
  it("passes a live option and a clear; drops an option the field lacks", () => {
    expect(liveRole("Plan builds", ["Plan builds"])).toBe("Plan builds");
    expect(liveRole("", [])).toBe("");
    expect(liveRole("Plan builds", ["Feedback builds"])).toBeUndefined();
    expect(liveRole(undefined, ["Plan builds"])).toBeUndefined();
  });

  it("wantedLiveFields plans Role only against the live field", () => {
    const card = { status: "Backlog" as const, decisionCalloutMissing: false };
    const plan = issue(5, ["plan"]);
    const withOption = { options: [{ name: "Plan builds" }] };
    expect(wantedLiveFields(plan, card, withOption).role).toBe("Plan builds");
    expect("role" in wantedLiveFields(plan, card, { options: [] })).toBe(false);
    expect("role" in wantedLiveFields(plan, card, undefined)).toBe(false);
  });

  it("wantedCardFields leaves Role out unless it is handed the registry", () => {
    const card = { status: "Backlog" as const };
    expect("role" in wantedCardFields(issue(1, ["plan"]), card)).toBe(false);
    expect(wantedCardFields(issue(1, ["plan"]), card, { seats }).role).toBe("Plan builds");
  });
});

describe("planCardFields: Role is written, cleared, or left alone", () => {
  const present = { [ROLE]: true };
  const plan = (have: Record<string, string>, role?: string) =>
    planCardFields({ have, wanted: role === undefined ? {} : { role }, present, today: "" });

  it("selects the seat when it differs, and writes nothing when it agrees", () => {
    expect(plan({}, "Plan builds")).toEqual([
      { field: ROLE, kind: "select", value: "Plan builds" },
    ]);
    expect(plan({ role: "Plan builds" }, "Plan builds")).toEqual([]);
  });

  it("clears a card no seat pulls any more, and only when it was set", () => {
    expect(plan({ role: "Plan builds" }, "")).toEqual([{ field: ROLE, kind: "clear", value: "" }]);
    expect(plan({}, "")).toEqual([]);
  });

  it("leaves Role alone when the board has no field, or nothing was planned", () => {
    expect(planCardFields({ have: {}, wanted: { role: "Plan builds" }, present: {} })).toEqual([]);
    expect(plan({ role: "Plan builds" })).toEqual([]);
  });
});

describe("roleFieldUpdate: the field's options follow the registry, ids kept, none removed", () => {
  const live = (
    ...rows: [string, string, string?][]
  ): { id: string; name: string; color: string; description: string }[] =>
    rows.map(([id, name, description]) => ({
      id,
      name,
      color: "BLUE",
      description: description ?? "",
    }));
  const reg = {
    roleOrder: ["a", "b"],
    seats: [
      { id: "a", role: "Plan builds", pulls: ["plan"], job: "Builds plans" },
      { id: "b", role: "Feedback builds", pulls: ["feedback"], job: "Builds feedback" },
      { id: "c", job: "Pulls nothing" },
    ],
  };

  it("is null when every seat's option is there and described", () => {
    const current = live(
      ["O1", "Plan builds", "Builds plans"],
      ["O2", "Feedback builds", "Builds feedback"],
    );
    expect(roleFieldUpdate(current, reg)).toBeNull();
  });

  it("adds a new seat's option and keeps the others' ids and colours", () => {
    const out = roleFieldUpdate(live(["O1", "Plan builds", "Builds plans"]), reg);
    expect(out).toEqual([
      { id: "O1", name: "Plan builds", color: "BLUE", description: "Builds plans" },
      { name: "Feedback builds", color: "GRAY", description: "Builds feedback" },
    ]);
  });

  it("re-describes a seat whose job changed, and keeps an option no seat names", () => {
    const out = roleFieldUpdate(
      live(
        ["O1", "Plan builds", "old"],
        ["O2", "Feedback builds", "Builds feedback"],
        ["O9", "Retired"],
      ),
      reg,
    );
    expect(out?.map((o) => `${o.id}:${o.name}:${o.description}`)).toEqual([
      "O1:Plan builds:Builds plans",
      "O2:Feedback builds:Builds feedback",
      "O9:Retired:",
    ]);
  });
});

describe("ensureRoleField: the sweep makes the field and keeps it in step", () => {
  const reg = {
    roleOrder: ["a"],
    seats: [{ id: "a", role: "Plan builds", pulls: ["plan"], job: "Builds plans" }],
  };
  const boardWith = (fields: unknown[][]) => {
    let reads = 0;
    return createBoardContext({
      readItems: () => ({ items: [], totalCount: 0 }),
      readFields: () => (fields[Math.min(reads++, fields.length - 1)] ?? []) as never,
      readProject: () => ({ id: "PVT_1", number: 2 }),
    });
  };
  const roleField = {
    id: "F_role",
    name: ROLE,
    options: [{ id: "O1", name: "Plan builds", description: "Builds plans" }],
  };

  it("creates a missing field with every seat's option, then reads it back", () => {
    const created: unknown[] = [];
    const lines: string[] = [];
    const field = ensureRoleField({
      board: boardWith([[], [roleField]]),
      seats: reg,
      create: (input) => created.push(input),
      write: () => {
        throw new Error("no update for a missing field");
      },
      log: (l) => lines.push(l),
    });
    expect(created).toEqual([
      {
        projectId: "PVT_1",
        name: ROLE,
        options: [{ name: "Plan builds", color: "GRAY", description: "Builds plans" }],
      },
    ]);
    expect(field?.id).toBe("F_role");
    expect(lines.join("\n")).toContain("Role field: created with (Plan builds)");
  });

  it("writes nothing when the field already matches", () => {
    const field = ensureRoleField({
      board: boardWith([[roleField]]),
      seats: reg,
      create: () => {
        throw new Error("no create");
      },
      write: () => {
        throw new Error("no write");
      },
      log: () => undefined,
    });
    expect(field).toEqual(roleField);
  });

  it("updates a drifted option list in place, keeping ids", () => {
    const writes: [string, unknown][] = [];
    ensureRoleField({
      board: boardWith([
        [{ ...roleField, options: [{ id: "O1", name: "Plan builds", description: "old" }] }],
        [roleField],
      ]),
      seats: reg,
      write: (id, options) => writes.push([id, options]),
      log: () => undefined,
    });
    expect(writes).toEqual([
      ["F_role", [{ id: "O1", name: "Plan builds", color: "GRAY", description: "Builds plans" }]],
    ]);
  });

  it("a dry run says what it would do and writes nothing", () => {
    const lines: string[] = [];
    ensureRoleField({
      board: boardWith([[]]),
      seats: reg,
      dryRun: true,
      create: () => {
        throw new Error("dry run created");
      },
      log: (l) => lines.push(l),
    });
    expect(lines).toEqual(["Role field: would be created with (Plan builds)"]);
  });

  it("fails open on a refused write, but an exhausted quota still stops the sweep", () => {
    const lines: string[] = [];
    const field = ensureRoleField({
      board: boardWith([[]]),
      seats: reg,
      create: () => {
        throw new Error("Something went wrong");
      },
      log: (l) => lines.push(l),
    });
    expect(field).toBeUndefined();
    expect(lines.join("\n")).toContain("::warning title=Role field not written::");
    expect(() =>
      ensureRoleField({
        board: boardWith([[]]),
        seats: reg,
        create: () => {
          throw new Error("GraphQL: API rate limit exceeded for user ID 1");
        },
        log: () => undefined,
      }),
    ).toThrow(/rate limit/);
  });

  it("createSingleSelectField sends one createProjectV2Field mutation and returns the field", () => {
    let sent = "";
    const field = createSingleSelectField(
      {
        projectId: "PVT_1",
        name: ROLE,
        options: [{ name: "Plan builds", color: "GRAY", description: "x" }],
      },
      {
        gh: (_argv, input) => {
          sent = input;
          return JSON.stringify({
            data: { createProjectV2Field: { projectV2Field: { id: "F_role", name: ROLE } } },
          });
        },
      },
    );
    expect(field.id).toBe("F_role");
    const body = JSON.parse(sent);
    expect(body.query).toContain("createProjectV2Field");
    expect(body.query).toContain("SINGLE_SELECT");
    expect(body.variables).toEqual({
      projectId: "PVT_1",
      name: ROLE,
      options: [{ name: "Plan builds", color: "GRAY", description: "x" }],
    });
  });
});

describe("the sweep fills Role beside Kind and Waiting on", () => {
  const run = (roleOptions: string[]) => {
    const synced: number[] = [];
    const lines: string[] = [];
    const board = createBoardContext({
      readItems: () => ({
        items: [
          // Kind and Waiting on already agree, so only Role can put a card in the drift.
          {
            id: "PVTI_1",
            status: "Backlog",
            priority: "P2",
            syncedPriority: "P2",
            kind: "Improvement",
            waitingOn: "Approval to build",
            content: { type: "Issue", url: URL(1) },
          },
          {
            id: "PVTI_2",
            status: "Backlog",
            priority: "P2",
            syncedPriority: "P2",
            kind: "Improvement",
            waitingOn: "Approval to build",
            role: "Plan builds",
            content: { type: "Issue", url: URL(2) },
          },
        ] as never,
        totalCount: 2,
      }),
      readFields: () =>
        [
          { id: "F_status", name: "Status", options: [] },
          {
            id: "F_role",
            name: ROLE,
            options: roleOptions.map((name, i) => ({ id: `O${i}`, name })),
          },
        ] as never,
      readProject: () => ({ id: "PVT_1", number: 2 }),
    });
    const result = reconcileBoard({
      board,
      readOpenIssues: () => [issue(1, ["plan"]), issue(2, ["plan"])],
      rateLimit: () => ({ remaining: 5000 }),
      ensureColumns: () => ["Backlog", "Ready"],
      readMode: () => ({ position: "normal", caps: { inFlightCap: 3, startedPlanCap: 4 } }),
      buildContext: () => ({}),
      sync: (n) => {
        synced.push(n);
        return { status: "Backlog" };
      },
      log: (l) => lines.push(l),
    });
    return { synced, result, lines };
  };

  it("syncs the card with no Role, not the one already in its seat's lane", () => {
    const { synced, result } = run(["Plan builds"]);
    expect(synced).toEqual([1]);
    expect(result.drift.find((d) => d.number === 1)?.fields).toEqual([
      { field: ROLE, kind: "select", value: "Plan builds" },
    ]);
  });

  it("leaves Role alone while the field lacks the seat's option", () => {
    const { synced } = run([]);
    expect(synced).toEqual([]);
  });
});

describe("the board reads carry Role", () => {
  it("cardFieldValues keeps Role only when GitHub set it", () => {
    expect(cardFieldValues({ role: { name: "Plan builds" } })).toEqual({ role: "Plan builds" });
    expect(cardFieldValues({ role: null })).toEqual({});
  });

  it("the whole-board read asks for Role and returns it on each card", () => {
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
                      role: { name: "Plan builds" },
                    },
                  ],
                },
              },
            },
          },
        });
      },
    });
    expect(query).toContain(`fieldValueByName(name:"${ROLE}")`);
    expect(items[0]).toMatchObject({ role: "Plan builds" });
  });
});
