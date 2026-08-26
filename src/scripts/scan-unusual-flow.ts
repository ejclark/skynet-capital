/**
 * CLI: the unusual-options-activity scan — the scheduled eye behind the flow ledger.
 *
 *   npm run scan:flow -- NVDA 2026-09-18            # scan one expiration, append the record
 *   npm run scan:flow -- NVDA 2026-09-18 --dry-run  # report only, write nothing
 *
 * READ-ONLY: two GETs (contracts, snapshots) and one append to the local ledger. It cannot place
 * an order. Credentials resolve exactly like a bot's — SKYNET_BOT_KEY / SKYNET_BOT_SECRET.
 *
 * SKYNET_FLOW_DIR is REQUIRED and has no default, on purpose: a relative `data/…` path is erased
 * by every Fly deploy unless it is pinned in `fly.toml`'s `[env]` block, that file is inside the
 * build envelope, and a ledger that silently loses its series is worse than one that refuses to
 * start (see `src/options/unusual-flow-store.ts`). `--dry-run` needs no directory at all.
 *
 * DELIVERY IS NOT THIS SCRIPT'S JOB. It prints and it appends. Turning a flag into an alert or a
 * badge belongs to the alert substrate; the ledger is the seam between them.
 */
import { AlpacaOptionsFlowSource } from "../adapters/alpaca-options-flow.js";
import { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { DEFAULT_UNUSUAL_FLOW_THRESHOLDS, detectUnusualFlow } from "../options/unusual-flow.js";
import { JsonlUnusualFlowStore } from "../options/unusual-flow-store.js";
import { ALPACA_DATA_BASE_URL } from "../runtime/data-source.js";

async function main(): Promise<void> {
  const [underlying, expiration] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!(underlying && expiration)) {
    console.error("usage: npm run scan:flow -- <UNDERLYING> <YYYY-MM-DD> [--dry-run]");
    process.exit(1);
  }
  const apiKey = process.env.SKYNET_BOT_KEY;
  const apiSecret = process.env.SKYNET_BOT_SECRET;
  if (!(apiKey && apiSecret)) {
    console.error("Set SKYNET_BOT_KEY and SKYNET_BOT_SECRET (any read-capable paper account).");
    process.exit(1);
  }
  const dryRun = process.argv.includes("--dry-run");
  const ledgerDir = process.env.SKYNET_FLOW_DIR;
  if (!(dryRun || ledgerDir)) {
    console.error(
      "Set SKYNET_FLOW_DIR to the ledger directory (on Fly, a path under the mounted /data " +
        "volume). There is no default: an unpinned relative path is erased on every deploy, and " +
        "a ledger that silently loses its series is worse than one that refuses to start. Use " +
        "--dry-run to scan and print without recording.",
    );
    process.exit(1);
  }
  const credentials = { apiKey, apiSecret };
  const tradingBase = process.env.ALPACA_PAPER_BASE_URL ?? ALPACA_PAPER_BASE_URL;
  const client = new AlpacaOptionsClient(
    new FetchAlpacaTradingTransport({ ...credentials, baseUrl: tradingBase }),
  );
  const source = new AlpacaOptionsFlowSource(
    client,
    new FetchAlpacaTradingTransport({
      ...credentials,
      baseUrl: process.env.ALPACA_DATA_BASE_URL ?? ALPACA_DATA_BASE_URL,
    }),
  );

  const scan = detectUnusualFlow(
    underlying,
    await source.flows(underlying, expiration),
    new Date().toISOString(),
    DEFAULT_UNUSUAL_FLOW_THRESHOLDS,
  );
  if (ledgerDir && !dryRun) {
    await new JsonlUnusualFlowStore(ledgerDir).save(scan);
  }

  console.log(
    `${underlying} ${expiration} — scanned ${scan.contractsScanned}, judged ${scan.contractsJudged}` +
      `, could not judge ${scan.indeterminate}, flagged ${scan.flags.length}` +
      ` (vol/OI ≥ ${scan.thresholds.minRatio}, min volume ${scan.thresholds.minVolume})`,
  );
  for (const flag of scan.flags) {
    const ratio = flag.ratio === undefined ? "no open interest" : `${flag.ratio.toFixed(1)}× OI`;
    console.log(
      `  ${flag.occSymbol}  ${flag.type} ${flag.strike}  vol ${flag.volume} / OI ${flag.openInterest}  [${ratio}]`,
    );
  }
  if (scan.flags.length === 0) {
    console.log(
      dryRun
        ? "  no unusual activity — nothing recorded (--dry-run)."
        : "  no unusual activity — the empty scan is recorded, not skipped.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
