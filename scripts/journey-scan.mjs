#!/usr/bin/env node
// Journey scan — the eye behind the reasoning-record contract (.claude/skills/journey).
//
// The 2026-08-20 hat-team research found the journey system was the least-instrumented feedback
// surface in the repo (1 instance, no template, no scanner, no trigger) — and that comment-only
// format rules decay while machine-checked ones hold. This scan is DELIBERATELY LENIENT: required
// headings + filename shape only, never content quality — the binding constraint on journeys is
// that they fire at all, and a heavy gate would kill the capture habit it exists to protect.
//
//   node scripts/journey-scan.mjs               # human report (inventory + status line)
//   node scripts/journey-scan.mjs --validate    # journeys satisfy the template contract (CI)
//
// Enforced in CI via tests/arch/journey.spec.ts. Dependency-free (node built-ins).
// Loud-failure doctrine: an unreadable input is an error, never "fine".
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const JOURNEY_DIR = join(ROOT, "docs", "JOURNEYS");

// The skill's section contract (docs/JOURNEYS/TEMPLATE.md). "Side quests banked" is optional —
// not every exchange spawns them.
const REQUIRED_HEADINGS = [
  "## The question, verbatim",
  "## Where it stands",
  "## What moved, and what moved it",
  "## Rejected branches",
  "## Open forks",
];
const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;

/** Committed journeys — kebab-case topic files, template and readme excluded. */
function journeyFiles() {
  if (!existsSync(JOURNEY_DIR)) return [];
  return readdirSync(JOURNEY_DIR)
    .filter((f) => f.endsWith(".md") && f !== "TEMPLATE.md" && f !== "README.md")
    .sort();
}

function validate() {
  const problems = [];
  for (const f of journeyFiles()) {
    if (!KEBAB_RE.test(f))
      problems.push(`docs/JOURNEYS/${f}: filename must be kebab-case, named for the question`);
    const text = readFileSync(join(JOURNEY_DIR, f), "utf8");
    for (const heading of REQUIRED_HEADINGS) {
      if (!text.includes(heading)) problems.push(`docs/JOURNEYS/${f}: missing "${heading}"`);
    }
  }
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) {
    console.error(
      `\n${problems.length} journey(s) fail the template contract (docs/JOURNEYS/TEMPLATE.md).`,
    );
    process.exit(1);
  }
  console.log(`✓ ${journeyFiles().length} journey(s) satisfy the contract.`);
}

function main() {
  if (process.argv.includes("--validate")) {
    validate();
    return;
  }
  const files = journeyFiles();
  if (!files.length) {
    console.log(
      "· no journeys banked yet — /journey captures a long exchange before it dies with the session.",
    );
    return;
  }
  for (const f of files) {
    const text = readFileSync(join(JOURNEY_DIR, f), "utf8");
    const status = /Status:\s*\*\*([^*]+)\*\*/.exec(text)?.[1]?.trim() ?? "?";
    console.log(`· ${f} — status: ${status}`);
  }
}

main();
