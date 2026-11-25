import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "@rstest/core";
import {
  createIds,
  graphqlWrite,
  idsNeeded,
  mutationFor,
  resolveQuery,
} from "../../scripts/issues-graphql.mjs";
import { ghRest } from "../../scripts/moneypenny/gh.mjs";
import { callerLabel, createBudget, parseRateHeaders } from "../../scripts/rest-budget.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// #8289 slice 1: every session shares one 5,000/hr REST allowance, and a surge emptied it 28
// minutes before the refill (2026-11-24) while the GraphQL allowance sat idle. These specs prove
// the two answers: a run under 1,000 left names its caller, and under 300 issues.mjs writes through
// GraphQL instead of REST.

const ISSUES = resolve("scripts/issues.mjs");
const SHIP = resolve("scripts/ship.sh");

describe("rest budget: reading GitHub's rate headers", () => {
  it("takes the last value of each header, case-insensitively", () => {
    // a proxy's CONNECT answer comes first and carries no rate headers; the API's block is last
    const dump =
      "HTTP/1.1 200 Connection established\r\n\r\nHTTP/2 200\r\nX-RateLimit-Remaining: 812\r\nx-ratelimit-reset: 1795507015\r\nx-ratelimit-resource: core\r\n\r\n";
    expect(parseRateHeaders(dump)).toEqual({
      remaining: 812,
      reset: 1795507015,
      resource: "core",
    });
    expect(parseRateHeaders("").remaining).toBeNull();
    expect(parseRateHeaders(undefined).remaining).toBeNull();
  });

  it("logs the caller once under 1,000, and once more when writes move to GraphQL", () => {
    const lines: string[] = [];
    const b = createBudget({ log: (l) => lines.push(l), caller: () => "issues.mjs update 7" });
    b.observe({ remaining: 1500, resource: "core" });
    expect(lines).toEqual([]);
    expect(b.useGraphql()).toBe(false);
    b.observe({ remaining: 999, resource: "core" });
    b.observe({ remaining: 998, resource: "core" });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/REST 999 left .* caller: issues\.mjs update 7/);
    b.observe({ remaining: 250, resource: "core" });
    b.observe({ remaining: 249, resource: "core" });
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/through GraphQL/);
    expect(b.useGraphql()).toBe(true);
  });

  it("ignores the search bucket, whose own remaining is 30 a minute", () => {
    const lines: string[] = [];
    const b = createBudget({ log: (l) => lines.push(l), caller: () => "x" });
    b.observe({ remaining: 29, resource: "search" });
    expect(lines).toEqual([]);
    expect(b.useGraphql()).toBe(false);
  });

  it("treats a REST refusal for rate limit as an empty allowance", () => {
    const b = createBudget({ log: () => undefined, caller: () => "x" });
    b.exhausted();
    expect(b.useGraphql()).toBe(true);
  });

  it("names the script, its subcommand, branch, CI run and session", () => {
    const label = callerLabel({
      argv: ["node", "/r/scripts/issues.mjs", "update", "8289"],
      env: { GITHUB_RUN_ID: "42", GITHUB_WORKFLOW: "moneypenny", CLAUDE_CODE_SESSION_ID: "s1" },
      branch: "feedback/8289",
    });
    expect(label).toBe(
      "issues.mjs update 8289 · branch feedback/8289 · run 42 (moneypenny) · session s1",
    );
  });
});

