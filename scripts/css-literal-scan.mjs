#!/usr/bin/env node
// CSS-literal scan — the eye for the type/spacing/radius ladder in the React shell's styles
// (a token lint in the shape of Atlassian's ensure-design-token-usage, built as a ratchet).
//
// WHY. docs/BRAND.md → "Spacing & type scale" says a value off the ladder is a defect, and
// app/src/styles/theme.css defines the ladders (--space-1…5, --text-xs…lg). Nothing measured them.
// A 2026-10 component-library census found the token layer near-total for COLOUR (1,723 tokenized
// vs 12 literal, ~99%) and near-absent for everything else: font-size 105 tokenized vs 635 raw
// (318 of them already EQUAL a --text-* value), spacing 89 vs 1,148 (42 distinct values), radius
// 252 raw across 18 values with no token at all. It also found fallbacks that lie:
// settings.css `var(--radius-sm, 6px)` names a token that does not exist (so 6px always wins), and
// level-up.css `var(--text-md, 15px)` carries a fallback that disagrees with the token's 12.5px.
// Retroactive-judging debt (docs/COACHES.md → grandfather, then shrink): today's count is frozen,
// new work conforms, the budget only ratchets down.
//
// What it counts, over app/src/styles/*.css minus theme.css (the token source):
//   raw*            a px/rem/em literal outside var() in font-size, spacing (padding*, margin*,
//                   gap, inset*, top/right/bottom/left), border-*radius, or letter-spacing. 0 is
//                   not a literal; a fallback inside var() is judged by the fallback checks below.
//   *EqualsToken    the subset of raw px literals whose value equals an existing token on that
//                   family's ladder (--text-* / --space-* / --radius-* / --tracking-*) — the
//                   mechanical swaps, target 0. A family with no token yet (radius and
//                   letter-spacing today) reports null and carries no budget key until its first
//                   token lands; that PR seeds the key with --update.
//   danglingVar     var(--x…) where --x is defined nowhere: not in any styles/*.css, not set from
//                   app/src TS/TSX (inline style custom properties count as defined).
//   mismatchedFallback  var(--x, literal) where --x IS a theme.css token and the literal matches
//                   none of its values — the fallback would render something the token never says.
//                   (A CSS-wide keyword fallback — inherit, initial… — claims no value; not counted.)
//
//   node scripts/css-literal-scan.mjs             # report; exit 1 when any count grew past budget
//   node scripts/css-literal-scan.mjs --update    # rewrite css-literal-budget.json (only lowers)
//   node scripts/css-literal-scan.mjs --candidate # file with the most token-equal literals, as JSON
//   node scripts/css-literal-scan.mjs --json      # counts, tokens and every finding as JSON
//
// Advisory in CI (tests/arch/css-literal.spec.ts via advisoryScan — debt class, never red
// mid-flow). Exit 2 = UNKNOWN: no styles dir, no theme.css, or a budget key missing. Dependency-free
// on purpose: postcss is only a transitive dependency here, and a declaration regex over
// comment-stripped CSS is enough for these four property families.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const APP_SRC = join(ROOT, "app/src");
const STYLES = join(APP_SRC, "styles");
const THEME = join(STYLES, "theme.css");
const BUDGET_FILE = join(ROOT, "css-literal-budget.json");
const rel = (f) => relative(ROOT, f).split("\\").join("/");

