// The deciding half of platter-sweep.mjs — pure, so a fixture drives every branch with no network.
//
// WHY (#7939, 2026-11-22): every rubber-stamp merge should reach Eric as ONE platter PR. The census
// that day counted the leaks: #7737 and #7711 were protected and green yet each sat as its own
// `hold-merge` PR, #7674 (a dependabot bump to workflow files) was on no platter, and platter #7424
// carried `conflict-flagged`, so the one touch meant to cover them all could not be taken. Two
// questions settle it, and this module answers both:
//
//   1. Is this open PR ADOPTABLE — held only because its diff is protected, so it may board the open
//      platter and its solo PR close (`ship platter adopt <pr>`)?
//   2. Does this open platter need a REBUILD — re-opened from main with its items re-boarded
//      (`ship platter rebuild <pr>`), because it conflicts with main?
//
// HOW A TASTE HOLD IS RECOGNIZED (the plan's constraint: "a taste hold never boards"). `hold-merge`
// is one label for two reasons — "this path is Eric's to merge" and "Eric wants to see this first"
// (CLAUDE.md → Merge posture) — so the label alone cannot tell them apart. A hold counts as taste,
// and the PR is refused, when ANY of these is true:
//   - it touches no protected path at all: then protection cannot be why it is held (#7672's shape:
//     100+ UI files, none protected);
//   - it carries a label that names a decision or a look: `taste`, `needs-eric`, `do-not-board`;
//   - its body says so: the line `Platter: no`, or a line that says held/hold AND names a look
//     (taste, eyeball, eyes, visual, design, placement, screenshot, "see it/this first", "look").
// To keep a protected PR off the platter on purpose, write `Platter: no` in its body (or label it
// `do-not-board`). Anything else that is protected, green and held boards. Refusing is the cheap
// error here: a refused PR stays exactly where it was, one tap as before.
//
// DEPENDABOT: a dependabot PR is never armed when it touches a protected path (dep-warden step 5),
// so it waits unlabelled. It is adoptable when its title names one patch or minor bump; a major, a
// group bump or an unparsable title is refused (dep-warden's rule: never a major unattended).

/** Branch protection requires these; both must have a passing run on the head. */
export const REQUIRED_CHECKS = ["verify", "integration tests"];
/** A conclusion that is a failure of the code, not of the runner. */
const RED = new Set(["failure", "timed_out", "action_required", "startup_failure"]);
/** Branch protection counts a skipped required check as passing (stuck-pr-decide.mjs, #5940). */
const PASSING = new Set(["success", "neutral", "skipped"]);

export const HOLD_LABEL = "hold-merge";
export const CONFLICT_LABEL = "conflict-flagged";
export const DEPENDABOT = "dependabot[bot]";
/** Labels that mean "a decision or a look is pending", never "only the path is protected". */
export const TASTE_LABELS = ["taste", "needs-eric", "do-not-board"];

const OPT_OUT = /^\s*platter:\s*no\b/im;
const HOLD_WORD = /\b(hold|held|holding)\b/i;
const LOOK_WORD =
  /\b(taste|eyeball|eyes|visual|design|placement|screenshot|look|see (it|this|them) first)\b/i;

const labelNames = (pr) => (pr.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));

export const isPlatterBranch = (ref) => typeof ref === "string" && ref.startsWith("platter/");

/** The reason a hold reads as taste, or null when nothing says so (see the header). */
export function tasteHold(pr) {
  const label = labelNames(pr).find((l) => TASTE_LABELS.includes(l));
  if (label) return `label \`${label}\` names a decision or a look, not a protected path`;
  const body = String(pr.body ?? "");
  if (OPT_OUT.test(body)) return "its body says `Platter: no`";
  const line = body.split("\n").find((l) => HOLD_WORD.test(l) && LOOK_WORD.test(l));
  if (line) return `its body holds it for a look: "${line.trim().slice(0, 100)}"`;
  return null;
}

/** "major" | "minor" | "patch" from a dependabot title ("bump X from 1.0.266 to 1.0.276"), else null. */
export function bumpLevel(title) {
  const m = /\bbump\s+\S+\s+from\s+v?(\d+)\.(\d+)\.(\d+)\S*\s+to\s+v?(\d+)\.(\d+)\.(\d+)/i.exec(
    String(title ?? ""),
  );
  if (!m) return null;
  const [from, to] = [m.slice(1, 4).map(Number), m.slice(4, 7).map(Number)];
  if (to[0] !== from[0]) return "major";
  if (to[1] !== from[1]) return "minor";
  return "patch";
}

