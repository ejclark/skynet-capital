// The contrast + name/role pass — the first a11y sweep this repo runs against rendered pages
// (`tests/ui/contrast.spec.ts` checks the theme's TOKENS, never a page). Adopted, not crafted:
// `@axe-core/playwright` (a devDependency; `node scripts/envelope-scan.mjs --check package.json`
// said the file is unprotected on 2026-09-26). The rule set is deliberately narrow — colour
// contrast and "does this control have a name" — because BRAND.md → Accessibility names exactly
// those two as the standing reader's problem (red/green colourblind; a phone with no hover).
// Everything axe reports beyond them is a different sweep's job.
//
// If the package is ever absent the pass reports itself unavailable rather than pretending to be
// green — the ledger then says "contrast: not run", never "0 findings".

const RULES = [
  "color-contrast",
  "button-name",
  "link-name",
  "label",
  "select-name",
  "input-button-name",
  "aria-command-name",
  "aria-input-field-name",
  "aria-toggle-field-name",
];

let builder;
async function load() {
  if (builder !== undefined) return builder;
  try {
    const mod = await import("@axe-core/playwright");
    builder = mod.default ?? mod.AxeBuilder;
  } catch {
    builder = null;
  }
  return builder;
}

/**
 * @returns {Promise<{available: boolean, findings: {kind: string, what: string, snippet: string, severity: string, fix: string}[]}>}
 */
export async function contrastPass(page) {
  const AxeBuilder = await load();
  if (!AxeBuilder) return { available: false, findings: [] };
  const results = await new AxeBuilder({ page }).withRules(RULES).analyze();
  const findings = [];
  for (const v of results.violations) {
    for (const node of v.nodes.slice(0, 6)) {
      const target = Array.isArray(node.target) ? node.target.join(" ") : String(node.target);
      const snippet = (node.html ?? "").replace(/\s+/g, " ").slice(0, 80);
      findings.push({
        kind: `axe:${v.id}`,
        what: `${v.help} — ${target}`,
        snippet: textOf(snippet),
        severity: v.impact === "critical" || v.impact === "serious" ? "medium" : "low",
        fix: "S",
      });
    }
  }
  return { available: true, findings };
}

/** The visible words inside an html snippet, for locating the element in source. */
function textOf(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
