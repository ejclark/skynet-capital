import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  botsStep,
  calls,
  deploysIssue,
  dispatchLandedWorld,
  fixture,
  iso,
  landed,
  lines,
  MIN,
  results,
  run,
  runsWindow,
} from "./fitness-harness";

// The reads half of the wiring tests from fitness.spec.ts (#6470): what fly and gh are asked, what
// the script does with a bad reply or a hung read, and how main-deploys is judged from the runs it
// reads, driven through the real entrypoint against stub binaries that record their arguments
// (tests/scripts/fitness-harness.ts). The reports half is fitness-wiring-reports.spec.ts. Grading
// with scripts/fitness-audit.mjs: swap `--spec` to this file.
const _WORKFLOW = resolve(".github/workflows/bots-catchup.yml");

describe("fitness wiring", () => {
  it("reads every clock contract from the real things, with the arguments the apps need", () => {
    const stub = fixture();
    const res = run(stub, ["--json"]);
    expect(res.status).toBe(0);
    const r = results(res);
    expect(r("bots-running")).toMatchObject({ status: "pass", detail: "started" });
    expect(r("bots-responsive").status).toBe("pass");
    expect(r("main-deploys")).toMatchObject({ status: "pass", detail: "both apps current" });
    expect(r("alerts-reach-owner").status).toBe("pass");
    expect(r("owner-assignment-path").status).toBe("pass");
    expect(r("memory-has-history")).toMatchObject({ status: "not-here", home: "session" });
    const fly = calls(stub, "fly");
    expect(fly).toContain("machine list -a skynet-capital-bots --json");
    expect(fly).toContain(
      "machine exec m1 cat /data/health.json -a skynet-capital-bots --timeout 30",
    );
    expect(fly).toContain("secrets list -a skynet-capital --json");
    expect(fly).not.toContain("exec standby1");
    expect(calls(stub, "gh")).toContain("api repos/{owner}/{repo}/commits/main");
    expect(calls(stub, "gh")).toContain("api repos/{owner}/{repo}/assignees/ejclark");
    expect(calls(stub, "gh")).toMatch(
      /api graphql -F owner=\{owner\} -F name=\{repo\} -F who=ejclark -F since=\d{4}-\d\d-\d\dT/,
    );
  });

  it("runs only the session contract in a session, and reads nothing from Fly there", () => {
    const versioned = run(fixture(), ["--json"], { GITHUB_ACTIONS: "" });
    expect(versioned.status).toBe(0);
    const r = results(versioned);
    expect(r("memory-has-history")).toMatchObject({
      status: "pass",
      detail: "1 folder(s) versioned",
    });
    for (const id of [
      "bots-running",
      "bots-responsive",
      "main-deploys",
      "alerts-reach-owner",
      "owner-assignment-path",
    ]) {
      expect(r(id).status).toBe("not-here");
      expect(r(id).detail).toBe("runs in the clock, and this is the session");
    }
    const bare = fixture({ memoryHistory: false });
    const red = run(bare, ["--json"], { GITHUB_ACTIONS: "" });
    expect(red.status).toBe(1);
    expect(results(red)("memory-has-history").status).toBe("fail");
    expect(calls(bare, "fly")).toBe("");
    const none = run(fixture({ memoryHistory: "none" }), ["--json"], { GITHUB_ACTIONS: "" });
    expect(results(none)("memory-has-history").status).toBe("unknown");
  });

  it("lets a session read the clock's contracts with --here, without writing", () => {
    const stub = fixture({ machine: "stopped" });
    const res = run(stub, ["--here", "clock", "--report"], { GITHUB_ACTIONS: "" });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      "fitness: would open [fitness] bots-running (not on CI, so nothing is written)",
    );
    expect(calls(stub, "gh")).toContain(
      "issue list --state open --label bug --json number,title,body,comments,createdAt,assignees --limit 200",
    );
    expect(calls(stub, "gh")).not.toContain("issue create");
  });

  it("keeps reporting the others when one reply is malformed, and exits red for the crash", () => {
    const stub = fixture({ machines: '{"not":"a list"}' });
    const res = run(stub, ["--json"]);
    expect(res.status).toBe(1);
    const r = results(res);
    expect(r("bots-running")).toMatchObject({ status: "unknown", detail: "the probe crashed" });
    expect(r("main-deploys").status).toBe("pass");
    expect(r("alerts-reach-owner").status).toBe("pass");
    expect(res.stdout).toContain("::warning::fitness: bots-running probe crashed");
    // A blip is read twice before it counts: two contracts list machines, each twice. A third,
    // decision-cycle, lists once more while the market is open, and this spec runs at any hour.
    const listed = lines(calls(stub, "fly"), "machine list");
    expect(listed).toBeGreaterThanOrEqual(4);
    expect(listed).toBeLessThanOrEqual(5);
    // A crash on the first read is still a crash when the retry reads clean: the run stays red
    // so the malformed reply is seen, while the contract itself reports what the retry found.
    const once = fixture();
    writeFileSync(join(once, "machines-first"), '{"not":"a list"}');
    const recovered = run(once, ["--json"]);
    expect(recovered.status).toBe(1);
    expect(results(recovered)("bots-running").status).toBe("pass");
    expect(recovered.stdout).toContain("::warning::fitness: bots-running probe crashed");
  });

  it("reports a dead Fly token as unknown with the cause kept, and assigns its one issue at once", () => {
    const stub = fixture();
    writeFileSync(join(stub, "fly-dead"), "");
    const res = run(stub, ["--json", "--report"]);
    expect(res.status).toBe(0);
    const r = results(res);
    for (const id of ["bots-running", "bots-responsive", "alerts-reach-owner"]) {
      expect(r(id).status).toBe("unknown");
    }
    expect(r("main-deploys").status).toBe("pass");
    expect(res.stdout).toContain("::warning::fitness: bots-running cannot read Fly");
    expect(res.stdout).toContain("exited 1: Error: token expired");
    const gh = calls(stub, "gh");
    expect(lines(gh, "issue create")).toBe(1);
    // Only he can set a credential, so the blind issue goes straight to him.
    expect(gh).toContain(
      "issue create --title [fitness] cannot read Fly --label bug --assignee ejclark --body",
    );
    expect(gh).not.toContain("[fitness] bots-running");
    expect(res.stdout).toContain("fitness: open-blind [fitness] cannot read Fly");
  });

  it("opens a blind issue unassigned when the read failed for any other reason", () => {
    const stub = fixture();
    writeFileSync(
      join(stub, "fly"),
      '#!/usr/bin/env bash\necho "$*" >> "$STUB/fly-calls"\necho "Error: 503 service unavailable" >&2\nexit 1\n',
    );
    run(stub, ["--report"]);
    const gh = calls(stub, "gh");
    expect(gh).toContain("issue create --title [fitness] cannot read Fly --label bug --body");
    expect(gh).not.toContain("--assignee");
    expect(gh).toContain("the owner, once these have been blind for 2 hours");
  });

  it("closes the blind issue once Fly reads again", () => {
    const stub = fixture({
      issues: [{ number: 12, title: "[fitness] cannot read Fly", body: "", comments: [] }],
    });
    run(stub, ["--report"]);
    expect(calls(stub, "gh")).toContain("issue close 12 --comment Fly can be read again.");
  });

  it("gives a hung read a deadline so it costs one contract, not the tick", () => {
    const stub = fixture();
    writeFileSync(join(stub, "exec-hang"), "");
    const started = Date.now();
    const res = run(stub, ["--json"], { FITNESS_SPAWN_MS: "300" });
    // Two hung reads would be ten seconds; the bound leaves room for a slow runner's node starts.
    expect(Date.now() - started).toBeLessThan(8000);
    const r = results(res);
    expect(r("bots-responsive")).toMatchObject({
      status: "unknown",
      detail: "cannot read the health stamp",
    });
    expect(r("bots-running").status).toBe("pass");
    expect(res.stdout).toContain("timed out after 300 ms");
  });

  it("judges main-deploys through deploy-lag: a young push passes, an old one fails, no read is unknown", () => {
    const young = results(run(fixture({ deploy: "young" }), ["--json"]))("main-deploys");
    expect(young.status).toBe("pass");
    expect(young.detail).toContain("inside the deploy grace");
    const late = results(run(fixture({ deploy: "late" }), ["--json"]))("main-deploys");
    expect(late).toMatchObject({ status: "fail", detail: "dashboard undeployed 45 min" });
    const blind = results(run(fixture({ deploy: "unreadable" }), ["--json"]))("main-deploys");
    expect(blind.status).toBe("unknown");
    expect(blind.detail).toContain("cannot read GitHub");
  });

  // Audit, 2026-11-01: the scan read push runs only, so catch-up's own landing never counted.
  it("counts a bots release landed by catch-up's dispatch: a current fleet is not behind", () => {
    const stub = fixture();
    dispatchLandedWorld(stub);
    const res = run(stub, ["--json", "--report"]);
    expect(results(res)("main-deploys")).toMatchObject({
      status: "pass",
      detail: "both apps current",
    });
    expect(calls(stub, "gh")).not.toContain("[fitness] main-deploys");
  });

  // Audit, 2026-11-01: a run of failed deploys pushed the last landing out of the runs read, and the
  // contract then passed and closed its issue with the fleet still on old code.
  it("stays red on a run of failed bots deploys with no landing left in the runs read", () => {
    const stub = fixture({ issues: [deploysIssue("**What failed:** bots undeployed 30 min.")] });
    runsWindow(
      stub,
      Array.from({ length: 40 }, () => botsStep("failure")),
    );
    const res = run(stub, ["--json", "--report"]);
    expect(results(res)("main-deploys")).toMatchObject({
      status: "fail",
      detail: "bots undeployed 120 min",
    });
    expect(calls(stub, "gh")).not.toContain("issue close 7");
  });

  it("leaves the issue open when no landing is in the runs read and nothing says why", () => {
    const stub = fixture({ issues: [deploysIssue("**What failed:** bots undeployed 30 min.")] });
    runsWindow(
      stub,
      Array.from({ length: 40 }, () => botsStep("skipped")),
    );
    const res = run(stub, ["--json", "--report"]);
    expect(results(res)("main-deploys")).toMatchObject({
      status: "unknown",
      detail: "no bots release landed in the runs read",
    });
    const gh = calls(stub, "gh");
    expect(gh).not.toContain("issue close 7");
    expect(gh).toContain("issue create --title [fitness] cannot read GitHub");
    expect(gh).toContain("no bots release landed in the runs read");
  });

  // Audit, 2026-11-01: a merge that landed after the tick's clock was taken filed "cannot read GitHub".
  it("files nothing when a merge lands during the tick and is dated ahead of its clock", () => {
    const stub = fixture({ deploy: "ahead" });
    const res = run(stub, ["--json", "--report"]);
    const r = results(res)("main-deploys");
    expect(r.status).toBe("pass");
    expect(r.detail).toBe("dashboard undeployed 0 min: inside the deploy grace");
    expect(calls(stub, "gh")).not.toContain("issue create");
  });

  it("comments when only the bots half is left of the two a thread reported", () => {
    const stub = fixture({
      issues: [
        deploysIssue("**What failed:** dashboard undeployed 45 min, bots undeployed 30 min."),
      ],
    });
    runsWindow(stub, [botsStep("skipped"), landed]);
    writeFileSync(
      join(stub, "api-compare"),
      JSON.stringify({
        commits: [
          {
            sha: "sha1",
            commit: { message: "fix: x", committer: { date: iso(Date.now() - 60 * MIN) } },
            author: { login: "ejclark" },
          },
        ],
        files: [{ filename: "scripts/fitness.mjs" }],
      }),
    );
    run(stub, ["--report"]);
    expect(calls(stub, "gh")).toContain(
      "issue comment 7 --body Still failing, and it changed: bots undeployed 60 min.",
    );
  });

  it("says what it read when the mail credential arrives, closing its thread in those words", () => {
    const stub = fixture({
      issues: [
        {
          ...deploysIssue("**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set."),
          title: "[fitness] alerts-reach-owner",
        },
      ],
    });
    run(stub, ["--report"]);
    const gh = calls(stub, "gh");
    expect(gh).toContain(
      "issue close 7 --comment Passing again: the mail credential is set; each account still has to opt in.",
    );
    expect(gh).not.toContain("delivery is configured");
  });

  it("retries only a read that failed: a judge's own unknown is not read twice", () => {
    const stub = fixture({ deploy: "future" });
    const r = results(run(stub, ["--json"]))("main-deploys");
    expect(r).toMatchObject({
      status: "unknown",
      detail: "the dashboard lag is dated in the future",
    });
    expect(lines(calls(stub, "gh"), "commits/main")).toBe(1);
    // A read that did fail is read twice before it counts as blind.
    const dead = fixture({ deploy: "unreadable" });
    run(dead, ["--json"]);
    expect(lines(calls(dead, "gh"), "commits/main")).toBe(2);
  });
});
