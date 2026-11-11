import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  ASSIGNED_MARKER,
  REOPENED_MARKER,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness-rungs.mjs";
import {
  calls,
  fixture,
  graphqlReply,
  iso,
  lines,
  MIN,
  results,
  run,
  START,
  STATEFUL_GH,
} from "./fitness-harness";

// The second wiring half of fitness.spec.ts (#6470): what the script files, assigns, comments on,
// reopens and closes through gh, and what it prints when a write is refused. The reads that feed
// those reports are in fitness-wiring.spec.ts; both drive the real entrypoint against the stub
// binaries in tests/scripts/fitness-harness.ts. Grading with scripts/fitness-audit.mjs: swap
// `--spec` to this file; the reads spec does not need to be staged beside it.
const WORKFLOW = resolve(".github/workflows/bots-catchup.yml");

describe("fitness wiring", () => {
  it("opens a failing contract's issue on the clock, unassigned, and exits 0 under --report", () => {
    const stub = fixture({ machine: "stopped" });
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("FAIL     bots-running: machine is stopped");
    expect(res.stdout).toContain("fitness: open [fitness] bots-running");
    const gh = calls(stub, "gh");
    expect(gh).toContain("issue create --title [fitness] bots-running --label bug --body");
    expect(gh).toContain("**What failed:** machine is stopped.");
    expect(gh).not.toContain("--assignee");
    expect(gh).toContain("The owner is assigned only once those are spent");
    expect(lines(gh, "issue create")).toBe(1);
    // Without --report the failure is the exit code.
    expect(run(fixture({ machine: "stopped" }), []).status).toBe(1);
  });

  it("opens a credential contract's issue assigned to the owner, in the same call", () => {
    const stub = fixture({ secrets: ["OTHER"] });
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(calls(stub, "gh")).toContain(
      "issue create --title [fitness] alerts-reach-owner --label bug --assignee ejclark --body",
    );
    expect(calls(stub, "gh")).toContain("Only the owner can fix this");
    // The marker in the body is what stops a second assignment if he takes himself off.
    expect(calls(stub, "gh")).toContain(ASSIGNED_MARKER);
  });

  it("assigns under the clock's token, then says why once, with the marker the next tick reads", () => {
    const open = {
      number: 7,
      title: "[fitness] bots-running",
      body: "**What failed:** machine is stopped.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [],
    };
    const mine = { user: { type: "Bot" }, body: "<!-- bots-start-stopped:start -->" };
    const stub = fixture({
      machine: "stopped",
      issues: [open],
      comments: {
        7: [1, 2, 3].map(() => ({ ...mine, created_at: iso(Date.now() - MIN) })),
      },
    });
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    const gh = calls(stub, "gh");
    expect(gh).toContain("api repos/{owner}/{repo}/issues/7/comments?per_page=100 --paginate --jq");
    const edit = gh.indexOf(
      "api --method POST repos/{owner}/{repo}/issues/7/assignees -f assignees[]=ejclark",
    );
    const said = gh.indexOf("issue comment 7 --body Assigned to the owner:");
    expect(edit).toBeGreaterThan(-1);
    expect(said).toBeGreaterThan(edit);
    expect(gh).toContain(ASSIGNED_MARKER);
    expect(res.stdout).toContain("fitness: assign [fitness] bots-running");
  });

  it("does not claim an assignment GitHub refused: the next tick tries again", () => {
    const open = {
      number: 7,
      title: "[fitness] alerts-reach-owner",
      body: "**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [],
    };
    const stub = fixture({ secrets: ["SKYNET_ALERT_EMAIL_API_KEY"], issues: [open] });
    writeFileSync(join(stub, "edit-refuse"), "");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("fitness: COULD NOT assign [fitness] alerts-reach-owner");
    expect(calls(stub, "gh")).not.toContain("issue comment 7");
  });

  it("prints what it would assign in a session and writes nothing, since a self-assignment mails no one", () => {
    const open = {
      number: 7,
      title: "[fitness] alerts-reach-owner",
      body: "**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [],
    };
    const stub = fixture({ secrets: ["SKYNET_ALERT_EMAIL_API_KEY"], issues: [open] });
    const res = run(stub, ["--here", "clock", "--report"], { GITHUB_ACTIONS: "" });
    expect(res.stdout).toContain("fitness: would assign [fitness] alerts-reach-owner");
    const gh = calls(stub, "gh");
    expect(gh).not.toContain("--method");
    expect(gh).not.toContain("issue comment");
  });

  it("holds and warns when an unassigned thread's comments cannot be read", () => {
    const open = {
      number: 7,
      title: "[fitness] alerts-reach-owner",
      body: "**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [],
    };
    const stub = fixture({ secrets: ["SKYNET_ALERT_EMAIL_API_KEY"], issues: [open] });
    writeFileSync(join(stub, "comments-dead"), "");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("::warning::fitness: cannot read the comments on #7");
    expect(calls(stub, "gh")).not.toContain("--method");
  });

  it("spends no comment read on a thread he already holds", () => {
    const open = {
      number: 7,
      title: "[fitness] alerts-reach-owner",
      body: "**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [{ login: "ejclark" }],
    };
    const stub = fixture({ secrets: ["SKYNET_ALERT_EMAIL_API_KEY"], issues: [open] });
    run(stub, ["--report"]);
    expect(calls(stub, "gh")).not.toContain("issues/7/comments");
    expect(calls(stub, "gh")).not.toContain("--method");
  });

  it("reopens a recently closed thread with one line, through gh, and unassigns first", () => {
    const thread = {
      number: 7,
      title: "[fitness] bots-responsive",
      state: "CLOSED",
      closedAt: iso(Date.now() - 60 * MIN),
      createdAt: iso(Date.now() - 90 * MIN),
      assignees: [{ login: "ejclark" }],
    };
    const stub = fixture({ stampAgeMs: 60 * MIN, closed: [thread] });
    run(stub, ["--report"]);
    const gh = calls(stub, "gh");
    expect(gh).toContain("issue list --state all --search");
    const removed = gh.indexOf(
      "api --method DELETE repos/{owner}/{repo}/issues/7/assignees -f assignees[]=ejclark",
    );
    const reopened = gh.indexOf("issue reopen 7 --comment The fix did not hold:");
    expect(removed).toBeGreaterThan(-1);
    expect(reopened).toBeGreaterThan(removed);
    expect(gh).toContain(REOPENED_MARKER);
    expect(gh).not.toContain("issue create");
    expect(gh).not.toContain("--method POST");
  });

  it("files a new issue with a warning when the closed threads cannot be read", () => {
    const stub = fixture({ stampAgeMs: 60 * MIN });
    writeFileSync(join(stub, "closed-dead"), "");
    const res = run(stub, ["--report"]);
    expect(res.stdout).toContain("::warning::fitness: cannot read closed fitness issues");
    expect(calls(stub, "gh")).toContain("issue create --title [fitness] bots-responsive");
  });

  it("looks for closed threads only when a failure has no open issue", () => {
    const quietWorld = fixture();
    run(quietWorld, ["--report"]);
    expect(calls(quietWorld, "gh")).not.toContain("--search");
  });

  it("reads bots-responsive as quiet while the machine is down, so one stop opens one issue", () => {
    const stub = fixture({ machine: "stopped" });
    const res = run(stub, ["--json", "--report"]);
    const r = results(res);
    expect(r("bots-responsive").status).toBe("quiet");
    expect(calls(stub, "fly")).not.toContain("machine exec");
    const gh = calls(stub, "gh");
    expect(lines(gh, "issue create")).toBe(1);
    expect(gh).toContain("issue create --title [fitness] bots-running");
  });

  it("gives a machine that just started until the stamp catches up, and no longer", () => {
    const started = (agoMs: number) =>
      `[{"id":"m1","state":"started","config":{},"events":[{"type":"exit","timestamp":${Date.now()}},{"type":"start","timestamp":${Date.now() - agoMs}}]}]`;
    const fresh = results(
      run(fixture({ machines: started(MIN), stampAgeMs: 60 * MIN }), ["--json"]),
    );
    expect(fresh("bots-responsive").status).toBe("quiet");
    const late = results(
      run(fixture({ machines: started(6 * MIN), stampAgeMs: 60 * MIN }), ["--json"]),
    );
    expect(late("bots-responsive").status).toBe("fail");
    // A second start inside the hour is a machine that keeps dying: no grace, or a restart loop
    // reads as quiet on every tick.
    const looping = `[{"id":"m1","state":"started","config":{},"events":[{"type":"start","timestamp":${Date.now() - 4 * MIN}},{"type":"start","timestamp":${Date.now() - MIN}}]}]`;
    const loop = results(run(fixture({ machines: looping, stampAgeMs: 60 * MIN }), ["--json"]));
    expect(loop("bots-responsive").status).toBe("fail");
    // The grace answers a stale stamp only: a fresh stamp still passes.
    const ok = results(run(fixture({ machines: started(MIN) }), ["--json"]));
    expect(ok("bots-responsive").status).toBe("pass");
  });

  it("reads the assignment path: a 404 fails, any other failed read is unknown, never a pass", () => {
    const missing = fixture();
    writeFileSync(join(missing, "not-assignable"), "");
    expect(results(run(missing, ["--json"]))("owner-assignment-path")).toMatchObject({
      status: "fail",
      detail: "the owner cannot be assigned on this repository",
    });
    const dead = fixture();
    writeFileSync(join(dead, "assign-dead"), "");
    expect(results(run(dead, ["--json"]))("owner-assignment-path").status).toBe("unknown");
    const blind = fixture();
    writeFileSync(join(blind, "graphql-dead"), "");
    expect(results(run(blind, ["--json"]))("owner-assignment-path")).toMatchObject({
      status: "unknown",
      detail: "cannot read GitHub",
    });
  });

  it("files the assignment path's staleness as an issue assigned to him: that issue is the test", () => {
    const stub = fixture({ assignedAgoMs: 31 * 24 * 60 * MIN });
    run(stub, ["--report"]);
    expect(calls(stub, "gh")).toContain(
      "issue create --title [fitness] owner-assignment-path --label bug --assignee ejclark --body",
    );
  });

  it("re-assigns a person-made assignment through gh: off, then on, then one line", () => {
    const stub = fixture();
    const self = {
      number: 6501,
      title: "[fitness] alerts-reach-owner",
      state: "OPEN",
      timelineItems: {
        nodes: [
          {
            createdAt: iso(Date.now() - MIN),
            actor: { __typename: "User", login: "ejclark" },
            assignee: { login: "ejclark" },
          },
        ],
      },
    };
    writeFileSync(join(stub, "graphql"), JSON.stringify(graphqlReply(Date.now(), [self])));
    run(stub, ["--report"]);
    const gh = calls(stub, "gh");
    const off = gh.indexOf(
      "api --method DELETE repos/{owner}/{repo}/issues/6501/assignees -f assignees[]=ejclark",
    );
    const on = gh.indexOf(
      "api --method POST repos/{owner}/{repo}/issues/6501/assignees -f assignees[]=ejclark",
    );
    const said = gh.indexOf("issue comment 6501 --body Re-assigned under the bot");
    expect(off).toBeGreaterThan(-1);
    expect(on).toBeGreaterThan(off);
    expect(said).toBeGreaterThan(on);
    expect(gh.slice(said)).toContain(ASSIGNED_MARKER);
    // The path's own thread opens unassigned: the re-assign is the one email.
    expect(gh).toContain("issue create --title [fitness] owner-assignment-path --label bug --body");
  });

  it("comments on a changed cause and closes on a pass, through gh", () => {
    const open = {
      number: 7,
      title: "[fitness] bots-running",
      body: "**What failed:** machine is stopped.",
      comments: [],
    };
    const changed = fixture({ machines: "[]", issues: [open] });
    run(changed, ["--report"]);
    expect(calls(changed, "gh")).toContain(
      "issue comment 7 --body Still failing, and it changed: no primary machine.",
    );
    const same = fixture({ machine: "stopped", issues: [open] });
    run(same, ["--report"]);
    expect(calls(same, "gh")).not.toContain("issue comment");
    // What was last said is the last comment: an older comment naming today's cause is history.
    const talked = {
      ...open,
      comments: [
        { body: "Still failing, and it changed: no primary machine." },
        { body: "Still failing, and it changed: machine is stopped." },
      ],
    };
    const back = fixture({ machines: "[]", issues: [talked] });
    run(back, ["--report"]);
    expect(calls(back, "gh")).toContain("issue comment 7 --body");
    const healed = fixture({ issues: [open] });
    run(healed, ["--report"]);
    expect(calls(healed, "gh")).toContain("issue close 7 --comment Passing again: started.");
  });

  // The oracle for this slice: the real start script and the real report, tick after tick, against
  // one GitHub that keeps state. The clock skips the report after the start script exits 3 until the
  // held workflow change lands, so this is the order that change gives it.
  (existsSync(START) ? it : it.skip)(
    "replays a machine that keeps stopping: one thread, no assignment until the budget is spent, one comment for it",
    () => {
      const stub = fixture({ machine: "stopped" });
      const plain = readFileSync(join(stub, "gh"), "utf8");
      writeFileSync(join(stub, "gh-plain"), plain);
      chmodSync(join(stub, "gh-plain"), 0o755);
      writeFileSync(join(stub, "gh"), STATEFUL_GH);
      chmodSync(join(stub, "gh"), 0o755);
      const down = readFileSync(join(stub, "machines"), "utf8");
      const up = down.replace(
        '"state":"stopped","config":{"env"',
        '"state":"started","config":{"env"',
      );
      expect(up).not.toBe(down);
      writeFileSync(join(stub, "machines-up"), up);
      const crash = () => writeFileSync(join(stub, "machines"), down);
      const db = () =>
        JSON.parse(readFileSync(join(stub, "threads.json"), "utf8")) as {
          issues: {
            number: number;
            title: string;
            state: string;
            assignees: string[];
            assigned: number;
            comments: { body: string }[];
          }[];
        };
      const tick = () => {
        const started = spawnSync("bash", [START, "skynet-capital-bots", "--report"], {
          encoding: "utf8",
          env: {
            ...process.env,
            STUB: stub,
            FLY_BIN: join(stub, "fly"),
            GH_BIN: join(stub, "gh"),
            BOTS_START_WAIT_SECS: "1",
            BOTS_POLL_SECS: "1",
          },
        });
        expect(run(stub, ["--report"]).status).toBe(0);
        return started.status;
      };
      const onlyThread = () => {
        const [thread, ...others] = db().issues;
        expect(others).toEqual([]);
        if (!thread) throw new Error("no thread was filed");
        return thread;
      };
      const said = (needle: string) =>
        db()
          .issues.flatMap((i) => i.comments)
          .filter((c) => c.body.includes(needle)).length;

      // Three crashes, three starts. Each heals in its own tick, so the thread opens and closes
      // three times, and he is never assigned.
      for (const i of [0, 1, 2]) {
        crash();
        expect(tick()).toBe(0);
        const thread = onlyThread();
        expect(thread.title).toBe("[fitness] bots-running");
        expect(thread.state).toBe("CLOSED");
        expect(thread.assigned).toBe(0);
        expect(said("<!-- bots-start-stopped:start -->")).toBe(i + 1);
        expect(said(REOPENED_MARKER)).toBe(i);
      }
      // The fourth: the budget is spent, the machine stays down, and now he hears, exactly once.
      crash();
      expect(tick()).toBe(3);
      const spent = onlyThread();
      expect(spent.state).toBe("OPEN");
      expect(spent.assignees).toEqual(["ejclark"]);
      expect(spent.assigned).toBe(1);
      expect(said(ASSIGNED_MARKER)).toBe(1);
      // A standing failure says nothing more.
      expect(tick()).toBe(3);
      const standing = onlyThread();
      expect(standing.comments).toHaveLength(spent.comments.length);
      expect(standing.assigned).toBe(1);
      expect(said(REOPENED_MARKER)).toBe(3);
      // A pass closes it.
      writeFileSync(join(stub, "machines"), up);
      expect(tick()).toBe(0);
      expect(onlyThread().state).toBe("CLOSED");
    },
  );

  // #6700: on 11-02 a tick ran while a bots deploy was replacing the machine. The start script left
  // it alone, as it does any state but stopped, and the report opened #6686 promising a start that
  // script never makes. The real clock order again, against a thread closed three days earlier.
  (existsSync(START) ? it : it.skip)(
    "gives a machine mid-deploy the deploy grace, then fails it naming a fix that acts on that state",
    () => {
      const replacing = (agoMs: number) =>
        JSON.stringify([
          { id: "standby1", state: "stopped", config: { standbys: ["m1"] } },
          {
            id: "m1",
            state: "replacing",
            config: {},
            events: [
              { type: "start", status: "started", timestamp: Date.now() - 3 * 60 * MIN },
              { type: "update", status: "replacing", timestamp: Date.now() - agoMs },
            ],
          },
        ]);
      const world = (agoMs: number) => {
        const stub = fixture({ machines: replacing(agoMs) });
        writeFileSync(join(stub, "gh-plain"), readFileSync(join(stub, "gh"), "utf8"));
        chmodSync(join(stub, "gh-plain"), 0o755);
        writeFileSync(join(stub, "gh"), STATEFUL_GH);
        chmodSync(join(stub, "gh"), 0o755);
        return stub;
      };
      const seedClosed = (stub: string) =>
        writeFileSync(
          join(stub, "threads.json"),
          JSON.stringify({
            issues: [
              {
                number: 1,
                title: "[fitness] bots-running",
                body: "**What failed:** machine is stopped.",
                state: "CLOSED",
                closedAt: iso(Date.now() - 3 * 24 * 60 * MIN),
                createdAt: iso(Date.now() - 3 * 24 * 60 * MIN - 30 * MIN),
                assignees: [],
                assigned: 0,
                comments: [],
              },
            ],
          }),
        );
      const db = (stub: string) =>
        JSON.parse(readFileSync(join(stub, "threads.json"), "utf8")) as {
          issues: { title: string; state: string; body: string; comments: { body: string }[] }[];
        };
      const tick = (stub: string) => {
        const started = spawnSync("bash", [START, "skynet-capital-bots", "--report"], {
          encoding: "utf8",
          env: { ...process.env, STUB: stub, FLY_BIN: join(stub, "fly"), GH_BIN: join(stub, "gh") },
        });
        expect(started.status).toBe(0);
        const res = run(stub, ["--json", "--report"]);
        expect(res.status).toBe(0);
        return results(res)("bots-running");
      };

      // Mid-deploy: nothing starts it, nothing opens, the closed thread stays closed.
      const young = world(2 * MIN);
      seedClosed(young);
      const quietRead = tick(young);
      expect(quietRead.status).toBe("quiet");
      expect(quietRead.detail).toBe("machine is replacing, inside the 20 min deploy grace");
      expect(calls(young, "fly")).not.toContain("machine start");
      expect(db(young).issues).toHaveLength(1);
      expect(db(young).issues[0]?.state).toBe("CLOSED");
      expect(db(young).issues[0]?.comments).toEqual([]);

      // Wedged past the grace: the thread reopens, and the failure is a real one.
      const wedged = world(25 * MIN);
      seedClosed(wedged);
      const failed = tick(wedged);
      expect(failed.status).toBe("fail");
      expect(failed.detail).toBe("machine is replacing past the 20 min deploy grace");
      expect(db(wedged).issues[0]?.state).toBe("OPEN");
      expect(db(wedged).issues[0]?.comments.at(-1)?.body).toContain(
        "What failed: machine is replacing past the 20 min deploy grace.",
      );

      // A first failure files a body that names a fix for this state, not the start script's.
      const fresh = world(25 * MIN);
      tick(fresh);
      const [filed] = db(fresh).issues;
      expect(filed?.body).toContain("**What fixes it:** nothing automatic: stopping the machine");
      expect(filed?.body).not.toContain("scripts/bots-start-stopped.sh acts first");
      expect(filed?.body).toContain("The owner is assigned if this still fails after 2 hours.");
    },
  );

  it("prints a refused write and still exits 0, because the next tick retries it", () => {
    const stub = fixture({ machine: "stopped" });
    writeFileSync(join(stub, "gh-refuse"), "");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("fitness: COULD NOT open [fitness] bots-running");
    expect(res.stdout).toContain("HTTP 502");
  });

  it("reports nothing, with a warning, when the issue list is not a list", () => {
    const stub = fixture({ machine: "stopped" });
    writeFileSync(join(stub, "issues"), "{}");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      "::warning::fitness: cannot read GitHub issues, so nothing was reported",
    );
    expect(res.stdout).toContain("not a list");
    expect(calls(stub, "gh")).not.toContain("issue create");
  });

  (existsSync(WORKFLOW) ? it : it.skip)("has a clock runner that really invokes the script", () => {
    expect(readFileSync(WORKFLOW, "utf8")).toContain("node scripts/fitness.mjs --report");
  });
});
