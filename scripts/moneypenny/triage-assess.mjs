#!/usr/bin/env node
// ASSESS A MEMBER'S FILING THE MOMENT IT LANDS (#7544) — the clear-path flip, triggered per filing.
//
//   node scripts/moneypenny/triage-assess.mjs --intent            # read $GITHUB_EVENT_PATH → outputs
//   node scripts/moneypenny/triage-assess.mjs --fetch <n> <dir>   # issue + trusted thread → files
//   node scripts/moneypenny/triage-assess.mjs --judged <dir>      # judge.json → clear=true|false
//   node scripts/moneypenny/triage-assess.mjs --post <dir> --mode filing|followup [--dry-run]
//
// WHY. A member files a bug, feature or idea from the app and, unless the in-app coach shaped it
// (`curated`, which self-readies), it sat in Backlog until a person or the daily flip got to it
// (#7544, filed by a member: "sees it enter the build queue within seconds, either ready to build or
// with clear feedback on what needs to happen next"). The judgment already existed — docs/ISSUES.md
// → "Who may flip it": four written checks, then two independent refuters (envelope paths, the
// thread) — but it only ran in batches, and only when the lanes' queue was starved
// (scripts/flip-due.mjs). That trigger answers "keep the lanes fed"; this one answers "tell the
// member where they stand", so it is the SAME rule on a different clock, not a looser rule.
//
// WHAT RUNS WHERE. `moneypenny-events.yml` asks `--intent` on the `feedback` label event (a new
// filing) and on an app-relayed follow-up to a filing this check parked on `needs-info` (the member
// iterating). The judge and the two refuters each run on their OWN runner with a read-only token and
// hand back one JSON blob as a job output; `--post` runs on a fresh runner, holds the App token, and
// computes "clear" from the four checks itself, never from a session's summary (clear-path-flip.js's
// rule). Every string a session wrote is flattened and capped before it is posted (`clean`), and the
// flip comment is built here from the checks, so a session never authors free markdown under the
// App's name. Sessions read only the thread `--fetch` filtered to repo members and bots (#2224).
//
// THE THREE OUTCOMES, each one comment with the footer:
//   - clear and unrefuted → the flip comment (clear-path-post's shape) + `ready` (+ `feedback`).
//     `ready` is "Up next", not "start now": the admission gate still decides when a build begins.
//   - not clear, and every failing check is one the member can answer (acceptance criteria, size)
//     → plain questions + `needs-info` (the app shows "Waiting on your answer"). Their follow-up
//     from the app re-runs this check; nobody has to notice it by hand.
//   - anything else (a fork only Eric settles, the protected class, an open blocker, or a refuter
//     said no) → a plain note that it waits for a person's look, and no label: the member has
//     nothing to answer, so `needs-info` would be a false promise.
// Refusals and flips are recorded in the same ledger the daily flip keeps (flip-refusals.mjs).
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { planPosts, unescapeHtml } from "../clear-path-post.mjs";
import { FLIP_REFUSALS_PATH, readiedRows, refusalRows } from "../flip-refusals.mjs";
import { isMain } from "../is-main.mjs";
import { appendLedgerRows } from "../pr-review/ledger.mjs";
import { ensureGhToken, ghRest, ghRestAll, sh } from "./gh.mjs";
import { FOOTER, LABELS, labelNames, parkedBy } from "./labels.mjs";
import { isClaudeComment } from "./plan-claim.mjs";
import { isRelayedFollowup } from "./reply-resume.mjs";
import { workGate } from "./work-gate.mjs";

export const CHECKS = ["criteria", "size", "noFork", "notBlocked"];
/** The checks a member can fix by answering a question. The other two are a person's call. */
export const MEMBER_ANSWERABLE = ["criteria", "size"];
/** Dial positions this check runs under. `conserve` defers to the daily flip; `halt` runs nothing. */
export const ASSESS_POSITIONS = ["normal", "surge"];
const MEMBER_LABEL = /^member-/;

// ─── pure core (specced in tests/scripts/moneypenny/triage-assess.spec.ts) ────────────────────────

const no = (reason) => ({ assess: false, reason });

