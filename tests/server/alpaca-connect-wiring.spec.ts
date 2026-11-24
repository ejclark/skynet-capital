import { asksForPaperOnly, resolveAlpacaConnect } from "../../src/server/alpaca-connect-wiring.js";
import { alpacaConnectProvider } from "../../src/server/auth/alpaca-connect.js";

/**
 * Connect is on only when Eric's two touches are both in (#8250): both app secrets set, and a
 * provider that asks Alpaca for a paper account. Either order; either missing keeps it off.
 */

const service = {
  refuseConnectStart: () => undefined,
  addConnectedParticipant: () => Promise.resolve({ ok: true as const, id: "x", displayName: "x" }),
};
const secrets = { SKYNET_ALPACA_CLIENT_ID: "id", SKYNET_ALPACA_CLIENT_SECRET: "secret" };
const paper = {
  authorizeUrl: (r: string, s: string) =>
    `https://app.alpaca.markets/oauth/authorize?redirect_uri=${r}&state=${s}&env=paper`,
  exchange: () => Promise.reject(new Error("unused")),
};
const unscoped = {
  authorizeUrl: (r: string, s: string) =>
    `https://app.alpaca.markets/oauth/authorize?redirect_uri=${r}&state=${s}`,
  exchange: () => Promise.reject(new Error("unused")),
};

describe("resolveAlpacaConnect", () => {
  it("stays off with either secret missing", () => {
    expect(resolveAlpacaConnect({}, { service, provider: paper })).toBeUndefined();
    expect(
      resolveAlpacaConnect({ SKYNET_ALPACA_CLIENT_ID: "id" }, { service, provider: paper }),
    ).toBeUndefined();
    expect(
      resolveAlpacaConnect({ SKYNET_ALPACA_CLIENT_SECRET: "s" }, { service, provider: paper }),
    ).toBeUndefined();
  });

  it("stays off, and says so, when the authorize URL lacks env=paper", () => {
    const lines: string[] = [];
    const off = resolveAlpacaConnect(secrets, {
      service,
      provider: unscoped,
      log: (l) => lines.push(l),
    });
    expect(off).toBeUndefined();
    expect(lines.join("\n")).toContain("env=paper");
  });

  it("turns on with both secrets and a paper-only provider", () => {
    expect(resolveAlpacaConnect(secrets, { service, provider: paper })).toBeDefined();
  });

  it("probes the real provider: on exactly when it carries env=paper (the platter item)", () => {
    const real = alpacaConnectProvider({ clientId: "id", clientSecret: "secret" });
    expect(Boolean(resolveAlpacaConnect(secrets, { service }))).toBe(asksForPaperOnly(real));
  });
});

describe("asksForPaperOnly", () => {
  it("refuses a live env, a doubled env, and an unparseable URL", () => {
    const build = (url: string) => ({ authorizeUrl: () => url });
    expect(asksForPaperOnly(build("https://a/x?env=live"))).toBe(false);
    expect(asksForPaperOnly(build("https://a/x?env=paper&env=live"))).toBe(false);
    expect(asksForPaperOnly(build("not a url"))).toBe(false);
    expect(asksForPaperOnly(build("https://a/x?env=paper"))).toBe(true);
  });
});
