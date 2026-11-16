import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { digestLines, memoryClaims, recent, redact } from "../../scripts/dream-digest.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

const SCRIPT = resolve("scripts/dream-digest.mjs");

const row = (value: unknown) => JSON.stringify(value);
const typed = (text: string) =>
  row({ type: "user", timestamp: "2026-11-01T00:00:00Z", message: { content: text } });

describe("which sessions a review reads", () => {
  const dir = mkdtempSync(join(tmpdir(), "dream-recent-"));
  const session = (name: string, started: string, touched: string) => {
    const path = join(dir, name);
    writeFileSync(path, `${JSON.stringify({ type: "user", timestamp: started })}\n`);
    utimesSync(path, new Date(touched), new Date(touched));
    return path;
  };
  const old = session("old.jsonl", "2026-08-21T00:00:00Z", "2026-10-23T00:00:00Z");
  const fresh = session("fresh.jsonl", "2026-11-01T00:00:00Z", "2026-11-01T00:00:00Z");
  const middle = session("middle.jsonl", "2026-10-20T00:00:00Z", "2026-10-21T00:00:00Z");
  afterEach(() => {
    delete process.env.AGENT_TRANSCRIPTS_DIR;
  });

  it("ranks by when a session started, not by when the file was last touched", () => {
    process.env.AGENT_TRANSCRIPTS_DIR = dir;
    expect(recent(3)).toEqual([fresh, middle, old]);
    expect(recent(1)).toEqual([fresh]);
  });

  it("can keep only sessions started after a date, as the next review needs", () => {
    process.env.AGENT_TRANSCRIPTS_DIR = dir;
    expect(recent(20, "2026-11-01")).toEqual([fresh]);
  });
});

describe("memory review digest", () => {
  it("keeps what a person typed and drops what the harness injected", () => {
    const digest = digestLines([
      typed("why does this keep failing"),
      typed("<task-notification>done</task-notification>"),
      typed("  <system-reminder>noise</system-reminder>"),
      typed("[Request interrupted by user]"),
      typed("This session is being continued from a previous conversation that ran out."),
      row({ type: "user", isSidechain: true, message: { content: "a sub-agent prompt" } }),
      row({ type: "user", isMeta: true, message: { content: "a skill's own text" } }),
    ]);
    expect(digest.typed.map((t: { text: string }) => t.text)).toEqual([
      "why does this keep failing",
    ]);
  });

  it("keeps tool errors and counts tools, because bad configuration shows up there first", () => {
    const digest = digestLines([
      row({
        type: "assistant",
        message: {
          content: [
            { type: "tool_use", name: "Bash", input: {} },
            { type: "tool_use", name: "Bash", input: {} },
            { type: "tool_use", name: "Skill", input: { skill: "ship" } },
          ],
        },
      }),
      row({
        type: "user",
        timestamp: "2026-11-01T00:00:01Z",
        message: {
          content: [{ type: "tool_result", is_error: true, content: "command not found: timeout" }],
        },
      }),
    ]);
    expect(digest.tools).toEqual({ Bash: 2, Skill: 1 });
    expect(digest.skills).toEqual({ ship: 1 });
    expect(digest.errors[0].text).toBe("command not found: timeout");
  });

  it("removes credentials before text leaves the transcript", () => {
    expect(redact("token ghp_abcdefghijklmnop123 here")).not.toContain("ghp_abcdefghijklmnop123");
    expect(redact("API_KEY=abcdefghijklmnopqrstuvwx")).toContain("[redacted]");
    expect(redact("ordinary words stay")).toBe("ordinary words stay");
    expect(digestLines([typed("my key is sk-ant-abcdefghijklmnop")]).typed[0].text).toContain(
      "[redacted]",
    );
  });

  it("survives a corrupt line and counts compactions", () => {
    const digest = digestLines([
      "not json",
      row({ subtype: "compact_boundary", timestamp: "2026-11-01T00:00:00Z" }),
    ]);
    expect(digest.compactions).toBe(1);
    expect(digest.first).toBe("2026-11-01T00:00:00Z");
  });

  it("finds the paths and issues a memory cites", () => {
    expect(
      memoryClaims("See `scripts/steer/pins.mjs` and `README.md`, after #5135 (#51 is too short)"),
    ).toMatchObject({
      paths: ["scripts/steer/pins.mjs"],
      issues: [5135],
    });
  });

  it("finds the npm scripts a memory tells a session to run", () => {
    expect(
      memoryClaims("Run `npm run -s issues -- update 4` then npm run steer:build").npmScripts,
    ).toEqual(["issues", "steer:build"]);
  });

  describe("which command a flag belongs to", () => {
    const flags = (text: string) => memoryClaims(text).flags;

    it("reads a flag as an argument of the nearest command to its left", () => {
      expect(flags("`node scripts/a.mjs --one` then `npm run b -- --two`")).toEqual([
        { script: "scripts/a.mjs", flag: "one" },
        { npm: "b", flag: "two" },
      ]);
    });

    // The runbook line that taught this: --prev is gather's flag, and design.mjs is only named after
    // it as the shape of a manifest. Reading by line would tell a review to delete a working flag.
    it("does not take a script merely named beside the flags as their command", () => {
      expect(
        flags("`npm run steer:gather -- --prev <dir>` (`scripts/steer/design.mjs` shape)"),
      ).toEqual([{ npm: "steer:gather", flag: "prev" }]);
    });

    it("keeps following the command across prose on the same line", () => {
      expect(flags("`node scripts/a.mjs <pr>`, read every diff, then `--apply --commit`")).toEqual([
        { script: "scripts/a.mjs", flag: "apply" },
        { script: "scripts/a.mjs", flag: "commit" },
      ]);
    });

    it("does not read another tool's flag as the script's", () => {
      expect(flags("`node scripts/a.mjs --one` then `gh pr merge --squash`")).toEqual([
        { script: "scripts/a.mjs", flag: "one" },
      ]);
    });

    it("does not carry a command onto the next line, or read a flag with no command", () => {
      expect(flags("`node scripts/a.mjs`\nthen pass --one")).toEqual([]);
      expect(flags("a dash -- in prose and --one alone")).toEqual([]);
    });
  });

  describe("future tense on an issue", () => {
    const future = (text: string) => memoryClaims(text).futureOnIssue;

    it("reads wording that waits on an issue", () => {
      expect(future("Once #5135 has merged, pass capabilities.")).toEqual([5135]);
      expect(future("until #6001 lands use the old path")).toEqual([6001]);
      expect(future("when #6002 merges")).toEqual([6002]);
    });

    it("leaves wording that only cites one", () => {
      expect(future("Since #5135, Done sends a comment.")).toEqual([]);
      expect(future("After #5135 merged we stopped.")).toEqual([]);
      expect(future("See #5135. It merges rules.")).toEqual([]);
    });
  });
});

