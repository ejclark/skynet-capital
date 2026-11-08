import {
  type BotMode,
  modeGate,
  type PersonaGateVerdict,
} from "../autonomous/controls-poll-wire.js";
import type { DeploySignalsFetcher } from "./ops-status-deploy-lag.js";
import { degradedDeploySignals } from "./ops-status-deploy-verdict.js";
import type { OpsSignal, OpsSignalLink, OpsStatus } from "./ops-status-types.js";

// Re-exported so every existing consumer (`ops-status-routes.ts`, `ops-status-view.ts`,
// `dashboard-ops-status.ts`) keeps one import site — this module is still the composition root
// for the shape, even though the shape itself lives in `ops-status-types.ts` (a dependency-free
// leaf, so it can't reintroduce the import cycle `scripts/dep-graph-scan.mjs` caught here once).
export type { OpsSignal, OpsSignalLink, OpsStatus } from "./ops-status-types.js";

/**
 * THE OPS-STATUS SERVICE — "bots up? on what commit? deploy lag?" answered from
 * what this process can already see, with no new credential. Eric was on his phone while the bots
 * were dark with no surface that said so; this is that surface's read side.
 *
 * Six signals, each honest about what it actually proves:
 *  - `deploy-app` / `deploy-bots` — is `main` deployed? (`ops-status-deploy-lag.ts`, via the
 *    GitHub Actions API the app already reaches for feedback filing).
 *  - `bridge` — has the bots process polled Mission Control recently? The closest credential-free
 *    proxy for "is the bots app alive" this process has: it doesn't watch Fly machine state, but
 *    the poll IS the bots process reaching this one, every ~30s (`bot-controls-client.ts`'s
 *    `POLL_MS`), so its absence is real signal. That same poll also carries the process's own
 *    `GIT_SHA` (`controls-poll-wire.ts`), which is what the `deploy-bots` row above answers
 *    "on what commit?" with.
 *  - `persona-gate` — the boot-time `[gate]` verdict per persona, riding the same poll (#666
 *    slice 3): which bots are cleared to place paper orders vs pinned to `observe`, and why.
 *  - `paper-orders` — whether each bot places paper orders or only watches, and the gate that
 *    holds a watching one (#6954 slice 1): the house mode, the owner's setting, the readiness gate
 *    or a suspend. The house mode is a Fly secret no page could read; the process now says it.
 *  - `activity` — when did a bot last place an order? A slower, second-order corroboration of the
 *    bridge signal — deliberately never alarms on its own (markets close; bots go quiet on
 *    weekends), only flagged `unknown` rather than `attention`.
 *
 * The running-commit answer originally needed a Fly read token (the issue's slice 2). It no longer
 * does: #1301 made the bots process stamp its own `GIT_SHA` from inside, and it now reports that
 * on the poll it was already making. A Fly token's one remaining exclusive value would be the
 * REASON a silent process is silent — deliberately not bought until an incident needs it.
 */

/** The bots process polls this app's internal bridge every 30s (`bot-controls-client.ts`'s
 *  `POLL_MS`); three missed ticks' worth of margin absorbs an ordinary jitter/GC pause without
 *  crying wolf. */
const BRIDGE_POLL_INTERVAL_MS = 30_000;
const BRIDGE_STALE_AFTER_MS = BRIDGE_POLL_INTERVAL_MS * 3;

/** A day with zero bot orders is unremarkable (a quiet market, a weekend) — this signal never
 *  alarms on its own; it only ever reads `unknown`, worded to point at the bridge signal instead
 *  of raising a second, possibly-false alarm. */
const ACTIVITY_QUIET_AFTER_MS = 24 * 60 * 60 * 1000;

const secondsAgo = (iso: string, now: Date): number =>
  Math.round((now.getTime() - Date.parse(iso)) / 1000);

/** `bridgeLastPollAt` is `undefined` when this app process has recorded no poll yet — either the
 *  bots process hasn't started, or it started before (or long after) this app did; that reads as
 *  `unknown`, not `attention`, since it says nothing about whether the bots app is actually down. */
export function bridgeSignal(
  bridgeLastPollAt: string | undefined,
  now: Date,
  link: OpsSignalLink,
): OpsSignal {
  if (!bridgeLastPollAt) {
    return {
      id: "bridge",
      label: "Controls bridge",
      verdict: "unknown",
      detail:
        "No poll recorded from the bots process yet this app run — either it hasn't started, or this app restarted more recently than its last poll.",
      link,
    };
  }
  const ageS = secondsAgo(bridgeLastPollAt, now);
  if (ageS * 1000 <= BRIDGE_STALE_AFTER_MS) {
    return {
      id: "bridge",
      label: "Controls bridge",
      verdict: "ok",
      detail: `Bots process polled Mission Control ${ageS}s ago — armed, suspend toggles reach it within ~30s.`,
    };
  }
  return {
    id: "bridge",
    label: "Controls bridge",
    verdict: "attention",
    detail: `No poll from the bots process in ${ageS}s (expected every ~30s) — it may be down, restarting, or unreachable.`,
    link,
  };
}

