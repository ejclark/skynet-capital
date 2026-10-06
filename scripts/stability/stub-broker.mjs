// THE STUB BROKER for the stability budget run (#4612 slice 1, #4613): offline mode's
// `FixtureTradingTransport`, served over HTTP so the dashboard can boot in LIVE mode.
//
// Why live mode at all: offline mode swaps the history, activity and event ledgers for in-memory
// stores, so it can never see a ledger-shaped cost — the very class that OOM-killed production.
// Live mode against this stub is production's exact store wiring with no Alpaca and no credential,
// and it needs no change to src/, so the same harness measures any past bundle (that is how it
// proves the pulse OOM on 4ba54e84).
//
// Same contract as `src/adapters/fixture-trading-transport.ts`: an account, no positions (so the
// market-data socket, whose host is hard-coded, never opens), no orders, an open clock, and 404 for
// every other route — the honest "no history yet" path each caller already takes offline. The
// trade_updates websocket gets a plain 404, which the stream logs once and never retries.
//
//   node scripts/stability/stub-broker.mjs <accounts.json> [port]   # {"<apiKey>": {"id", "equity"}}
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const [file, port = "8080"] = process.argv.slice(2);
const accounts = JSON.parse(readFileSync(file, "utf8"));

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

/** `path` is `route` itself or `route` plus a query — never a longer path under it. */
const isRoute = (path, route) => path === route || path.startsWith(`${route}?`);

const server = createServer((req, res) => {
  const account = accounts[req.headers["apca-api-key-id"]];
  const path = req.url ?? "/";
  if (!account) return json(res, 401, { message: "unauthorized." });
  if (req.method !== "GET") return json(res, 403, { message: "the stub broker is read-only" });
  if (isRoute(path, "/v2/account")) {
    const equity = account.equity.toFixed(2);
    return json(res, 200, {
      id: `stub-${account.id}`,
      account_number: `STUB-${account.id.toUpperCase()}`,
      status: "ACTIVE",
      currency: "USD",
      cash: (account.equity * 0.4).toFixed(2),
      portfolio_value: equity,
      equity,
      last_equity: equity,
      buying_power: (account.equity * 0.4).toFixed(2),
    });
  }
  if (isRoute(path, "/v2/positions") || isRoute(path, "/v2/orders")) return json(res, 200, []);
  if (isRoute(path, "/v2/clock")) return json(res, 200, { is_open: true });
  return json(res, 404, { code: 40410000, message: "endpoint not found" });
});
server.on("upgrade", (_req, socket) => {
  socket.end("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n");
});
server.listen(Number(port), () => console.log(`stub broker on ${port}`));
