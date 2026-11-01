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
// detects and reports. It changes nothing, so it is safe to run anywhere. `--json` for machines.
// Exit codes: 0 all passing or unknown · 1 something fails.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BOTS_APP = "skynet-capital-bots";
const DASHBOARD_APP = "skynet-capital";
const STAMP_FRESH_MS = 5 * 60_000;
const NO_MAIL_LINE = "Alert delivery: off";

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
export function judgeAlertReach(logText) {
  const lines = logText.split("\n").filter((line) => line.includes("Alert delivery:"));
  if (!lines.length) return unknown("no boot line in the log buffer");
  return lines.at(-1).includes(NO_MAIL_LINE)
    ? fail("no mail credential, so alerts reach nobody")
    : pass("delivery is on");
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
  const res = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
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
    reaches: "an issue on GitHub",
    probe: () => {
      const machines = json("fly", ["machine", "list", "-a", BOTS_APP, "--json"]);
      return machines ? judgeMachine(machines) : unknown("cannot read Fly");
    },
  },
  {
    id: "bots-responsive",
    mustBeTrue: "The bots process is alive, polling, and reachable from Mission Control",
    corrector: null,
    budget: "none: needs a named cause first",
    reaches: "nobody yet",
    probe: (nowMs) => {
      const machines = json("fly", ["machine", "list", "-a", BOTS_APP, "--json"]);
      const id = machines?.find((m) => (m.config?.standbys ?? []).length === 0)?.id;
      if (!id) return unknown("cannot read Fly");
      const stamp = json("fly", ["machine", "exec", id, "cat /data/health.json", "-a", BOTS_APP]);
      return stamp ? judgeStamp(stamp, nowMs) : unknown("cannot read the health stamp");
    },
  },
  {
    id: "main-deploys",
    mustBeTrue: "A merge to main reaches production",
    corrector: "the Moneypenny repair lane",
    budget: "once per failure signature",
    reaches: "an issue on GitHub",
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
    reaches: "nobody yet",
    probe: () => {
      const logs = run("fly", ["logs", "-a", DASHBOARD_APP, "--no-tail"]);
      return logs === null ? unknown("cannot read Fly") : judgeAlertReach(logs);
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const now = Date.now();
  const results = CONTRACTS.map(({ probe, ...contract }) => ({ ...contract, ...probe(now) }));
  if (process.argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else {
    for (const r of results) {
      console.log(`${r.status.toUpperCase().padEnd(8)}${r.id}: ${r.detail}`);
      if (r.status === "fail")
        console.log(`        corrects: ${r.corrector ?? "nothing yet"} · reaches: ${r.reaches}`);
    }
  }
  if (results.some((r) => r.status === "fail")) process.exitCode = 1;
}
