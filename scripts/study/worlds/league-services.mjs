// The league's services a production server always wires (#4943) — answered from the world's
// book so the pages one tap from the profile render as a member would see them, never as a
// deployment with the service switched off. The thin slice met three such holes: Activity stuck
// on "Tuning in…" (no feed read), the Status pill saying "No ops panel is wired in this
// deployment", and Settings › Account saying account management "isn't wired"; later Milestones
// saying the journey "isn't linked" (#5208). Each was the world, not the app — production wires all of them whenever sign-in (OAuth) is configured
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
import { lastBotActivityAt } from "../../../src/scripts/dashboard-ops-status.ts";
import {
  appDeploySignal,
  botsDeployLag,
  botsDeploySignal,
  deployLag,
} from "../../../src/server/ops-status-deploy-verdict.ts";
import { buildOpsStatus } from "../../../src/server/ops-status-service.ts";
import { createProgressionService } from "../../../src/server/progression-service.ts";
import { isOccSymbol } from "../../../src/trading/option-symbols.ts";
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

/**
 * The bots process's last Mission Control poll. It polls every ~30s whether or not any persona ran
 * a pass (`ops-status-service.ts`), so a bot that stopped deciding is NOT a process that stopped
 * polling: the world's process is up, its last poll 20s before the instant. A world whose story is
 * "the bots process is down" would say so in its input; none does yet.
 */
const LAST_POLL = new Date(AT.getTime() - 20_000).toISOString();

/** The activity store's one read the fleet panel makes: an account's newest fill. */
const activityStore = (book) => ({
  latest: async (id) =>
    (book.activity[id] ?? []).reduce((a, b) => (a === undefined || b.at > a.at ? b : a), undefined),
});

/**
 * The fleet panel, through the real `buildOpsStatus` and production's own last-activity read.
 * The bots process is up and current (see LAST_POLL); deploys are read as production reads them
 * with its GitHub token, through the real verdicts, with main = the deployed = the running commit.
 */
function opsStatus(book) {
  const bots = book.participants.filter((p) => p.kind === "bot").map((p) => p.id);
  const hub = { getState: () => ({ participants: book.participants }) };
  const link = {
    href: `https://github.com/${REPO}/actions/workflows/pipeline.yml`,
    label: "Open Actions",
  };
  return {
    status: () => {
      const head = composingCommit();
      return buildOpsStatus({
        now: () => AT,
        bridgeLastPollAt: () => LAST_POLL,
        botsRunningSha: () => head,
        personaGateVerdicts: () => bots.map((id) => ({ id, ready: true, reason: "ready" })),
        lastBotActivityAt: () => lastBotActivityAt(hub, activityStore(book)),
        fetchDeploySignals: async (_now, running) => ({
          app: appDeploySignal(deployLag(head, head, []), head, head, link),
          bots: botsDeploySignal(botsDeployLag(head, head, []), link, running),
        }),
        repo: REPO,
      });
    },
  };
}

/** A member's option fill needs its order-audit tag to earn, and no book carries the audit yet —
 *  refused rather than read as earning nothing. */
const optionFillWithoutAudit = (book, ids) => {
  const option = ids.flatMap((id) => book.activity[id] ?? []).find((f) => isOccSymbol(f.symbol));
  if (!option) return Promise.resolve([]);
  return Promise.reject(
    new Error(
      `study world: ${option.symbol} is a member's option fill but the book carries no order ` +
        "audit — add the audit to the book before a milestone can classify it",
    ),
  );
};

/**
 * The journey (#5208): production builds it on every boot (`dashboard-companion.ts`), so
 * `/api/learn` answers a linked member's own milestones from their fills. Without it the world
 * said "isn't linked" beside an onboarding that said connected. Its messages and feedback reads
 * are wired and empty — nobody here has said anything to Moneypenny or filed. No preference store:
 * production seeds a member with fill history to wheels off with every earn already claimed, and
 * an absent store reads exactly that (`progression-service-support.ts → seedRecord`) without a
 * write on a read.
 */
function progression(book) {
  return createProgressionService({
    readFills: async (id) => book.activity[id] ?? [],
    readTags: (id) => optionFillWithoutAudit(book, [id]),
    readMessages: async () => [],
    readFeedback: async () => [],
    now: () => new Date(AT),
  });
}

/** The seams to spread into a world's server config. */
export function leagueServices(book) {
  const allActivity = () => Object.values(book.activity).flat();
  const humans = book.participants.filter((p) => p.kind === "human").map((p) => p.id);
  return {
    // The Activity feed: every account's fills (the bus is not wired, so the ledger is the feed).
    // Its other kinds are on, as production's are. Milestones derive from the same fills and are
    // a member's only: a share fill earns its rung untagged, but a member's option fill needs its
    // order-audit tag, which no book carries yet — so a book with one refuses rather than render a
    // record quietly missing that earn (wire-routes.ts: the falsifier the kind exists not to
    // trip). A bot's option fill earns nothing on the feed either way. The builds
    // kind is on with no merge: the page prints no "nothing merged" claim for an empty list, where
    // leaving it off would print "isn't switched on in this deployment" (shell-artifacts.mjs).
    readAllTradeActivity: async () => allActivity(),
    readAllLadderProgress: async () => [],
    readAllOrderAudit: () => optionFillWithoutAudit(book, humans),
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
    // Replies under the Council's lines are on too (#5097); with no line up, nobody has replied.
    councilReplies: {
      load: () => ({ weeks: {} }),
      add: refuse("a Council reply"),
      remove: refuse("removing a Council reply"),
      loadCouncil: () => ({ weeks: {} }),
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
    progression: progression(book),
  };
}
