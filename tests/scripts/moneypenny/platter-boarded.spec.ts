import { describe, expect, it } from "@rstest/core";
import { readBoarded, recheckPullable } from "../../../scripts/moneypenny/admission.mjs";
import { claimFeedback, claimPlan } from "../../../scripts/moneypenny/index.mjs";
import { notPullableReason } from "../../../scripts/moneypenny/labels.mjs";
import { platterClosesByIssue } from "../../../scripts/moneypenny/pr-issues.mjs";

// #6191 — #5837's last item boarded held platter #5852, but the issue kept `ready`, so the retry
// sweep ran three more builds that found nothing to do. An issue an open platter CLOSES now waits
// on Eric's merge: no automated puller claims it. Every read is injected: no `gh`, no network.

const platter = (number: number, body: string, ref = "platter/2026-10-19") => ({
  number,
  body,
  head: { ref },
});

const ready = (number: number, lane = "feedback") => ({
  number,
  state: "open",
  body: "",
  labels: [{ name: lane }, { name: "ready" }],
});

describe("platterClosesByIssue — what the open platters will close", () => {
  it("maps each issue a platter's Summary closes to that platter", () => {
    const body =
      "## Summary\n- Closes #5837 — boarded as item 5.\n- Part of #4535 — boarded as item 2.";
    expect(platterClosesByIssue([platter(5852, body)])).toEqual(new Map([[5837, 5852]]));
  });

  it("counts only platters: an ordinary PR that closes an issue is still a build in flight", () => {
    expect(platterClosesByIssue([platter(10, "Closes #5837", "feedback/5837")])).toEqual(new Map());
  });

  it("does not count a `Part of` bullet — that issue still has work a puller may take", () => {
    expect(platterClosesByIssue([platter(5852, "- Part of #4535")])).toEqual(new Map());
  });
});

describe("the pull rule refuses an issue a held platter closes", () => {
  const boardedOn = new Map([[5837, 5852]]);

  it("names the platter whose merge closes it", () => {
    expect(notPullableReason(ready(5837), { boardedOn })).toBe(
      "#5837 is boarded on held platter #5852 — nothing is left to build; the platter's merge closes it",
    );
  });

  it("leaves every other issue, and a caller that passes no map, as before", () => {
    expect(notPullableReason(ready(6000), { boardedOn })).toBeNull();
    expect(notPullableReason(ready(5837))).toBeNull();
  });
});

describe("recheckPullable / readBoarded — the claim-time read", () => {
  it("refuses a boarded issue on the fresh re-read", () => {
    const row = ready(5837);
    expect(
      recheckPullable(
        row,
        () => row,
        () => new Map([[5837, 5852]]),
      ),
    ).toContain("held platter #5852");
  });

  it("never reads the platters for an issue the labels already refuse", () => {
    const parked = { ...ready(5837), labels: [{ name: "ready" }, { name: "needs-eric" }] };
    const boarded = () => {
      throw new Error("read the platters");
    };
    expect(recheckPullable(parked, () => parked, boarded)).toContain("parked by needs-eric");
  });

  it("fails open with a warning when the open PRs cannot be read", () => {
    const lines: string[] = [];
    const map = readBoarded(
      () => {
        throw new Error("HTTP 502");
      },
      (l) => lines.push(l),
    );
    expect(map).toEqual(new Map());
    expect(lines[0]).toContain("::warning::the open platters could not be read");
  });
});

describe("both claim lanes refuse before the gate or the lease", () => {
  const untouched = () => {
    throw new Error("the gate was asked");
  };
  const deps = {
    readBoarded: () => new Map([[5837, 5852]]),
    readMode: untouched,
  };

  it("the feedback lane", () => {
    const issue = ready(5837);
    const ctx = { payload: { action: "labeled", label: { name: "ready" }, issue } };
    const r = claimFeedback(ctx, 0, "abc", { ...deps, readIssue: () => issue });
    expect(r).toEqual({ claimed: false, reason: expect.stringContaining("held platter #5852") });
  });

  it("the plan lane", () => {
    const issue = ready(5837, "plan");
    const ctx = { payload: { action: "labeled", label: { name: "ready" }, issue } };
    const r = claimPlan(ctx, 0, "abc", deps);
    expect(r).toEqual({ claimed: false, reason: expect.stringContaining("held platter #5852") });
  });
});