// End to end through the command line, so the wiring is in the test: a real git repo standing in for
// origin/main, and a stub gh that says which issues are closed. No network, no real memory folder.
describe("stale report on a memory folder", () => {
  // A stub gh answers the REST read the report makes; "fails" stands in for no login, an expired
  // token or a spent rate bucket, and logs each call so the spec can count them.
  const GH_ANSWERS =
    '#!/bin/sh\necho "$@" >> "$(dirname "$0")/calls"\ncase "$2" in */123) echo closed;; *) echo open;; esac\n';
  const GH_FAILS =
    '#!/bin/sh\necho "$@" >> "$(dirname "$0")/calls"\necho "HTTP 403: API rate limit exceeded" >&2\nexit 1\n';

  function run(
    memories: Record<string, string>,
    { gh = GH_ANSWERS, main = true, packageJson = true } = {},
  ) {
    const root = mkdtempSync(join(tmpdir(), "dream-stale-"));
    const repo = join(root, "repo");
    const memory = join(root, "memory");
    const bin = join(root, "bin");
    mkdirSync(join(repo, "scripts"), { recursive: true });
    mkdirSync(memory);
    mkdirSync(bin);
    if (packageJson)
      writeFileSync(
        join(repo, "package.json"),
        JSON.stringify({
          scripts: { live: "node scripts/live.mjs", nodejsless: "rstest run" },
        }),
      );
    writeFileSync(join(repo, "scripts", "live.mjs"), 'const a = flag("real");\n');
    const env = hermeticGitEnv({ PATH: `${bin}:${process.env.PATH}` });
    const git = (...args: string[]) =>
      spawnSync(
        "git",
        ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args],
        { cwd: repo, env, encoding: "utf8" },
      );
    git("init", "-q");
    git("add", "-A");
    git("commit", "-q", "-m", "base");
    if (main) git("update-ref", "refs/remotes/origin/main", "HEAD");
    // Only #123 is closed; every other number reads as open.
    writeFileSync(join(bin, "gh"), gh);
    chmodSync(join(bin, "gh"), 0o755);
    for (const [name, text] of Object.entries(memories)) writeFileSync(join(memory, name), text);
    const res = spawnSync("node", [SCRIPT, "--memory", memory], {
      cwd: repo,
      env,
      encoding: "utf8",
    });
    expect(res.status).toBe(0);
    const calls = existsSync(join(bin, "calls"))
      ? readFileSync(join(bin, "calls"), "utf8").trim().split("\n")
      : [];
    return { rows: JSON.parse(res.stdout), stderr: res.stderr, calls };
  }
  const fixture = (memories: Record<string, string>) => run(memories).rows;

  // #6717: a gh that failed read as "open", so a memory waiting on a closed issue came back clean.
  it("lists an issue gh could not read as unread, never as open, and reads it once", () => {
    const { rows, stderr, calls } = run(
      { "a.md": "Wait until #6699 lands.", "b.md": "See #6699." },
      { gh: GH_FAILS },
    );
    for (const row of rows) {
      expect(row.unreadIssues).toEqual([6699]);
      expect(row.closedIssues).toEqual([]);
    }
    expect(rows[0].futureOnClosedIssue).toEqual([]);
    expect(calls).toHaveLength(1);
    expect(stderr).toContain("#6699");
    expect(stderr).toContain("HTTP 403");
  });

  it("reads an issue through REST, which answers where gh's GraphQL is refused", () => {
    const { rows, calls } = run({ "a.md": "Once #123 has merged, do the other thing." });
    expect(rows[0]).toMatchObject({ closedIssues: [123], unreadIssues: [] });
    expect(calls).toEqual(["api repos/{owner}/{repo}/issues/123 --jq .state"]);
  });

  it("says unread, not nothing missing, when there is no origin/main to read", () => {
    const [row] = run(
      { "a.md": "Run `npm run live -- --real` and `node scripts/live.mjs --real`." },
      { main: false },
    ).rows;
    expect(row).toMatchObject({
      missingPaths: "unread: not checked, so not clean",
      missingNpmScripts: "unread: not checked, so not clean",
      flagsNotInScript: "unread: not checked, so not clean",
    });
  });

  it("says unread on the npm rows when main has no package.json, and still checks paths", () => {
    const [cites, quiet] = run(
      {
        "a.md": "Run `npm run live -- --real`, see `scripts/gone.mjs`.",
        "b.md": "Nothing to run here.",
      },
      { packageJson: false },
    ).rows;
    expect(cites).toMatchObject({
      missingPaths: ["scripts/gone.mjs"],
      missingNpmScripts: "unread: not checked, so not clean",
      flagsNotInScript: "unread: not checked, so not clean",
    });
    // A memory that cites no npm script has nothing left unchecked.
    expect(quiet).toMatchObject({ missingNpmScripts: [], flagsNotInScript: [] });
  });

  it("lists a dead npm script, a dead flag and future tense on a closed issue", () => {
    const [row] = fixture({
      "a.md": [
        "Run `npm run gone`.",
        "Run `npm run live -- --real --dead`.",
        "Run `node scripts/live.mjs --also-dead`.",
        "Once #123 has merged, do the other thing.",
      ].join("\n"),
    });
    expect(row.missingNpmScripts).toEqual(["gone"]);
    expect(row.flagsNotInScript).toEqual([
      "--dead on scripts/live.mjs",
      "--also-dead on scripts/live.mjs",
    ]);
    expect(row.futureOnClosedIssue).toEqual([123]);
    expect(row.closedIssues).toEqual([123]);
  });

  it("lists nothing on a clean memory", () => {
    const [row] = fixture({
      "a.md": [
        "Run `npm run live -- --real` and `node scripts/live.mjs --real`.",
        "`npm run nodejsless -- --anything` runs no script of ours to check against.",
        "Once #456 has merged, do the other thing.",
        "The file lives at /usr/local/bin/thing.sh and `/usr/lib/x.md`.",
      ].join("\n"),
    });
    expect(row).toMatchObject({
      missingPaths: [],
      closedIssues: [],
      unreadIssues: [],
      missingNpmScripts: [],
      flagsNotInScript: [],
      futureOnClosedIssue: [],
    });
  });

  it("reports a script that is gone even when it is run with no flags", () => {
    const [row] = fixture({ "a.md": "Run `node scripts/gone.mjs <pr>`." });
    expect(row.missingPaths).toEqual(["scripts/gone.mjs"]);
  });

  it("does not read an inherited object property as an npm script", () => {
    const [row] = fixture({ "a.md": "Run `npm run constructor -- --flag`." });
    expect(row.missingNpmScripts).toEqual(["constructor"]);
    expect(row.flagsNotInScript).toEqual([]);
  });

  it("reports a script that is gone once, as a missing path, not its flags as well", () => {
    const [row] = fixture({ "a.md": "Run `node scripts/gone.mjs --flag`." });
    expect(row.missingPaths).toEqual(["scripts/gone.mjs"]);
    expect(row.flagsNotInScript).toEqual([]);
  });
});
