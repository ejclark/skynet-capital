import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  callerOf,
  classify,
  formatSummary,
  normalizePath,
  summarize,
} from "../../scripts/rest-meter.mjs";

// #8289 slice 2: five cuts each measured their spender with a logging gh/curl/fetch built by hand
// and thrown away. `npm run rest:meter -- <command>` is that measurement, committed: these specs
// pin how a logged call is classified and that a metered command still runs as itself.

const METER = resolve("scripts/rest-meter.mjs");

describe("rest meter: what one call costs", () => {
  it("reads a gh api call's endpoint past its flags, and its verb", () => {
    expect(
      classify({
        via: "gh",
        args: ["api", "-H", "Accept: x", "repos/o/r/issues/12", "--jq", ".x"],
      }),
    ).toEqual({ kind: "rest", endpoint: "GET repos/{repo}/issues/:n", paginated: false });
    expect(
      classify({ via: "gh", args: ["api", "-X", "PATCH", "repos/o/r/pulls/3"] }).endpoint,
    ).toBe("PATCH repos/{repo}/pulls/:n");
    expect(
      classify({ via: "gh", args: ["api", "repos/o/r/issues/1/labels", "-f", "labels[]=x"] })
        .endpoint,
    ).toBe("POST repos/{repo}/issues/:n/labels");
    expect(classify({ via: "gh", args: ["api", "--paginate", "repos/o/r/pulls"] }).paginated).toBe(
      true,
    );
    expect(classify({ via: "gh", args: ["api", "graphql", "-f", "query=x"] }).kind).toBe("graphql");
  });

  it("counts a gh subcommand as a gh command, and gh's offline commands as nothing", () => {
    expect(classify({ via: "gh", args: ["pr", "view", "12", "--json", "state"] })).toEqual({
      kind: "gh-cli",
      endpoint: "gh pr view",
    });
    expect(classify({ via: "gh", args: ["auth", "token"] }).kind).toBe("none");
    expect(classify({ via: "gh", args: ["--version"] }).kind).toBe("none");
  });

  it("reads curl's URL and method, and ignores anything not GitHub's API", () => {
    const h = ["-sS", "-D", "/tmp/h", "-H", "Authorization: Bearer t"];
    expect(
      classify({
        via: "curl",
        args: [
          ...h,
          "https://api.github.com/repos/o/r/commits/" + "a".repeat(40) + "/check-runs?per_page=100",
        ],
      }),
    ).toEqual({
      kind: "rest",
      endpoint: "GET repos/{repo}/commits/:sha/check-runs",
    });
    expect(
      classify({
        via: "curl",
        args: [...h, "-X", "POST", "https://api.github.com/repos/o/r/issues/9/comments"],
      }).endpoint,
    ).toBe("POST repos/{repo}/issues/:n/comments");
    expect(
      classify({
        via: "curl",
        args: [...h, "--data-binary", "@-", "https://api.github.com/graphql"],
      }).kind,
    ).toBe("graphql");
    expect(classify({ via: "curl", args: ["https://example.com/x"] }).kind).toBe("other");
    expect(
      classify({
        via: "fetch",
        url: "https://api.github.com/repos/o/r/pulls?state=open",
        method: "GET",
      }).endpoint,
    ).toBe("GET repos/{repo}/pulls");
  });

  it("folds ids, shas and the repo out of a path", () => {
    expect(normalizePath("/repos/ejclark/skynet-capital/issues/8289/events?page=2")).toBe(
      "repos/{repo}/issues/:n/events",
    );
    expect(normalizePath("repos/o/r/git/ref/tags/claim/feedback-8289")).toBe(
      "repos/{repo}/git/ref/tags/claim/feedback-8289",
    );
  });

  it("names the script that made a call, with its subcommand", () => {
    expect(callerOf("/usr/bin/node /home/x/repo/scripts/stuck-pr-scan.mjs --json")).toBe(
      "scripts/stuck-pr-scan.mjs",
    );
    expect(callerOf("bash scripts/ship.sh open fix(x): y --body-file b")).toBe(
      "scripts/ship.sh open",
    );
    expect(callerOf("node scripts/issues.mjs update 8289 --comment-file f")).toBe(
      "scripts/issues.mjs update",
    );
    expect(callerOf("")).toBe("(unknown)");
  });
});

