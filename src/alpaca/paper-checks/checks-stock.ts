/**
 * The stock-side paper checks (#8256): 1 bracket-after-close, 2 extended-hours, 3 evening-quotes,
 * 4 fractional-exits. Every entry is a limit that can't fill (30% of the last IEX trade); the one
 * exception is check 4's 0.5-share market buy and its sell-back, which exist to give the OCO a
 * position to sit on. Cleanup (`cleanup.ts`) cancels whatever these leave open.
 */
import { type CheckAnswer, sayAll, verdict } from "./answer.js";
import {
  type Attempt,
  bracketLegs,
  cents,
  classify,
  type Desk,
  lastTrade,
  placeOrder,
  readOrder,
  unfillableBuy,
} from "./desk.js";
import { openingToday, phaseAt } from "./windows.js";

const MINUTE = 60_000;

/** Check 1 — a limit-entry bracket sent while closed, `day` and `gtc`, read back with its legs. */
export async function bracketAfterClose(desk: Desk): Promise<CheckAnswer> {
  const entry = unfillableBuy(await lastTrade(desk, "SPY"));
  const body = (tif: "day" | "gtc") => ({
    symbol: "SPY",
    qty: "1",
    side: "buy",
    type: "limit",
    limit_price: entry,
    time_in_force: tif,
    order_class: "bracket",
    ...bracketLegs(entry),
  });
  const sent = [
    await placeOrder(desk, "bracket-after-close", "bracket, day", body("day")),
    await placeOrder(desk, "bracket-after-close", "bracket, gtc", body("gtc")),
  ];
  const readAll = async (when: string): Promise<Attempt[]> => {
    const reads: Attempt[] = [];
    for (const s of sent) {
      if (s.orderId) reads.push(await readOrder(desk, `${s.label}, ${when}`, s.orderId));
    }
    return reads;
  };
  const reads = await readAll("read back");
  // Started 15 minutes or less before the open: watch both through 09:31 ET, 20 minutes at most.
  // A signal ends the watch (#8372): the script's sleep returns at once after one, so a loop bounded
  // only by the clock would spin broker reads until 09:31 instead of letting cleanup start.
  const started = desk.now();
  const openAt = openingToday({ ...desk.facts, now: started });
  let afterOpen: Attempt[] = [];
  if (openAt !== undefined && openAt - started <= 15 * MINUTE) {
    const until = Math.min(openAt + MINUTE, started + 20 * MINUTE);
    while (desk.now() < until && !desk.ledger.interrupted) {
      await desk.sleep(Math.min(MINUTE, until - desk.now()));
      if (desk.ledger.interrupted) break;
      afterOpen = await readAll("after the open");
    }
  }
  return {
    outcome: verdict(sent),
    answer: sayAll([...sent, ...reads, ...afterOpen]),
    attempts: [...sent, ...reads, ...afterOpen],
  };
}

/** Check 2 — one whole-share `extended_hours` day limit, in whichever session is running. */
export async function extendedHours(desk: Desk): Promise<CheckAnswer> {
  const phase = phaseAt({ ...desk.facts, now: desk.now() });
  const entry = unfillableBuy(await lastTrade(desk, "SPY"));
  const sent = await placeOrder(desk, "extended-hours", `1-share extended_hours limit, ${phase}`, {
    symbol: "SPY",
    qty: "1",
    side: "buy",
    type: "limit",
    limit_price: entry,
    time_in_force: "day",
    extended_hours: true,
  });
  const read = sent.orderId ? [await readOrder(desk, "read back", sent.orderId)] : [];
  return { outcome: verdict([sent]), answer: sayAll([sent, ...read]), attempts: [sent, ...read] };
}

/**
 * The stock feeds check 3 reads. Alpaca's market-data docs list `iex` (real time) and SIP 15
 * minutes delayed for the free plan; `boats` and `overnight` are the two evening feeds in the same
 * docs' feed list, read too so a refusal records that they are not free rather than leaving it
 * assumed.
 */
export const EVENING_FEEDS = ["iex", "delayed_sip", "boats", "overnight"] as const;

/** One latest quote or trade on one feed: the broker's status, the print's own time and its age. */
async function readFeed(
  desk: Desk,
  feed: string,
  symbol: string,
  kind: "quote" | "trade",
): Promise<Attempt> {
  const label = `${symbol} ${kind} on ${feed}`;
  try {
    const response = await desk.data.get(`/v2/stocks/${symbol}/${kind}s/latest?feed=${feed}`);
    const row = (response.body as Record<string, Record<string, unknown>> | null)?.[kind];
    const at = typeof row?.t === "string" ? row.t : undefined;
    if (!at) return classify(label, response);
    const ageSeconds = Math.round((desk.now() - Date.parse(at)) / 1000);
    return { ...classify(label, response), quoteAt: at, ageSeconds };
  } catch (error) {
    return { label, result: "error", message: String(error) };
  }
}