/**
 * Should this event start an assessment, and in which mode? Pure: `gate` is workGate()'s verdict.
 * `filing` — the `feedback` label landing on a member's freeform filing.
 * `followup` — an app-relayed follow-up on a member filing parked `needs-info` and never readied:
 * the only question open on such a filing is this check's own (the build lane asks only on `ready`
 * filings, and reply-resume.mjs already refuses to let a relayed reply ready one).
 */
export function assessIntent(ctx, gate) {
  const issue = ctx?.payload?.issue;
  if (!issue) return no("no issue in the payload");
  if (issue.pull_request) return no(`#${issue.number} is a pull request`);
  if (issue.state && String(issue.state).toLowerCase() !== "open") {
    return no(`#${issue.number} is not open`);
  }
  const names = labelNames(issue.labels);
  const has = (n) => names.includes(n);
  if (!has(LABELS.feedback.name)) return no(`#${issue.number} is not a feedback filing`);
  if (!names.some((n) => MEMBER_LABEL.test(n))) {
    return no(`#${issue.number} carries no member- label — not a member's filing`);
  }
  if (has(LABELS.plan.name)) return no(`#${issue.number} is a plan — the plan lane's to flip`);
  if (has(LABELS.ready.name)) return no(`#${issue.number} is already ready`);
  if (has(LABELS.inProgress.name)) return no(`#${issue.number} is in progress`);

  let mode;
  if (ctx.eventName === "issues") {
    if (ctx.action !== "labeled" || ctx.payload.label?.name !== LABELS.feedback.name) {
      return no("not the feedback label landing");
    }
    // The coach-shaped path is triageFeedbackDecision's (index.mjs): it self-readies, or the coach
    // already parked it with its own question. Either way this check has nothing to add.
    if (has("curated")) return no(`#${issue.number} is coach-shaped — the backlog gate owns it`);
    const parked = parkedBy(names);
    if (parked.length) return no(`#${issue.number} is already parked by ${parked.join(", ")}`);
    mode = "filing";
  } else if (ctx.eventName === "issue_comment") {
    const body = ctx.payload.comment?.body;
    if (ctx.action !== "created") return no("not a new comment");
    if (isClaudeComment(body)) return no("a session's own comment never re-assesses (loop guard)");
    if (!isRelayedFollowup(body)) return no("not a follow-up the app relayed from the member");
    if (!has(LABELS.needsInfo.name)) {
      return no(`#${issue.number} is not waiting on the member (no needs-info)`);
    }
    const other = parkedBy(names).filter((l) => l !== LABELS.needsInfo.name);
    if (other.length) return no(`#${issue.number} is also parked by ${other.join(", ")}`);
    mode = "followup";
  } else {
    return no(`event ${ctx.eventName} never starts an assessment`);
  }

  if (!gate?.dispatch) return no(`work dial: ${gate?.reason ?? "unread"}`);
  if (!ASSESS_POSITIONS.includes(gate.position)) {
    return no(`work-mode is ${gate.position} — the daily flip assesses it instead`);
  }
  return { assess: true, mode, number: issue.number, reason: `member ${mode} on #${issue.number}` };
}

/** Which checks failed, read from the judge's own evidence. Mirrors clear-path-flip.js. */
export function failedChecks(judged, mode = "filing") {
  if (!judged || typeof judged !== "object") return ["judge: no result"];
  const failed = CHECKS.filter((k) => judged.checks?.[k]?.pass !== true);
  if (judged.state && judged.state !== "open") failed.push("state");
  const labels = labelNames(judged.labels);
  if (labels.includes(LABELS.ready.name)) failed.push("ready");
  // In followup mode `needs-info` is the question being answered, not a blocker.
  const parked = parkedBy(labels).filter((l) => mode !== "followup" || l !== LABELS.needsInfo.name);
  if (parked.length) failed.push("parked");
  return failed;
}

/**
 * The judge + refuters → a clear-path-flip-shaped result `{survivors, refuted, notClear}`, so the
 * flip's own post rules (planPosts) and refusal ledger (refusalRows) apply unchanged. A refuter
 * that did not return counts as a refutation: an unverified call is not an earned one.
 */
