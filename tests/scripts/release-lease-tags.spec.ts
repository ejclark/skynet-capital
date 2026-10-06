import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  dropLeaseTags,
  isSemanticReleaseProcess,
  leaseTags,
  prepare,
} from "../../scripts/release-lease-tags.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// The semantic-release plugin that keeps claim leases (refs/tags/claim/<slug>) out of the release
// job's `fetch --tags` / `push --tags`. Driven against real git repos in a temp dir, because the
// failure is git's own refusal, not anything a fake would reproduce faithfully.
//
// The anchor is run 37397356694 (#4715): the plan lane released and re-took `claim/plan-4393`
// while `release · deploy` was installing, and semantic-release's fetch died with
// `! [rejected] claim/plan-4393 -> claim/plan-4393  (would clobber existing tag)`.

const PLUGIN = resolve("scripts/release-lease-tags.mjs");
/** Every git call here — ours and the plugin's — runs scrubbed of GIT_DIR & co. (hermetic-git.spec). */
const env = hermeticGitEnv();

const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", ["-c", "user.email=ci@example.com", "-c", "user.name=ci", ...args], {
    cwd,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const tryGit = (cwd: string, ...args: string[]) =>
  spawnSync("git", args, { cwd, env, encoding: "utf8" });

/** A remote holding one release tag and one lease, a lane clone, and a release-runner clone. */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "release-lease-"));
  const remote = join(root, "remote.git");
  const lane = join(root, "lane");
  const runner = join(root, "runner");
  git(root, "init", "-q", "--bare", "-b", "main", remote);
  git(root, "clone", "-q", remote, lane);
  git(lane, "commit", "-q", "--allow-empty", "-m", "one");
  git(lane, "push", "-q", "origin", "HEAD:main");
  git(lane, "tag", "-a", "-m", "v1", "v1.0.0");
  git(lane, "tag", "-a", "-m", "stamp 1", "claim/plan-4393");
  git(lane, "push", "-q", "origin", "--tags");
  git(root, "clone", "-q", remote, runner); // actions/checkout: every tag, local
  /** The plan lane releasing its lease (DELETE git/refs/tags/claim/…). */
  const release = () => {
    git(lane, "push", "-q", "origin", ":refs/tags/claim/plan-4393");
    git(lane, "tag", "-d", "claim/plan-4393");
  };
  /** …and re-taking it: a new stamped tag object under the same name. */
  const retake = () => {
    git(lane, "tag", "-a", "-m", "stamp 2", "claim/plan-4393");
    git(lane, "push", "-q", "origin", "claim/plan-4393");
  };
  const remoteTags = () => git(remote, "tag", "--list").split("\n").filter(Boolean);
  const localTags = () => git(runner, "tag", "--list").split("\n").filter(Boolean);
  return { remote, runner, release, retake, remoteTags, localTags };
}

describe("leaseTags", () => {
  it("picks only claim/* lines out of `git tag --list` output", () => {
    expect(leaseTags("claim/plan-4393\nv1.2.3\nclaim/feedback-1020\n\n")).toEqual([
      "claim/plan-4393",
      "claim/feedback-1020",
    ]);
  });

  it("returns nothing for empty or missing output", () => {
    expect(leaseTags("")).toEqual([]);
    expect(leaseTags(undefined)).toEqual([]);
  });
});

describe("isSemanticReleaseProcess", () => {
  it("matches the npx bin shim and the resolved bin script", () => {
    expect(isSemanticReleaseProcess("/repo/node_modules/.bin/semantic-release")).toBe(true);
    expect(
      isSemanticReleaseProcess("/repo/node_modules/semantic-release/bin/semantic-release.js"),
    ).toBe(true);
  });

  it("does not match a test runner, so importing the plugin never deletes the caller's tags", () => {
    expect(isSemanticReleaseProcess("/repo/node_modules/vitest/vitest.mjs")).toBe(false);
    expect(isSemanticReleaseProcess(undefined)).toBe(false);
  });
});

describe("the fetch half — a lease re-taken during the job", () => {
  it("reproduces #4715: semantic-release's `fetch --tags` refuses to clobber the stale copy", () => {
    const f = fixture();
    f.release();
    f.retake();
    const fetch = tryGit(f.runner, "fetch", "--tags", "--", f.remote);
    expect(fetch.status).not.toBe(0);
    expect(fetch.stderr).toContain("would clobber existing tag");
  });

  it("fetches cleanly once the local lease tags are dropped, keeping the release tags", () => {
    const f = fixture();
    f.release();
    f.retake();
    expect(dropLeaseTags({ cwd: f.runner, env })).toEqual(["claim/plan-4393"]);
    expect(f.localTags()).toEqual(["v1.0.0"]);
    expect(tryGit(f.runner, "fetch", "--tags", "--", f.remote).status).toBe(0);
  });

  it("drops the tags at load when semantic-release is the process", () => {
    const f = fixture();
    // Stands in for semantic-release's bin: an entry named like it that loads the plugin.
    const bin = join(f.runner, "..", "semantic-release.js");
    writeFileSync(
      bin,
      `import(${JSON.stringify(PLUGIN)}).catch((e) => { console.error(e); process.exit(1); });\n`,
    );
    const result = spawnSync("node", [bin], { cwd: f.runner, env, encoding: "utf8" });
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: "" });
    expect(f.localTags()).toEqual(["v1.0.0"]);
  });
});

describe("the push half — a lease released during the job", () => {
  it("without the drop, `push --tags` resurrects a lease the lane already released", () => {
    const f = fixture();
    f.release();
    expect(tryGit(f.runner, "push", "--tags", "--", f.remote).status).toBe(0);
    expect(f.remoteTags()).toContain("claim/plan-4393");
  });

  it("prepare drops the local leases, so the push carries only the release's own tags", () => {
    const f = fixture();
    f.release();
    git(f.runner, "tag", "v1.1.0");
    const logged: string[] = [];
    prepare({}, { cwd: f.runner, env, logger: { log: (m) => logged.push(m) } });
    expect(tryGit(f.runner, "push", "--tags", "--", f.remote).status).toBe(0);
    expect(f.remoteTags()).toEqual(["v1.0.0", "v1.1.0"]);
    expect(logged).toEqual(["Dropped 1 local lease tag(s) before the tag push"]);
  });
});

describe(".releaserc.json", () => {
  it("lists the plugin last, so its prepare runs after every other plugin's and before the push", () => {
    const { plugins } = JSON.parse(readFileSync(".releaserc.json", "utf8")) as {
      plugins: unknown[];
    };
    expect(plugins.at(-1)).toBe("./scripts/release-lease-tags.mjs");
  });
});