export function activitySignal(
  lastBotActivityAt: string | undefined,
  now: Date,
  link: OpsSignalLink,
): OpsSignal {
  if (!lastBotActivityAt) {
    return {
      id: "activity",
      label: "Bot activity",
      verdict: "unknown",
      detail: "No bot order activity recorded yet.",
      link,
    };
  }
  const ageMs = now.getTime() - Date.parse(lastBotActivityAt);
  if (ageMs <= ACTIVITY_QUIET_AFTER_MS) {
    const ageH = Math.round(ageMs / 3_600_000);
    return {
      id: "activity",
      label: "Bot activity",
      verdict: "ok",
      detail: `Last bot order ${ageH < 1 ? "under an hour" : `${ageH}h`} ago.`,
    };
  }
  const ageD = Math.round(ageMs / 86_400_000);
  return {
    id: "activity",
    label: "Bot activity",
    verdict: "unknown",
    detail: `No bot order in ${ageD}d — could be a quiet market or a weekend, not necessarily a problem. Cross-check the controls bridge signal above.`,
    link,
  };
}

/** The panel's read of the boot-time `[gate]` verdict per persona (#666 slice 3) — the same fact
 *  `autonomous-live-wiring.ts` already logs, riding the `/controls` poll it was already making. No
 *  `link`: a not-ready persona is a code/readiness-pack fact, not something an Actions button
 *  fixes, so a "recovery" link here would be dishonest rather than merely unhelpful. */
export function personaGateSignal(verdicts: readonly PersonaGateVerdict[] | undefined): OpsSignal {
  if (!verdicts || verdicts.length === 0) {
    return {
      id: "persona-gate",
      label: "Persona gate",
      verdict: "unknown",
      detail:
        "No persona readiness report from the bots process yet — an older build, no live bots wired, or nothing has polled this app run.",
    };
  }
  const notReady = verdicts.filter((v) => !v.ready);
  if (notReady.length === 0) {
    return {
      id: "persona-gate",
      label: "Persona gate",
      verdict: "ok",
      detail: `${verdicts.length} persona(s) cleared to place paper orders — no readiness gate is pinning any bot to observe.`,
    };
  }
  return {
    id: "persona-gate",
    label: "Persona gate",
    verdict: "attention",
    detail: `${notReady.length} of ${verdicts.length} persona(s) pinned to observe: ${notReady
      .map((v) => `${v.id} (${v.reason})`)
      .join("; ")}.`,
  };
}

/** One bot's standing, in the words the card prints: never a bare "live", which would read as money. */
function botStanding(
  verdict: PersonaGateVerdict,
  suspended: string | null,
  opensHeld: string | null,
): { readonly placing: boolean; readonly words: string } {
  const gate = modeGate("live", verdict);
  if (gate === "owner") {
    return { placing: false, words: "watching: its owner set it to watch only" };
  }
  if (gate === "readiness") {
    return { placing: false, words: "watching: not cleared by its readiness gate" };
  }
  // A suspend blocks every cycle (`suspendedReason` in bot-controls.ts), so a live bot under one
  // places nothing either, and saying "placing" over it would be the false claim this row exists
  // to stop.
  if (suspended) return { placing: false, words: `watching: ${suspended}` };
  // "Stop opening, keep exits" (#6954 slice 5b): it still sells, so it is not "watching", and it
  // opens nothing, so it is not counted as placing paper orders either.
  if (opensHeld) {
    return { placing: false, words: "placing exits only: its owner stopped new positions" };
  }
  return { placing: true, words: "placing paper orders" };
}

/**
 * Whether the bots place paper orders or only watch, and why (#6954 slice 1). The house mode comes
 * from the process itself on the `/controls` poll, each bot's mode from its gate verdict, and a
 * suspend from this app's own Mission Control store. A house in `observe` is the one state that
 * asks for a person: every bot is only watching, and the switch is the owner's. A bot held by its
 * owner, its readiness gate or a suspend is said in words and never alarms on this row — the
 * persona-gate row above already raises a readiness pin, and a suspend or a narrowed bot is a
 * choice someone made. No `link`: the house switch is an approval, not an Actions page to open.
 */
