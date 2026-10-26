import {
  assertProductionAccess,
  isProduction,
  productionAccessProblem,
} from "../../src/scripts/production-access.js";

// The production boot gate (#4621): a deploy that lost its secrets must fail, not come up open.
const none = { hasAuth: false, hasPassword: false };

describe("isProduction", () => {
  it("is the platform's word: Fly's injected app name, or NODE_ENV=production", () => {
    expect(isProduction({ FLY_APP_NAME: "skynet-capital" })).toBe(true);
    expect(isProduction({ NODE_ENV: "production" })).toBe(true);
    expect(isProduction({})).toBe(false);
    expect(isProduction({ NODE_ENV: "development" })).toBe(false);
  });
});

describe("productionAccessProblem", () => {
  it("refuses a production boot with neither sign-in nor a password", () => {
    expect(productionAccessProblem({ FLY_APP_NAME: "x" }, none)).toMatch(/Refusing to boot/);
    expect(productionAccessProblem({ NODE_ENV: "production" }, none)).toMatch(
      /SKYNET_SESSION_SECRET/,
    );
  });

  it("lets production boot once OAuth or the password is configured", () => {
    const env = { NODE_ENV: "production" };
    expect(productionAccessProblem(env, { hasAuth: true, hasPassword: false })).toBeUndefined();
    expect(productionAccessProblem(env, { hasAuth: false, hasPassword: true })).toBeUndefined();
  });

  it("leaves localhost open — an unconfigured dev run is the intended behavior", () => {
    expect(productionAccessProblem({}, none)).toBeUndefined();
  });
});

describe("assertProductionAccess", () => {
  const oauth = {
    SKYNET_SESSION_SECRET: "s",
    SKYNET_GITHUB_CLIENT_ID: "id",
    SKYNET_GITHUB_CLIENT_SECRET: "secret",
  };

  it("throws in production when the session secret or a provider pair is missing", () => {
    expect(() => assertProductionAccess({ NODE_ENV: "production" })).toThrow(/Refusing to boot/);
    // A session secret alone configures no provider, so resolveAuth is undefined: still open.
    expect(() =>
      assertProductionAccess({ NODE_ENV: "production", SKYNET_SESSION_SECRET: "s" }),
    ).toThrow(/Refusing to boot/);
  });

  it("passes in production with OAuth fully configured, or with a password", () => {
    expect(() => assertProductionAccess({ NODE_ENV: "production", ...oauth })).not.toThrow();
    expect(() =>
      assertProductionAccess({ NODE_ENV: "production", SKYNET_DASHBOARD_PASSWORD: "p" }),
    ).not.toThrow();
  });

  it("does nothing outside production", () => {
    expect(() => assertProductionAccess({})).not.toThrow();
  });
});