export function assemble({ number, judged, envelope, thread, mode = "filing" }) {
  const out = { survivors: [], refuted: [], notClear: [] };
  const failed = failedChecks(judged, mode);
  const title = judged?.title ?? "";
  if (failed.length) {
    out.notClear.push({ issue: number, title, failed });
    return out;
  }
  const votes = [
    envelope && typeof envelope.refuted === "boolean"
      ? envelope
      : { refuted: true, line: "envelope — verifier did not return" },
    thread && typeof thread.refuted === "boolean"
      ? thread
      : { refuted: true, line: "thread — verifier did not return" },
  ];
  const verifiers = votes.map((v) => clean(v.line ?? "", 200));
  if (votes.some((v) => v.refuted)) {
    out.refuted.push({ issue: number, title, verifiers });
    return out;
  }
  out.survivors.push({
    issue: number,
    title,
    checks: judged.checks,
    addFeedback: !labelNames(judged.labels).includes(LABELS.feedback.name),
    // Built here from the checks, never the judge's own markdown: the App posts it.
    comment: flipComment(judged),
    verifiers,
  });
  return out;
}

/** Who may speak on a public thread (feedback-build.md's #2224 filter): repo members and our bots. */
export const TRUSTED_ASSOCIATIONS = ["OWNER", "MEMBER", "COLLABORATOR"];
export const TRUSTED_BOTS = ["skynet-envoy[bot]", "github-actions[bot]"];

/** Pure. The comments a session may read: trusted authors only, in the order given. */
export function trustedComments(comments = []) {
  return comments.filter(
    (c) =>
      TRUSTED_ASSOCIATIONS.includes(c?.author_association) || TRUSTED_BOTS.includes(c?.user?.login),
  );
}

/**
 * Pure. One line of session text, safe to post under the App's name: whitespace collapsed (no
 * breaking out of a table or a fold), `<`/`>` swapped for lookalikes (no raw HTML), `@` defused (no pings), `|`
 * escaped (no extra table cells), capped.
 */
