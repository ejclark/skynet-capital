import {
  ALPACA_DEFAULT_SCOPE,
  alpacaConnectProvider,
} from "../../../src/server/auth/alpaca-connect.js";

function fakeFetch(routes: Record<string, unknown>): typeof fetch {
  return (async (input: string | URL) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) {
      throw new Error(`unexpected fetch ${url}`);
    }
    return { json: async () => routes[key] } as Response;
  }) as unknown as typeof fetch;
}

describe("alpacaConnectProvider", () => {
  const provider = alpacaConnectProvider({ clientId: "aid", clientSecret: "asecret" });

  it("builds an authorize URL with the default scope and state", () => {
    const url = provider.authorizeUrl("https://app/onboard/alpaca/callback", "st8");
    expect(url).toContain("app.alpaca.markets/oauth/authorize");
    expect(url).toContain("response_type=code");
    expect(url).toContain("client_id=aid");
    expect(url).toContain("state=st8");
    expect(url).toContain(new URLSearchParams({ scope: ALPACA_DEFAULT_SCOPE }).toString());
    expect(url).toContain("redirect_uri=https%3A%2F%2Fapp%2Fonboard%2Falpaca%2Fcallback");
  });

  it("honors a custom scope", () => {
    const url = alpacaConnectProvider({
      clientId: "aid",
      clientSecret: "asecret",
      scope: "account:write",
    }).authorizeUrl("https://app/cb", "s");
    expect(url).toContain("scope=account%3Awrite");
  });

  it("exchanges a code for the access token", async () => {
    const fetchFn = fakeFetch({
      "api.alpaca.markets/oauth/token": {
        access_token: "tok-123",
        token_type: "bearer",
        scope: "account:write trading",
      },
    });
    const connection = await provider.exchange("code", "https://app/cb", fetchFn);
    expect(connection).toEqual({
      accessToken: "tok-123",
      tokenType: "bearer",
      scope: "account:write trading",
    });
  });

  it("throws when the token response has no access_token", async () => {
    const fetchFn = fakeFetch({ "oauth/token": { error: "invalid_grant" } });
    await expect(provider.exchange("bad", "https://app/cb", fetchFn)).rejects.toThrow(
      /no access_token/,
    );
  });
});