export function paperOrdersSignal(
  processMode: BotMode | undefined,
  verdicts: readonly PersonaGateVerdict[] | undefined,
  suspendedReason: (botId: string) => string | null,
  opensHeldReason: (botId: string) => string | null = () => null,
): OpsSignal {
  const id = "paper-orders";
  const label = "Paper orders";
  if (!processMode) {
    return {
      id,
      label,
      verdict: "unknown",
      detail:
        "The bots process has not said whether it places paper orders — an older build, or nothing has polled this app run.",
    };
  }
  if (processMode === "observe") {
    return {
      id,
      label,
      verdict: "attention",
      detail:
        "Every bot is watching: the house mode records what each would do and places no paper orders.",
    };
  }
  const reported = (verdicts ?? []).filter((v) => v.mode !== undefined);
  if (reported.length === 0) {
    return {
      id,
      label,
      verdict: "unknown",
      detail:
        "The house mode places paper orders, but no bot has reported its own mode yet — none wired, or an older bots build.",
    };
  }
  const standings = reported.map((v) => ({
    id: v.id,
    ...botStanding(v, suspendedReason(v.id), opensHeldReason(v.id)),
  }));
  const placing = standings.filter((b) => b.placing).length;
  return {
    id,
    label,
    verdict: "ok",
    detail: `${placing} of ${standings.length} bot(s) placing paper orders. ${standings
      .map((b) => `${b.id}: ${b.words}`)
      .join("; ")}.`,
  };
}

export interface OpsStatusInputs {
  readonly now: () => Date;
  /** Reads the bridge poll tracker (`dashboard-insights-bridge.ts`) — undefined until the bots
   *  process has polled at least once this app run. */
  readonly bridgeLastPollAt: () => string | undefined;
  /** The commit the bots process reported on its last poll (`controls-poll-wire.ts`); undefined
   *  when it reported none, in which case the deploy row falls back to CI's deploy record. */
  readonly botsRunningSha: () => string | undefined;
  /** This boot's per-persona readiness-gate verdicts, as the bots process reported them on its
   *  last poll (`controls-poll-wire.ts`); undefined when it reported none — an older bots build, no
   *  live bots wired, or a malformed payload, in which case the row reads `unknown`, never wrong. */
  readonly personaGateVerdicts: () => readonly PersonaGateVerdict[] | undefined;
  /** The house mode the bots process reported on its last poll (#6954 slice 1); undefined from a
   *  build that predates the header, in which case the paper-orders row reads `unknown`. */
  readonly botsProcessMode: () => BotMode | undefined;
  /** This app's own Mission Control read: why a bot is suspended, or null (`suspendedReason`). */
  readonly suspendedReason: (botId: string) => string | null;
  /** The same store's "stop opening, keep exits", or null (`opensHeldReason`, #6954 slice 5b).
   *  Absent reads as no hold. */
  readonly opensHeldReason?: (botId: string) => string | null;
  /** Latest `at` among bot-owned trade-activity records; undefined when none exist. Never throws
   *  — a read failure should read as "unknown", not crash the panel. */
  readonly lastBotActivityAt: () => Promise<string | undefined>;
  /** Present only when a GitHub token is configured (`resolveDeployLagFetcher`); absent = the
   *  panel's credential-free degraded mode for the two deploy signals. */
  readonly fetchDeploySignals?: DeploySignalsFetcher;
  /** `owner/repo` — used only to build the "Open Actions" deep link on every signal. */
  readonly repo: string;
}

function actionsLinkFor(repo: string): OpsSignalLink {
  return {
    href: `https://github.com/${repo}/actions/workflows/pipeline.yml`,
    label: "Open Actions",
  };
}

/** `owner/repo` this app is deployed from — the same default `feedback-service.ts`/
 *  `feedback-status.ts` use, so the panel needs no env var of its own. */
export function resolveOpsStatusRepo(env: Readonly<Record<string, string | undefined>>): string {
  return env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
}

export async function buildOpsStatus(inputs: OpsStatusInputs): Promise<OpsStatus> {
  const now = inputs.now();
  const link = actionsLinkFor(inputs.repo);
  const runningSha = inputs.botsRunningSha();
  const [activityAt, deploy] = await Promise.all([
    inputs.lastBotActivityAt().catch(() => undefined),
    inputs.fetchDeploySignals
      ? inputs
          .fetchDeploySignals(now, runningSha)
          .catch(() => degradedDeploySignals(link, runningSha))
      : Promise.resolve(degradedDeploySignals(link, runningSha)),
  ]);
  return {
    generatedAt: now.toISOString(),
    degraded: !inputs.fetchDeploySignals,
    signals: [
      deploy.app,
      deploy.bots,
      bridgeSignal(inputs.bridgeLastPollAt(), now, link),
      personaGateSignal(inputs.personaGateVerdicts()),
      paperOrdersSignal(
        inputs.botsProcessMode(),
        inputs.personaGateVerdicts(),
        inputs.suspendedReason,
        inputs.opensHeldReason,
      ),
      activitySignal(activityAt, now, link),
    ],
  };
}
