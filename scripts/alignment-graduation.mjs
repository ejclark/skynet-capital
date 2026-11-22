// ALIGNMENT GRADUATION — #7939 slice 3. Rule 3 of docs/process/ALIGNMENT.md says a class of
// decision whose predictions keep matching stops asking: three matches in a row and no miss in its
// last five, proposed as ONE ready-to-approve PR, his one tap. Until this file nothing ran that
// check ("No scheduled lane runs it … a session does both"), so on 2026-11-22 the ledger held 21
// matches and no class had ever graduated: the stream of asks reaching Eric never shrank on the
// evidence it was collecting. This reads the ledger and answers, per class, "may it graduate?";
// the daily loops Routine (docs/process/LOOPS-ROUTINE.md) runs it and opens the held PR.
//
// WHAT COUNTS. Only `match` and `miss` (the first word of the Score cell). `pending`, `not
// predicted`, `decided on his behalf`, `unclear …`, `score by hand …` are not evidence either way:
// they neither extend a streak nor break one. Rows are ordered by date, ledger order within a day.
//
// RULE 4 IS A TABLE, NOT A GUESS. The irreversible class never graduates on predictions, so every
// class is looked up in CLASS_MAP: `reversible` may graduate, `irreversible` never does, and a
// class the table does not name is `unmapped` and NOT eligible — the conservative default, fixed
// by a PR that adds it to the table (a reviewable call, never an inference at run time).
//
// SEND BACK. A class in "Graduated classes" with a miss dated on or after its graduation, or one
// the table now calls irreversible, is flagged `sendBack`: a normal PR removes its row.
//
//   node scripts/alignment-graduation.mjs [--json] [--file F]   # the check; exit 0 always (advisory)
//   node scripts/alignment-graduation.mjs --body "<class>"        # the held PR's body, for ship.sh
//   node scripts/alignment-graduation.mjs --graduate "<class>"    # add its row (refuses if not eligible)
//   node scripts/alignment-graduation.mjs --send-back "<class>"   # remove its row, leave a dated line
import { readFileSync, writeFileSync } from "node:fs";
import { isMain } from "./is-main.mjs";

const DEFAULT_FILE = new URL("../docs/process/ALIGNMENT.md", import.meta.url);
/** Rule 3's numbers. */
export const STREAK = 3;
export const WINDOW = 5;

/**
 * Every class the ledger uses, with its rule-4 verdict and the line that decides it. Add a class
 * here, by PR, before it can graduate. `irreversible` cites envelope.json or CLAUDE.md's hard
 * boundaries; `reversible` names how a wrong call is undone.
 */
export const CLASS_MAP = {
  "screen design (taste)": [
    "reversible",
    "a design round's pick; a wrong one is the next round's note or a revert PR",
  ],
  "session housekeeping": ["reversible", "archiving a session is undone by unarchiving it"],
  "engineering gates": ["reversible", "a budget number in a repo file; a PR moves it back"],
  "member trade surfaces": ["reversible", "where a screen shows something; a PR moves it back"],
  "spend limits": ["irreversible", "spend: envelope.json and CLAUDE.md's hard boundaries"],
  credentials: ["irreversible", "credentials: envelope.json and CLAUDE.md's hard boundaries"],
  "review queue": ["irreversible", "merging a held PR is his click (merge posture, carve-outs)"],
  "schedule (arming)": ["irreversible", "arming a Routine is his (docs/ROUTINES.md house rule)"],
  "member data sharing": ["irreversible", "the shared-universe boundary and the invite gate"],
  "member onboarding": ["irreversible", "granting anyone repo or app access is his call"],
  "bot safety rules": [
    "irreversible",
    "safeguards on autonomous trading; held by safety-scales-to-stakes until he moves it",
  ],
};
/** A class the table does not name, but whose words say rule 4: still not eligible, louder. */
const RULE_FOUR_WORDS =
  /spend|budget|credential|secret|token|password|merge|arm|access|invite|privacy|outward|deploy/i;

