export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // The research automation lane (skynet-envoy[bot]) writes each commit body as unwrapped
    // single-line paragraphs (its PR description text, reused verbatim) — @commitlint/config-
    // conventional's default body-max-line-length (100) rejects those outright, and it applies
    // retroactively to every commit already on a branch, not just new ones a contributor writes
    // by hand. Every PR here squash-merges (docs/COACHES.md, ship loop): only the squash commit's
    // message — built from the PR title, never from these intermediate bodies — ever lands in
    // main's history, so per-commit body wrapping has no history-hygiene payoff here to justify
    // blocking merges over it. Disabled rather than raised, since prose length is unbounded either
    // way; type/subject-format rules (what actually matters for a squash-merge convention) stay on.
    "body-max-line-length": [0],
  },
};