describe("rest budget: issues.mjs writes as GraphQL mutations", () => {
  const ids = {
    repo: () => "R_1",
    issue: (n: number) => `I_${n}`,
    label: (name: string) => `L_${name}`,
    issueByDb: (id: number) => `D_${id}`,
    commentByDb: (id: number) => `C_${id}`,
  };

  it("creates with label ids, and shapes the answer like REST", () => {
    const op = {
      method: "POST",
      path: "issues",
      payload: { title: "t", body: "b", labels: ["bug"] },
    };
    expect(idsNeeded(op)).toEqual({ repo: true, issues: [], labels: ["bug"] });
    const m = mutationFor(op, ids);
    expect(m.query).toContain("createIssue");
    expect(m.variables.input).toEqual({
      repositoryId: "R_1",
      title: "t",
      body: "b",
      labelIds: ["L_bug"],
    });
    const answer = m.pick({
      createIssue: {
        issue: {
          id: "I_9",
          databaseId: 90,
          number: 9,
          title: "t",
          state: "OPEN",
          url: "u",
          labels: { nodes: [{ name: "bug" }] },
        },
      },
    });
    expect(answer).toMatchObject({
      id: 90,
      node_id: "I_9",
      number: 9,
      state: "open",
      html_url: "u",
    });
    expect(answer?.labels).toEqual([{ name: "bug" }]);
  });

  it("edits before it closes, in one document, with the close reason", () => {
    const m = mutationFor(
      {
        method: "PATCH",
        path: "issues/7",
        payload: { labels: ["a"], state: "closed", state_reason: "not_planned" },
      },
      ids,
    );
    expect(m.query.indexOf("updateIssue")).toBeLessThan(m.query.indexOf("closeIssue"));
    expect(m.variables.u).toEqual({ id: "I_7", labelIds: ["L_a"] });
    expect(m.variables.c).toEqual({ issueId: "I_7", stateReason: "NOT_PLANNED" });
    // a close alone sends no empty update
    const close = mutationFor(
      {
        method: "PATCH",
        path: "issues/7",
        payload: { state: "closed", state_reason: "completed" },
      },
      ids,
    );
    expect(close.query).not.toContain("updateIssue");
  });

  it("covers comment, comment edit, sub-issue, blocked-by and label adds", () => {
    const of = (method: string, path: string, payload: Record<string, unknown>) =>
      mutationFor({ method, path, payload }, ids);
    expect(of("POST", "issues/7/comments", { body: "hi" }).variables.input).toEqual({
      subjectId: "I_7",
      body: "hi",
    });
    expect(of("PATCH", "issues/comments/55", { body: "hi" }).variables.input).toEqual({
      id: "C_55",
      body: "hi",
    });
    expect(of("POST", "issues/7/sub_issues", { sub_issue_id: 80 }).variables.input).toEqual({
      issueId: "I_7",
      subIssueId: "D_80",
    });
    expect(
      of("POST", "issues/8/dependencies/blocked_by", { issue_id: 70 }).variables.input,
    ).toEqual({ issueId: "I_8", blockingIssueId: "D_70" });
    expect(of("POST", "issues/8/labels", { labels: ["ready"] }).variables.input).toEqual({
      labelableId: "I_8",
      labelIds: ["L_ready"],
    });
    expect(() => of("DELETE", "issues/8/labels/ready", {})).toThrow(/no mutation/);
  });

  it("resolves only what it lacks, in one read, label names as variables", () => {
    const q = resolveQuery({ repo: true, issues: [7], labels: ['say "hi"'] }, "o/r");
    expect(q.query).toContain("i7: issue(number: 7)");
    expect(q.variables).toEqual({ owner: "o", name: "r", l0: 'say "hi"' });
    const sent: string[] = [];
    const book = createIds({
      repo: "o/r",
      send: (query) => {
        sent.push(query);
        return query.startsWith("query")
          ? { repository: { l0: { id: "L_x" } } }
          : { addLabelsToLabelable: { clientMutationId: null } };
      },
    });
    book.register({ node_id: "I_7", number: 7, id: 70 });
    graphqlWrite({ method: "POST", path: "issues/7/labels", payload: { labels: ["x"] } }, book, {
      send: (query, variables) => {
        sent.push(query);
        expect(variables.input).toEqual({ labelableId: "I_7", labelIds: ["L_x"] });
        return {};
      },
    });
    expect(sent.filter((s) => s.startsWith("query"))).toHaveLength(1); // the label, not the issue
    expect(() =>
      createIds({ repo: "o/r", send: () => ({ repository: {} }) }).label("nope"),
    ).toThrow(/cannot create a label/);
  });
});

