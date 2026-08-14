#!/usr/bin/env node
// Handoff scan — the eye behind the design→code handoff watcher (docs/HANDOFFS.md).
//
// A handoff is a plan authored in a Claude Design session: `docs/handoffs/<slug>/` holds the design
// bundle, and its README.md is plan-shaped (docs/plans/TEMPLATE.md) so the plan lifecycle applies
// unchanged. `**Status:** ready` is the go signal — and, exactly as with plans, only Eric flips
// draft→ready. Committing a bundle triggers nothing; the flip is the authorization.
//
//   node scripts/handoff-scan.mjs              # report every handoff and its status
//   node scripts/handoff-scan.mjs --ready      # JSON array of ready handoffs ([] = nothing to do)
//   node scripts/handoff-scan.mjs --validate   # enforce the contract (exit 1 on a malformed handoff)
//
// Enforced in CI via tests/arch/handoff.spec.ts; consumed by .github/workflows/handoff-detect.yml
// and by the hourly handoff Routine. Dependency-free on purpose — the workflow runs it WITHOUT
// `npm ci`, so a handoff push costs seconds of runner time rather than minutes (GHA minutes are the
// metered constraint; see pipeline.yml's rationing notes).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const HANDOFF_DIR = join(ROOT, "docs", "handoffs");

const STATUSES = ["draft", "ready", "executing", "review", "done"];

// Sections the plan contract requires (docs/plans/TEMPLATE.md), plus the one a handoff adds:
// "Design bundle" — which file in the folder is authoritative for what. Without it an executing
// session has to guess whether the HTML or the prose wins, which is exactly the drift the handoff
// exists to prevent.
const REQUIRED_SECTIONS = [
  "Intent & end-state",
  "Acceptance criteria (EARS)",
  "Design bundle",
  "Constraints & non-goals",
  "Autonomy envelope",
];

// EARS keywords (the /ears skill's grammar) — a criterion has to be shaped like a verifiable
// `shall` statement, not a wish.
const EARS_RE = /^\s*[-*]\s*\[[ xX]\]\s*(WHEN|WHILE|IF|WHERE|THE)\b/m;

// Literal scaffolding from TEMPLATE.md. A handoff past `draft` carrying these was never authored —
// refuse it loudly rather than let an unattended session build from a skeleton.
const PLACEHOLDERS = [
  "<short name>",
  "<slug>",
  "<trigger>",
  "<system>",
  "<response>",
  "<test/gate/screenshot/exit-status>",
  "<fork>",
  "TBD",
];

const rel = (f) => relative(ROOT, f).split("\\").join("/");

function bundleFiles(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) bundleFiles(p, acc);
    else acc.push(rel(p));
  }
  return acc;
}

function parse(slug) {
  const dir = join(HANDOFF_DIR, slug);
  const readme = join(dir, "README.md");
  const problems = [];

  if (!existsSync(readme)) {
    return {
      slug,
      title: slug,
      status: null,
      path: rel(dir),
      readme: rel(readme),
      files: [],
      problems: ["no README.md — a handoff folder must carry its own contract"],
    };
  }

  const text = readFileSync(readme, "utf8");
  const title = (text.match(/^#\s+(?:Handoff:\s*)?(.+)$/m)?.[1] ?? slug).trim();
  if (!/^#\s+\S/m.test(text)) problems.push("no H1 title");

  const status = text.match(/^\*\*Status:\*\*\s*([A-Za-z]+)/m)?.[1]?.toLowerCase() ?? null;
  if (!status)
    problems.push("no `**Status:**` line — nothing tells the watcher whether this is live");
  else if (!STATUSES.includes(status))
    problems.push(`unknown status "${status}" (expected one of ${STATUSES.join(", ")})`);

  for (const section of REQUIRED_SECTIONS) {
    if (!text.includes(`## ${section}`)) problems.push(`missing section "## ${section}"`);
  }

  if (!EARS_RE.test(text))
    problems.push(
      "no EARS acceptance criterion — an unattended build has nothing to verify against",
    );

  // Draft handoffs are allowed to be skeletons; anything past draft is a build order.
  if (status && status !== "draft") {
    const left = PLACEHOLDERS.filter((p) => text.includes(p));
    if (left.length) problems.push(`unfilled template placeholder(s): ${left.join(", ")}`);
  }

  return {
    slug,
    title,
    status,
    path: rel(dir),
    readme: rel(readme),
    files: bundleFiles(dir),
    problems,
  };
}

function scan() {
  if (!existsSync(HANDOFF_DIR)) return [];
  return readdirSync(HANDOFF_DIR, { withFileTypes: true })
    .filter(
      (e) =>
        e.isDirectory() ||
        (e.isSymbolicLink() && statSync(join(HANDOFF_DIR, e.name)).isDirectory()),
    )
    .map((e) => e.name)
    .sort()
    .map(parse);
}

const args = process.argv.slice(2);
const handoffs = scan();

if (args.includes("--ready")) {
  const ready = handoffs
    .filter((h) => h.status === "ready" && h.problems.length === 0)
    .map(({ slug, title, path, readme, files }) => ({ slug, title, path, readme, files }));
  process.stdout.write(`${JSON.stringify(ready, null, 2)}\n`);
  process.exit(0);
}

if (args.includes("--validate")) {
  const broken = handoffs.filter((h) => h.problems.length > 0);
  for (const h of broken) {
    console.error(`✗ ${h.path}`);
    for (const p of h.problems) console.error(`    ${p}`);
  }
  if (broken.length) {
    console.error(
      `\n${broken.length} handoff(s) fail the contract. Fix them against docs/handoffs/TEMPLATE.md — a` +
        " malformed handoff is worse than no handoff, because a session will build the wrong thing from it.",
    );
    process.exit(1);
  }
  console.log(`✓ ${handoffs.length} handoff(s) satisfy the contract.`);
  process.exit(0);
}

// Default: the human report.
if (!handoffs.length) {
  console.log(
    "No handoffs. Drop a Claude Design bundle in docs/handoffs/<slug>/ — see docs/HANDOFFS.md.",
  );
  process.exit(0);
}
for (const h of handoffs) {
  const mark = h.problems.length ? "✗" : h.status === "ready" ? "▶" : "·";
  console.log(`${mark} ${h.status ?? "?"}\t${h.slug} — ${h.title}`);
  for (const p of h.problems) console.log(`      ${p}`);
}
const ready = handoffs.filter((h) => h.status === "ready" && !h.problems.length);
console.log(
  `\n${handoffs.length} handoff(s), ${ready.length} ready to build.` +
    (ready.length ? " The watcher will pick these up." : ""),
);
