#!/usr/bin/env node
// MONEYPENNY — THE RELAY (#3818 slice 4, sub-issue #4287). The one job: **a remainder never dies
// with the issue that captured it.**
//
//   node scripts/moneypenny/relay.mjs --list              # what would relay, touching nothing
//   node scripts/moneypenny/relay.mjs --list --backfill   # include closes from before the watermark
//   node scripts/moneypenny/relay.mjs --apply --backfill  # drain the historical queue, oldest first
//
// WHAT WAS DROPPING. A sliced build ships slice 1, writes the remainder onto the issue and applies
// `next-slice`. Nothing then carries that remainder anywhere: every automated puller reads OPEN
// issues (`pullable()`), so the moment the issue closes the remainder is invisible to all of them
// while still reading, on the issue itself, as "captured". Measured on 2026-10-02: **24 closed
// issues still carry a remainder label**, every one of them closed `completed` — #3595's Playbook
// Store slice 2, #716's Stop-Limit, #783's Collections fold. The plan's own line for this was
// "`next-slice` is terminal" (#3818, "Where it stands today").
//
// WHY A NEW ISSUE AND NOT A REOPEN. A reopened issue carries its whole shipped thread, so a puller
// reads a mostly-done story and has to work out which part is left — and the board would show it in
// whatever column its old labels imply. A relay issue carries ONE ask (the remainder), lands in
// Backlog, and links back for the detail. The original stays closed and honest about what shipped.
//
// WHY IT NEVER ARRIVES `ready`. The label is the authorization in this repo (docs/ISSUES.md →
// *Ready*), and a remainder's shape is exactly what nobody has judged yet. Carrying it forward is
// CAPTURE; authorizing it is a separate act. So a relay issue is pullable by nobody until someone
// flips it, which is also what keeps a false positive (a remainder that actually landed, with the
// label left behind) from costing a build — only a close.
//
// THE WATERMARK, AND WHY THE 24 ARE NOT RELAYED ON THE FIRST PUSH. Relaying a five-week backlog in
// one sweep would put ~24 capture issues on the board at once, most of which need a human to say
// "this landed" — the 10,000-cuts failure CLAUDE.md warns about, paid in one go. So the push path
// only relays issues closed on or after `RELAY_FROM`: from here on nothing is lost, with zero noise.
// The historical queue stays visible to `--list` and drains on demand through `--apply`, where a
// person is present to read it. Same instinct as #4056's correction to criterion 11 ("only for
// closes after the guard lands").
//
// SHAPE — decide/do, like every other lane here: `routeRelay()` is pure (closed issues and the open
// titles in, intents out) and `gatherRelayDeps()` is the only part that reads GitHub. Every branch is
// specced from data in tests/scripts/moneypenny/relay.spec.ts.
import { ghRestAll, sh } from "./gh.mjs";
import { ensureLabel, FOOTER, LABELS, labelNames } from "./labels.mjs";

/** The labels that each mean "a remainder is written on this issue and nobody has built it".
 *  `needs-session` is here for the same reason as `next-slice`: it names WHO can pick the remainder
 *  up, not that anyone did (labels.mjs — the #1357 waiting room). */
export const REMAINDER_LABELS = [LABELS.nextSlice.name, LABELS.needsSession.name];

/** The push path relays closes from this date forward; everything older needs `--backfill`. ISO so
 *  a string compare on `closed_at` is a date compare. See the watermark note in the header. */
export const RELAY_FROM = "2026-10-02";

/** How many relays one tick may file. A rate ceiling, not a policy one — the same reasoning as
 *  `RECONCILE_CAP` in events.mjs: GitHub's secondary limits refuse a burst of mutating calls, and
 *  three per push drains any realistic queue within a normal day. */
export const RELAY_CAP = 3;

/** Kind labels worth inheriting, so a relayed remainder lands in the same part of the board as its
 *  parent. Deliberately NOT `ready`, `in-progress`, any parking label, or the remainder labels
 *  themselves — a relay is a fresh, unjudged, unclaimed ask. */
const INHERITED_LABELS = [
  LABELS.enhancement.name,
  LABELS.bug.name,
  LABELS.feedback.name,
  LABELS.plan.name,
  LABELS.bottleneck.name,
];

/** One relay per source issue, and the title IS the idempotency key — the same device a capsule
 *  signature and an alarm title use. Truncated so GitHub's 256-char ceiling is never the thing that
 *  makes two relays of one issue look different. */
export function relayTitle(number, title) {
  const stem = String(title ?? "")
    .trim()
    .slice(0, 180);
  return `[relay] #${number} remainder — ${stem}`;
}

/** The remainder labels an issue actually carries (empty when it carries none). */
export const remainderLabels = (labels = []) => {
  const names = labelNames(labels);
  return REMAINDER_LABELS.filter((l) => names.includes(l));
};

/** Which of the parent's kind labels the relay issue should be opened with, parent order preserved
 *  so the primary kind leads. Always at least `enhancement`, so the issue is never unlabelled. */
export function relayLabels(labels = []) {
  const inherited = labelNames(labels).filter((l) => INHERITED_LABELS.includes(l));
  return inherited.length ? inherited : [LABELS.enhancement.name];
}

