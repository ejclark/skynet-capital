/**
 * CLI: read every participant's live account and write the observatory dashboard to
 * dist/dashboard.html.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run export:dashboard
 *
 * The generated HTML is self-contained. To surface it as the shared dashboard, publish
 * dist/dashboard.html as a Claude Artifact; re-running this and re-publishing to the same
 * URL refreshes the view (this is what a scheduled run will do once bots trade live).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { buildDashboardData } from "../observatory/dashboard-data.js";
import { renderDashboardDocument } from "../observatory/render-dashboard.js";
import { loadParticipants } from "../participants/load-participants.js";
import { createDefaultPersonas } from "../personas/registry.js";

const OUTPUT_FILE = "dist/dashboard.html";

async function main(): Promise<void> {
  const participants = loadParticipants(createDefaultPersonas(), process.env);
  if (participants.length === 0) {
    console.error(
      "No participants found. Set SKYNET_BOT_<ID>_KEY/_SECRET and/or SKYNET_HUMAN_<ID>_KEY/_SECRET in .env.",
    );
    process.exit(1);
  }

  console.log(`Reading ${participants.length} account(s)...`);
  const data = await buildDashboardData(participants, {
    clientFactory: (participant) =>
      new AlpacaTradingClient(
        new FetchAlpacaTradingTransport({
          baseUrl: participant.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL,
          apiKey: participant.credentials.apiKey,
          apiSecret: participant.credentials.apiSecret,
        }),
      ),
  });

  mkdirSync("dist", { recursive: true });
  writeFileSync(OUTPUT_FILE, renderDashboardDocument(data));

  for (const p of data.participants) {
    const state = p.error ? "ERROR" : `$${Math.round(p.equity).toLocaleString("en-US")}`;
    console.log(`  ${p.error ? "✗" : "✓"} ${p.displayName} — ${state}`);
  }
  console.log(`Wrote ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
