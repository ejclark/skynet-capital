import { submitFeedbackRequest } from "./feedback";

/**
 * ASKING FOR A TICKER'S RESEARCH (#4469 slice 3b part 2; shared with the fit finder, slice 4) — the
 * one filing both doors use. The research lane has no member-triggered path, so the member's own
 * tap files a feature request through `/api/feedback` (its per-member throttle, its log, its capsule)
 * and the build lane runs the strategy's screen and adds the pair-table row. Research is per
 * strategy and ticker, not per account, so every subscriber reuses it. Never starts research itself,
 * so it cannot spend past the work spigot or the research dispatch budget.
 */
export function askForResearch(
  strategyName: string,
  ticker: string,
  asked = "the ticker picker on the strategy's card",
) {
  return submitFeedbackRequest({
    kind: "feature",
    title: `Study ${ticker} for ${strategyName} in the Playbook Store`,
    area: "Playbook Store",
    details: [
      `Add ${ticker} to ${strategyName} in the Playbook Store (#4469).`,
      "",
      `Run the strategy's research screen on ${ticker} once, write its call sheet with a confidence and a dated falsifier, and add its row to the pair table: researched, a conviction, screened, stand aside, or can't run, with the reason. Research is per strategy and ticker, not per account, so every subscriber reuses it.`,
      "",
      `Asked from ${asked}.`,
    ].join("\n"),
  });
}