/**
 * A curl that answers like GitHub at a chosen REST `remaining`: it writes the rate headers to the
 * `-D` file, logs every call, saves each GraphQL document, and answers a resolve read or an
 * updateIssue. `refuseWrites` makes every REST write a 403 for rate limit, as GitHub does when spent;
 * `refuseAll` refuses the reads too, the state at 0 left. An issue read over GraphQL (its query asks
 * for `subIssuesSummary`) answers with the issue.
 */
function runAt(
  remaining: number,
  argv: string[],
  { refuseWrites = false, refuseAll = false } = {},
) {
  const dir = mkdtempSync(join(tmpdir(), "rest-budget-"));
  const issue = '{"id":70,"node_id":"I_7","number":7,"title":"t","state":"open","labels":[]}';
  writeFileSync(
    join(dir, "curl"),
    `#!/bin/bash
echo "$@" >> "${dir}/curl.log"
prev=""; hdr=""; method=GET; url="\${@: -1}"
for a in "$@"; do [ "$prev" = "-D" ] && hdr="$a"; [ "$prev" = "-X" ] && method="$a"; prev="$a"; done
[ -n "$hdr" ] && printf 'HTTP/2 200\\r\\nx-ratelimit-remaining: %s\\r\\nx-ratelimit-resource: core\\r\\n\\r\\n' "${remaining}" > "$hdr"
in="$(cat)"
case "$url" in
  */graphql)
    printf '%s\\n' "$in" >> "${dir}/graphql.log"
    case "$in" in
      *subIssuesSummary*) echo '{"data":{"repository":{"issue":{"id":"I_7","databaseId":70,"number":7,"title":"t","state":"OPEN","url":"https://x/7","labels":{"nodes":[]},"subIssuesSummary":{"total":0,"completed":0},"issueDependenciesSummary":{"blockedBy":0}}}}}' ;;
      *'"query":"query('*) echo '{"data":{"repository":{"l0":{"id":"LA_bug"}}}}' ;;
      *) echo '{"data":{"u":{"issue":{"id":"I_7","databaseId":70,"number":7,"title":"t","state":"OPEN","url":"https://x/7","labels":{"nodes":[{"name":"bug"}]}}}}}' ;;
    esac ;;
  *)
    if [ "${refuseAll ? "1" : ""}" = 1 ] || { [ "$method" != GET ] && [ "${refuseWrites ? "1" : ""}" = 1 ]; }; then
      echo '{"message":"API rate limit exceeded for user ID 1."}'; exit 22
    fi
    echo '${issue}' ;;
esac
`,
  );
  chmodSync(join(dir, "curl"), 0o755);
  const res = spawnSync(process.execPath, [ISSUES, ...argv], {
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      GH_TOKEN: "stub",
      GITHUB_REPOSITORY: "o/r",
    },
    encoding: "utf8",
  });
  const read = (f: string) => {
    try {
      return readFileSync(join(dir, f), "utf8");
    } catch {
      return "";
    }
  };
  const calls = read("curl.log").trim().split("\n").filter(Boolean);
  return {
    res,
    rest: calls.filter((c) => !c.endsWith("/graphql")),
    restWrites: calls.filter((c) => / -X /.test(` ${c} `) && !c.endsWith("/graphql")),
    graphql: read("graphql.log"),
  };
}

