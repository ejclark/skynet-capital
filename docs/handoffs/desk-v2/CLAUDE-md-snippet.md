# Snippet for the repo's CLAUDE.md — teaches Claude Code how to treat handoffs

## Design handoffs (docs/handoffs/)
- Any folder under `docs/handoffs/<feature>/` is a design handoff from Claude Design.
- `README.md` in that folder is the authoritative spec: contract rulings, screen anatomy,
  interactions, state, data requirements, and a file-by-file implementation map.
- The bundled `.dc.html` files are DESIGN REFERENCES (open in a browser to see the target),
  never production code — recreate them in this repo's server-rendered TS renderer idiom
  (pure functions returning HTML/SVG strings, tokens from docs/BRAND.md, no webfonts, no bundler).
- Turns/sections the README marks historical or parked are OUT OF SCOPE — do not build them.
- Acceptance: every contract ruling in the README holds on the implemented screens; tests,
  lint, typecheck, and arch budgets stay green; PR description maps commits to the README's
  implementation map and lists any ruling you could not satisfy with WHY (never silently skip).
- Setup for auto-pickup: copy `github-workflow-design-handoff.yml` to
  `.github/workflows/design-handoff.yml` and install the Claude Code GitHub App on the repo.
