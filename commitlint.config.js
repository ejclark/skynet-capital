// Dependabot's exact generated titles: one package ("Bump x from 1 to 2") or a group ("Bump the
// playwright group with 3 updates"). Anchored at both ends so nothing hand-written rides along.
const DEPENDABOT_TITLE =
  /^chore\(deps(-dev)?\): Bump (\S+ from \S+ to \S+|the \S+ group( across \d+ directories)? with \d+ updates?)\s*$/;

export default {
  extends: ["@commitlint/config-conventional"],
  // Dependabot capitalizes "Bump" and offers no setting to change it, so every one of its PRs failed
  // the PR-title check and none could auto-merge (2026-09-24: six queued, all red). Only its exact
  // title shape is exempt; every hand-written subject still lints.
  ignores: [(message) => DEPENDABOT_TITLE.test(message)],
};