/** `{ verdict: "reversible"|"irreversible"|"unmapped", why }` for a class name. Pure. */
export function ruleFour(cls = "") {
  const hit = CLASS_MAP[String(cls).trim().toLowerCase()];
  if (hit) return { verdict: hit[0], why: hit[1] };
  if (RULE_FOUR_WORDS.test(cls))
    return { verdict: "irreversible", why: "not in CLASS_MAP, and its words name rule 4" };
  return { verdict: "unmapped", why: "not in CLASS_MAP: add it by PR before it can graduate" };
}

/** Table cells of one markdown row, `\|` kept inside a cell. */
function cells(line) {
  const out = [];
  let cur = "";
  const body = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && body[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (body[i] === "|") {
      out.push(cur.trim());
      cur = "";
    } else cur += body[i];
  }
  out.push(cur.trim());
  return out;
}

/** The table rows under a `## <heading>` section, header and separator dropped. */
function sectionRows(md, heading) {
  const lines = String(md ?? "").split("\n");
  const from = lines.findIndex((l) => new RegExp(`^##\\s+${heading}\\b`, "i").test(l));
  if (from === -1) return [];
  const rows = [];
  let header = true;
  for (const l of lines.slice(from + 1)) {
    if (/^##\s/.test(l)) break;
    if (!/^\|.*\|\s*$/.test(l)) continue;
    if (header) {
      header = false; // the column names
      continue;
    }
    if (/^\|[\s:|-]+\|\s*$/.test(l)) continue; // the separator
    rows.push(cells(l));
  }
  return rows;
}

/** `match`, `miss`, or `null` for anything else a Score cell says. Pure. */
export function scoreOf(cell = "") {
  const s = String(cell)
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim()
    .toLowerCase();
  if (/^match\b/.test(s)) return "match";
  if (/^miss\b/.test(s)) return "miss";
  return null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The Ledger table as rows `{ date, cls, ask, predicted, given, score }`, by date. Pure. */
export function parseLedger(md) {
  return sectionRows(md, "Ledger")
    .filter((c) => c.length >= 6 && DAY.test(c[0]))
    .map((c, i) => ({
      date: c[0],
      cls: c[1],
      ask: c[2],
      predicted: c[3],
      given: c[4],
      score: scoreOf(c[5]),
      i,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.i - b.i)
    .map(({ i, ...r }) => r);
}

/** The "Graduated classes" table as `{ cls, date, pr }`. Pure. */
export function parseGraduated(md) {
  return sectionRows(md, "Graduated classes")
    .filter((c) => c.length >= 3 && c[0] && DAY.test(c[1]))
    .map((c) => ({ cls: c[0], date: c[1], pr: c[2] }));
}

const slug = (cls) =>
  String(cls)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
/** The branch a graduation PR rides, so "is one already open?" is one lookup by head. */
export const branchOf = (cls) => `alignment/graduate-${slug(cls)}`;

/**
 * Per class: the counts, the trailing streak, the misses in the last five, rule 4's verdict,
 * eligibility, and — for a graduated class — whether it goes back. Pure.
 */
export function classStats(rows, graduated = []) {
  const by = new Map();
  for (const r of [...rows, ...graduated]) {
    const key = r.cls.trim().toLowerCase();
    if (!by.has(key)) by.set(key, { cls: r.cls.trim(), rows: [] });
    if ("score" in r) by.get(key).rows.push(r);
  }
  const out = [...by].map(([key, { cls, rows: all }]) =>
    statsOf(cls, all, graduated.find((g) => g.cls.trim().toLowerCase() === key) ?? null),
  );
  return out.sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.matches - a.matches);
}

/** Why a graduated class goes back, else `null`: a miss on or after graduation, or rule 4. */
function sendBackOf(grad, scored, rule4) {
  if (!grad) return null;
  const miss = scored.find((r) => r.score === "miss" && r.date >= grad.date);
  if (miss) return `miss on ${miss.date}: ${miss.ask}`;
  return rule4.verdict === "reversible" ? null : `rule 4 / unmapped: ${rule4.why}`;
}

/** One class's record. Pure. */
function statsOf(cls, all, grad) {
  const scored = all.filter((r) => r.score);
  let streak = 0;
  for (let i = scored.length - 1; i >= 0 && scored[i].score === "match"; i--) streak++;
  const lastFive = scored.slice(-WINDOW);
  const lastFiveMisses = lastFive.filter((r) => r.score === "miss").length;
  const rule4 = ruleFour(cls);
  const rule3 = streak >= STREAK && lastFiveMisses === 0;
  return {
    cls,
    matches: scored.filter((r) => r.score === "match").length,
    misses: scored.filter((r) => r.score === "miss").length,
    unscored: all.length - scored.length,
    streak,
    lastFiveMisses,
    rule3,
    rule4: rule4.verdict,
    rule4Why: rule4.why,
    graduated: grad,
    eligible: rule3 && rule4.verdict === "reversible" && !grad,
    sendBack: sendBackOf(grad, scored, rule4),
    branch: branchOf(cls),
    lastFive,
  };
}

/** The whole check over a file's text. Pure. */
export function check(md) {
  const rows = parseLedger(md);
  const graduated = parseGraduated(md);
  const classes = classStats(rows, graduated);
  return {
    counts: {
      match: rows.filter((r) => r.score === "match").length,
      miss: rows.filter((r) => r.score === "miss").length,
      other: rows.filter((r) => !r.score).length,
    },
    eligible: classes.filter((c) => c.eligible).map((c) => c.cls),
    sendBack: classes.filter((c) => c.sendBack).map((c) => c.cls),
    graduated: graduated.map((g) => g.cls),
    classes,
  };
}

/** Graduated classes that are live: reversible and not due to go back. What the ask lane skips. Pure. */
export function activeGraduated(md) {
  return check(md)
    .classes.filter((c) => c.graduated && !c.sendBack && c.rule4 === "reversible")
    .map((c) => c.cls);
}

const GRAD_HEAD = "## Graduated classes";
const GRAD_TABLE = ["| Class | Graduated | PR |", "|---|---|---|"];

/** `md` with a row added to "Graduated classes" (the section is created above Ledger if absent). Pure. */
export function withGraduated(md, { cls, date, pr }) {
  const lines = String(md).split("\n");
  const row = `| ${cls} | ${date} | ${pr} |`;
  let from = lines.findIndex((l) => l.startsWith(GRAD_HEAD));
  if (from === -1) {
    const ledger = lines.findIndex((l) => /^##\s+Ledger\b/.test(l));
    const at = ledger === -1 ? lines.length : ledger;
    lines.splice(at, 0, GRAD_HEAD, "", ...GRAD_TABLE, "");
    from = at;
  }
  let last = -1;
  for (let i = from + 1; i < lines.length && !/^##\s/.test(lines[i]); i++)
    if (/^\|.*\|\s*$/.test(lines[i])) last = i;
  if (last === -1) {
    lines.splice(from + 1, 0, "", ...GRAD_TABLE, row);
  } else lines.splice(last + 1, 0, row);
  return lines.join("\n");
}

/** `md` with a class's graduated row removed and a dated send-back line under the table. Pure. */
export function withoutGraduated(md, { cls, date, why }) {
  const lines = String(md).split("\n");
  const from = lines.findIndex((l) => l.startsWith(GRAD_HEAD));
  if (from === -1) return md;
  let last = -1;
  for (let i = from + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    if (!/^\|.*\|\s*$/.test(lines[i])) continue;
    if (cells(lines[i])[0]?.toLowerCase() === cls.trim().toLowerCase()) {
      lines.splice(i, 1);
      i--;
      continue;
    }
    last = i;
  }
  if (last !== -1) lines.splice(last + 1, 0, "", `- ${date} · ${cls} sent back: ${why}`);
  return lines.join("\n");
}

const esc = (s) => String(s).replaceAll("|", "\\|");

/** The held graduation PR's body: judgeable in ten seconds, reversal stated. Pure. */
export function prBody(c) {
  const rows = c.lastFive.map(
    (r) => `| ${r.date} | ${esc(r.ask)} | ${esc(r.predicted)} | ${esc(r.given)} | ${r.score} |`,
  );
  return [
    "## The picture",
    "",
    "| Date | The ask | Predicted | Eric's answer | Score |",
    "|---|---|---|---|---|",
    ...rows,
    "",
    `_Caption — the last ${c.lastFive.length} scored rows of "${c.cls}" in docs/process/ALIGNMENT.md; ${c.streak} matches in a row._`,
    "",
    "## Summary",
    "",
    `- "${c.cls}" stops asking you: the session decides at its predicted answer and reports it.`,
    "- Each decision shows in the digest's Headlines; reply to one to reverse it, and it counts as a miss.",
    "- A miss sends the class back to asking; to reverse now, close this PR. Part of #7939.",
    "",
    "> [!IMPORTANT]",
    "> **Needs from you**",
    `> 1. Merge to let "${c.cls}" decide and report, or close to keep it asking — rule 3 of the ledger.`,
    "",
    "<details>",
    "<summary><strong>Why, acceptance &amp; the weeds</strong></summary>",
    "",
    "### Why",
    "",
    `Rule 3 (docs/process/ALIGNMENT.md): ${c.matches} matches, ${c.misses} misses in all; the last ${STREAK} in a row matched and none of the last ${WINDOW} missed. Rule 4: ${c.rule4} — ${c.rule4Why}.`,
    "",
    "### What decide and report means here",
    "",
    "- An ask of this class is not assigned to you. The session takes its predicted option, says so in the digest's Headlines, and logs the row.",
    "- Your reply reversing one is scored a miss; one miss after graduation opens a send-back PR (`--send-back`).",
    "",
    "### Risk & rollback",
    "",
    "- Docs only: one row in the Graduated classes table. Close this PR to decline; revert it to send the class back.",
    "",
    "</details>",
  ].join("\n");
}

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i === -1 ? null : (argv[i + 1] ?? null);
}

/** The three write/print modes; each refuses (exit 1) a class the check does not allow. */
const MODES = {
  "--body": (c) => (c?.eligible ? { print: prBody(c) } : null),
  "--graduate": (c, md, today) =>
    c?.eligible
      ? {
          write: withGraduated(md, { cls: c.cls, date: today, pr: `\`${c.branch}\`` }),
          print: `graduated row added for "${c.cls}" (${today})`,
        }
      : null,
  "--send-back": (c, md, today) =>
    c?.sendBack
      ? {
          write: withoutGraduated(md, { cls: c.cls, date: today, why: c.sendBack }),
          print: `"${c.cls}" sent back: ${c.sendBack}`,
        }
      : null,
};

function summary(result) {
  const { counts } = result;
  const lines = [
    `ledger: ${counts.match} match · ${counts.miss} miss · ${counts.other} not scored either way`,
  ];
  for (const c of result.classes) {
    let state = c.rule3 ? `rule 3 met, held: ${c.rule4}` : "not yet";
    if (c.eligible) state = `ELIGIBLE → ${c.branch}`;
    if (c.graduated) state = `graduated ${c.graduated.date}`;
    if (c.sendBack) state = `SEND BACK (${c.sendBack})`;
    lines.push(
      `- ${c.cls}: ${c.matches} match · ${c.misses} miss · streak ${c.streak} · last-5 misses ${c.lastFiveMisses} · ${c.rule4} · ${state}`,
    );
  }
  return lines.join("\n");
}

function main(argv) {
  const file = arg(argv, "--file") ?? DEFAULT_FILE;
  const md = readFileSync(file, "utf8");
  const result = check(md);
  const today = arg(argv, "--date") ?? new Date().toISOString().slice(0, 10);
  const mode = Object.keys(MODES).find((m) => argv.includes(m));
  if (mode) {
    const name = String(arg(argv, mode)).trim().toLowerCase();
    const c = result.classes.find((x) => x.cls.toLowerCase() === name);
    const out = MODES[mode](c, md, today);
    if (!out) {
      console.error(
        `alignment-graduation: ${mode} "${name}" is not allowed by the check; nothing done`,
      );
      process.exit(1);
    }
    if (out.write) writeFileSync(file, out.write);
    console.log(out.print);
    return;
  }
  // The check itself is advisory: it always exits 0.
  console.log(argv.includes("--json") ? JSON.stringify(result, null, 2) : summary(result));
}

if (isMain(import.meta.url)) main(process.argv.slice(2));
