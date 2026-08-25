import { isOccSymbol } from "./option-symbols.js";

/**
 * ASSET CLASS — what KIND of instrument a broker symbol names, and the one place that judgement
 * lives. `option-symbols.ts` already answers "is this an OCC contract"; this widens the same idea to
 * the third thing an Alpaca account can hold, a crypto pair, so a view never has to guess from a
 * string.
 *
 * The distinction is load-bearing on the desk rather than cosmetic: an equity or an option only
 * trades while the exchange is open, and a crypto pair trades every hour of every day. A surface
 * that can't tell them apart can't tell you which of your holdings is still moving at 2am — which is
 * exactly the question this classification exists to answer (`venue-clock.ts`).
 *
 * Alpaca spells the same pair two ways depending on which API you asked: the market-data API says
 * `BTC/USD`, and a position read comes back as `BTCUSD`. Both are recognized here so a member's
 * holdings classify the same however they arrived. The bare form is only accepted for a KNOWN base
 * asset — a made-up `FOOUSD` stays an equity rather than being promoted to crypto on shape alone.
 */
export type AssetClass = "equity" | "option" | "crypto";

/** The currencies Alpaca quotes crypto pairs in. Order matters: longest suffix wins on `BTCUSDT`. */
const CRYPTO_QUOTES = ["USDT", "USDC", "USD", "BTC", "ETH"] as const;

/**
 * Base assets we recognize by name in the bare `BTCUSD` form. Real coins only, and deliberately a
 * RECOGNITION list, not a menu: nothing here claims a coin is tradeable from this app or supported
 * by any broker. It exists so a holding that already sits in a member's account gets read honestly.
 */
const CRYPTO_BASES: ReadonlySet<string> = new Set([
  "AAVE",
  "AVAX",
  "BAT",
  "BCH",
  "BTC",
  "CRV",
  "DOGE",
  "DOT",
  "ETH",
  "GRT",
  "LINK",
  "LTC",
  "MKR",
  "PEPE",
  "SHIB",
  "SOL",
  "SUSHI",
  "TRX",
  "UNI",
  "USDC",
  "USDT",
  "XRP",
  "XTZ",
  "YFI",
]);

/** The slashed wire form: `BTC/USD`, `SHIB/USDT`. */
const SLASHED_PAIR = /^([A-Z0-9]{2,10})\/([A-Z]{3,4})$/;

/** The two halves of a crypto pair, or undefined when the symbol isn't one. */
export interface CryptoPair {
  /** The coin being priced, e.g. `BTC`. */
  readonly base: string;
  /** What it's priced in, e.g. `USD`. */
  readonly quote: string;
}

/** `BTC/USD` or `BTCUSD` → `{ base: "BTC", quote: "USD" }`; undefined for anything else. */
export function parseCryptoPair(symbol: string): CryptoPair | undefined {
  const raw = symbol.trim().toUpperCase();
  const slashed = SLASHED_PAIR.exec(raw);
  if (slashed) {
    const base = slashed[1] as string;
    const quote = slashed[2] as string;
    return CRYPTO_QUOTES.some((q) => q === quote) ? { base, quote } : undefined;
  }
  for (const quote of CRYPTO_QUOTES) {
    if (!raw.endsWith(quote)) continue;
    const base = raw.slice(0, -quote.length);
    if (base.length > 0 && base !== quote && CRYPTO_BASES.has(base)) return { base, quote };
  }
  return undefined;
}

/** True when a broker symbol names a crypto pair rather than a share or an option contract. */
export function isCryptoSymbol(symbol: string): boolean {
  return parseCryptoPair(symbol) !== undefined;
}

/**
 * The one classifier. Options are checked first because an OCC symbol is the most specific shape,
 * and anything unrecognized falls to `equity` — the honest default for a US brokerage account,
 * and never a claim that the symbol is a coin.
 */
export function assetClassOf(symbol: string): AssetClass {
  if (isOccSymbol(symbol)) return "option";
  if (isCryptoSymbol(symbol)) return "crypto";
  return "equity";
}

/** `BTCUSD` → `BTC/USD`. Non-crypto symbols pass through unchanged, like `humanizeOptionSymbol`. */
export function humanizeCryptoSymbol(symbol: string): string {
  const pair = parseCryptoPair(symbol);
  return pair ? `${pair.base}/${pair.quote}` : symbol;
}