export function clean(text, max = 300) {
  const flat = unescapeHtml(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    // A lookalike, not `&lt;`: clear-path-post's renderBody unescapes entities, which would revive it.
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .replace(/@/g, "@​")
    .replace(/\|/g, "\\|");
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/** The flip comment, from the four checks alone. */
export function flipComment(judged) {
  const rows = CHECKS.map((k) => `| ${k} | pass | ${clean(judged?.checks?.[k]?.evidence)} |`);
  return [
    "**Clear path — filing check** (docs/ISSUES.md → Who may flip it)",
    "",
    "| Check | Verdict | Evidence |",
    "|---|---|---|",
    ...rows,
  ].join("\n");
}

const checkTable = (judged) => {
  const rows = CHECKS.map((k) => {
    const c = judged?.checks?.[k];
    const verdict = c?.pass === true ? "pass" : "**fail**";
    return `| ${k} | ${verdict} | ${clean(c?.evidence ?? "no evidence")} |`;
  });
  return [
    "<details><summary>The four checks (docs/ISSUES.md → Who may flip it)</summary>",
    "",
    "| Check | Verdict | Evidence |",
    "|---|---|---|",
    ...rows,
    "",
    "</details>",
  ].join("\n");
};

const QUEUED =
  "**Queued to build.** This filing passed the automatic check, so it is now in line. " +
  "Its status moves to *Being built* when a build slot frees up.";

/**
 * The one write this assessment authorizes, as data: the comment body and the label changes.
 * Pure. Throws only through planPosts, on a malformed survivor (two verifier lines, four passes).
 */
export function planWrite(result, judged, mode = "filing") {
  if (result.survivors.length) {
    const [post] = planPosts(result);
    return {
      kind: "ready",
      issue: post.issue,
      body: `${QUEUED}\n\n${post.body}`,
      // Off first, then on: `ready` landing while `needs-info` is still there is the illegal
      // ready + parked pair (labels.mjs), and the claim would refuse it.
      remove: mode === "followup" ? [LABELS.needsInfo.name] : [],
      add: post.labels,
    };
  }
  const entry = result.refuted[0] ?? result.notClear[0];
  const failed = entry?.failed ?? [];
  const asks = (judged?.memberAsks ?? [])
    .slice(0, 3)
    .map((a) => clean(a))
    .filter(Boolean);
  const answerable =
    result.notClear.length > 0 &&
    failed.length > 0 &&
    failed.every((f) => MEMBER_ANSWERABLE.includes(f)) &&
    asks.length > 0;
  if (answerable) {
    const lead =
      mode === "followup"
        ? "**Thanks for the follow-up. This still needs a little more before it can be built.**"
        : "**Thanks for filing this. It needs a little more before it can be built.**";
    return {
      kind: "ask",
      issue: entry.issue,
      body: [
        lead,
        "",
        ...asks.map((a) => `- ${a}`),
        "",
        "Answer with **Follow up** on this filing in the app (Profile → Feedback → your recent " +
          "feedback). Your answer is checked again automatically; nobody has to pick it up first.",
        "",
        checkTable(judged),
        "",
        FOOTER,
        "",
      ].join("\n"),
      remove: [],
      add: mode === "followup" ? [] : [LABELS.needsInfo.name],
    };
  }
  const reason = clean(judged?.plainReason ?? "");
  const verifierLines = (entry?.verifiers ?? []).map((v) => `- ${clean(v, 200)}`);
  return {
    kind: "backlog",
    issue: entry?.issue,
    body: [
      "**This one waits for a person's look before it is built.** Nothing is needed from you " +
        "right now; it stays in the backlog until then.",
      ...(reason ? ["", reason] : []),
      "",
      checkTable(judged),
      ...(verifierLines.length ? ["", "**Second check:**", ...verifierLines] : []),
      "",
      FOOTER,
      "",
    ].join("\n"),
    // A follow-up that turned up a person's call: the member is no longer the one being waited on.
    remove: mode === "followup" ? [LABELS.needsInfo.name] : [],
    add: [],
  };
}

/** Live-state guard at post time: why to skip writing now, or null. */
export function liveSkip(issue, mode = "filing") {
  if (!issue) return "could not read the issue";
  if (issue.state !== "open") return `issue is ${issue.state}`;
  const names = labelNames(issue.labels);
  if (names.includes(LABELS.ready.name)) return "already carries ready";
  if (names.includes(LABELS.inProgress.name)) return "in progress";
  const parked = parkedBy(names).filter((l) => mode !== "followup" || l !== LABELS.needsInfo.name);
  if (parked.length) return `parked since judging: ${parked.join(", ")}`;
  if (mode === "followup" && !names.includes(LABELS.needsInfo.name)) {
    return "no longer waiting on the member";
  }
  return null;
}

// ─── IO ───────────────────────────────────────────────────────────────────────────────────────────

const readJson = (file) => {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const output = (pairs) => {
  const out = process.env.GITHUB_OUTPUT;
  const text = Object.entries(pairs)
    .map(([k, v]) => `${k}=${v}\n`)
    .join("");
  if (out) appendFileSync(out, text);
  else process.stdout.write(text);
};

function readCtx() {
  const file = process.env.GITHUB_EVENT_PATH;
  const payload = file && existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  return { eventName: process.env.GITHUB_EVENT_NAME ?? "", action: payload.action, payload };
}

function restWrite(method, path, payload) {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? "";
  const repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
  return sh(
    "curl",
    [
      "-sS",
      "--fail-with-body",
      "-X",
      method,
      "-H",
      `Authorization: Bearer ${token}`,
      "-H",
      "Accept: application/vnd.github+json",
      "-H",
      "User-Agent: skynet-triage-assess",
      "-H",
      "Content-Type: application/json",
      ...(payload === undefined ? [] : ["--data-binary", "@-"]),
      `https://api.github.com/repos/${repo}/${path}`,
    ],
    payload === undefined ? {} : { input: JSON.stringify(payload) },
  );
}

function record(rows, what) {
  if (!rows.length) return;
  try {
    appendLedgerRows(FLIP_REFUSALS_PATH, rows, {
      message: `chore(flip): ${rows.length} ${what}(s) to ${FLIP_REFUSALS_PATH} (filing check)`,
    });
  } catch (err) {
    console.log(`::warning::could not record ${what}: ${String(err?.message).slice(0, 200)}`);
  }
}

function runPost(dir, mode, dryRun) {
  const judged = readJson(join(dir, "judge.json"));
  const number = Number(process.env.ASSESS_ISSUE ?? judged?.issue);
  if (!Number.isInteger(number) || number <= 0) {
    console.log("::warning::no issue number — the judge did not run; the daily flip will see it");
    return 0;
  }
  if (!judged || Number(judged.issue) !== number) {
    console.log(`::warning::#${number}: no usable judge result — nothing posted`);
    return 0;
  }
  const result = assemble({
    number,
    judged,
    envelope: readJson(join(dir, "refute-envelope.json")),
    thread: readJson(join(dir, "refute-thread.json")),
    mode,
  });
  let write;
  try {
    write = planWrite(result, judged, mode);
  } catch (err) {
    console.error(`triage-assess: ${err.message}`);
    return 1;
  }
  if (dryRun) {
    console.log(
      `── #${write.issue} ${write.kind} −[${write.remove}] +[${write.add}]\n${write.body}`,
    );
    return 0;
  }
  ensureGhToken();
  const skip = liveSkip(ghRest(`issues/${number}`), mode);
  if (skip) {
    console.log(`#${number} skipped — ${skip}`);
    return 0;
  }
  // Comment first: a label with no paper trail is the one outcome the flip rule forbids.
  restWrite("POST", `issues/${number}/comments`, { body: write.body });
  for (const l of write.remove) restWrite("DELETE", `issues/${number}/labels/${l}`);
  if (write.add.length) restWrite("POST", `issues/${number}/labels`, { labels: write.add });
  console.log(`#${number} ${write.kind} — −[${write.remove}] +[${write.add}]`);
  const at = new Date().toISOString();
  if (write.kind === "ready") record(readiedRows([number], at), "readied");
  else record(refusalRows(result, at), "refusal");
  return 0;
}

/** Write what a session may read: the issue, its trusted thread, and (refuters) the judge's file. */
function runFetch(number, dir) {
  ensureGhToken();
  mkdirSync(dir, { recursive: true });
  const issue = ghRest(`issues/${number}`);
  const slim = {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    labels: labelNames(issue.labels),
    body: issue.body ?? "",
  };
  writeFileSync(join(dir, "issue.json"), `${JSON.stringify(slim, null, 2)}\n`);
  const thread = trustedComments(ghRestAll(`issues/${number}/comments`))
    .map((c) => `--- ${c.user?.login} ${c.created_at}\n${c.body ?? ""}`)
    .join("\n\n");
  writeFileSync(join(dir, "thread.txt"), `${thread}\n`);
  if (process.env.JUDGE_JSON) writeFileSync(join(dir, "judge.json"), process.env.JUDGE_JSON);
  console.log(`::notice::fetched #${number}; trusted thread ${thread ? "written" : "empty"}`);
  return 0;
}

function main(argv) {
  if (argv.includes("--fetch")) {
    const i = argv.indexOf("--fetch");
    return runFetch(Number(argv[i + 1]), argv[i + 2]);
  }
  if (argv.includes("--intent")) {
    const ctx = readCtx();
    let gate;
    try {
      gate = workGate();
    } catch (err) {
      gate = { dispatch: false, reason: `dial unreadable: ${err?.message ?? err}` };
    }
    const intent = assessIntent(ctx, gate);
    console.log(`::notice::filing check — ${intent.reason}`);
    output(intent.assess ? { issue: intent.number, mode: intent.mode } : { issue: "", mode: "" });
    return 0;
  }
  const dirAt = (flag) => argv[argv.indexOf(flag) + 1];
  if (argv.includes("--judged")) {
    const judged = readJson(join(dirAt("--judged"), "judge.json"));
    const mode = argv.includes("--mode") ? dirAt("--mode") : "filing";
    const failed = failedChecks(judged, mode);
    console.log(`::notice::judge — ${failed.length ? `not clear: ${failed.join(", ")}` : "clear"}`);
    output({ clear: failed.length ? "false" : "true" });
    return 0;
  }
  if (argv.includes("--post")) {
    const mode = argv.includes("--mode") ? dirAt("--mode") : "filing";
    return runPost(dirAt("--post"), mode, argv.includes("--dry-run"));
  }
  console.error("usage: triage-assess.mjs --intent | --judged <dir> | --post <dir> --mode <m>");
  return 1;
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
