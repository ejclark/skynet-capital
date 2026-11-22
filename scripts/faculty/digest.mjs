// THE ROUND DIGEST (#change-scenarios) — every session a round did not land, read for you: what the
// member said, why the ease was what it was, every write the page sent, the turn the member was most
// lost on and the frame of it. Model-free; reads only the round directory.
//
//   node scripts/faculty/digest.mjs <round dir> [--all]     # → <round dir>/digest.md
//
// WHY: after each of the first five rounds the same reading was done by hand, ten one-line scripts a
// round over summary.json, turns.jsonl and frames/ to answer "why did this one fail?" (2026-11-17).
// A recurring manual check is the first thing to automate (CLAUDE.md → the orchestration north star).
// The digest groups the misses by the member's own words so a cluster ("the More menu opens to
// nothing", three phone sessions) reads as one finding, not three, and names the frames to open.
//
// `--all` digests the landed sessions too (ease below 5 is still friction worth reading).

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const clip = (s, n = 280) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);

/** The turns of one session, as the actor gave them. */
function turnsOf(dir) {
  const path = join(dir, "turns.jsonl");
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** The turn the member was most lost on (highest confusion, the later on a tie), and its frame. */
export function worstTurn(turns, dir) {
  let worst;
  for (const t of turns) {
    if (worst === undefined || Number(t.confusion ?? 0) >= Number(worst.confusion ?? 0)) worst = t;
  }
  if (!worst) return undefined;
  // The frame after that turn's action; a `done` / `give_up` takes none, so it is the last frame the
  // member saw before it.
  const frames = existsSync(join(dir, "frames"))
    ? readdirSync(join(dir, "frames"))
        .filter((f) => /^\d{3}\.jpg$/.test(f))
        .sort()
    : [];
  const wanted = `${String((worst.step ?? worst.n) + 1).padStart(3, "0")}.jpg`;
  const frame = frames.includes(wanted)
    ? wanted
    : (frames.filter((f) => f <= wanted).at(-1) ?? frames.at(-1));
  return { turn: worst, frame: frame ? join(dir, "frames", frame) : undefined };
}

/** Writes the page sent, minus the dock's own read receipts. */
export function memberWrites(summary) {
  return (summary.writes ?? [])
    .filter((w) => !String(w.url).startsWith("/api/companion"))
    .map((w) => `${w.method} ${w.url}${w.body ? ` ${clip(w.body, 160)}` : ""}`);
}

/** One session's entry in the digest. */
export function entry(dir, summary) {
  const turns = turnsOf(dir);
  const worst = worstTurn(turns, dir);
  const v = summary.verdict ?? {};
  const lines = [
    `### ${summary.scenario} · ${summary.member} · ${summary.viewport} — ${
      summary.confounded ? `set aside: ${summary.confounded}` : v.success ? "landed" : "not landed"
    }`,
    "",
    `- **Verdict:** ${clip(v.reason)}${v.unintended?.length ? ` · **unintended:** ${v.unintended.join("; ")}` : ""}`,
    `- **Ended:** ${summary.ended} after ${summary.turns}/${summary.cap} turns · ease ${summary.ease?.score ?? "—"}/7`,
    `- **Why the ease:** ${clip(summary.ease?.reason)}`,
    `- **Said:** ${clip(summary.said)}`,
  ];
  const writes = memberWrites(summary);
  lines.push(`- **Writes sent:** ${writes.length ? writes.join(" · ") : "none"}`);
  if (worst) {
    lines.push(
      `- **Most lost (turn ${worst.turn.n}, confusion ${worst.turn.confusion ?? "—"}):** ${clip(worst.turn.as_member, 200)} — noticed: ${clip(worst.turn.noticed, 200)}`,
    );
    if (worst.frame) lines.push(`- **Frame:** \`${worst.frame}\``);
  }
  return lines.join("\n");
}

function main(argv) {
  const dir = argv.find((a) => !a.startsWith("--"));
  if (!dir) throw new Error("usage: digest.mjs <round dir> [--all]");
  const all = argv.includes("--all");
  const sessions = readdirSync(dir)
    .map((name) => join(dir, name))
    .filter((d) => existsSync(join(d, "summary.json")))
    .map((d) => ({ dir: d, summary: read(join(d, "summary.json")) }));
  const misses = sessions.filter(
    ({ summary }) =>
      all || summary.confounded || !summary.verdict?.success || (summary.ease?.score ?? 7) < 4,
  );
  const header = [
    `# Round digest — ${misses.length} of ${sessions.length} session(s) worth reading`,
    "",
    `_Not landed, set aside, or landed at ease below 4${all ? " (and, with --all, every other session)" : ""}. Open the frame named under each to see what the member saw._`,
    "",
  ];
  const body = misses
    .sort((a, b) => String(a.summary.scenario).localeCompare(b.summary.scenario))
    .map(({ dir: d, summary }) => entry(d, summary));
  const out = join(dir, "digest.md");
  writeFileSync(out, `${[...header, body.join("\n\n")].join("\n")}\n`);
  console.log(`digest: ${misses.length} session(s) → ${out}`);
}

if (process.argv[1]?.endsWith("faculty/digest.mjs")) main(process.argv.slice(2));
