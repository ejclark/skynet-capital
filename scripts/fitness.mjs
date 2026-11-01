#!/usr/bin/env node
// Fitness: what must stay true about the running system, checked from outside it (#6470).
//
// Eric, 2026-11-01: fitness functions define "the test that needs to pass", and AI must be able to
// detect, correct and maintain when they don't; they define self-healing systems. Every coach in
// docs/COACHES.md watches the code, so this watches outcomes. The bots outage is why each contract
// carries the parts it does:
//
//   mustBeTrue   an outcome, not a proxy. A green deploy step reported "current" over a dead fleet.
//   probe        reads the real thing, from outside it. A check inside the process dies with it.
//   corrector    what fixes it, or null. A check with no corrector is only an alarm.
//   budget       how often the corrector may act before it must stop and ask.
//   reaches      who hears a failure. The market-hours stall alert detected correctly from 10-18 and
//                reached nobody, because its mail credential was never set.
//
// A probe that cannot run reports "unknown", never a pass: an unknown is not health. This script
// detects and reports, and calls no corrector. `--json` for machines. `--report` keeps one issue per
// failing contract, assigned to the owner: GitHub already delivers that to a phone and inbox, so
// reaching them needs no new credential. The repo is public, so an issue carries only the contract's
// own words and never a log line.
// Exit codes: 0 all passing or unknown, or --report · 1 something fails.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// CI installs the binary as flyctl; a laptop usually has fly.
const FLY = process.env.FLY_BIN ?? (spawnSync("fly", ["version"]).status === 0 ? "fly" : "flyctl");
const OWNER = "ejclark";
const BOTS_APP = "skynet-capital-bots";
const DASHBOARD_APP = "skynet-capital";
const STAMP_FRESH_MS = 5 * 60_000;
// What src/adapters/email-alert-delivery.ts needs. Read as names, never values. The boot line said the
// same thing, but it aged out of the log buffer within hours and the contract went blind.
const ALERT_SECRETS = ["SKYNET_ALERT_EMAIL_API_KEY", "SKYNET_ALERT_EMAIL_FROM"];

const pass = (detail) => ({ status: "pass", detail });
const fail = (detail) => ({ status: "fail", detail });
const unknown = (detail) => ({ status: "unknown", detail });

/** Judge the primary bots machine. A marked stop is a person's decision, so it passes. */
export function judgeMachine(machines) {
  const primary = machines.find((m) => (m.config?.standbys ?? []).length === 0);
  if (!primary) return fail("no primary machine");
  if (primary.config?.metadata?.["skynet-halt"]) {
    return pass(`deliberately halted: ${primary.config.metadata["skynet-halt"]}`);
  }
  return primary.state === "started" ? pass("started") : fail(`machine is ${primary.state}`);
}

/** Judge the process's own stamp: alive, polling recently, and reachable by Mission Control. */
export function judgeStamp(stamp, nowMs) {
  const ageMs = nowMs - Date.parse(stamp.lastControlsPollAt ?? "");
  if (!Number.isFinite(ageMs)) return fail("the stamp has no controls poll");
  if (ageMs > STAMP_FRESH_MS)
    return fail(`last controls poll ${Math.round(ageMs / 60000)} min ago`);
  return stamp.bridge === "armed"
    ? pass(`polled ${Math.round(ageMs / 1000)}s ago, bridge armed`)
    : fail(`bridge is ${stamp.bridge}`);
}

/** Judge main's deploys on the newest run that finished. A cancelled run says nothing either way. */
export function judgeDeploys(runs) {
  const finished = runs.filter(
    (r) => r.conclusion && r.conclusion !== "cancelled" && r.conclusion !== "skipped",
  );
  if (!finished.length) return unknown("no finished push run to read");
  const newest = finished[0];
  if (newest.conclusion === "success") return pass("newest finished push run passed");
  const streak = finished.findIndex((r) => r.conclusion === "success");
  return fail(`${streak === -1 ? finished.length : streak} failed in a row`);
}

