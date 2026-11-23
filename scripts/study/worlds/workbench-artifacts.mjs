// What a member can still meet on the bench in a workbench world that production would not show
// them (#8005) — the shell's rows (shell-artifacts.mjs) plus the bench's own. The checker reads
// them before it calls a finding real; compose and parity write them beside each run.

import { SHELL_ARTIFACTS } from "./shell-artifacts.mjs";

/** @type {{route: string, sees: string, why: string}[]} */
export const WORKBENCH_ARTIFACTS = [
  ...SHELL_ARTIFACTS,
  {
    route: "/app/trade with any symbol but NVDA, CRWV, AAPL, MSFT, SPY or GOOG",
    sees: "No quote, chart, chain or guidance for the symbol typed.",
    why:
      "A world quotes only the underlyings its market input lists (workbench-reads.mjs → QUOTED);" +
      " production quotes any listed symbol from the broker's feed.",
  },
  {
    route: "/app/trade → Watch, Cancel, Change, Place (any write on the bench)",
    sees:
      "The page's success path runs, but the list, the order or the position does not change" +
      " afterwards.",
    why: "A world records writes and never applies or sends them (world-route.mjs).",
  },
  {
    route: "/app/trade?section=outlook → Show me the structures (and Guidance's premium read)",
    sees: "“Premium can't be called rich or cheap here — no IV history is recorded for this name yet.”",
    why:
      "Production's IV clock samples each name's implied vol to disk every session" +
      " (`iv-sampler.ts`); a world records no samples, so no regime can be read.",
  },
  {
    route: "/app/trade?section=orders → Alerts → Send these to me",
    sees: "“Alert delivery isn't configured on this deployment yet — alerts stay on this page.”",
    why:
      "Production mails alerts when its mail credential is set (`dashboard-alert-delivery.ts`);" +
      " a world sends nothing off the machine, so it wires the settings store and no transport.",
  },
  {
    route: "/app/ (the Campaign tab, one tap from Trade)",
    sees: "No quest drawn from market conditions; the page's quests list may be empty.",
    why:
      "Production's conditions quests read the VIX history from CBOE (`conditions-quests.ts`);" +
      " a world refuses every request off the machine, so that kind reads as unread.",
  },
];
