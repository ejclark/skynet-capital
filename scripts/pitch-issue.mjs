// pitch-issue.mjs: the shape a spend ask takes before it reaches Eric (#8201, a slice of #8161).
//
// Eric, 2026-11-23: anything that costs him money out of pocket (a bigger server, more tokens, a
// raised cap) arrives as a pitch and a conversation, never as a build. CLAUDE.md's hard boundaries
// already named spend as his; what was missing was a shape for the ask. Spend asks travelled as a
// bare `needs-eric` with a per-use delta in a comment: no monthly dollar figure, no free
// alternative, no number that would undo the change (docs/ISSUES.md → Pitch issues).
//
// THE CONTRACT: a `pitch`-labelled body carries five lines, one line each so they read on a phone:
//   - **Who wants it:** <a seat, a loop, or a member by `member-<id>` label, never a name>
//   - **Monthly cost:** $<n>/month, <how it was priced>
//   - **What it buys:** <number and unit>, <how it is measured>
//   - **Free alternative first:** <what was tried, #N, what it moved>  (or `not tried, <why>`)
//   - **Rolls back if:** <number> by <date>, <what reads it>
// plus `needs-eric` and a `Needs from you` callout whose class is `spend limits`.
//
// WHY THE CLASS LINE IS CHECKED TOO (the amendment on #8201's receipt): the label and the callout
// class are two markers for one fact. The label is what GitHub's list view and filters show; the
// class is what keeps the ask out of decide-and-report (`spend limits` is irreversible in
// alignment-graduation.mjs CLASS_MAP). Requiring both means they cannot drift apart.
//
// PURE and dependency-free. issue-lint.mjs calls `pitchProblems`; the lane judges whether an ask
// is spend, and this only checks the shape once it is labelled (#8201, out of scope: no keyword guess).

/** The five lines, in the order the skeleton writes them. `needs` names what the value must carry
 *  beyond being filled in, and the regex that proves it. */
export const PITCH_FIELDS = [
  { name: "Who wants it" },
  { name: "Monthly cost", needs: ["`$` figure", /\$\s?\d/] },
  { name: "What it buys" },
  { name: "Free alternative first" },
  { name: "Rolls back if", needs: ["number", /\d/] },
];

/** A value that answers nothing: blank, a skeleton `<placeholder>` left in, or TBD/TODO/?. */
const PLACEHOLDER = /^(?:<[^>]*>|tbd|todo|\?+|n\/a|-+)?[.\s]*$/i;

/** `**Name:**` at the start of a line (bullet, quote or table pipe allowed), its value to line end.
 *  `null` when the line is absent or its value is a placeholder. Same reading as bottleneck-baseline's
 *  `**Before:**` line, so the two body contracts parse alike. */
export function pitchField(body, name) {
  const m = new RegExp(`^[\\s>|*-]*\\*\\*${name}:?\\*\\*:?[ \\t]*(.*)$`, "im").exec(body ?? "");
  if (!m) return null;
  const value = m[1].replace(/\|\s*$/, "").trim();
  return PLACEHOLDER.test(value) ? null : value;
}

/** True for one of the five lines as a bullet. They stand in for a capsule's talking points, so
 *  issue-lint's 2–4 bullet note does not count them (five is the shape, not a wall). */
export function isPitchLine(line = "") {
  return PITCH_FIELDS.some(({ name }) =>
    new RegExp(`^\\s*[-*]\\s+\\*\\*${name}:?\\*\\*`, "i").test(line),
  );
}

/** The callout's `- Class: spend limits` sub-line (docs/ISSUES.md rule 8), anywhere in a `>` block. */
const SPEND_CLASS = /^>[ \t]*(?:[-*][ \t]*)?\**class\**[ \t]*:[ \t]*\**spend limits\b/im;

/** Problems for a `pitch`-labelled body, one per gap, each naming the line it wants. Empty when the
 *  label is absent: a body linted before filing, or any other issue, is never checked. */
export function pitchProblems(body = "", labels) {
  if (!(Array.isArray(labels) && labels.includes("pitch"))) return [];
  const text = String(body ?? "");
  const where = "(docs/ISSUES.md → Pitch issues)";
  const problems = [];
  for (const { name, needs } of PITCH_FIELDS) {
    const value = pitchField(text, name);
    if (value === null) {
      problems.push(`labelled \`pitch\` but no \`**${name}:**\` line with a value ${where}`);
    } else if (needs && !needs[1].test(value)) {
      problems.push(`\`pitch\` line \`**${name}:**\` carries no ${needs[0]}: "${value}" ${where}`);
    }
  }
  if (!labels.includes("needs-eric")) {
    problems.push(
      `labelled \`pitch\` without \`needs-eric\`: a pitch waits on Eric's answer, and needs-eric is what parks and assigns it ${where}`,
    );
  }
  if (!SPEND_CLASS.test(text)) {
    problems.push(
      `labelled \`pitch\` but its \`Needs from you\` callout has no \`- Class: spend limits\` line, so the ask could graduate to decide-and-report ${where}`,
    );
  }
  return problems;
}
