import {
  executePlanClose,
  gatherPlanCloseDeps,
  HELD_MARKER,
  type PlanIssue,
  planCloseVerdict,
  routePlanClose,
  uncheckedCriteria,
} from "../../../scripts/moneypenny/plan-close.mjs";

// CLOSE A FINISHED PLAN (#4393 slice 5, criterion 7). #3651 sat open at 8/8 closed sub-issues on
// 2026-10-05. The sweep closes a plan once every sub-issue is done — unless something on the issue
// says more remains, in which case it says so once and stays quiet. Nothing here touches GitHub:
// the verdict and the routing are pure, and the one read and the writes are injected.

const plan = (over: Partial<PlanIssue> = {}): PlanIssue => ({
  number: 3651,
  title: "Closed retro loop",
  body: "### Acceptance criteria\n- WHEN a probe closes, the system SHALL write a retro.\n",
  labels: [{ name: "enhancement" }, { name: "plan" }],
  sub_issues_summary: { total: 8, completed: 8 },
  ...over,
});

const only = <T>(xs: readonly T[]): T => {
  if (xs.length !== 1) throw new Error(`expected exactly one, got ${xs.length}`);
  return xs[0] as T;
};

describe("plan close — what the verdict reads", () => {
  it("closes a plan whose every sub-issue is closed and nothing says more remains", () => {
    expect(planCloseVerdict(plan()).action).toBe("close");
  });

  it.each([
    ["not a plan", plan({ labels: [{ name: "feedback" }] })],
    ["no sub-issues to count", plan({ sub_issues_summary: { total: 0, completed: 0 } })],
    ["a sub-issue still open", plan({ sub_issues_summary: { total: 8, completed: 7 } })],
    ["a build is live on it", plan({ labels: ["plan", "in-progress"] })],
  ])("skips silently: %s", (_why, issue) => {
    expect(planCloseVerdict(issue).action).toBe("skip");
  });

  it.each([
    ["next-slice", ["plan", "next-slice"]],
    ["needs-session", ["plan", "needs-session"]],
    ["needs-eric", ["plan", "needs-eric"]],
  ])("holds a finished plan that carries %s", (label, labels) => {
    const verdict = planCloseVerdict(plan({ labels }));

    expect(verdict.action).toBe("hold");
    expect([verdict.why].flat().join(" ")).toContain(label);
  });

  it("holds a finished plan whose body has an unchecked criterion, and names it", () => {
    const verdict = planCloseVerdict(
      plan({ body: "- [x] first\n- [ ] the thing nobody ticked\n" }),
    );

    expect(verdict.action).toBe("hold");
    expect(verdict).toMatchObject({ unchecked: ["the thing nobody ticked"] });
  });

  it("does not mistake task-list syntax inside a code fence for a criterion", () => {
    const body = "Example:\n```md\n- [ ] shown as syntax\n```\n";

    expect(uncheckedCriteria(body)).toEqual([]);
    expect(planCloseVerdict(plan({ body })).action).toBe("close");
  });
});

describe("plan close — what the sweep writes", () => {
  it("closes a finished plan with a receipt, signed", () => {
    const intent = only(routePlanClose({ openPlans: [plan()] }));

    expect(intent.kind).toBe("close-plan");
    expect(intent.issueNumber).toBe(3651);
    expect(intent.body).toContain("— Moneypenny");
  });

  it("tells a reopener the one thing that keeps the plan open", () => {
    expect(only(routePlanClose({ openPlans: [plan()] })).body).toContain("add `next-slice`");
  });

  it("tells a held plan why, once — and not again once the marker is on the thread", () => {
    const labels = ["plan", "next-slice"];

    const first = only(routePlanClose({ openPlans: [plan({ labels })] }));
    expect(first.kind).toBe("hold-plan-close");
    expect(first.body).toContain(HELD_MARKER);
    expect(first.body).toContain("next-slice");

    expect(routePlanClose({ openPlans: [plan({ labels, heldNoted: true })] })).toEqual([]);
  });

  it("writes nothing for a plan with open sub-issues", () => {
    expect(
      routePlanClose({ openPlans: [plan({ sub_issues_summary: { total: 8, completed: 3 } })] }),
    ).toEqual([]);
  });

  it("acts on at most the cap per tick, lowest number first", () => {
    const openPlans = [900, 300, 600, 100].map((number) => plan({ number }));

    const intents = routePlanClose({ openPlans, planCloseCap: 2 });

    expect(intents.map((i) => i.issueNumber)).toEqual([100, 300]);
  });

  it("closes as completed, and the comment is the close's own", () => {
    const calls: string[][] = [];
    const intent = only(routePlanClose({ openPlans: [plan()] }));

    executePlanClose(intent, {
      run: (_cmd, args) => {
        calls.push(args);
        return "";
      },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual(
      expect.arrayContaining(["issue", "close", "3651", "--reason", "completed", "--comment"]),
    );
  });

  it("comments on a held plan without closing it", () => {
    const calls: string[][] = [];
    const intent = only(routePlanClose({ openPlans: [plan({ labels: ["plan", "next-slice"] })] }));

    executePlanClose(intent, {
      run: (_cmd, args) => {
        calls.push(args);
        return "";
      },
    });

    expect(calls.map((a) => a[1])).toEqual(["comment"]);
  });
});

describe("plan close — the one read", () => {
  const held = plan({ number: 4056, labels: ["plan", "next-slice"] });
  const bot = (body: string) => ({ user: { login: "skynet-envoy[bot]" }, body });

  it("reads comments only for a held plan — a closable or open one costs nothing", () => {
    const asked: number[] = [];

    gatherPlanCloseDeps(
      [plan(), held, plan({ number: 5, sub_issues_summary: { total: 4, completed: 1 } })],
      {
        readComments: (n) => {
          asked.push(n);
          return [];
        },
      },
    );

    expect(asked).toEqual([4056]);
  });

  it("remembers a bot's held comment", () => {
    const [issue] = gatherPlanCloseDeps([held], { readComments: () => [bot(HELD_MARKER)] });

    expect(issue?.heldNoted).toBe(true);
  });

  it("ignores the marker from an account that is not this repo's bot", () => {
    const stranger = { user: { login: "someone-else" }, body: HELD_MARKER };

    const [issue] = gatherPlanCloseDeps([held], { readComments: () => [stranger] });

    expect(issue?.heldNoted).toBe(false);
  });

  it("treats an unreadable thread as already told rather than risk a second comment", () => {
    const [issue] = gatherPlanCloseDeps([held], {
      readComments: () => {
        throw new Error("502");
      },
    });

    expect(issue?.heldNoted).toBe(true);
  });
});
