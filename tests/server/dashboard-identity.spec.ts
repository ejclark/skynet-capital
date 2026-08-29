import type { Session } from "../../src/server/auth/session.js";
import { keyOf, resolveCurrentId, resolveOwnedIds } from "../../src/server/dashboard-identity.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

const session = (email: string): Session => ({
  email,
  provider: "google",
  exp: Date.now() + 60_000,
});

describe("resolveCurrentId", () => {
  it("is undefined with no session", () => {
    expect(resolveCurrentId(undefined, (email) => email)).toBeUndefined();
  });

  it("is undefined when no resolveOwnerId hook is wired", () => {
    expect(resolveCurrentId(session("ann@example.com"), undefined)).toBeUndefined();
  });

  it("resolves the session's email through the hook", () => {
    expect(resolveCurrentId(session("ann@example.com"), (email) => `id-${email}`)).toBe(
      "id-ann@example.com",
    );
  });
});

describe("resolveOwnedIds", () => {
  const baseConfig = {} as unknown as DashboardServerConfig;

  it("is empty with no session", () => {
    expect(resolveOwnedIds(undefined, baseConfig)).toEqual([]);
  });

  it("prefers the plural hook when wired", () => {
    const config = {
      resolveOwnerIds: (email: string) => [`a-${email}`, `b-${email}`],
    } as unknown as DashboardServerConfig;
    expect(resolveOwnedIds(session("ann@example.com"), config)).toEqual([
      "a-ann@example.com",
      "b-ann@example.com",
    ]);
  });

  it("falls back to the singular hook wrapped in an array", () => {
    const config = {
      resolveOwnerId: (email: string) => `single-${email}`,
    } as unknown as DashboardServerConfig;
    expect(resolveOwnedIds(session("ann@example.com"), config)).toEqual(["single-ann@example.com"]);
  });

  it("is empty when neither hook is wired", () => {
    expect(resolveOwnedIds(session("ann@example.com"), baseConfig)).toEqual([]);
  });
});

describe("keyOf", () => {
  it("reads ?key= from the URL", () => {
    expect(keyOf("/?key=secret")).toBe("secret");
  });

  it("is empty when no ?key= is present", () => {
    expect(keyOf("/")).toBe("");
  });
});
