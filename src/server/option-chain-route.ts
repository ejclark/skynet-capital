import type { ServerResponse } from "node:http";
import { rowPremium } from "../alpaca/alpaca-options-client.js";
import { EXPIRATION_PATTERN, UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { sendJson } from "./page-shell.js";

/**
 * Chain data for the ticket, degrading exactly as the legacy `ticketData` degrades.
 *
 * Every degraded response carries a machine-readable `reason` alongside the prose `chainNote`
 * so the client can branch on *why* the chain didn't load without parsing English text:
 * `"unlinked"` (no connected account yet), `"no-options"` (a genuine dead end — the symbol has
 * no listed options), or `"failed"` (a feed/broker error — the ticket still works manually).
 *
 * The row payload widened for the scroll-out chain columns (#2017 Phase 1 slice 14): volume and
 * the four commonly-shown greeks (delta/gamma/theta/vega) now ride alongside bid/ask/openInterest,
 * each still absent — never a fabricated value — whenever the client didn't compute it.
 */
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
      reason: "unlinked",
    });
    return;
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const expirations = await client.getExpirations(symbol, today);
    if (expirations.length === 0) {
      sendJson(res, 200, {
        chainNote: `No listed options found for ${symbol}. Check the symbol.`,
        reason: "no-options",
      });
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
          ...(row.volume !== undefined ? { volume: row.volume } : {}),
          ...(row.delta !== undefined ? { delta: row.delta } : {}),
          ...(row.gamma !== undefined ? { gamma: row.gamma } : {}),
          ...(row.theta !== undefined ? { theta: row.theta } : {}),
          ...(row.vega !== undefined ? { vega: row.vega } : {}),
        };
      }),
    });
  } catch (error) {
    sendJson(res, 200, {
      chainNote: `Couldn't load the option chain right now — ${String(error)}. The ticket still works; premiums just can't be estimated.`,
      reason: "failed",
    });
  }
}
