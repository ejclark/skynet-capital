import { describe, expect, it } from "@rstest/core";
import {
  blockedBy,
  blocksPhrase,
  greenSince,
  HELD_GREEN_HOURS,
  HELD_OPEN_HOURS,
  heldDue,
  isHeldPr,
  readHeldFacts,
} from "../../scripts/held-pr.mjs";

// #7317: a held PR's ask is timed from when both required checks went green, not from when it
// opened — the measured wait (37.6 h median, 2026-11-10) was the ask arriving late, not Eric.
const NOW = Date.parse("2026-11-23T20:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 36e5).toISOString();
const held = (over: Record<string, unknown> = {}) => ({
  number: 7030,
  title: "feat(x): a thing (#6871 slice 2)",
  body: "- Part of #6871",
  state: "open",
  labels: [{ name: "hold-merge" }],
  created_at: hoursAgo(5),
  head: { ref: "feat/6871-thing", sha: "abc" },
  ...over,
});
const run = (name: string, conclusion: string | null, h: number, status = "completed") => ({
  name,
  status,
  conclusion,
  completed_at: hoursAgo(h),
});

describe("isHeldPr", () => {
  it("is open, not a draft, and labelled hold-merge or built from a platter branch", () => {
    expect(isHeldPr(held())).toBe(true);
    expect(isHeldPr(held({ labels: [], head: { ref: "platter/2026-11" } }))).toBe(true);
    expect(isHeldPr(held({ labels: [] }))).toBe(false);
    expect(isHeldPr(held({ draft: true }))).toBe(false);
    expect(isHeldPr(held({ state: "closed" }))).toBe(false);
  });
});

describe("greenSince: when the head's last required check went green", () => {
  it("is the later of the two required checks' finish times", () => {
    const at = greenSince([run("verify", "success", 6), run("integration tests", "success", 5)]);
    expect(at).toBe(NOW - 5 * 36e5);
  });

  it("counts a skipped required check as passing, as branch protection does", () => {
    expect(greenSince([run("verify", "success", 2), run("integration tests", "skipped", 2)])).toBe(
      NOW - 2 * 36e5,
    );
  });

  it("is null while one is red, still running, or never reported", () => {
    expect(greenSince([run("verify", "failure", 2), run("integration tests", "success", 2)])).toBe(
      null,
    );
    expect(
      greenSince([run("verify", null, 2, "in_progress"), run("integration tests", "success", 2)]),
    ).toBe(null);
    expect(greenSince([run("verify", "success", 2)])).toBe(null);
  });
});

describe("heldDue: which clock makes it his", () => {
  it(`asks once green for ${HELD_GREEN_HOURS}h, long before the old ${HELD_OPEN_HOURS}h-open timer`, () => {
    expect(heldDue(held(), { greenAt: NOW - 3.9 * 36e5, now: NOW })).toBeNull();
    expect(heldDue(held(), { greenAt: NOW - 4 * 36e5, now: NOW })).toEqual({
      green: true,
      hours: 4,
    });
  });

  it("keeps the 12h-open backstop for a PR not known green, and says it is not green", () => {
    const old = held({ created_at: hoursAgo(13) });
    expect(heldDue(old, { greenAt: null, now: NOW })).toEqual({ green: false, hours: 13 });
    expect(heldDue(old, { greenAt: undefined, now: NOW })).toMatchObject({ green: false });
  });

  it("stays due through a push that restarts a long-held PR's checks, on the green clock", () => {
    const old = held({ created_at: hoursAgo(30) });
    expect(heldDue(old, { greenAt: NOW - 0.5 * 36e5, now: NOW })).toEqual({
      green: true,
      hours: 0.5,
    });
  });

  it("is never due for a PR that is not held", () => {
    expect(heldDue(held({ labels: [] }), { greenAt: NOW - 40 * 36e5, now: NOW })).toBeNull();
  });
});

describe("blockedBy: what a held PR holds up", () => {
  const issues: Record<number, unknown> = {
    6871: { title: "plan", state: "open", labels: [{ name: "plan" }] },
    7034: { title: "slice", state: "open", labels: [] },
    7000: { title: "done", state: "closed", labels: [] },
  };

  it("names every open issue the PR names, plans flagged, closed ones and failed reads dropped", () => {
    const pr = held({ body: "- Closes #7034\n- Part of #6871\n- refs #7000\n- refs #7999" });
    const read = (n: number) => {
      if (!(n in issues)) throw new Error("404");
      return issues[n] as never;
    };
    expect(blockedBy(pr, read)).toEqual([
      { number: 6871, title: "plan", plan: true },
      { number: 7034, title: "slice", plan: false },
    ]);
  });

  it("phrases them plans first", () => {
    expect(
      blocksPhrase([
        { number: 7034, title: "", plan: false },
        { number: 6871, title: "", plan: true },
      ]),
    ).toBe("plan #6871 and #7034");
    expect(blocksPhrase([])).toBe("");
  });
});

describe("readHeldFacts: the gather's reads", () => {
  it("reads check runs for held PRs only, and what a PR blocks only once it is due", () => {
    const paths: string[] = [];
    const read = (path: string) => {
      paths.push(path);
      if (path.startsWith("commits/abc/"))
        return {
          check_runs: [run("verify", "success", 5), run("integration tests", "success", 5)],
        };
      if (path.startsWith("commits/def/"))
        return {
          check_runs: [run("verify", "success", 1), run("integration tests", "success", 1)],
        };
      if (path === "issues/6871") return { title: "plan", state: "open", labels: ["plan"] };
      return null;
    };
    const facts = readHeldFacts(
      [
        held(),
        held({ number: 7211, head: { ref: "fix/y", sha: "def" }, body: "Part of #7286" }),
        held({ number: 7300, labels: [] }),
      ],
      { read, now: NOW },
    );
    expect([...facts.keys()]).toEqual([7030, 7211]);
    expect(facts.get(7030)).toEqual({
      greenAt: NOW - 5 * 36e5,
      blocks: [{ number: 6871, title: "plan", plan: true }],
    });
    expect(facts.get(7211)?.blocks).toEqual([]);
    expect(paths).not.toContain("issues/7286");
  });

  it("leaves the green time unknown when the check-runs read fails, and reads nothing without a reader", () => {
    const facts = readHeldFacts([held()], {
      read: () => {
        throw new Error("502");
      },
      now: NOW,
    });
    expect(facts.get(7030)?.greenAt).toBeUndefined();
    expect(readHeldFacts([held()], { read: null, now: NOW }).size).toBe(0);
  });
});
