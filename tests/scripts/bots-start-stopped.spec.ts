import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";

// #5955. Driven against stub `fly` and `gh`: a stopped machine starts unless a person marked the
// stop, and a machine that keeps dying stops being restarted. The live machine is never stopped to
// test this, so these specs are the proof of the stopped path until a real stop occurs.
//
// The `gh` stub keeps state (study 2026-11-01, "start budget is four and strangers spend it"): the
// issue it files, and every comment on it as the REST comments route would return them, so a run
// of starts is counted the way the live script counts them — only a bot comment carrying the start
// marker spends the budget, and the budget is exactly 3.
const SCRIPT = resolve("scripts/bots-start-stopped.sh");
const MARKER = "<!-- bots-start-stopped:start -->";

const STUB_FLY = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/fly-calls"
case "$1 $2" in
  "machine list")
    cat <<JSON
[{"id":"standby1","state":"stopped","config":{"standbys":["m1"]}},
 {"id":"m1","state":"$(cat "$S/state")","config":{"metadata":$(cat "$S/meta")},
  "events":[{"type":"exit","timestamp":5,"request":{"exit_event":{"exit_code":137,"oom_killed":true}}}]}]
JSON
    ;;
  "machine start")
    [[ -f "$S/refuse" ]] && exit 1
    [[ -f "$S/never" ]] || echo started > "$S/state" ;;
  "logs -a") printf 'member@example.test rejected\\nheap out of memory\\n' ;;
esac
`;

// Comments live in $S/comments as one JSON object per line, in the REST shape the script reads.
// \`issue comment\` appends a bot-authored one; a spec seeds others to play a stranger or a bot
// saying something else.
const STUB_GH = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/gh-calls"
case "$1 $2" in
  "issue list") if [[ -f "$S/issue" ]]; then cat "$S/issue"; else echo '[]'; fi ;;
  "issue create")
    echo '[{"number":42,"title":"[fitness] bots-running","state":"OPEN"}]' > "$S/issue"
    echo "$8" > "$S/frame"
    echo "https://github.com/o/r/issues/42" ;;
  "issue reopen")
    jq -c 'map(.state = "OPEN")' "$S/issue" > "$S/issue.next"; mv "$S/issue.next" "$S/issue" ;;
  "issue comment")
    body="$5"
    jq -cn --arg b "$body" --arg t "$(date -u +%FT%TZ)" '{user:{type:"Bot"},body:$b,created_at:$t}' >> "$S/comments" ;;
  "issue view") cat "$S/recent" 2>/dev/null ;;
  "api --method") ;;
  api*)
    # \`gh api <path> --jq <filter>\`: the filter runs over the stored comments, as gh would run it.
    filter="$4"
    if [[ -f "$S/comments" ]]; then jq -s "$filter" "$S/comments"; else echo '[]' | jq "$filter"; fi ;;
esac
exit 0
`;

function fixture(state: string, meta = "{}") {
  const stub = mkdtempSync(join(tmpdir(), "bots-start-"));
  writeFileSync(join(stub, "state"), state);
  writeFileSync(join(stub, "meta"), meta);
  for (const [name, body] of [
    ["fly", STUB_FLY],
    ["gh", STUB_GH],
  ] as const) {
    writeFileSync(join(stub, name), body);
    chmodSync(join(stub, name), 0o755);
  }
  return stub;
}

