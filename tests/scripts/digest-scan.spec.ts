import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { QUIET_HOURS, quietReason, waitingWork } from "../../scripts/digest-scan.mjs";

// QUIET WITH WORK WAITING (#6470). The digest's due rule was 5 commits or 7 days, so a repo that
// stopped moving read as "nothing to say": main sat 75.8h from 2026-10-27T13:37Z with research due
// and no lane run of any kind, and no digest fired. The third reason makes that silence a digest,
// and so a push notification, within a day — on the clock that is already armed, with no workflow
// edit. Pure halves first; then the CLI under a fake `gh` and a throwaway git history, so the
// argv and the `--due` JSON are pinned, not only the arithmetic.

const issue = (number: number, labels: string[]) => ({
  number,
  title: `issue ${number}`,
  state: "OPEN",
  labels: labels.map((name) => ({ name })),
});

describe("waitingWork — what counts as work waiting", () => {
  it("counts a ready issue the pull rule would start, and research the event scan says is due", () => {
    const w = waitingWork({
      readyIssues: [issue(6018, ["bug", "feedback", "ready"])],
      researchDue: 2,
    });
    expect(w).toEqual({ ready: [{ number: 6018, title: "issue 6018" }], researchDue: 2 });
  });

  it.each([
    ["in-progress", ["feedback", "ready", "in-progress"]],
    ["needs-eric", ["plan", "ready", "needs-eric"]],
    ["needs-info", ["feedback", "ready", "needs-info"]],
  ])(
    "leaves out a ready issue parked or started (%s) — the same rule the sweep applies",
    (_, labels) => {
      expect(waitingWork({ readyIssues: [issue(1, labels)], researchDue: 0 }).ready).toEqual([]);
    },
  );
});

describe("quietReason — the third due reason", () => {
  const waiting = { ready: [{ number: 6018, title: "x" }], researchDue: 0 };

  it(`is due once main has been quiet ${QUIET_HOURS}h with something to start`, () => {
    expect(quietReason(QUIET_HOURS, waiting)).toBe("quiet-with-work");
    expect(quietReason(75.8, { ready: [], researchDue: 3 })).toBe("quiet-with-work");
  });

  it("is not due while main is quiet with nothing waiting — a quiet weekend is not a failure", () => {
    expect(quietReason(40, { ready: [], researchDue: 0 })).toBeNull();
  });

  it("is not due under the threshold, however much is waiting", () => {
    expect(quietReason(QUIET_HOURS - 0.1, waiting)).toBeNull();
  });

  it("is never due on an unknown read — unknown is said, not counted", () => {
    expect(quietReason(80, null)).toBeNull();
    expect(quietReason(80, { ready: null, researchDue: null })).toBeNull();
  });

  it("counts the half that was read when the other half failed", () => {
    expect(quietReason(80, { ready: waiting.ready, researchDue: null })).toBe("quiet-with-work");
    expect(quietReason(80, { ready: null, researchDue: 1 })).toBe("quiet-with-work");
    expect(quietReason(80, { ready: null, researchDue: 0 })).toBeNull();
  });
});

// THE WIRING. `GIT_DIR` points the script's git at a throwaway history whose only commit on
// `origin/main` is dated 2026-10-27T13:37:21Z (the real gap's first silent hour), and a fake `gh`
// on PATH records its argv and answers the sweep's REST ready read from a fixture. docs/digests/
// and scripts/event-scan.mjs are the real ones in cwd, so the research count is whatever the scan
// says for that day — a number, or null if that scan refused the day — never pinned, because
// ledgers written since change it; the ready half is asserted exactly and is read on its own.
describe("digest-scan --due — the quiet reason, end to end", () => {
  let dir: string;
  let log: string;
  const SCRIPT = join(process.cwd(), "scripts/digest-scan.mjs");

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "digest-quiet-"));
    log = join(dir, "gh.log");
    const repo = join(dir, "repo");
    const git = (args: string[]) =>
      execFileSync("git", args, {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_DIR: join(repo, ".git"),
          GIT_WORK_TREE: repo,
          GIT_AUTHOR_DATE: "2026-10-27T13:37:21Z",
          GIT_COMMITTER_DATE: "2026-10-27T13:37:21Z",
          GIT_AUTHOR_NAME: "t",
          GIT_AUTHOR_EMAIL: "t@t",
          GIT_COMMITTER_NAME: "t",
          GIT_COMMITTER_EMAIL: "t@t",
        },
      });
    execFileSync("mkdir", ["-p", repo]);
    git(["init", "-q"]);
    git(["commit", "-q", "--allow-empty", "-m", "last merge before the gap"]);
    git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
    writeFileSync(
      join(dir, "gh"),
      [
        "#!/bin/sh",
        `printf '%s\\n' "$*" >> "${log}"`,
        'case "$*" in',
        '  *"api repos/{owner}/{repo}/issues?state=open&labels=ready"*) cat "$READY_FIXTURE" ;;',
        "  *) echo '[]' ;;",
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(join(dir, "gh"), 0o755);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const due = (readyIssues: unknown[], now: string) => {
    const fixture = join(dir, "ready.json");
    writeFileSync(fixture, JSON.stringify(readyIssues));
    const r = spawnSync("node", [SCRIPT, "--due", `--now=${now}`], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${dir}:${process.env.PATH}`,
        GIT_DIR: join(dir, "repo", ".git"),
        READY_FIXTURE: fixture,
      },
    });
    // No log file means the fake `gh` was never run — the no-op case, not an error.
    const calls = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [];
    return { status: r.status, stderr: r.stderr, out: JSON.parse(r.stdout || "null"), calls };
  };

  it("WHEN main is 46h quiet and a ready issue can start, THEN the digest is due for that reason", () => {
    const { status, stderr, out, calls } = due(
      [issue(6018, ["bug", "feedback", "ready"])],
      "2026-10-29T12:00:00Z",
    );
    expect(status, stderr).toBe(0);
    expect(out.quietHours).toBeCloseTo(46.4, 1);
    expect(out.reason).toBe("quiet-with-work");
    expect(out.due).toBe(true);
    expect(out.waiting.ready).toEqual([{ number: 6018, title: "issue 6018" }]);
    expect(out.waiting.researchDue === null || typeof out.waiting.researchDue === "number").toBe(
      true,
    );
    // The ready read is the sweep's own: REST (a cloud session is refused GraphQL), open `ready`.
    expect(calls).toEqual([
      "api repos/{owner}/{repo}/issues?state=open&labels=ready&sort=created&direction=asc&per_page=100",
    ]);
  });

  it("WHEN main is 46h quiet but every ready issue is started or parked, THEN only due research counts", () => {
    const { status, out } = due(
      [issue(4619, ["feedback", "ready", "in-progress"])],
      "2026-10-29T12:00:00Z",
    );
    expect(status).toBe(0);
    expect(out.waiting.ready).toEqual([]);
    expect(out.reason).toBe((out.waiting.researchDue ?? 0) > 0 ? "quiet-with-work" : null);
  });

  it("WHEN main has been quiet under a day, THEN GitHub is not read at all — a no-op costs nothing", () => {
    const { status, out, calls } = due(
      [issue(6018, ["bug", "feedback", "ready"])],
      "2026-10-28T12:00:00Z",
    );
    expect(status).toBe(0);
    expect(out.quietHours).toBeCloseTo(22.4, 1);
    expect(out.reason).not.toBe("quiet-with-work");
    expect(out.waiting).toBeNull();
    expect(calls).toEqual([]);
  });
});
