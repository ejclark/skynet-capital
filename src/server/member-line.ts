/**
 * One line of member-authored text that other members will read (issue #2224 — the Council line,
 * shape 1, and comments on a filing, shape 3). Everyone in the gate reads it (#2224 shape 3
 * red-team, H2): bidi overrides/isolates could visually reorder what renders beside it, and control
 * characters (a newline from a pasted block) break "one line". Overrides go; controls collapse to a
 * space; the result is trimmed. Emoji joiners stay. Length rules stay with each caller — the
 * Council and a comment carry different caps.
 */
export function toMemberLine(text: string): string {
  return text
    .replace(/[‪-‮⁦-⁩]/g, "")
    .replace(/\p{Cc}+/gu, " ")
    .trim();
}
