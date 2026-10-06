// A semantic-release local plugin (listed in .releaserc.json) that keeps Moneypenny's claim
// leases out of the release job's tag traffic. Leases live at `refs/tags/claim/<slug>`
// (scripts/moneypenny/index.mjs claimHandoff, tests/arch/lease-namespace.spec.ts), and
// semantic-release moves EVERY tag twice: `git fetch --tags` before any plugin runs, and
// `git push --tags` right after `prepare`. Neither knows a lease from a version tag.
//
// Provenance (run 37397356694, issue #4715). `release · deploy` checked out with every tag, spent
// its install steps, then semantic-release's fetch died:
//
//     ! [rejected] claim/plan-4393 -> claim/plan-4393  (would clobber existing tag)
//
// The plan lane had released and re-taken that lease in between. A re-take is a NEW stamped tag
// object (claimStamp), so the runner's local copy now disagreed with the remote, and git refuses
// to move an existing tag on a plain `--tags` fetch. Nothing was wrong with the release — a lease
// moving during the job failed it and left `main` merged-but-undeployed.
//
// The push half is quieter and worse: a lease RELEASED between the fetch and the push is still a
// local tag, so `git push --tags` re-creates it on the remote — resurrecting a lock the lane
// already dropped, which then holds the issue for up to the two-hour TTL.
//
// THE FIX: a release runner never needs a local lease. Drop every local `claim/*` tag
//   1. at load — semantic-release imports plugins before its fetch, and there is no earlier hook
//      that does not mean editing the workflow. With no local copy, the fetch can only CREATE the
//      tag, which never clobbers (a fetch reads one snapshot of the remote's refs);
//   2. in `prepare` — the last step before `push --tags`, so only the release's own tags go out.
// Deleting a local tag never touches the remote lease; the lane reads leases over the API.
//
// The load-time drop runs only when semantic-release is the process (argv[1]), so importing this
// module from a spec or a REPL never deletes the caller's tags.
import { execFileSync } from "node:child_process";

/** The local-tag namespace leases live under — refs/tags/claim/<slug>. */
export const LEASE_PREFIX = "claim/";

/** Pure. The lease tags in `git tag --list` output — everything else (the v* releases) is kept. */
export function leaseTags(tagList) {
  return String(tagList ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((tag) => tag.startsWith(LEASE_PREFIX));
}

/** Delete every local lease tag in `cwd`. Returns the names dropped. Never touches a remote. */
export function dropLeaseTags({ cwd = process.cwd(), env = process.env } = {}) {
  const git = (args) => execFileSync("git", args, { cwd, env, encoding: "utf8" });
  const tags = leaseTags(git(["tag", "--list", `${LEASE_PREFIX}*`]));
  if (tags.length) git(["tag", "-d", ...tags]);
  return tags;
}

/** Pure. Is this process semantic-release itself (bin shim or the resolved bin script)? */
export function isSemanticReleaseProcess(argv1) {
  return /[\\/]semantic-release(?:\.js)?$/.test(String(argv1 ?? ""));
}

/** semantic-release `prepare` step — runs after every other plugin's prepare, before `push --tags`. */
export function prepare(_pluginConfig, { cwd, env, logger }) {
  const dropped = dropLeaseTags({ cwd, env });
  if (dropped.length)
    logger.log(`Dropped ${dropped.length} local lease tag(s) before the tag push`);
}

if (isSemanticReleaseProcess(process.argv[1])) {
  try {
    const dropped = dropLeaseTags();
    if (dropped.length)
      console.log(
        `release-lease-tags: dropped ${dropped.length} local lease tag(s) before the tag fetch`,
      );
  } catch (err) {
    // A cleanup that cannot run must not be the thing that fails the release; the fetch will
    // report the real problem if one exists.
    console.warn(`release-lease-tags: could not drop local lease tags — ${err.message}`);
  }
}