/**
 * Why this issue is not relayed — or `null` when it is. Asked in this order so the reason names the
 * first rule that fails, exactly like `notPullableReason`.
 *
 * `not planned` is the one close reason that is a DECISION, not an accident: someone looked at the
 * work and said no. Carrying its remainder forward would overturn that decision mechanically, which
 * is the opposite of what this lane is for.
 */
export function notRelayableReason(issue, { relayFrom = RELAY_FROM, backfill = false } = {}) {
  if (!issue) return "no issue to relay";
  const n = issue.number;
  if (!remainderLabels(issue.labels).length) {
    return `#${n} carries no remainder label (${REMAINDER_LABELS.join(", ")})`;
  }
  if (String(issue.state ?? "closed").toLowerCase() === "open") {
    return `#${n} is still open — its remainder is already pullable`;
  }
  if (String(issue.stateReason ?? "") === "not_planned") {
    return `#${n} was closed as not planned — that is a decision, not a dropped remainder`;
  }
  const closedAt = String(issue.closedAt ?? "");
  if (!backfill && closedAt.slice(0, 10) < relayFrom) {
    return `#${n} closed ${closedAt.slice(0, 10)}, before the relay watermark ${relayFrom} — run \`--backfill\` to include it`;
  }
  return null;
}

/**
 * Decide what to relay. Pure: no network, no disk, no clock.
 *
 * Oldest close first, for the same reason `routeReceipts` drains oldest first — the remainder that
 * has been invisible longest is the one whose silence has cost the most. Deduped against the open
 * titles the router already pages for the receipt sweep, so a relay that is still open is never
 * filed twice even if the source issue's label write failed.
 *
 * @param deps { closedWithRemainder: [{ number, title, labels, closedAt, stateReason }],
 *               openIssueTitles, relayFrom, relayCap, backfill }
 * @returns Intent[] — `[]` means nothing was dropped, which is the correct answer on most pushes.
 */
export function routeRelay(deps = {}) {
  const {
    closedWithRemainder = [],
    openIssueTitles = [],
    relayFrom = RELAY_FROM,
    relayCap = RELAY_CAP,
    backfill = false,
  } = deps;
  const queued = new Set(openIssueTitles);
  const dropped = [];
  for (const issue of closedWithRemainder) {
    if (notRelayableReason(issue, { relayFrom, backfill })) continue;
    const title = relayTitle(issue.number, issue.title);
    if (queued.has(title)) continue;
    queued.add(title);
    dropped.push({ ...issue, relayTitle: title });
  }
  dropped.sort((a, b) => String(a.closedAt ?? "").localeCompare(String(b.closedAt ?? "")));
  const batch = dropped.slice(0, relayCap);
  if (dropped.length > batch.length) {
    // stderr only — stdout carries machine-read output on some call paths, the same rule the
    // dispatch ceiling and the receipt reconcile follow.
    console.error(
      `::notice::relay — carrying ${batch.length} of ${dropped.length} dropped remainder(s) this ` +
        `tick (cap ${relayCap}); the rest drain on later pushes, oldest close first.`,
    );
  }
  return batch.map((issue) => ({
    kind: "relay-remainder",
    source: issue.number,
    sourceTitle: issue.title,
    title: issue.relayTitle,
    labels: relayLabels(issue.labels),
    clearLabels: remainderLabels(issue.labels),
    body: relayBody(issue),
    sourceComment: sourceCommentBody(issue),
  }));
}

/**
 * The relay issue's body, in the house capsule grammar (docs/ISSUES.md).
 *
 * It deliberately QUOTES NOTHING from the source thread. The remainder is written by a build
 * session in prose whose shape nobody pinned, so any parse of it would be a guess that reads as a
 * quotation — and a confidently wrong restatement of the ask is worse for a zero-context puller
 * than a link to the real thing. So: name the one fact that is certain (a remainder was recorded and
 * nobody built it), point at where it is written, and say what has to happen before anyone pulls it.
 */
export function relayBody(issue) {
  const n = issue.number;
  const closed = String(issue.closedAt ?? "").slice(0, 10);
  const carried = carriedList(issue.labels);
  return [
    `**The remainder of #${n} was never built — relayed here so it is pullable again.**`,
    "",
    "| | |",
    "|---|---|",
    `| **Status** | relayed from #${n}, closed ${closed} still carrying ${carried} |`,
    `| **Source** | #${n} — ${String(issue.title ?? "").slice(0, 120)} |`,
    `| **Size** | unknown until #${n}'s remainder is read — size it before flipping \`ready\` |`,
    "",
    `- #${n} shipped a slice and closed with its remainder still marked, so no puller could see it:`,
    "  every automated puller reads open issues only (`pullable()`, `scripts/moneypenny/labels.mjs`).",
    `- The remainder itself is written on #${n}'s thread, by the session that sliced it. Read that`,
    "  first — this issue carries the pointer, deliberately not a restatement of it.",
    "- **In Backlog on purpose.** Nothing builds this until someone sizes the remainder and applies",
    "  `ready`; close it instead if the work actually landed and the label was just left behind.",
    "",
    `Picture: waived — a relay capture; the remainder's own story is on #${n}.`,
    "",
    `Done when: the remainder of #${n} is built, re-filed with its own criteria, or closed with a`,
    "one-line reason saying where it landed.",
    "",
    FOOTER,
  ].join("\n");
}