/** Judge whether an alert can reach anyone, from the app's own boot line. */
export function judgeAlertReach(secretNames) {
  const missing = ALERT_SECRETS.filter((name) => !secretNames.includes(name));
  return missing.length
    ? fail(`alerts reach nobody: ${missing.join(" and ")} not set`)
    : pass("delivery is configured");
}

/** Judge the size budget from config-audit's constant, so the number has one home. */
export function judgeClaudeMd(bytes, auditSource) {
  const budget = Number(auditSource.match(/CLAUDE_MD_BUDGET_BYTES = (\d+)/)?.[1]);
  if (!budget) return unknown("no budget defined yet");
  return bytes <= budget
    ? pass(`${bytes} of ${budget} bytes`)
    : fail(`${bytes} over budget ${budget}`);
}

function run(bin, args) {
  const res = spawnSync(bin, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return res.status === 0 ? res.stdout : null;
}

function json(bin, args) {
  const out = run(bin, args);
  if (out === null) return null;
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function memoryDirs() {
  const root = join(homedir(), ".claude", "projects");
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .map((name) => join(root, name, "memory"))
    .filter((dir) => existsSync(join(dir, "MEMORY.md")));
}

// One contract per thing that must stay true. Order is the order they matter.
export const CONTRACTS = [
  {
    id: "bots-running",
    mustBeTrue: "The bots machine is running, unless a person deliberately halted it",
    corrector: "scripts/bots-start-stopped.sh",
    budget: "3 starts in 6 hours, then stop",
    reaches: "an issue assigned to the owner",
    probe: () => {
      const machines = json(FLY, ["machine", "list", "-a", BOTS_APP, "--json"]);
      return machines ? judgeMachine(machines) : unknown("cannot read Fly");
    },
  },
  {
    id: "bots-responsive",
    mustBeTrue: "The bots process is alive, polling, and reachable from Mission Control",
    corrector: null,
    budget: "none: needs a named cause first",
    reaches: "an issue assigned to the owner",
    probe: (nowMs) => {
      const machines = json(FLY, ["machine", "list", "-a", BOTS_APP, "--json"]);
      const id = machines?.find((m) => (m.config?.standbys ?? []).length === 0)?.id;
      if (!id) return unknown("cannot read Fly");
      const stamp = json(FLY, ["machine", "exec", id, "cat /data/health.json", "-a", BOTS_APP]);
      return stamp ? judgeStamp(stamp, nowMs) : unknown("cannot read the health stamp");
    },
  },
  {
    id: "main-deploys",
    mustBeTrue: "A merge to main reaches production",
    corrector: "the Moneypenny repair lane",
    budget: "once per failure signature",
    reaches: "an issue assigned to the owner",
    probe: () => {
      const runs = json("gh", [
        "run",
        "list",
        "--workflow",
        "pipeline.yml",
        "--event",
        "push",
        "--limit",
        "30",
        "--json",
        "conclusion",
      ]);
      return runs ? judgeDeploys(runs) : unknown("cannot read GitHub");
    },
  },
  {
    id: "alerts-reach-owner",
    mustBeTrue: "A critical alert reaches the owner when they are not looking",
    corrector: null,
    budget: "none: a credential is the owner's to set",
    reaches: "an issue assigned to the owner",
    probe: () => {
      const secrets = json(FLY, ["secrets", "list", "-a", DASHBOARD_APP, "--json"]);
      return secrets
        ? judgeAlertReach(secrets.map((secret) => secret.name ?? secret.Name))
        : unknown("cannot read Fly");
    },
  },
  {
    id: "memory-has-history",
    mustBeTrue: "Any change to shared agent memory can be seen and undone",
    corrector: "scripts/hooks/memory-history.mjs",
    budget: "every write",
    reaches: "the session",
    probe: () => {
      const dirs = memoryDirs();
      if (!dirs.length) return unknown("no memory folder on this machine");
      const bare = dirs.filter((dir) => !existsSync(join(dir, ".git")));
      return bare.length
        ? fail(`${bare.length} of ${dirs.length} memory folders have no history`)
        : pass(`${dirs.length} folder(s) versioned`);
    },
  },
  {
    id: "startup-size",
    mustBeTrue: "What every session must load stays under its budget",
    corrector: "move a narrow rule to docs/process/WORKING-AGREEMENTS.md",
    budget: "advisory ratchet",
    reaches: "the config audit",
    probe: () => {
      const path = resolve("CLAUDE.md");
      const audit = resolve("scripts/config-audit.mjs");
      if (!(existsSync(path) && existsSync(audit))) return unknown("run from the repo root");
      return judgeClaudeMd(readFileSync(path).length, readFileSync(audit, "utf8"));
    },
  },
];

const issueTitle = (id) => `[fitness] ${id}`;

/**
 * What the issues should do, given results and the open fitness issues. Pure. A failure opens one
 * issue or comments only when its detail changed, so a standing failure does not pile up comments.
 * A pass closes the issue. An unknown touches nothing: it proves neither health nor failure.
 */
export function reportActions(results, openIssues) {
  const actions = [];
  for (const r of results) {
    const issue = openIssues.find((i) => i.title === issueTitle(r.id));
    if (r.status === "fail" && !issue) actions.push({ kind: "open", result: r });
    else if (
      r.status === "fail" &&
      !issue.body.includes(r.detail) &&
      !issue.lastComment?.includes(r.detail)
    ) {
      actions.push({ kind: "comment", number: issue.number, result: r });
    } else if (r.status === "pass" && issue)
      actions.push({ kind: "close", number: issue.number, result: r });
  }
  return actions;
}

function issueBody(r) {
  return [
    `**This must stay true:** ${r.mustBeTrue}.`,
    `**What failed:** ${r.detail}.`,
    `**What fixes it:** ${r.corrector ?? "nothing automatic yet"} (budget: ${r.budget}).`,
    "",
    "This issue closes itself once the check passes. Contract: `scripts/fitness.mjs`.",
  ].join("\n");
}

function report(results) {
  // Listed by label, not --search: the search index lags a new issue, which would open a duplicate.
  const listed = json("gh", [
    "issue",
    "list",
    "--state",
    "open",
    "--label",
    "bug",
    "--json",
    "number,title,body,comments",
    "--limit",
    "200",
  ]);
  if (!listed) {
    console.error("fitness: cannot read GitHub issues, so nothing was reported");
    return;
  }
  const open = listed.map((i) => ({
    ...i,
    lastComment: i.comments?.at(-1)?.body ?? "",
  }));
  for (const a of reportActions(results, open)) {
    const done =
      a.kind === "open"
        ? run("gh", [
            "issue",
            "create",
            "--title",
            issueTitle(a.result.id),
            "--label",
            "bug",
            "--assignee",
            OWNER,
            "--body",
            issueBody(a.result),
          ])
        : a.kind === "comment"
          ? run("gh", [
              "issue",
              "comment",
              String(a.number),
              "--body",
              `Still failing, and it changed: ${a.result.detail}.`,
            ])
          : run("gh", [
              "issue",
              "close",
              String(a.number),
              "--comment",
              `Passing again: ${a.result.detail}.`,
            ]);
    console.log(`fitness: ${done === null ? "COULD NOT " : ""}${a.kind} ${a.result.id}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const now = Date.now();
  const results = CONTRACTS.map(({ probe, ...contract }) => ({
    ...contract,
    ...probe(now),
  }));
  if (process.argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else {
    for (const r of results) {
      console.log(`${r.status.toUpperCase().padEnd(8)}${r.id}: ${r.detail}`);
      if (r.status === "fail")
        console.log(`        corrects: ${r.corrector ?? "nothing yet"} · reaches: ${r.reaches}`);
    }
  }
  if (process.argv.includes("--report")) report(results);
  else if (results.some((r) => r.status === "fail")) process.exitCode = 1;
}
