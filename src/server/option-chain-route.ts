import type { ServerResponse } from "node:http";
import { rowPremium } from "../alpaca/alpaca-options-client.js";
import { EXPIRATION_PATTERN, UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { sendJson } from "./page-shell.js";

/** Chain data for the ticket, degrading exactly as the legacy `ticketData` degrades. */
export async function serveChain(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  const type = params.get("type");
  const requestedExp = params.get("exp");
  if (!UNDERLYING_PATTERN.test(symbol) || (type !== "call" && type !== "put")) {
    sendJson(res, 400, { error: "the chain wants ?symbol=<underlying>&type=call|put" });
    return;
  }
  if (requestedExp !== null && !EXPIRATION_PATTERN.test(requestedExp)) {
    sendJson(res, 400, { error: "?exp= must be a YYYY-MM-DD date" });
    return;
  }
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  if (!client) {
    sendJson(res, 200, {
      chainNote:
        "Live option chains load through your own connected account, and your session isn't linked to one yet.",
    });
    return;
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const expirations = await client.getExpirations(symbol, today);
    if (expirations.length === 0) {
      sendJson(res, 200, { chainNote: `No listed options found for ${symbol}. Check the symbol.` });
      return;
    }
    const expiration =
      requestedExp && expirations.includes(requestedExp)
        ? requestedExp
        : (expirations[0] as string);
    const [chain, spot] = await Promise.all([
      client.getChain(symbol, expiration, type),
      client.getUnderlyingPrice(symbol),
    ]);
    sendJson(res, 200, {
      symbol,
      optionType: type,
      expirations,
      expiration,
      ...(spot !== undefined ? { spot } : {}),
      rows: chain.map((row) => {
        const premium = rowPremium(row);
        return {
          strike: row.strike,
          occSymbol: row.occSymbol,
          ...(premium !== undefined ? { premium } : {}),
          ...(row.bid !== undefined ? { bid: row.bid } : {}),
          ...(row.ask !== undefined ? { ask: row.ask } : {}),
          ...(row.openInterest !== undefined ? { openInterest: row.openInterest } : {}),
        };
      }),
    });
  } catch (error) {
    sendJson(res, 200, {
      chainNote: `Couldn't load the option chain right now — ${String(error)}. The ticket still works; premiums just can't be estimated.`,
    });
  }
}
