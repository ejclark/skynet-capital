/**
 * A git environment that cannot reach outside the directory you point it at.
 *
 * WHY THIS EXISTS, and why it is shared rather than copied. Git exports `GIT_DIR`,
 * `GIT_INDEX_FILE`, `GIT_WORK_TREE` and friends into the environment of **every hook it runs**.
 * Those variables OUTRANK `cwd`. So a spec that builds a throwaway repo and reaches it only by
 * `cwd` works perfectly under a bare `npm test`, and then — the moment the same suite runs from
 * `.husky/pre-push` — silently operates on the REAL repository instead.
 *
 * That is not theoretical. On 2026-08-26 it cost a session three separate recoveries:
 *  - `tests/arch/envelope.spec.ts` ran `git add -A`, which staged a wholesale deletion of all 845
 *    tracked files into the developer's index (working tree untouched, but `git status` unreadable).
 *  - `tests/arch/doc-rot.spec.ts` ran `git init -q`, which re-initialised the real repository and
 *    flipped `core.bare` to `true` — after which every plain `git` command in the repo answered
 *    `fatal: this operation must be run in a work tree`.
 *
 * The envelope spec was fixed twice, independently, by two sessions that each hit it. The doc-rot
 * spec was missed both times, because the fix lived as a private helper inside the file that hurt
 * first. Hence this module: the scrub is one importable thing, so the next spec that shells out to
 * `git` inherits the fix instead of rediscovering the bug.
 *
 * Prefix-matching every `GIT_*` key is deliberate — an allowlist of the four or five variables you
 * happen to remember is exactly how this recurred.
 */
export function hermeticGitEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra };
  for (const key of Object.keys(env)) {
    if (key.startsWith("GIT_")) delete env[key];
  }
  return env;
}