describe("rest budget: issues.mjs at the edge of the allowance (end to end)", () => {
  it("with 250 left, the label write goes through GraphQL and the caller is named", () => {
    const { res, restWrites, graphql } = runAt(250, ["update", "7", "--add", "bug"]);
    expect(res.status).toBe(0);
    expect(restWrites).toEqual([]);
    expect(graphql).toContain("updateIssue");
    expect(graphql).toContain("LA_bug");
    expect(res.stderr).toMatch(/rate-limit: REST 250 left .* caller: issues\.mjs update 7/);
    expect(res.stdout).toMatch(/^#7 /);
  });

  it("with 1,500 left, the write stays on REST and nothing is logged", () => {
    const { res, restWrites, graphql } = runAt(1500, ["update", "7", "--add", "bug"]);
    expect(res.status).toBe(0);
    expect(restWrites).toHaveLength(1);
    expect(graphql).toBe("");
    expect(res.stderr).not.toMatch(/rate-limit:/);
  });

  it("a REST write refused for rate limit is sent again through GraphQL", () => {
    const { res, restWrites, graphql } = runAt(1500, ["update", "7", "--add", "bug"], {
      refuseWrites: true,
    });
    expect(res.status).toBe(0);
    expect(restWrites).toHaveLength(1);
    expect(graphql).toContain("updateIssue");
  });

  // The measured gap (2026-11-24, #8346's repair): at 0 left `update` stopped at its first act, the
  // issue read, so the GraphQL write behind it never ran.
  it("at 0 left, update reads the issue through GraphQL and still posts its comment", () => {
    const dir = mkdtempSync(join(tmpdir(), "rest-budget-comment-"));
    writeFileSync(join(dir, "c.md"), "hello");
    const { res, rest, graphql } = runAt(0, ["update", "7", "--comment-file", join(dir, "c.md")], {
      refuseAll: true,
    });
    expect(res.status, res.stderr).toBe(0);
    expect(rest).toHaveLength(1); // the one refused read, never sent again over REST
    expect(graphql).toContain("subIssuesSummary");
    expect(graphql).toContain("addComment");
    expect(res.stdout).toMatch(/^#7 /);
  });

  it("at 0 left, show prints the issue read through GraphQL, its board column included", () => {
    const { res, graphql } = runAt(0, ["show", "7"], { refuseAll: true });
    expect(res.status, res.stderr).toBe(0);
    expect(graphql).toContain("issue(number: 7)");
    expect(res.stdout).toMatch(/^#7 \[[^\]]+\] t /);
  });
});

describe("rest budget: ship.sh names its caller", () => {
  it("logs once per run under 1,000, never for the search bucket or above the line", () => {
    const dir = mkdtempSync(join(tmpdir(), "ship-rate-"));
    writeFileSync(
      join(dir, "curl"),
      `#!/bin/bash
prev=""; hdr=""
for a in "$@"; do [ "$prev" = "-D" ] && hdr="$a"; prev="$a"; done
printf 'HTTP/2 200\\r\\nx-ratelimit-remaining: %s\\r\\nx-ratelimit-resource: %s\\r\\n\\r\\n' "$STUB_LEFT" "$STUB_RESOURCE" > "$hdr"
printf '{}\\n__SHIP_HTTP__200'
`,
    );
    chmodSync(join(dir, "curl"), 0o755);
    execFileSync("git", ["init", "-q", "-b", "feedback/8289", dir], { env: hermeticGitEnv({}) });
    execFileSync("git", ["-C", dir, "remote", "add", "origin", "https://github.com/o/r.git"], {
      env: hermeticGitEnv({}),
    });
    const run = (left: string, resource = "core") =>
      spawnSync(
        "bash",
        [
          "-c",
          `source "${SHIP}"; SHIP_SUBCOMMAND=open; api GET /pulls/1 >/dev/null; api GET /pulls/1 >/dev/null`,
        ],
        {
          cwd: dir,
          env: hermeticGitEnv({
            GH_TOKEN: "stub",
            PATH: `${dir}:${process.env.PATH ?? ""}`,
            STUB_LEFT: left,
            STUB_RESOURCE: resource,
            TMPDIR: dir,
          }),
          encoding: "utf8",
        },
      );
    const low = run("812");
    expect(low.status).toBe(0);
    expect(low.stderr.match(/rate-limit:/g)).toHaveLength(1);
    expect(low.stderr).toMatch(/REST 812 left .* caller: ship\.sh open · branch feedback\/8289/);
    expect(run("4000").stderr).not.toMatch(/rate-limit:/);
    expect(run("20", "search").stderr).not.toMatch(/rate-limit:/);
  });
});

// #8289 slice 2: only issues.mjs and ship.sh named their caller, so the 83 scripts on gh.mjs's
// `ghRest` (every Moneypenny lane, `rank`, `work-gate`, the digests) spent the shared allowance
// unseen. `ghRest` is now `restCall`'s GET, so it reports into the same budget.
describe("rest budget: every script on ghRest names its caller", () => {
  const headerDump = (left: number, resource = "core") =>
    `HTTP/2 200\r\nx-ratelimit-remaining: ${left}\r\nx-ratelimit-resource: ${resource}\r\n\r\n`;
  const dumpTo = (args: string[]) => {
    const file = args[args.indexOf("-D") + 1];
    if (!file) throw new Error("ghRest asked curl for no header dump (-D)");
    return file;
  };
  const answeringAt =
    (left: number, resource = "core") =>
    (_cmd: string, args: string[]) => {
      writeFileSync(dumpTo(args), headerDump(left, resource));
      return '{"number":7}';
    };

  it("reports each read's remaining count to the budget it is given", () => {
    const lines: string[] = [];
    const into = createBudget({ log: (l) => lines.push(l), caller: () => "route.mjs sweep" });
    expect(ghRest("issues/7", { token: "t", run: answeringAt(640), into })).toEqual({ number: 7 });
    ghRest("issues/8", { token: "t", run: answeringAt(639), into });
    expect(into.remaining()).toBe(639);
    expect(lines).toEqual([
      "rate-limit: REST 640 left of the shared hourly allowance — caller: route.mjs sweep",
    ]);
  });

  it("reports a refused read too, and ignores the search bucket", () => {
    const into = createBudget({ log: () => undefined });
    ghRest("search/issues?q=x", { token: "t", run: answeringAt(12, "search"), into });
    expect(into.remaining()).toBeNull();
    const refused = (_cmd: string, args: string[]) => {
      writeFileSync(dumpTo(args), headerDump(0));
      throw Object.assign(new Error("Command failed: curl\ncurl: (22) … error: 403"), {
        stdout: '{"message":"API rate limit exceeded for user ID 1."}',
      });
    };
    expect(() => ghRest("issues/7", { token: "t", run: refused, into })).toThrow(/rate limit/);
    expect(into.remaining()).toBe(0);
  });

  it("end to end: a script on ghRest logs its caller once, under 1,000 left only", () => {
    const dir = mkdtempSync(join(tmpdir(), "ghrest-budget-"));
    writeFileSync(
      join(dir, "curl"),
      `#!/bin/bash
prev=""; hdr=""
for a in "$@"; do [ "$prev" = "-D" ] && hdr="$a"; prev="$a"; done
printf 'HTTP/2 200\\r\\nx-ratelimit-remaining: %s\\r\\nx-ratelimit-resource: core\\r\\n\\r\\n' "$STUB_LEFT" > "$hdr"
echo '{"number":7}'
`,
    );
    chmodSync(join(dir, "curl"), 0o755);
    const probe = join(dir, "route-probe.mjs");
    const gh = pathToFileURL(resolve("scripts/moneypenny/gh.mjs")).href;
    writeFileSync(
      probe,
      `import { ghRest } from ${JSON.stringify(gh)};\nghRest("issues/7");\nghRest("issues/8");\n`,
    );
    const run = (left: string) =>
      spawnSync(process.execPath, [probe, "sweep"], {
        cwd: dir,
        env: {
          ...process.env,
          PATH: `${dir}:${process.env.PATH}`,
          GH_TOKEN: "stub",
          GITHUB_REPOSITORY: "o/r",
          GITHUB_RUN_ID: "42",
          GITHUB_WORKFLOW: "moneypenny",
          STUB_LEFT: left,
        },
        encoding: "utf8",
      });
    const low = run("812");
    expect(low.status, low.stderr).toBe(0);
    expect(low.stderr.match(/rate-limit:/g)).toHaveLength(1);
    expect(low.stderr).toMatch(
      /REST 812 left .* caller: route-probe\.mjs sweep · run 42 \(moneypenny\)/,
    );
    expect(run("4000").stderr).not.toMatch(/rate-limit:/);
  });
});
