/**
 * CLI: the trading smoke test — one share out, one share back, to prove the live order path works
 * before a real signal depends on it. See src/trading/smoke-trade.ts for why this exists.
 *
 *   npm run smoke:trade -- NVDA          # buy 1, sell 1, report both legs
 *   npm run smoke:trade -- NVDA 1 --hold # buy 1 and keep it (inspect a real position)
 *
 * Credentials resolve exactly like a bot's: SKYNET_BOT_<PERSONA>_KEY/SECRET, or the shared
 * SKYNET_BOT_KEY/SKYNET_BOT_SECRET. Paper only — it refuses any non-paper base URL outright.
 */
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";
import { runSmokeTrade, SmokeTradeRefused } from "../trading/smoke-trade.js";

async function main(): Promise<void> {
  const [symbol, rawQty] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!symbol) {
    console.error("usage: npm run smoke:trade -- <SYMBOL> [quantity] [--hold]");
    process.exit(1);
  }
  const apiKey = process.env.SKYNET_BOT_KEY;
  const apiSecret = process.env.SKYNET_BOT_SECRET;
  if (!(apiKey && apiSecret)) {
    console.error("Set SKYNET_BOT_KEY and SKYNET_BOT_SECRET (the account to smoke-test).");
    process.exit(1);
  }
  const baseUrl = process.env.ALPACA_PAPER_BASE_URL ?? ALPACA_PAPER_BASE_URL;
  if (!baseUrl.includes("paper-api")) {
    // The instrument places real orders. It is allowed to do that only where they are simulated.
    console.error(`Refusing: ${baseUrl} is not a paper endpoint. This tool is paper-only.`);
    process.exit(1);
  }

  const client = new AlpacaTradingClient(
    new FetchAlpacaTradingTransport({ apiKey, apiSecret, baseUrl }),
  );
  try {
    const result = await runSmokeTrade(client, {
      symbol,
      ...(rawQty ? { quantity: Number(rawQty) } : {}),
      ...(process.argv.includes("--hold") ? { holdOpen: true } : {}),
    });
    for (const leg of result.legs) {
      const px = leg.filledPrice === undefined ? "?" : leg.filledPrice.toFixed(2);
      console.log(
        `  ${leg.side.padEnd(4)} ${leg.filledQuantity} ${result.symbol} @ ${px} [${leg.status}] ${leg.orderId}`,
      );
    }
    for (const note of result.notes) console.log(`  note: ${note}`);
    console.log(
      result.realized === undefined
        ? "\n✓ smoke trade complete — realized P/L unknown (see notes)."
        : `\n✓ smoke trade complete — realized ${result.realized >= 0 ? "+" : ""}${result.realized.toFixed(2)}.`,
    );
  } catch (error) {
    if (error instanceof SmokeTradeRefused) {
      console.error(`✗ refused: ${error.message}`);
      process.exit(2);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error("smoke trade failed:", error);
  process.exit(1);
});
