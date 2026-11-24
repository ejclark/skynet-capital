import { type AlpacaConnect, type ConnectService, ConnectState } from "./alpaca-connect-routes.js";
import { type AlpacaConnectProvider, alpacaConnectProvider } from "./auth/alpaca-connect.js";
import type { FetchFn } from "./auth/providers.js";

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Connect with Alpaca is ON only when both halves of Eric's setup are in place (#8250): the
 * app's two secrets are set (Fly → Secrets), AND the provider it builds asks for a paper
 * account (`env=paper`, which lands with the platter item in `auth/alpaca-connect.ts`). Read
 * from the authorize URL the provider actually builds, at boot — so the order of his two
 * touches can't matter, and a build whose provider would ever ask for a live grant keeps the
 * key-paste guide instead.
 *
 * Named like the login pairs (`auth/resolve-auth.ts`) and read here, outside `auth/`, so the
 * protected diff stays one file.
 */
export function resolveAlpacaConnect(
  env: Env,
  deps: {
    readonly service: ConnectService;
    readonly fetchFn?: FetchFn;
    readonly log?: (line: string) => void;
    /** Test seam: the provider to probe and use. Defaults to Alpaca's real one. */
    readonly provider?: Pick<AlpacaConnectProvider, "authorizeUrl" | "exchange">;
  },
): AlpacaConnect | undefined {
  const clientId = env.SKYNET_ALPACA_CLIENT_ID?.trim();
  const clientSecret = env.SKYNET_ALPACA_CLIENT_SECRET?.trim();
  if (!(clientId && clientSecret)) return undefined;
  const provider = deps.provider ?? alpacaConnectProvider({ clientId, clientSecret });
  if (!asksForPaperOnly(provider)) {
    deps.log?.(
      "[alpaca-connect] off: the authorize URL does not carry env=paper — the key-paste guide stays",
    );
    return undefined;
  }
  return {
    provider,
    fetchFn: deps.fetchFn ?? fetch,
    service: deps.service,
    state: new ConnectState(),
  };
}

/** True when the provider's authorize URL asks Alpaca for a paper account and nothing else. */
export function asksForPaperOnly(provider: Pick<AlpacaConnectProvider, "authorizeUrl">): boolean {
  try {
    const url = new URL(provider.authorizeUrl("https://probe.invalid/cb", "probe"));
    return url.searchParams.getAll("env").join(",") === "paper";
  } catch {
    return false;
  }
}
