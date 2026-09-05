// Label references inside a workflow file — the piece that lets workflow-lint answer "does the
// label this job's condition names actually exist?" (rule 7). Split out of workflow-lint.mjs the
// same way script-deps.mjs was for rule 6: the grammar here is GitHub-expression and `gh` CLI
// syntax, a separate concern from YAML structure, and keeping it out holds workflow-lint under the
// file-size cap. Dependency-free, like everything a CI gate is built from.
//
// PROVENANCE (#894, the third incident of the 2026-08-29 #889→#890→#892 chain). #889 shipped
// `pipeline.yml`'s `arm-auto-merge` job gated on
// `!contains(github.event.pull_request.labels.*.name, 'hold-merge')` while no lane provisioned
// `hold-merge`; #892 had to add it afterwards. Nothing failed in between — the condition simply
// never matched, so the documented escape hatch (hold a green PR for a taste call) did not exist for
// anyone who reached for it.

// The three ways a workflow names a label as a literal. Deliberately narrow: only forms whose value
// is a quoted/bare constant, so `--add-label "$LABEL"` and other shell indirection are skipped
// rather than guessed at. A form nobody writes here yet is a false negative, which costs nothing;
// a form guessed wrong would be a false positive on a green pipeline, which costs a red gate.
const LABEL_REFS = [
  /labels\.\*\.name\s*,\s*['"]([^'"]+)['"]/g, // contains(<...>.labels.*.name, 'x')
  /\.label\.name\s*[=!]=\s*['"]([^'"]+)['"]/g, // github.event.label.name == 'x'
  /--(?:add|remove)-label[=\s]+['"]?([a-z][a-z0-9-]*)['"]?/g, // gh issue edit --add-label x
];

/**
 * Label names a workflow references that the repo's vocabulary does not register. Pure — the caller
 * supplies the known set, so specs pass a fixture and workflow-lint's `main()` passes the real
 * `LABEL_NAMES` from `scripts/moneypenny/labels.mjs`.
 *
 * THE FULL REGISTRY, not `MANAGED_LABELS` — deliberately the opposite of `label-vocabulary.spec.ts`,
 * which asks "will `--add-label` succeed" and so may only count labels this repo UPSERTS. This asks
 * "does the label exist at all", and the registered-but-not-owned tier records exactly that:
 * `moneypenny-events.yml` reads `github.event.label.name == 'feedback'`, real (the intake form
 * applies it) but unmanaged on purpose. The managed set here would fail a correct workflow.
 */
export function unknownLabels(text, known = []) {
  const have = new Set(known);
  const referenced = LABEL_REFS.flatMap((re) => [...text.matchAll(re)].map((m) => m[1]));
  return [...new Set(referenced)].filter((label) => !have.has(label));
}