const feedWords = (a: Attempt): string =>
  a.result === "accepted"
    ? `${a.label}: ${a.quoteAt ? `${a.ageSeconds}s old` : "no time"}`
    : `${a.label}: ${a.result}${a.httpStatus ? ` (HTTP ${a.httpStatus})` : ""}`;

/** Check 3 — the latest quote and trade for SPY and NVDA on each feed, with each one's age. */
export async function eveningQuotes(desk: Desk): Promise<CheckAnswer> {
  const attempts: Attempt[] = [];
  for (const feed of EVENING_FEEDS) {
    for (const symbol of ["SPY", "NVDA"]) {
      attempts.push(await readFeed(desk, feed, symbol, "quote"));
      attempts.push(await readFeed(desk, feed, symbol, "trade"));
    }
  }
  const refused = attempts.some((a) => a.result === "refused");
  const outcome = attempts.some((a) => a.result === "accepted")
    ? "accepted"
    : refused
      ? "refused"
      : "error";
  return { outcome, answer: attempts.map(feedWords).join("; "), attempts };
}

/** Poll an order until it fills or is cancelled (10 reads, 1s apart), returning the last read. */
async function awaitSettled(
  desk: Desk,
  label: string,
  id: string | undefined,
): Promise<Attempt | undefined> {
  if (!id) return undefined;
  let read: Attempt | undefined;
  for (let i = 0; i < 10; i += 1) {
    read = await readOrder(desk, label, id);
    if (read.orderStatus === "filled" || read.orderStatus === "canceled") return read;
    await desk.sleep(1000);
  }
  return read;
}

/** Cancel one order this check placed and wait for the broker to say so. */
async function cancel(
  desk: Desk,
  label: string,
  id: string | undefined,
): Promise<Attempt | undefined> {
  if (!id) return undefined;
  await desk.trading.delete(`/v2/orders/${encodeURIComponent(id)}`);
  return awaitSettled(desk, label, id);
}

const present = (attempts: readonly (Attempt | undefined)[]): Attempt[] =>
  attempts.filter((a): a is Attempt => a !== undefined);

/**
 * Check 4 — a 0.5-share bracket, then an OCO sell over a 0.5-share position it buys and sells back.
 * The bracket is cancelled before anything sells: an open buy limit beside a sell is what Alpaca's
 * wash-trade guard refuses, and that refusal would answer a question this check isn't asking.
 */
export async function fractionalExits(desk: Desk): Promise<CheckAnswer> {
  const last = await lastTrade(desk, "SPY");
  const entry = unfillableBuy(last);
  const check = "fractional-exits";
  const bracket = await placeOrder(desk, check, "0.5-share bracket buy", {
    symbol: "SPY",
    qty: "0.5",
    side: "buy",
    type: "limit",
    limit_price: entry,
    time_in_force: "day",
    order_class: "bracket",
    ...bracketLegs(entry),
  });
  const bracketGone = await cancel(desk, "0.5-share bracket buy, cancelled", bracket.orderId);
  const market = (side: "buy" | "sell", label: string) =>
    placeOrder(desk, check, label, {
      symbol: "SPY",
      qty: "0.5",
      side,
      type: "market",
      time_in_force: "day",
    });
  const buy = await market("buy", "0.5-share market buy");
  const attempts = present([bracket, bracketGone, buy]);
  const stop = (why: string): CheckAnswer => ({
    outcome: verdict([bracket]),
    answer: `${sayAll(attempts)}; ${why}, so no OCO sent`,
    attempts,
  });
  if (buy.result !== "accepted" && buy.result !== "dry run") return stop("no position");
  desk.ledger.bought.add("SPY");
  const bought = await awaitSettled(desk, "0.5-share market buy, filled", buy.orderId);
  if (bought) attempts.push(bought);
  if (!desk.dryRun && bought?.orderStatus !== "filled")
    return stop("the market buy did not fill in 10 seconds");
  const oco = await placeOrder(desk, check, "0.5-share OCO sell", {
    symbol: "SPY",
    qty: "0.5",
    side: "sell",
    type: "limit",
    time_in_force: "day",
    order_class: "oco",
    take_profit: { limit_price: cents(last * 1.5) },
    stop_loss: { stop_price: cents(last * 0.5) },
  });
  const ocoGone = await cancel(desk, "0.5-share OCO sell, cancelled", oco.orderId);
  const sell = await market("sell", "0.5-share market sell back");
  const sold = await awaitSettled(desk, "0.5-share market sell back, filled", sell.orderId);
  attempts.push(...present([oco, ocoGone, sell, sold]));
  return { outcome: verdict([bracket, oco]), answer: sayAll(attempts), attempts };
}
