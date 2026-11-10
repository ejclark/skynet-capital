// ANSWER READ-BACK — #6953 slice 3. An ask on a card is only half a loop: his reply used to be read
// by whichever session next opened the issue, and the ledger (docs/process/ALIGNMENT.md) only grew
// when the steering page did (87 answers 10-10..10-16, then nothing). This reads the reply on the
// push tick instead — no session, no page:
//
//   his first reply under an ask that is a letter on the card, "yes", "no" or "not now"
//     → the lane answers "Read as: A", takes `needs-eric` off, unassigns him, clears its ask from
//       the body, and leaves a scored ledger row in the same comment.
//
// WHAT COUNTS AS HIS: a comment by `ejclark` with NO lane footer. Sessions post under his login too,
// so the footer is the only tell (plan-claim.mjs's `isClaudeComment` relies on the same rule). A
// reply that does not parse (a question, a "let me think") is left alone: the issue stays his, and
// the next comment is tried. Reading is conservative on purpose — a misread is a wrongly cleared ask.
//
// WHAT IT NEVER DOES: act on the answer. "merge it" on a held-PR card is NOT read as the merge —
// merging a platter is the irreversible class and stays his click (CLAUDE.md, hard boundaries).
// Held-PR asks carry no `needs-eric` label and are not read here at all.
//
// plan and feedback issues are skipped: reply-resume.mjs already takes their label off and resumes
// the build with the reply as its answer, and clearing the label first would steal that wake.
//
//   node scripts/moneypenny/answer-readback.mjs --ledger [--apply]   # rows for ALIGNMENT.md
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isMain } from "../is-main.mjs";
import { ASSIGN_MARKER, cardOf, UNASSIGN_MARKER } from "./ask-card.mjs";
import { ERIC, NEEDS_ERIC, withoutLaneAsk, writeIssueBody } from "./decision-callout.mjs";
import { ghRest, ghRestAll, sh, trustedComment, withRetry } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";

export const READ_MARKER = "<!-- moneypenny:read-back -->";
const LEDGER_OPEN = "<!-- moneypenny:ledger ";
const LANE_FOOTER = /Generated (?:by|with) \[Claude Code\]/;
/** Lanes whose own reply path owns the answer (reply-resume.mjs). */
const OTHER_REPLY_LANES = [LABELS.plan.name, LABELS.feedback.name];

const names = (labels = []) => labels.map((l) => (typeof l === "string" ? l : l?.name));
const isHis = (c) =>
  String(c?.user?.login ?? "").toLowerCase() === ERIC && !LANE_FOOTER.test(c?.body ?? "");

/** The first line, markdown furniture and a leading "reply"/"answer" word stripped. */
function firstLine(text = "") {
  const line = text.split("\n").find((l) => l.trim()) ?? "";
  return line
    .replace(/^[\s>*_`#-]+/, "")
    .replace(/^(?:(?:reply|answer|re)\b\s*[:-]\s*|(?:reply|answer)\b\s+)/i, "")
    .trim();
}

const TOKEN = /^(?:(\d)[.:)]?\s*)?([A-F]\d?)$/;
/** A plain word is an answer only when it stands alone or is followed by a clause set off by a dash,
 *  colon or paren — "no, actually do X" and "later today I'll look" are not clean answers. */
const plain = (words) => new RegExp(`^(?:${words})\\s*(?:[.!]*$|\\s[—–-]\\s|[(:])`, "i");
const YES = plain("yes|yep|yeah|approved?|do it|go ahead|ok(?:ay)?");
const NO = plain("no|nope");
const DEFER = plain("not now|later|park it|park|defer");

/**
 * What a reply says, against the card it answers, or `null` when it is not an answer to read.
 *   `{ kind: "option", picks: [{ item, key }] }` — letters, one per question (`B`, `A, B, A`, `2B 1A`);
 *   `{ kind: "yes" | "no" | "deferred" }`       — the plain words, only where no letter is on offer.
 * A letter must exist on the card for its question; the rest of a single-question reply is free text
 * ("B — keep it simple"). A several-question reply must be letters and nothing else. Pure.
 */
export function readAnswer(text, card) {
  const line = firstLine(text);
  if (!line) return null;
  if (DEFER.test(line)) return { kind: "deferred" };
  const items = card?.items ?? [];
  const offered = items.some((it) => (it.keys ?? []).length);
  if (!offered) {
    if (YES.test(line)) return { kind: "yes" };
    if (NO.test(line)) return { kind: "no" };
    return null;
  }
  const head = items.length > 1 ? line : line.split(/\s+[—–-]\s+|\s*[(:]/)[0];
  const tokens = head.split(/[\s,;/]+/).filter(Boolean);
  // One question takes exactly one token ("B", "b — simple"), so "B or maybe C?" and "a bit more
  // context" are not answers; several questions take exactly one token each.
  if (items.length <= 1 && tokens.length !== 1) return null;
  const first = tokens;
  const picks = [];
  for (const [i, t] of first.entries()) {
    const m = TOKEN.exec(
      t.replace(/[.!)*_`]+$/, "").replace(/^([a-f]\d?)$/, (s) => s.toUpperCase()),
    );
    if (!m) return null;
    const item = m[1] ? Number(m[1]) - 1 : i;
    if (!(items[item]?.keys ?? []).includes(m[2])) return null;
    picks.push({ item, key: m[2] });
  }
  // Every question answered once: "1A 1B" and "2B 2B" leave one open and double-score another.
  if (items.length > 1 && new Set(picks.map((p) => p.item)).size !== items.length) return null;
  return picks.length ? { kind: "option", picks } : null;
}

