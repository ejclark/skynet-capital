/**
 * CLI: print the pre-market morning brief — persona readiness, what each enabled playbook
 * wants today, upcoming earnings proximity, and current positions for the active bots.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run brief:morning
 *
 * Works WITHOUT credentials too — calendar/playbook/readiness are pure and offline; only the
 * positions section needs a live account, and it degrades to a note rather than failing.
 *
 * Env knobs (same as run:autonomous, so the brief reports on whatever's actually configured):
 *   SKYNET_AUTONOMOUS_BOTS   comma-separated persona ids (default: day-trader)
 *   SKYNET_PLAYBOOKS         playbook roster, "id:mode" pairs — same parsing as the live runner
 */
import { createBotBroker } from "../bots/bot-broker.js";
import { enabledBotIds, loadBots } from "../bots/bot-registry.js";
import { buildMorningBrief } from "../observatory/morning-brief.js";
import { renderMorningBriefText } from "../observatory/render-morning-brief.js";
import { createDefaultPersonas } from "../personas/registry.js";

async function main(): Promise<void> {
  const enabled = new Set(enabledBotIds(process.env));
  const roster = createDefaultPersonas().filter((p) => enabled.has(p.id));
  if (roster.length === 0) {
    console.error(`No enabled personas. Wanted: ${[...enabled].join(", ")}`);
    process.exit(1);
  }
  const { bots, missing } = loadBots(roster, process.env);
  if (missing.length > 0) {
    console.warn(`No credentials for: ${missing.join(", ")} — they'll be skipped in POSITIONS.`);
  }

  const brief = await buildMorningBrief(new Date().toISOString(), {
    personas: roster,
    bots,
    brokerFactory: createBotBroker,
    playbookEnv: process.env,
  });

  console.log(renderMorningBriefText(brief));
}

main().catch((error) => {
  console.error("Morning brief failed:", error);
  process.exit(1);
});