describe("rest meter: the summary", () => {
  it("ranks callers by REST first and endpoints by count", () => {
    const s = summarize([
      { via: "gh", args: ["api", "graphql"], caller: "node scripts/a.mjs" },
      {
        via: "curl",
        args: ["https://api.github.com/repos/o/r/issues/1"],
        caller: "node scripts/b.mjs",
      },
      {
        via: "curl",
        args: ["https://api.github.com/repos/o/r/issues/2"],
        caller: "node scripts/b.mjs",
      },
      { via: "gh", args: ["api", "--paginate", "repos/o/r/pulls"], caller: "node scripts/a.mjs" },
      { via: "gh", args: ["auth", "token"], caller: "bash scripts/ship.sh open" },
    ]);
    expect(s.totals).toEqual({ rest: 3, graphql: 1, ghCli: 0, paginated: 1 });
    expect(s.callers.map((c) => c.caller)).toEqual(["scripts/b.mjs", "scripts/a.mjs"]);
    expect(s.endpoints[0]).toEqual({ endpoint: "GET repos/{repo}/issues/:n", count: 2 });
    const text = formatSummary(s);
    expect(text).toContain("rest-meter: 3+ REST · 1 GraphQL · 0 gh commands");
    expect(text).toContain("1 paginated gh api call(s)");
  });
});

describe("rest meter: a metered run", () => {
  it("logs gh, curl and fetch calls by caller, passes output through, and keeps the exit status", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rest-meter-spec-"));
    const stubs = join(dir, "stubs");
    spawnSync("mkdir", ["-p", stubs]);
    for (const tool of ["gh", "curl"])
      writeFileSync(join(stubs, tool), `#!/usr/bin/env bash\necho "${tool}-stub $*"\n`, {
        mode: 0o755,
      });
    const server = createServer((_req, res) => res.end("ok"));
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", () => done()));
    const port = (server.address() as { port: number }).port;
    const script = join(dir, "spender.mjs");
    writeFileSync(
      script,
      [
        'import { execFileSync } from "node:child_process";',
        'process.stdout.write(execFileSync("gh", ["api", "repos/o/r/issues/1"], { encoding: "utf8" }));',
        'process.stdout.write(execFileSync("curl", ["-sS", "https://api.github.com/graphql"], { encoding: "utf8" }));',
        `await (await fetch("http://127.0.0.1:${port}/x")).text();`,
        "process.exit(3);",
      ].join("\n"),
    );
    const log = join(dir, "calls.jsonl");
    const run = await new Promise<{ status: number | null; stdout: string; stderr: string }>(
      (done) => {
        // async spawn: the fetch above needs this process's event loop free to answer it
        const child = spawn(
          process.execPath,
          [METER, "--log", log, "--", process.execPath, script],
          { env: { ...process.env, PATH: `${stubs}:${process.env.PATH}` } },
        );
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (d: Buffer) => (stdout += d));
        child.stderr.on("data", (d: Buffer) => (stderr += d));
        child.on("close", (status: number | null) => done({ status, stdout, stderr }));
      },
    );
    server.close();
    expect(run.status).toBe(3);
    expect(run.stdout).toContain("gh-stub api repos/o/r/issues/1");
    expect(run.stdout).toContain("curl-stub -sS https://api.github.com/graphql");
    expect(run.stderr).toContain("rest-meter: 1 REST · 1 GraphQL · 0 gh commands");
    expect(run.stderr).toMatch(/1\s+1\s+0\s+\/\S*\/spender\.mjs/);
    const entries = readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    expect(entries.map((e) => e.via).sort()).toEqual(["curl", "fetch", "gh"]);
    expect(entries.find((e) => e.via === "fetch").url).toBe(`http://127.0.0.1:${port}/x`);
  });
});
