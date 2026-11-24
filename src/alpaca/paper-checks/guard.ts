/**
 * Only the dedicated test account (#8256). The paper checks place real paper orders, so before a
 * single request they prove three things, and refuse (exit 2) on any doubt:
 *
 * 1. The key is `SKYNET_PAPER_CHECK_KEY` / `_SECRET` and nothing else — no fallback to a bot's or
 *    a member's key, no base-URL variable, no Connect token — and it isn't the same value as any
 *    `SKYNET_BOT_*_KEY` or `SKYNET_HUMAN_*_KEY` in the environment.
 * 2. The host is the paper Trading API, through `assertPaperTradingHost` (`paper-host.ts`).
 * 3. The account is a `PA…` paper account holding no position and no open order but this tool's
 *    own `paperchk-` ones — so cleanup can't touch anything it didn't place.
 *
 * Nothing here prints the key, the secret, the account id or the account number; `redactor` is
 * the belt to that brace, applied to every line the run writes.
 */
import type { JsonResponse } from "../../http/fetch-json.js";
import { ALPACA_DATA_HOST, assertPaperTradingHost, PAPER_TRADING_HOST } from "../paper-host.js";
import { type AlpacaTradingTransport, FetchAlpacaTradingTransport } from "../trading-transport.js";
import { ORDER_PREFIX } from "./catalog.js";

/** A refusal before anything was placed — the command exits 2. */
export class PaperCheckRefused extends Error {}

export interface PaperCheckCredentials {
  readonly apiKey: string;
  readonly apiSecret: string;
}

const OTHER_KEYS = /^SKYNET_(BOT|HUMAN)_(?:.+_)?KEY$/;

/** The test account's key and secret from the two variables, or a refusal. */
export function credentialsFrom(
  env: Readonly<Record<string, string | undefined>>,
): PaperCheckCredentials {
  const apiKey = env.SKYNET_PAPER_CHECK_KEY;
  const apiSecret = env.SKYNET_PAPER_CHECK_SECRET;
  if (!(apiKey && apiSecret)) {
    throw new PaperCheckRefused(
      "no test account key: set SKYNET_PAPER_CHECK_KEY and SKYNET_PAPER_CHECK_SECRET",
    );
  }
  for (const [name, value] of Object.entries(env)) {
    if (OTHER_KEYS.test(name) && value === apiKey) {
      throw new PaperCheckRefused(
        `the test account key is the same as ${name}; the checks run only on a dedicated paper account`,
      );
    }
  }
  return { apiKey, apiSecret };
}

export interface PaperCheckTransports {
  readonly trading: AlpacaTradingTransport;
  readonly data: AlpacaTradingTransport;
}

/** The paper Trading API and the market-data API, both on the test account's key. */
export function transportsFor(credentials: PaperCheckCredentials): PaperCheckTransports {
  const tradingUrl = `https://${PAPER_TRADING_HOST}`;
  assertPaperTradingHost(tradingUrl);
  return {
    trading: new FetchAlpacaTradingTransport({ baseUrl: tradingUrl, ...credentials }),
    data: new FetchAlpacaTradingTransport({
      baseUrl: `https://${ALPACA_DATA_HOST}`,
      ...credentials,
    }),
  };
}

/** `--dry-run`: reads go through; every POST, PATCH and DELETE is printed and never sent. */
export function dryRunTransport(
  inner: AlpacaTradingTransport,
  log: (line: string) => void,
): AlpacaTradingTransport {
  const print = (method: string, path: string, body?: unknown): Promise<JsonResponse> => {
    log(
      `dry run, not sent: ${method} ${path}${body === undefined ? "" : ` ${JSON.stringify(body)}`}`,
    );
    return Promise.resolve({ status: 0, body: null });
  };
  return {
    get: (path) => inner.get(path),
    post: (path, body) => print("POST", path, body),
    patch: (path, body) => print("PATCH", path, body),
    delete: (path) => print("DELETE", path),
  };
}

const field = (body: unknown, key: string): unknown =>
  body && typeof body === "object" ? (body as Record<string, unknown>)[key] : undefined;

function listed(response: JsonResponse, what: string): unknown[] {
  if (response.status !== 200 || !Array.isArray(response.body)) {
    throw new PaperCheckRefused(`could not read the account's ${what} (HTTP ${response.status})`);
  }
  return response.body;
}

/** What the run must never print: the account's own identifiers, kept only to redact them. */
export interface AccountSecrets {
  readonly id: string;
  readonly number: string;
}

/** Refuse unless this is an empty `PA…` paper account, before anything is placed. */
export async function guardAccount(trading: AlpacaTradingTransport): Promise<AccountSecrets> {
  const account = await trading.get("/v2/account");
  if (account.status !== 200) {
    throw new PaperCheckRefused(`could not read the account (HTTP ${account.status})`);
  }
  const number = field(account.body, "account_number");
  const id = field(account.body, "id");
  if (typeof number !== "string" || !number.startsWith("PA")) {
    throw new PaperCheckRefused(
      "the account is not a paper account (its number doesn't start with PA)",
    );
  }
  const positions = listed(await trading.get("/v2/positions"), "positions");
  if (positions.length > 0) {
    throw new PaperCheckRefused(
      `the account holds ${positions.length} position(s); the checks run only on an empty test account`,
    );
  }
  const orders = listed(await trading.get("/v2/orders?status=open&limit=500"), "open orders");
  const foreign = orders.filter(
    (o) => !String(field(o, "client_order_id") ?? "").startsWith(ORDER_PREFIX),
  );
  if (foreign.length > 0) {
    throw new PaperCheckRefused(
      `the account has ${foreign.length} open order(s) this tool didn't place`,
    );
  }
  return { id: typeof id === "string" ? id : "", number };
}

/** Replace every secret value in a line with `[redacted]`. Empty values are skipped. */
export function redactor(secrets: readonly string[]): (text: string) => string {
  const values = secrets.filter((s) => s.length > 0);
  return (text) => values.reduce((out, value) => out.split(value).join("[redacted]"), text);
}