/**
 * The ask this lane stands behind and the first readable reply under it, from an issue's comments
 * (oldest first), else `null`. The ask is the newest bot comment carrying the ask marker that no
 * later unassign marker has closed; the card is believed only from a bot, because this repo is
 * public and the card decides what his one word means. Pure.
 */
export function findReply(comments = []) {
  let ask = null;
  for (const c of comments) {
    if (!trustedComment(c)) continue;
    const body = c.body ?? "";
    if (body.includes(UNASSIGN_MARKER)) ask = null;
    else if (body.includes(ASSIGN_MARKER)) ask = c;
  }
  if (!ask) return null;
  const card = isBot(ask) ? cardOf(ask.body) : null;
  const after = comments.filter((c) => Date.parse(c.created_at ?? "") > Date.parse(ask.created_at));
  for (const reply of after.filter((c) => trustedComment(c) && isHis(c))) {
    const answer = readAnswer(reply.body, card);
    if (answer) return { ask, card, reply, answer };
  }
  return null;
}
const isBot = (c) => c?.user?.type === "Bot";

/** Planner input for one issue: the readable reply, if it is the lane's to read. */
export function readbackFor(issue, comments) {
  // The label is NOT required: a read-back that took it off and then failed before its comment
  // would otherwise lose the reply for good. The ask marker (the planner's `markers`) is the memory.
  // A PR is never read: a held-PR ask is answered by the merge click, which no reply stands in for.
  if (issue.pull_request) return null;
  if (names(issue.labels).some((n) => OTHER_REPLY_LANES.includes(n))) return null;
  if ((issue.state ?? "open") !== "open") return null;
  const found = findReply(comments);
  return found ? { number: issue.number, title: issue.title, ...found } : null;
}

// --- the ledger -----------------------------------------------------------------------------

const CLASSES = [
  [/breaker|\bbots?\b|wheel|playbook|paper order/i, "bot safety rules"],
  [/spend|budget|\bcap\b|\$\d/i, "spend limits"],
  [/credential|secret|token|password|api key/i, "credentials"],
  [/archive|session/i, "session housekeeping"],
  [/exit plan|trade form|ticket|member/i, "member trade surfaces"],
  [/gate|lint|debt/i, "engineering gates"],
];
export const classOf = (text = "") => CLASSES.find(([re]) => re.test(text))?.[1] ?? "unclassified";

const day = (iso) => String(iso ?? "").slice(0, 10);

/** One scored row per question answered (ALIGNMENT rule 2: match · miss · unclear). Pure. */
export function ledgerRows({ number, title = "", card, answer, reply }) {
  const items = card?.items?.length ? card.items : [{ question: title }];
  const picks = answer.kind === "option" ? answer.picks : [{ item: 0, key: null }];
  return picks.map(({ item, key }) => {
    const it = items[item] ?? items[0] ?? {};
    const given = key ?? (answer.kind === "deferred" ? "not now" : answer.kind);
    let score;
    if (answer.kind === "deferred") score = "unclear (deferred: not now)";
    else if (it.predicted && key) score = it.predicted === key ? "match" : "miss";
    else if (it.forecast && answer.kind !== "option") {
      const said = new RegExp(`^${answer.kind}\\b`, "i").test(it.forecast.trim());
      score = said ? "match" : "score by hand (the prediction is prose)";
    } else score = it.forecast ? "score by hand (the prediction is prose)" : "not predicted";
    const predicted = it.forecast
      ? `${it.forecast}${it.confidence && !it.forecast.includes(it.confidence) ? ` (${it.confidence})` : ""}`
      : "— (no prediction recorded)";
    return {
      date: day(reply.created_at),
      cls: classOf(`${it.question} ${title}`),
      ask: `#${number} · ${String(it.question ?? title)
        .replace(/\s+/g, " ")
        .slice(0, 140)}`,
      predicted,
      given,
      score,
      key: `${number}/${reply.id}/${item}`,
    };
  });
}

const esc = (s) => String(s).replaceAll("|", "\\|");
/** One ledger line; the key rides in the last cell so a row is never appended twice. */
const tableRow = (r) =>
  `| ${r.date} | ${r.cls} | ${esc(r.ask)} | ${esc(r.predicted)} | ${esc(r.given)} | ${r.score} <!-- ledger:${r.key} --> |`;

