import { describe, expect, it } from "@rstest/core";
import {
  CONTRACTS,
  judgeAlertReach,
  judgeClaudeMd,
  judgeDeploys,
  judgeMachine,
  judgeStamp,
  reportActions,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness.mjs";

const NOW = Date.parse("2026-11-01T06:00:00Z");
const standby = { state: "stopped", config: { standbys: ["m1"] } };

const failing = {
  id: "bots-running",
  status: "fail",
  detail: "machine is stopped",
};

describe("fitness reporting", () => {
  const issue = {
    number: 7,
    title: "[fitness] bots-running",
    body: "machine is stopped",
    lastComment: "",
  };

  it("opens one issue for a new failure", () => {
    expect(reportActions([failing], [])).toEqual([{ kind: "open", result: failing }]);
  });

  it("stays quiet about a failure it already reported", () => {
    expect(reportActions([failing], [issue])).toEqual([]);
  });

  it("comments once when a standing failure changes", () => {
    const changed = { ...failing, detail: "no primary machine" };
    expect(reportActions([changed], [issue])).toEqual([
      { kind: "comment", number: 7, result: changed },
    ]);
    expect(
      reportActions([changed], [{ ...issue, lastComment: "it changed: no primary machine." }]),
    ).toEqual([]);
  });

  it("closes the issue when the check passes", () => {
    const ok = { id: "bots-running", status: "pass", detail: "started" };
    expect(reportActions([ok], [issue])).toEqual([{ kind: "close", number: 7, result: ok }]);
    expect(reportActions([ok], [])).toEqual([]);
  });

  it("does nothing on an unknown, which proves neither health nor failure", () => {
    const blind = {
      id: "bots-running",
      status: "unknown",
      detail: "cannot read Fly",
    };
    expect(reportActions([blind], [issue])).toEqual([]);
    expect(reportActions([blind], [])).toEqual([]);
  });
});

describe("fitness contracts", () => {
  it("fails a stopped machine, whatever a standby is doing", () => {
    expect(judgeMachine([standby, { state: "stopped", config: {} }]).status).toBe("fail");
    expect(judgeMachine([standby, { state: "started", config: {} }]).status).toBe("pass");
  });

  it("passes a stop a person marked", () => {
    const halted = {
      state: "stopped",
      config: { metadata: { "skynet-halt": "eric paused" } },
    };
    expect(judgeMachine([halted]).status).toBe("pass");
  });

  it("fails a stale or unreachable process that still reads as started", () => {
    const fresh = "2026-11-01T05:59:00Z";
    expect(judgeStamp({ lastControlsPollAt: fresh, bridge: "armed" }, NOW).status).toBe("pass");
    expect(
      judgeStamp({ lastControlsPollAt: "2026-11-01T05:00:00Z", bridge: "armed" }, NOW).status,
    ).toBe("fail");
    expect(judgeStamp({ lastControlsPollAt: fresh, bridge: "unreachable" }, NOW).status).toBe(
      "fail",
    );
    expect(judgeStamp({}, NOW).status).toBe("fail");
  });

  it("reads deploys from the newest finished run and ignores cancelled ones", () => {
    expect(judgeDeploys([{ conclusion: "cancelled" }, { conclusion: "success" }]).status).toBe(
      "pass",
    );
    const red = judgeDeploys([
      { conclusion: "failure" },
      { conclusion: "failure" },
      { conclusion: "success" },
    ]);
    expect(red.status).toBe("fail");
    expect(red.detail).toBe("2 failed in a row");
  });

  it("treats no evidence as unknown, never as a pass", () => {
    expect(judgeDeploys([{ conclusion: "cancelled" }]).status).toBe("unknown");
    expect(judgeClaudeMd(10, "no budget here").status).toBe("unknown");
  });

  it("fails an alarm that can reach nobody, the 10-18 to 11-01 gap", () => {
    const key = "SKYNET_ALERT_EMAIL_API_KEY";
    const from = "SKYNET_ALERT_EMAIL_FROM";
    expect(judgeAlertReach(["OTHER"]).status).toBe("fail");
    expect(judgeAlertReach([key]).detail).toBe(`alerts reach nobody: ${from} not set`);
    expect(judgeAlertReach([key, from]).status).toBe("pass");
  });

  it("holds the size budget in one place", () => {
    const source = "const CLAUDE_MD_BUDGET_BYTES = 100;";
    expect(judgeClaudeMd(100, source).status).toBe("pass");
    expect(judgeClaudeMd(101, source).status).toBe("fail");
  });

  it("makes every contract state an outcome, a corrector field, a budget and who hears it", () => {
    for (const contract of CONTRACTS) {
      expect(contract.mustBeTrue.length).toBeGreaterThan(10);
      expect(contract).toHaveProperty("corrector");
      expect(contract.budget.length).toBeGreaterThan(0);
      expect(contract.reaches.length).toBeGreaterThan(0);
      expect(typeof contract.probe).toBe("function");
    }
  });
});