/** Property families: which declarations they judge, and which token ladder they swap onto. */
const FAMILIES = {
  fontSize: { label: "font-size", prop: /^font-size$/, ladder: "--text-" },
  spacing: {
    label: "spacing",
    prop: /^(?:(?:padding|margin)(?:-[a-z-]+)?|(?:row-|column-|grid-)?gap|inset(?:-[a-z-]+)?|top|right|bottom|left)$/,
    ladder: "--space-",
  },
  radius: { label: "radius", prop: /^border(?:-[a-z]+)*-radius$/, ladder: "--radius-" },
  letterSpacing: { label: "letter-spacing", prop: /^letter-spacing$/, ladder: "--tracking-" },
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const rawKey = (fam) => `raw${cap(fam)}`;
const eqKey = (fam) => `${fam}EqualsToken`;

function unknown(why) {
  console.error(`✗ ${why} — CSS-literal verdict UNKNOWN.`);
  return 2;
}
if (!existsSync(STYLES)) process.exit(unknown(`${rel(STYLES)} not found`));
if (!existsSync(THEME)) process.exit(unknown(`${rel(THEME)} not found (the token source)`));

/** Blank out comments, keeping newlines so offsets still map to the right line. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
const lineAt = (text, index) => text.slice(0, index).split("\n").length;
const norm = (v) => v.trim().replace(/\s+/g, " ").toLowerCase();

/** Every `var(` in `value` with its name and fallback (balanced parens; nested vars included). */
function varsIn(value) {
  const out = [];
  for (let i = value.indexOf("var("); i !== -1; i = value.indexOf("var(", i + 4)) {
    let depth = 0;
    let end = i + 3;
    for (; end < value.length; end++) {
      if (value[end] === "(") depth++;
      else if (value[end] === ")" && --depth === 0) break;
    }
    const inner = value.slice(i + 4, end);
    const comma = inner.indexOf(",");
    const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
    out.push({ name, fallback: comma === -1 ? null : inner.slice(comma + 1).trim() });
  }
  return out;
}
/** `value` with every top-level var(…) removed, so only literals written outright remain. */
function withoutVars(value) {
  let out = "";
  let i = 0;
  while (i < value.length) {
    if (value.startsWith("var(", i)) {
      let depth = 0;
      let j = i + 3;
      for (; j < value.length; j++) {
        if (value[j] === "(") depth++;
        else if (value[j] === ")" && --depth === 0) break;
      }
      out += " ";
      i = j + 1;
    } else out += value[i++];
  }
  return out;
}
/** CSS-wide keywords claim no value, so as a fallback they cannot disagree with a token. */
const CSS_WIDE = new Set(["inherit", "initial", "unset", "revert", "revert-layer"]);
const LITERAL = /(?<![\w.#-])(-?(?:\d+\.?\d*|\.\d+))(px|rem|em)\b/g;
/** Non-zero length literals in a var-free value. */
const literalsIn = (value) =>
  [...value.matchAll(LITERAL)]
    .filter((m) => Number(m[1]) !== 0)
    .map((m) => ({ text: `${m[1]}${m[2]}`, n: Number(m[1]), unit: m[2] }));

/** `prop: value` declarations (custom properties included) with their line numbers. */
function declarations(css) {
  const text = stripComments(css);
  const out = [];
  const re = /(?:^|[;{\s])(--[\w-]+|[a-z][a-z-]*)\s*:\s*([^;{}]*?)\s*(?=[;}])/g;
  for (const m of text.matchAll(re)) {
    out.push({ prop: m[1], value: m[2], line: lineAt(text, m.index + m[0].indexOf(m[1])) });
  }
  return out;
}

// ── tokens: theme.css custom properties (every block — dark, light, density) ──
const themeDecls = declarations(readFileSync(THEME, "utf8"));
const themeTokens = new Map(); // name → Set(normalized values)
for (const d of themeDecls.filter((x) => x.prop.startsWith("--"))) {
  if (!themeTokens.has(d.prop)) themeTokens.set(d.prop, new Set());
  themeTokens.get(d.prop).add(norm(d.value));
}
/** Per family: px value → token name, from tokens on its ladder whose value is a single px length. */
const ladders = {};
for (const [fam, { ladder }] of Object.entries(FAMILIES)) {
  const byPx = new Map();
  for (const [name, values] of themeTokens) {
    if (!name.startsWith(ladder)) continue;
    for (const v of values) {
      const m = /^(\d+\.?\d*|\.\d+)px$/.exec(v);
      if (m && !byPx.has(Number(m[1]))) byPx.set(Number(m[1]), name);
    }
  }
  ladders[fam] = byPx;
}

// ── every custom property defined somewhere the cascade could see it ──
const cssFiles = readdirSync(STYLES)
  .filter((f) => f.endsWith(".css"))
  .sort()
  .map((f) => join(STYLES, f));
const defined = new Set(themeTokens.keys());
const parsed = new Map(); // file → declarations
for (const f of cssFiles) {
  const decls = declarations(readFileSync(f, "utf8"));
  parsed.set(f, decls);
  for (const d of decls) if (d.prop.startsWith("--")) defined.add(d.prop);
}
function walkCode(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkCode(p, acc);
    else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}
for (const f of walkCode(APP_SRC)) {
  for (const m of readFileSync(f, "utf8").matchAll(/--[a-zA-Z][\w-]*/g)) defined.add(m[0]);
}

// ── the scan ──
const counts = {};
const distinct = {};
const tokenized = {};
const findings = { equalsToken: [], danglingVar: [], mismatchedFallback: [] };
for (const fam of Object.keys(FAMILIES)) {
  counts[rawKey(fam)] = 0;
  counts[eqKey(fam)] = ladders[fam].size ? 0 : null;
  distinct[fam] = new Set();
  tokenized[fam] = 0;
}
counts.danglingVar = 0;
counts.mismatchedFallback = 0;
const perFileEquals = new Map();
for (const f of cssFiles) {
  if (f === THEME) continue;
  const file = rel(f);
  for (const d of parsed.get(f)) {
    for (const v of varsIn(d.value)) {
      const where = `${file}:${d.line}`;
      if (!defined.has(v.name)) {
        counts.danglingVar++;
        findings.danglingVar.push({ where, var: v.name, fallback: v.fallback });
      } else if (
        v.fallback &&
        !v.fallback.startsWith("var(") &&
        !CSS_WIDE.has(norm(v.fallback)) &&
        themeTokens.has(v.name)
      ) {
        const values = themeTokens.get(v.name);
        if (!values.has(norm(v.fallback))) {
          counts.mismatchedFallback++;
          findings.mismatchedFallback.push({
            where,
            var: v.name,
            fallback: v.fallback,
            token: [...values].join(" | "),
          });
        }
      }
    }
    const fam = Object.keys(FAMILIES).find((k) => FAMILIES[k].prop.test(d.prop));
    if (!fam) continue;
    if (d.value.includes("var(")) tokenized[fam]++;
    for (const lit of literalsIn(withoutVars(d.value))) {
      counts[rawKey(fam)]++;
      distinct[fam].add(lit.text);
      const token = lit.unit === "px" ? ladders[fam].get(lit.n) : undefined;
      if (token) {
        counts[eqKey(fam)]++;
        findings.equalsToken.push({
          where: `${file}:${d.line}`,
          prop: d.prop,
          literal: lit.text,
          token,
        });
        perFileEquals.set(file, (perFileEquals.get(file) ?? 0) + 1);
      }
    }
  }
}
const distinctCounts = Object.fromEntries(Object.entries(distinct).map(([k, s]) => [k, s.size]));
const tokens = Object.fromEntries(
  Object.entries(ladders).map(([fam, byPx]) => [
    fam,
    Object.fromEntries([...byPx].map(([px, name]) => [name, `${px}px`])),
  ]),
);
const budgetKeys = Object.keys(counts).filter((k) => counts[k] !== null);

// Each mode returns an exit code instead of calling process.exit, which can cut a large --json
// write to a pipe short at 64 KiB.
function candidateMode() {
  // Cheapest high-leverage move: the file with the most literals that already equal a token —
  // each is a mechanical swap with no taste call. Fallback findings are listed beside it.
  const [file, n] =
    [...perFileEquals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? [];
  const swaps = findings.equalsToken.filter((x) => x.where.startsWith(`${file}:`));
  const candidate = file ? { file, equalsToken: n, swaps } : null;
  const fallback = findings.danglingVar[0] ?? findings.mismatchedFallback[0] ?? null;
  console.log(JSON.stringify({ candidate, fallback, counts }, null, 2));
  return 0;
}

function updateMode(budget) {
  const next = {};
  for (const k of budgetKeys) {
    const prev = Number.isFinite(budget?.[k]) ? budget[k] : counts[k];
    next[k] = Math.min(prev, counts[k]); // ratchet down only; a new key seeds at today's count
  }
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`css-literal-budget.json updated — ${JSON.stringify(next)} (only lowers).`);
  return 0;
}

function printReport() {
  console.log("📐 CSS-literal scan — app/src/styles off the type/spacing/radius ladder");
  for (const [fam, { label }] of Object.entries(FAMILIES)) {
    const eq = counts[eqKey(fam)];
    console.log(
      `  ${label.padEnd(15)} raw ${String(counts[rawKey(fam)]).padStart(5)} (${distinctCounts[fam]} distinct)` +
        ` · tokenized decls ${String(tokenized[fam]).padStart(4)}` +
        ` · equals a token ${eq === null ? "— (no token on the ladder yet)" : eq}`,
    );
  }
  console.log(`  dangling var()        ${counts.danglingVar}`);
  for (const x of findings.danglingVar.slice(0, 5))
    console.log(`      ${x.where}  var(${x.var}${x.fallback ? `, ${x.fallback}` : ""})`);
  console.log(`  mismatched fallbacks  ${counts.mismatchedFallback}`);
  for (const x of findings.mismatchedFallback.slice(0, 5))
    console.log(`      ${x.where}  var(${x.var}, ${x.fallback}) — token is ${x.token}`);
}

function verdict(budget) {
  const seed = "Seed it: `node scripts/css-literal-scan.mjs --update`";
  if (!budget) return unknown(`css-literal-budget.json missing. ${seed}`);
  const missing = budgetKeys.filter((k) => !Number.isFinite(budget[k]));
  if (missing.length)
    return unknown(
      `css-literal-budget.json has no ${missing.join(", ")} (a new measurement). ${seed}`,
    );
  const grew = budgetKeys.filter((k) => counts[k] > budget[k]);
  if (!grew.length) {
    console.log("\n✓ CSS literals within budget.");
    return 0;
  }
  for (const k of grew) console.error(`\n✗ ${k} grew: ${counts[k]} > budget ${budget[k]}.`);
  console.error(
    "Fix: use the ladder token (var(--space-N) / var(--text-…)) instead of the literal, and name an\n" +
      "existing token in var() with a fallback equal to its value (or none). Then\n" +
      "`node scripts/css-literal-scan.mjs --update` to ratchet the budget down.",
  );
  return 1;
}

function main() {
  if (process.argv.includes("--json")) {
    const report = { counts, distinct: distinctCounts, tokenized, tokens, findings };
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }
  if (process.argv.includes("--candidate")) return candidateMode();
  const budget = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : null;
  if (process.argv.includes("--update")) return updateMode(budget);
  printReport();
  return verdict(budget);
}
process.exitCode = main();