/** Green = every required check has a passing completed run, and no run on the head is red. */
export function checksGreen(checkRuns = []) {
  const red = checkRuns.find((r) => RED.has(r.conclusion ?? ""));
  if (red) return { green: false, why: `\`${red.name}\` is ${red.conclusion}` };
  for (const name of REQUIRED_CHECKS) {
    const runs = checkRuns.filter((r) => r.name === name);
    if (!runs.some((r) => r.status === "completed" && PASSING.has(r.conclusion ?? ""))) {
      const live = runs.find((r) => r.status !== "completed");
      return {
        green: false,
        why: live ? `\`${name}\` is still ${live.status}` : `no passing \`${name}\``,
      };
    }
  }
  return { green: true, why: "" };
}

/** Why this PR's SHAPE rules it out (closed, draft, another base, a fork, a platter), or null. */
function shapeRefusal(pr) {
  if (pr.state && pr.state !== "open") return `it is ${pr.state}`;
  if (pr.draft) return "it is a draft";
  if (pr.base?.ref && pr.base.ref !== "main") return `it targets ${pr.base.ref}, not main`;
  if (isPlatterBranch(pr.head?.ref)) return "it is a platter itself";
  if (pr.head?.repo && pr.base?.repo && pr.head.repo.full_name !== pr.base.repo.full_name)
    return "its branch lives in a fork, which the platter cannot fetch";
  return null;
}

/** Why a dependabot bump may not board unattended (a major, or no bump to read), or null. */
function bumpRefusal(title) {
  const level = bumpLevel(title);
  if (level === null) return "a dependabot title with no single semver bump to read";
  if (level === "major") return "a major bump — dep-warden escalates those to Eric";
  return null;
}

/**
 * Is this open PR adoptable onto the platter? `files` are its changed paths, `isProtected(path)` is
 * envelope-scan's answer, `checkRuns` the head's runs. Returns `{adopt: true, …}` or
 * `{adopt: false, reason}`; the reason is one line a person can act on.
 */
export function judgeAdopt({ pr, files = [], isProtected, checkRuns = [] }) {
  const base = { number: pr.number, branch: pr.head?.ref ?? "", title: pr.title ?? "" };
  const refuse = (reason) => ({ ...base, adopt: false, reason });
  const shape = shapeRefusal(pr);
  if (shape) return refuse(shape);
  const labels = labelNames(pr);
  const dependabot = pr.user?.login === DEPENDABOT;
  if (!(dependabot || labels.includes(HOLD_LABEL)))
    return refuse(`it is not held (\`${HOLD_LABEL}\` absent): the normal merge path owns it`);
  const protectedPaths = files.filter((f) => isProtected(f));
  if (protectedPaths.length === 0)
    return refuse("it touches no protected path, so protection is not why it waits");
  const taste = tasteHold(pr);
  if (taste) return refuse(`a taste hold: ${taste}`);
  const bump = dependabot ? bumpRefusal(pr.title) : null;
  if (bump) return refuse(bump);
  if (labels.includes(CONFLICT_LABEL) || pr.mergeable === false)
    return refuse("it conflicts with main: catch it up on its own branch first");
  const { green, why } = checksGreen(checkRuns);
  if (!green) return refuse(`not green: ${why}`);
  return {
    ...base,
    adopt: true,
    kind: dependabot ? "dependabot" : "held",
    protected: protectedPaths,
  };
}

/**
 * Does this open platter need a rebuild? `pr` is the single-PR read (it alone carries `mergeable`).
 * `mergeable: null` means GitHub has not computed it yet, which is no evidence either way, so the
 * label decides then. A stale `conflict-flagged` on a platter GitHub calls mergeable still rebuilds:
 * the label's owner (moneypenny's repair lane) resolves conflicts by MERGING on the branch, which is
 * development on the platter (ship.sh rule 2) — the rebuild replaces that merge with clean items.
 */
export function judgeRebuild(pr) {
  if (!isPlatterBranch(pr.head?.ref))
    return { number: pr.number, rebuild: false, reason: "not a platter" };
  const flagged = labelNames(pr).includes(CONFLICT_LABEL);
  const dirty = pr.mergeable === false || pr.mergeable_state === "dirty";
  const reason = dirty
    ? "GitHub reports it conflicts with main"
    : flagged
      ? `labelled \`${CONFLICT_LABEL}\``
      : "";
  return { number: pr.number, branch: pr.head.ref, rebuild: Boolean(reason), reason };
}

/** The open platter items board onto: the newest open platter PR, or null. */
export function openPlatter(openPrs = []) {
  const platters = openPrs.filter((p) => isPlatterBranch(p.head?.ref) && p.base?.ref === "main");
  platters.sort((a, b) => b.number - a.number);
  return platters[0] ?? null;
}

/** The open PRs worth judging for adoption: held ones and dependabot's, never a platter. */
export function adoptCandidates(openPrs = []) {
  return openPrs.filter(
    (p) =>
      !isPlatterBranch(p.head?.ref) &&
      (labelNames(p).includes(HOLD_LABEL) || p.user?.login === DEPENDABOT),
  );
}
