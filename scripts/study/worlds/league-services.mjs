// The league's services a production server always wires (#4943) — answered from the world's
// book so the pages one tap from the profile render as a member would see them, never as a
// deployment with the service switched off. The thin slice met three such holes: Activity stuck
// on "Tuning in…" (no feed read), the Status pill saying "No ops panel is wired in this
// deployment", and Settings › Account saying account management "isn't wired". Each was the
// world, not the app — production wires all of them whenever sign-in (OAuth) is configured
// (`src/scripts/serve-dashboard.ts`, `dashboard-ops-status.ts`).
//
// RULES, the same as server-config.mjs: the real route handlers and builders run untouched; this
// file only fills the seams they read through. A store the book has nothing for is EMPTY (no
// Council line this week, no filing, no saved profile) — a world fact, never a disabled service.
// Writes never reach these (world-route.mjs records them and answers a stub), so the write seams
// refuse loudly if anything ever calls one.
//
// What is still not production's — the fund owner's cards, the sign-in page, the feedback coach —
// is declared in shell-artifacts.mjs, which compose and parity write beside every run.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  appDeploySignal,
  botsDeployLag,
  botsDeploySignal,
  deployLag,
} from "../../../src/server/ops-status-deploy-verdict.ts";
import { buildOpsStatus } from "../../../src/server/ops-status-service.ts";
import { INSTANT } from "./instant.mjs";

const AT = new Date(INSTANT);
const REPO = "ejclark/skynet-capital";

const refuse = (what) => () => {
  throw new Error(`study world: ${what} is a write — the world records writes, never applies them`);
};

/** The commit that composed this world: what production would report as deployed and running. */
function composingCommit() {
  const checkout = fileURLToPath(new URL("../../../", import.meta.url));
  const out = spawnSync("git", ["-C", checkout, "rev-parse", "HEAD"], { encoding: "utf8" });
  if (out.status !== 0) throw new Error(`study world: git rev-parse failed: ${out.stderr}`);
  return out.stdout.trim();
}

/** Newest `at` (ms or ISO) across records, as ISO; undefined when there are none. */
function newest(records) {
  const times = records.map((r) => (typeof r.at === "number" ? r.at : Date.parse(r.at)));
  return times.length > 0 ? new Date(Math.max(...times)).toISOString() : undefined;
}

/**
 * The fleet panel, through the real `buildOpsStatus`. The bots process's last poll is the bots'
 * newest pass (a stopped bot stopped polling too); deploys are read as production reads them with
 * its GitHub token, through the real verdicts, with main = the deployed = the running commit.
 */
function opsStatus(book) {
  const bots = book.participants.filter((p) => p.kind === "bot").map((p) => p.id);
  const link = {
    href: `https://github.com/${REPO}/actions/workflows/pipeline.yml`,
    label: "Open Actions",
  };
  const lastPass = newest(bots.flatMap((id) => book.decisions[id] ?? []));
  return {
    status: () => {
      const head = composingCommit();
      return buildOpsStatus({
        now: () => AT,
        bridgeLastPollAt: () => lastPass,
        botsRunningSha: () => (lastPass ? head : undefined),
        personaGateVerdicts: () =>
          lastPass ? bots.map((id) => ({ id, ready: true, reason: "ready" })) : undefined,
        lastBotActivityAt: async () => newest(bots.flatMap((id) => book.activity[id] ?? [])),
        fetchDeploySignals: async (_now, running) => ({
          app: appDeploySignal(deployLag(head, head, []), head, head, link),
          bots: botsDeploySignal(botsDeployLag(head, head, []), link, running),
        }),
        repo: REPO,
      });
    },
  };
}

/** The seams to spread into a world's server config. */
export function leagueServices(book) {
  const allActivity = () => Object.values(book.activity).flat();
  return {
    // The Activity feed: every account's fills (the bus is not wired, so the ledger is the feed).
    // Its other kinds are on, as production's are: milestones derive from the same fills (no
    // ladder logged, no order tagged); the builds kind has no merge in this world.
    readAllTradeActivity: async () => allActivity(),
    readAllLadderProgress: async () => [],
    readAllOrderAudit: async () => [],
    readMergedPullRequests: async () => [],
    // Feedback is switched on (production has its token); this world's members have filed nothing.
    submitFeedback: refuse("submitting feedback"),
    submitFollowup: refuse("a feedback follow-up"),
    readFeedback: async () => [],
    readAllFeedback: async () => [],
    // The Council is on; nobody has spoken this week.
    council: {
      load: () => ({ weeks: {} }),
      submit: refuse("a Council line"),
      retract: refuse("retracting a Council line"),
      now: () => AT,
    },
    filingComments: {
      load: () => ({ issues: {} }),
      add: refuse("a filing comment"),
      remove: refuse("removing a filing comment"),
      readFilings: async () => [],
      now: () => AT,
    },
    // Account management is wired; no account has a saved display name or timezone yet.
    accountAdmin: {
      profileFor: () => undefined,
      updateProfile: refuse("a profile update"),
      removeAccount: refuse("removing an account"),
    },
    opsStatus: opsStatus(book),
  };
}