/** The comment the lane leaves: what it read, what it did, and the rows (visible and machine). */
export function readbackComment({ answer, rows }) {
  const said =
    answer.kind === "option"
      ? answer.picks.length > 1
        ? answer.picks.map((p) => `${p.item + 1} → ${p.key}`).join(", ")
        : answer.picks[0].key
      : answer.kind === "deferred"
        ? "not now"
        : answer.kind;
  return [
    `Read as: ${said}. \`${NEEDS_ERIC}\` is off and the assignment is gone; if I misread, reply here and a session reads it.`,
    "",
    ...rows.map(
      (r) =>
        `- Alignment ledger: ${r.score}${r.predicted.startsWith("—") ? "" : ` (predicted ${r.predicted})`}`,
    ),
    "",
    READ_MARKER,
    UNASSIGN_MARKER,
    `${LEDGER_OPEN}${JSON.stringify(rows).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e")} -->`,
    "",
    FOOTER,
  ].join("\n");
}

/**
 * Carry out one read-back. The reply comes LAST: the label and assignment are the writes that
 * matter. A failure before the comment leaves the ask marker standing, so the next tick reads the
 * reply again (`readbackFor` does not need the label); a failure of the comment itself the same. A label already gone is fine.
 */
export function executeReadback(intent, { run = sh, retry = withRetry, read = ghRest } = {}) {
  const n = String(intent.number);
  const api = (method, path, ...extra) =>
    retry(() => run("gh", ["api", "--method", method, `repos/{owner}/{repo}/${path}`, ...extra]));
  const body = retry(() => read(`issues/${n}`))?.body ?? "";
  const cleared = withoutLaneAsk(body);
  if (cleared !== body) writeIssueBody(intent.number, cleared, { run, retry });
  try {
    api("DELETE", `issues/${n}/labels/${NEEDS_ERIC}`);
  } catch (err) {
    if (!/404|not found|does not exist/i.test(`${err?.stderr ?? ""} ${err?.message ?? ""}`))
      throw err;
  }
  api("DELETE", `issues/${n}/assignees`, "-f", `assignees[]=${ERIC}`);
  api("POST", `issues/${n}/comments`, "-f", `body=${intent.body}`);
  return `📖 read #${n} — ${intent.said}`;
}

// --- weekly ledger rows, by hand ---------------------------------------------------------------

/** Rows recorded in read-back comments, from an issue's comments. Pure. */
export function rowsFromComments(comments = []) {
  const rows = [];
  for (const c of comments) {
    if (c?.user?.type !== "Bot" || !(c.body ?? "").includes(READ_MARKER)) continue;
    const at = c.body.indexOf(LEDGER_OPEN);
    const end = at === -1 ? -1 : c.body.indexOf(" -->", at);
    if (end === -1) continue;
    try {
      rows.push(...JSON.parse(c.body.slice(at + LEDGER_OPEN.length, end)));
    } catch {
      // a mangled marker is one lost row, never a failed run
    }
  }
  return rows;
}

/** `ledger` with the rows it does not already carry appended to its table, else unchanged. Pure. */
export function appendRows(ledger, rows) {
  const fresh = rows.filter((r) => !ledger.includes(`<!-- ledger:${r.key} -->`));
  if (!fresh.length) return { ledger, added: 0 };
  const lines = ledger.split("\n");
  const from = lines.findIndex((l) => /^##\s+Ledger\b/.test(l));
  let last = -1;
  for (let i = from === -1 ? 0 : from; i < lines.length; i++) {
    if (i > from && from !== -1 && /^##\s/.test(lines[i] ?? "")) break;
    if (/^\|.*\|\s*$/.test(lines[i] ?? "")) last = i;
  }
  if (last === -1) return { ledger, added: 0 };
  lines.splice(last + 1, 0, ...fresh.map(tableRow));
  return { ledger: lines.join("\n"), added: fresh.length };
}

function main(argv) {
  if (!argv.includes("--ledger")) {
    console.error("usage: answer-readback.mjs --ledger [--apply] [--days N]");
    process.exit(2);
  }
  const days = Number(argv[argv.indexOf("--days") + 1]) || 7;
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const rows = [];
  for (const i of ghRestAll(`issues?state=all&since=${since}`)) {
    if (!i.comments) continue;
    rows.push(...rowsFromComments(ghRestAll(`issues/${i.number}/comments`)));
  }
  const path = join(process.cwd(), "docs/process/ALIGNMENT.md");
  if (!existsSync(path)) throw new Error("run from the repo root: docs/process/ALIGNMENT.md");
  const { ledger, added } = appendRows(readFileSync(path, "utf8"), rows);
  if (argv.includes("--apply")) writeFileSync(path, ledger);
  console.log(
    `${added} new ledger row(s) in the last ${days} day(s)${argv.includes("--apply") ? " — written" : " (dry run; --apply writes)"}`,
  );
}

if (isMain(import.meta.url)) main(process.argv.slice(2));
