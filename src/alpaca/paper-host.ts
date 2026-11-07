/**
 * Paper-only, as a fact in code (#6954 slice 2). Before this file the only thing keeping an order
 * off Alpaca's real-money host was a default URL constant: an env value, a per-participant
 * `baseUrl` or a credentials-bridge `baseUrl` could name any host, and nothing at runtime looked.
 *
 * The rule lives HERE and nowhere else (the #928 doctrine: one narrow file, then protect it —
 * listing it in `envelope.json` is #6956). Every Alpaca transport and the fills stream call it;
 * `tests/arch/paper-only.spec.ts` proves nothing builds one without.
 *
 * `FetchAlpacaTradingTransport` serves two hosts — paper trading AND market data — so the
 * transport check admits exactly those two. The data host has no order endpoints, so a transport
 * that passes can place paper orders only. The fills stream, which authenticates an account,
 * accepts the paper host alone.
 *
 * One narrow stand-in is allowed: a dotless host, which no public DNS resolves (a container name
 * such as the stability harness's `http://skynet-broker:8080`, or `localhost`). Real money lives
 * on a dotted public hostname, so a stand-in cannot reach it.
 */

/** Alpaca's paper Trading API host — the only place an order may go. */
export const PAPER_TRADING_HOST = "paper-api.alpaca.markets";
/** Alpaca's market-data host — read-only quotes, bars and news; it takes no orders. */
export const ALPACA_DATA_HOST = "data.alpaca.markets";

function parse(baseUrl: string): URL | undefined {
  try {
    return new URL(baseUrl);
  } catch {
    return undefined;
  }
}

/** A single-label hostname (`skynet-broker`, `localhost`) — unresolvable on the public internet. */
function isStandIn(url: URL): boolean {
  const host = url.hostname;
  return host.length > 0 && !host.includes(".") && !host.includes(":");
}

function refuse(baseUrl: string, allowed: string): never {
  throw new Error(
    `paper-only: refusing Alpaca host "${baseUrl}" — only ${allowed} (or an offline stand-in) is allowed. ` +
      "This app places paper orders and nothing else.",
  );
}

/** Throws unless `baseUrl` is the paper Trading API (https) or an offline stand-in. */
export function assertPaperTradingHost(baseUrl: string): void {
  const url = parse(baseUrl);
  if (!url) refuse(baseUrl, PAPER_TRADING_HOST);
  if (isStandIn(url)) return;
  if (url.protocol === "https:" && url.hostname === PAPER_TRADING_HOST) return;
  refuse(baseUrl, PAPER_TRADING_HOST);
}

/**
 * Throws unless `baseUrl` is the paper Trading API, the market-data API (https) or an offline
 * stand-in — the two hosts one `FetchAlpacaTradingTransport` may be pointed at.
 */
export function assertPaperOrDataHost(baseUrl: string): void {
  const url = parse(baseUrl);
  if (!url) refuse(baseUrl, `${PAPER_TRADING_HOST} / ${ALPACA_DATA_HOST}`);
  if (isStandIn(url)) return;
  if (url.protocol === "https:" && [PAPER_TRADING_HOST, ALPACA_DATA_HOST].includes(url.hostname)) {
    return;
  }
  refuse(baseUrl, `${PAPER_TRADING_HOST} / ${ALPACA_DATA_HOST}`);
}