function run(stub: string, ...args: string[]) {
  return spawnSync("bash", [SCRIPT, "bots-app", ...args], {
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
}

const flyCalls = (stub: string) => readFileSync(join(stub, "fly-calls"), "utf8");
const ghCalls = (stub: string) =>
  existsSync(join(stub, "gh-calls")) ? readFileSync(join(stub, "gh-calls"), "utf8") : "";
const comments = (stub: string) =>
  existsSync(join(stub, "comments"))
    ? readFileSync(join(stub, "comments"), "utf8").trim().split("\n")
    : [];

/** Seed an open issue carrying `n` comments of one shape, each from now-ish. */
function seed(stub: string, n: number, shape: { type: "Bot" | "User"; body: string }) {
  openThread(stub);
  const at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const rows = Array.from({ length: n }, () =>
    JSON.stringify({ user: { type: shape.type }, body: shape.body, created_at: at }),
  );
  writeFileSync(join(stub, "comments"), `${rows.join("\n")}\n`);
}

const TITLE = "[fitness] bots-running";
const thread = (over: Record<string, unknown> = {}) => ({
  number: 42,
  title: TITLE,
  state: "OPEN",
  ...over,
});
const openThread = (stub: string) => writeFileSync(join(stub, "issue"), JSON.stringify([thread()]));
const closedThread = (stub: string, agoDays: number) =>
  writeFileSync(
    join(stub, "issue"),
    JSON.stringify([
      thread({
        state: "CLOSED",
        closedAt: new Date(Date.now() - agoDays * 86_400_000)
          .toISOString()
          .replace(/\.\d{3}Z$/, "Z"),
      }),
    ]),
  );

/** Stop the machine again so the next run finds it stopped. */
const stopAgain = (stub: string) => writeFileSync(join(stub, "state"), "stopped");

describe("bots-start-stopped", () => {
  it("starts a stopped primary, never the standby", () => {
    const stub = fixture("stopped");
    expect(run(stub).status).toBe(0);
    expect(flyCalls(stub)).toContain("machine start m1");
    expect(flyCalls(stub)).not.toContain("machine start standby1");
    expect(readFileSync(join(stub, "state"), "utf8").trim()).toBe("started");
  });

  it("leaves a running machine alone", () => {
    const stub = fixture("started");
    expect(run(stub).status).toBe(0);
    expect(flyCalls(stub)).not.toContain("machine start");
  });

  it("always respects a stop a person marked", () => {
    const stub = fixture("stopped", '{"skynet-halt":"eric paused"}');
    const res = run(stub, "--report");
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("deliberately halted");
    expect(flyCalls(stub)).not.toContain("machine start");
    expect(ghCalls(stub)).toBe("");
  });

  it("fails when fly refuses, so a release cannot read green over a dead fleet", () => {
    const stub = fixture("stopped");
    writeFileSync(join(stub, "refuse"), "");
    expect(run(stub).status).toBe(1);
  });

  it("fails when the machine never reaches started", () => {
    const stub = fixture("stopped");
    writeFileSync(join(stub, "never"), "");
    expect(run(stub).status).toBe(1);
  });

  it("files the issue, then one marked comment per start with the exit record and a named cause, never a log line", () => {
    const stub = fixture("stopped");
    expect(run(stub, "--report").status).toBe(0);
    const calls = ghCalls(stub);
    expect(calls).toContain("issue create");
    expect(calls).toContain("issue comment 42");
    expect(calls).not.toContain("member@example.test");
    expect(calls).not.toContain("heap out of memory");
    const [first, ...rest] = comments(stub);
    expect(rest).toEqual([]);
    expect(first).toContain("oom_killed");
    expect(first).toContain("heap-oom");
    expect(first).toContain(MARKER);
    expect(flyCalls(stub)).toContain("machine start m1");
  });

  it("comments on the open issue instead of filing another", () => {
    const stub = fixture("stopped");
    seed(stub, 1, { type: "Bot", body: `start\n${MARKER}` });
    expect(run(stub, "--report").status).toBe(0);
    expect(ghCalls(stub)).toContain("issue comment 42");
    expect(ghCalls(stub)).not.toContain("issue create");
    expect(comments(stub)).toHaveLength(2);
  });

  it("allows exactly three starts in the window; the fourth is refused (the budget was four)", () => {
    const stub = fixture("stopped");
    const outcomes: number[] = [];
    for (let i = 0; i < 4; i++) {
      stopAgain(stub);
      outcomes.push(run(stub, "--report").status ?? -1);
    }
    expect(outcomes).toEqual([0, 0, 0, 3]);
    expect(comments(stub)).toHaveLength(3);
    expect(flyCalls(stub).match(/machine start m1/g)).toHaveLength(3);
  });

  it("stops restarting a machine that keeps dying", () => {
    const stub = fixture("stopped");
    seed(stub, 3, { type: "Bot", body: `start\n${MARKER}` });
    const res = run(stub, "--report");
    expect(res.status).toBe(3);
    expect(res.stdout).toContain("budget spent");
    expect(flyCalls(stub)).not.toContain("machine start");
    expect(comments(stub)).toHaveLength(3);
    // The read is narrowed to the window on the server side: the route pages oldest first, and a
    // long-lived issue's recent starts would otherwise sit past the first page.
    expect(ghCalls(stub)).toMatch(/issues\/42\/comments\?per_page=100&since=\d{4}-\d\d-\d\dT/);
  });

  it("a comment with no body does not break the count", () => {
    const stub = fixture("stopped");
    seed(stub, 3, { type: "Bot", body: `start\n${MARKER}` });
    writeFileSync(
      join(stub, "comments"),
      `${readFileSync(join(stub, "comments"), "utf8")}${JSON.stringify({ user: { type: "Bot" }, body: null, created_at: new Date().toISOString() })}\n`,
    );
    expect(run(stub, "--report").status).toBe(3);
  });

  it("a stranger's comments never spend the budget — this repo is public", () => {
    const stub = fixture("stopped");
    seed(stub, 3, { type: "User", body: `start\n${MARKER}` });
    expect(run(stub, "--report").status).toBe(0);
    expect(flyCalls(stub)).toContain("machine start m1");
  });

  it("a bot saying anything else does not spend it either — only the start marker counts", () => {
    const stub = fixture("stopped");
    seed(stub, 3, { type: "Bot", body: "Failed again — unrelated lane noise" });
    expect(run(stub, "--report").status).toBe(0);
    expect(flyCalls(stub)).toContain("machine start m1");
  });

  it("files under the same title the fitness report keeps, unassigned, in the report's own shape", () => {
    const stub = fixture("stopped");
    expect(run(stub, "--report").status).toBe(0);
    const calls = ghCalls(stub);
    expect(calls).toContain(`issue create --title ${TITLE} --label bug --body`);
    expect(calls).not.toContain("--assignee");
    // The report reads a cause it finds on the thread as already said, so it stays quiet.
    expect(readFileSync(join(stub, "frame"), "utf8")).toContain(
      "**What failed:** machine is stopped.",
    );
    expect(comments(stub)[0]).toContain("**What failed:** machine is stopped.");
  });

  it("reads the thread by its exact title, whatever else the search returns", () => {
    const stub = fixture("stopped");
    writeFileSync(
      join(stub, "issue"),
      JSON.stringify([thread({ number: 7, title: "[fitness] bots-running again" })]),
    );
    expect(run(stub, "--report").status).toBe(0);
    expect(ghCalls(stub)).toContain("issue create");
    expect(ghCalls(stub)).not.toContain("issue comment 7");
  });

  it("reopens a thread closed in the last 14 days, unassigning first, with one line", () => {
    const stub = fixture("stopped");
    closedThread(stub, 3);
    expect(run(stub, "--report").status).toBe(0);
    const calls = ghCalls(stub);
    expect(calls).not.toContain("issue create");
    const off = calls.indexOf(
      "api --method DELETE repos/{owner}/{repo}/issues/42/assignees -f assignees[]=ejclark",
    );
    const back = calls.indexOf("issue reopen 42 --comment The fix did not hold:");
    expect(off).toBeGreaterThan(-1);
    expect(back).toBeGreaterThan(off);
    expect(calls).toContain("<!-- fitness:reopened -->");
    expect(calls).toContain("issue comment 42");
    expect(flyCalls(stub)).toContain("machine start m1");
  });

  it("files a new thread once the closed one is older than 14 days", () => {
    const stub = fixture("stopped");
    closedThread(stub, 15);
    expect(run(stub, "--report").status).toBe(0);
    expect(ghCalls(stub)).toContain("issue create");
    expect(ghCalls(stub)).not.toContain("issue reopen");
  });

  it("keeps the budget across a close: the report closing the thread cannot buy a fourth start", () => {
    const stub = fixture("stopped");
    const outcomes: number[] = [];
    for (let i = 0; i < 4; i++) {
      stopAgain(stub);
      // Each start's pass closes the thread, as the report does right after this script.
      if (existsSync(join(stub, "issue"))) closedThread(stub, 0);
      outcomes.push(run(stub, "--report").status ?? -1);
    }
    expect(outcomes).toEqual([0, 0, 0, 3]);
    expect(flyCalls(stub).match(/machine start m1/g)).toHaveLength(3);
    // The refused one still reopens, so a machine left down has an open thread for the report.
    expect(JSON.parse(readFileSync(join(stub, "issue"), "utf8"))[0].state).toBe("OPEN");
  });

  it("files an issue when the thread cannot be read: a second thread beats silence", () => {
    const stub = fixture("stopped");
    writeFileSync(join(stub, "issue"), "not json");
    expect(run(stub, "--report").status).toBe(0);
    expect(ghCalls(stub)).toContain("issue create");
    expect(flyCalls(stub)).toContain("machine start m1");
  });

  it("does not spend the budget or file anything on a deploy", () => {
    const stub = fixture("stopped");
    seed(stub, 9, { type: "Bot", body: `start\n${MARKER}` });
    expect(run(stub).status).toBe(0);
    expect(ghCalls(stub)).toBe("");
  });
});
