// THE REDESIGN RETRO'S GATHERING HALF (docs/process/REDESIGN.md → step i, "Learn forward").
//
//   node scripts/redesign/retro.mjs <issue> [--json]
//
// WHY A SCRIPT (Eric, 2026-10-14: "a retro activity before archiving the session could also provide
// a self healing mechanic - we had a recent session that is 15+ iterations deep on redesign. Odds
// are likely that better context could have been provided, superior questions asks/answered upfront
// to reduce the required iterations"). A retro starts from facts: every round a screen's issue
// recorded, what he picked, and every note he left. Those facts sit in the read-back comments
// steer:readback posts ("Answered on the decisions page, design-<issue>-r<N>."), and re-deriving
// them by hand cost a session most of its reading. This lays them out as one timeline plus the
// learn-forward ledger's numbers. It decides nothing: sorting each note into the layer it teaches
// (the loop, his reader profile, the personas, the screen) is the session's judgment.
//
// What it reads: the issue's comments over REST (scripts/moneypenny/gh.mjs, the core bucket).
// What it prints: per round, its date, question, picks (Fix first · Pick · More of · Not · Build) and his
// notes word for word (pin notes, notes under an option, and quoted notes), then the ledger row's
// numbers.

import { pathToFileURL } from "node:url";

/** A read-back comment's first line, carrying the round id. */
const READBACK = /Answered on the decisions page, design-(\d+)-r([\w-]+)\./;
/** The pick lines a read-back writes under a question. */
const PICK = /^- (Fix first|Pick|More of|Not|Build|Look closer|Not a problem):\s*(.*)$/;
/** A line that carries his note: a pin's, `- Option B · pin 2 (label) — 👍 keep — “note”`, or one
 *  under an option (option-notes.mjs, #5429), `- Option B (its name) — more of this — “note”`. */
const PIN_NOTE = /^- (.+?) \((.*?)\)(?: — (.+?))? — “([\s\S]*)”?$/;

/** A pin note may run over several lines (the read-back indents the later ones): join them back
 *  up to the closing quote, so the note is quoted whole. */
function joinNotes(lines) {
  const joined = [];
  for (const l of lines) {
    const prev = joined.at(-1);
    const open = prev?.startsWith("- ") && prev.includes("“") && !prev.trimEnd().endsWith("”");
    if (open) joined[joined.length - 1] = `${prev}\n${l.trim()}`;
    else joined.push(l);
  }
  return joined;
}

/** One line's note — a pin's, an option's, or a quoted note on the round — or null. */
function noteOf(l) {
  if (l.startsWith("- ") && l.includes("“")) {
    const n = PIN_NOTE.exec(l);
    if (!n) return null;
    const text = n[4].replace(/”$/, "").trim();
    return { on: `${n[1]} (${n[2]})`, reaction: n[3] ?? null, text };
  }
  if (!l.startsWith(">")) return null;
  const text = l.replace(/^>\s?/, "").trim();
  return text ? { on: "the round", reaction: null, text } : null;
}

/**
 * One read-back comment → its round, or null when the comment is not a read-back.
 * @param {{ at: string, body: string }} c
 */
export function parseReadback(c) {
  const m = READBACK.exec(c.body ?? "");
  if (!m) return null;
  const lines = joinNotes((c.body ?? "").split("\n"));
  const question = (lines.find((l) => /^\*\*Q\d+ · /.test(l)) ?? "")
    .replace(/^\*\*Q\d+ · /, "")
    .replace(/\*\*$/, "")
    .trim();
  const picks = lines
    .map((l) => PICK.exec(l))
    .filter(Boolean)
    .map((p) => ({ kind: p[1], what: p[2].trim() }));
  const notes = lines.map(noteOf).filter(Boolean);
  const round = Number.parseInt(m[2], 10);
  return {
    issue: Number(m[1]),
    round: Number.isNaN(round) ? m[2] : round,
    at: c.at,
    question,
    picks,
    notes,
  };
}

/**
 * Every round an issue's comments record, oldest first, plus the ledger row's numbers: rounds,
 * the first round with a Build pick, and how many notes came after round 0.
 * @param {{ at: string, body: string }[]} comments
 */
export function retroOf(comments) {
  const rounds = comments
    .map(parseReadback)
    .filter(Boolean)
    .sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const builds = rounds.filter((r) => r.picks.some((p) => p.kind === "Build"));
  const notesAfter0 = rounds.filter((r) => r.round !== 0).reduce((n, r) => n + r.notes.length, 0);
  return {
    rounds,
    ledger: {
      rounds: rounds.length,
      firstBuild: builds[0]?.round ?? null,
      builds: builds.map((r) => r.round),
      notesAfterRound0: notesAfter0,
      from: rounds[0]?.at ?? null,
      to: rounds.at(-1)?.at ?? null,
    },
  };
}

/** The timeline and the ledger numbers as markdown, for the session to read and judge. */
export function retroMarkdown(issue, { rounds, ledger }) {
  const out = [`# Retro facts — #${issue}`, ""];
  for (const r of rounds) {
    out.push(
      `## r${r.round} · ${String(r.at).slice(0, 16).replace("T", " ")} · ${r.question || "(no question line)"}`,
    );
    for (const p of r.picks) out.push(`- ${p.kind}: ${p.what}`);
    for (const n of r.notes)
      out.push(`  - note on ${n.on}${n.reaction ? ` (${n.reaction})` : ""}: “${n.text}”`);
    out.push("");
  }
  out.push(
    "## Ledger numbers",
    `- Rounds read back: ${ledger.rounds} (${String(ledger.from).slice(0, 10)} → ${String(ledger.to).slice(0, 10)})`,
    `- First Build pick: ${ledger.firstBuild === null ? "none" : `r${ledger.firstBuild}`}${ledger.builds.length > 1 ? ` (all: ${ledger.builds.map((b) => `r${b}`).join(", ")})` : ""}`,
    `- Notes after round 0: ${ledger.notesAfterRound0}`,
  );
  return out.join("\n");
}

async function main(argv) {
  const issue = Number.parseInt(argv.find((a) => /^\d+$/.test(a)) ?? "", 10);
  if (!issue) throw new Error("usage: node scripts/redesign/retro.mjs <issue> [--json]");
  const { ensureGhToken, ghRestAll } = await import("../moneypenny/gh.mjs");
  ensureGhToken();
  const raw = await ghRestAll(`/issues/${issue}/comments`);
  const facts = retroOf(raw.map((c) => ({ at: c.created_at, body: c.body ?? "" })));
  console.log(
    argv.includes("--json") ? JSON.stringify(facts, null, 1) : retroMarkdown(issue, facts),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