/** `` `next-slice` + `needs-session` `` — how both bodies name what the source issue was carrying. */
const carriedList = (labels) =>
  remainderLabels(labels)
    .map((l) => `\`${l}\``)
    .join(" + ");

/** The receipt on the closed issue — the permanent record that the remainder moved, since the relay
 *  also takes the remainder label off (that removal is what keeps the sweep idempotent, so the
 *  comment has to be the thing that survives). */
export function sourceCommentBody(issue) {
  const carried = carriedList(issue.labels);
  return [
    `📨 **Remainder relayed** — this issue closed still carrying ${carried}, which meant the`,
    "remainder recorded above was invisible to every puller (they read open issues only). It now has",
    "its own issue, in Backlog, linked back here.",
    "",
    `${carried} removed from this issue: it is no longer where the remainder lives, and leaving it`,
    "would relay the same remainder again on the next push.",
    "",
    FOOTER,
  ].join("\n");
}

/**
 * Read the closed issues that still carry a remainder. REST on the core bucket and paged, never
 * `gh issue list --json` (which compiles to GraphQL — gh.mjs's header has the day that cost us the
 * whole hour). One query per remainder label, because REST's `labels=` is an AND.
 *
 * FAIL CLOSED, like `gatherDeps` itself: a read that throws must never look like "nothing was
 * dropped", which is this lane's whole failure mode in miniature.
 */
export function gatherRelayDeps({ read = ghRestAll, labels = REMAINDER_LABELS } = {}) {
  const byNumber = new Map();
  for (const label of labels) {
    for (const row of read(`issues?state=closed&labels=${encodeURIComponent(label)}`)) {
      if (row.pull_request) continue;
      byNumber.set(row.number, {
        number: row.number,
        title: row.title,
        labels: labelNames(row.labels),
        closedAt: row.closed_at,
        stateReason: row.state_reason,
        state: row.state,
      });
    }
  }
  return [...byNumber.values()];
}

/**
 * Carry out one relay: open the issue, receipt the source, then take the remainder label off.
 *
 * THAT ORDER IS THE IDEMPOTENCY. The label removal is what stops the next push relaying the same
 * remainder, so it goes LAST — a failure anywhere earlier leaves the source untouched and the sweep
 * simply retries, where removing first would drop the remainder on the floor for good. A relay
 * issue that got filed before a later step failed is caught by the title dedupe instead.
 *
 * Lives here rather than in `index.mjs`'s `executeOne` so the CLI below needs no import of the
 * router (which imports this file — the cycle that would be). The router's branch delegates here.
 */
export function executeRelay(intent, { run = sh, ensure = ensureLabel } = {}) {
  for (const name of intent.labels) ensure(LABELS_BY_NAME.get(name) ?? { name });
  const url = run("gh", [
    "issue",
    "create",
    "--title",
    intent.title,
    "--body",
    intent.body,
    "--label",
    intent.labels.join(","),
  ]);
  run("gh", [
    "issue",
    "comment",
    String(intent.source),
    "--body",
    `${intent.sourceComment}\n\nRelayed to ${url}`,
  ]);
  for (const name of intent.clearLabels) {
    run("gh", ["issue", "edit", String(intent.source), "--remove-label", name]);
  }
  return `📨 relayed #${intent.source}'s remainder → ${url}`;
}

/** The registry keyed by name, so `executeRelay` upserts a label with its real color/description
 *  instead of letting GitHub auto-create a grey one (labels.mjs's `ensureLabel` header). */
const LABELS_BY_NAME = new Map(Object.values(LABELS).map((l) => [l.name, l]));

/** `--list` / `--apply`, for the historical queue a push tick deliberately leaves alone. */
function main(argv = process.argv.slice(2)) {
  const backfill = argv.includes("--backfill");
  const apply = argv.includes("--apply");
  const limitArg = argv.indexOf("--limit");
  const relayCap = limitArg >= 0 ? Number(argv[limitArg + 1]) : Number.POSITIVE_INFINITY;
  const intents = routeRelay({
    closedWithRemainder: gatherRelayDeps(),
    openIssueTitles: ghRestAll("issues?state=open").map((i) => i.title),
    backfill,
    relayCap,
  });
  if (!intents.length) {
    console.log(
      `· nothing to relay${backfill ? "" : ` (closes before ${RELAY_FROM} need --backfill)`}`,
    );
    return;
  }
  console.log(
    `${intents.length} dropped remainder(s)${apply ? "" : " — nothing written (--list)"}:`,
  );
  for (const i of intents) console.log(`  #${i.source} → ${i.title}`);
  if (!apply) {
    console.log("\nRun again with --apply to file them, oldest close first.");
    return;
  }
  for (const i of intents) console.log(executeRelay(i));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
