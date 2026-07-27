import type { Scenario } from "../scenario.js";
import { bankerScenarios } from "./banker.js";
import { dayTraderScenarios } from "./day-trader.js";

/**
 * Scenario packs keyed by persona id. Add a persona's pack here and it's picked up by
 * the runner + `npm run eval:persona <id>`. Packs are the rubric the bot-creation flow
 * will grade an authored persona against (docs/AUTONOMY-READINESS.md §6).
 */
export const scenarioPacks: Readonly<Record<string, readonly Scenario[]>> = {
  "day-trader": dayTraderScenarios,
  banker: bankerScenarios,
};
