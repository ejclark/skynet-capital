import type { Session } from "../../src/server/auth/session.js";
import {
  idOf,
  keyOf,
  resolveCurrentId,
  resolveOwnedIds,
  rotatableAccountOptions,
} from "../../src/server/dashboard-identity.js";
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

describe("rotatableAccountOptions", () => {
  const board = [
    { id: "human-eric", displayName: "Eric", kind: "human" as const },
    { id: "sauron", displayName: "Sauron", kind: "bot" as const },
    { id: "human-ann", displayName: "Ann", kind: "human" as const },
  ];
  const hub = { getState: () => ({ participants: board }) };

  // 2026-08-27: the reported bug — an owner's OWN roster account had no ownerEmail link, so
  // ownedAccountOptions resolved to just an unrelated owned bot, and /rotate locked onto it.
  it("adds every roster account for an owner, even ones their email doesn't own", () => {
    const config = {
      hub,
      isOwnerEmail: (email: string) => email === "eric@example.com",
      resolveOwnerIds: () => ["sauron"],
      rosterIds: () => new Set(["human-eric", "sauron"]),
    } as unknown as DashboardServerConfig;
    const options = rotatableAccountOptions(session("eric@example.com"), config);
    expect(options.map((o) => o.id).sort()).toEqual(["human-eric", "sauron"]);
  });

  it("does not widen for a non-owner — same as ownedAccountOptions", () => {
    const config = {
      hub,
      isOwnerEmail: () => false,
      resolveOwnerIds: () => ["human-ann"],
      rosterIds: () => new Set(["human-eric", "sauron"]),
    } as unknown as DashboardServerConfig;
    const options = rotatableAccountOptions(session("ann@example.com"), config);
    expect(options.map((o) => o.id)).toEqual(["human-ann"]);
  });

  it("never duplicates an account the owner already owns directly", () => {
    const config = {
      hub,
      isOwnerEmail: () => true,
      resolveOwnerIds: () => ["human-eric"],
      rosterIds: () => new Set(["human-eric"]),
    } as unknown as DashboardServerConfig;
    const options = rotatableAccountOptions(session("eric@example.com"), config);
    expect(options.map((o) => o.id)).toEqual(["human-eric"]);
  });

  it("is empty with no session", () => {
    const config = { hub, isOwnerEmail: () => true } as unknown as DashboardServerConfig;
    expect(rotatableAccountOptions(undefined, config)).toEqual([]);
  });

  // #732 — /account renders the broker account number from these options, so the board's
  // accountNumber has to survive the trip through BOTH branches: the owned one, and the
  // owner-only roster widening (which builds its rows from a different code path).
  it("carries each account's Alpaca account number through the owned branch", () => {
    const config = {
      hub: {
        getState: () => ({
          participants: [{ ...board[1], accountNumber: "PA9ZZZZZZ" }],
        }),
      },
      isOwnerEmail: () => false,
      resolveOwnerIds: () => ["sauron"],
    } as unknown as DashboardServerConfig;
    expect(rotatableAccountOptions(session("ann@example.com"), config)[0]?.accountNumber).toBe(
      "PA9ZZZZZZ",
    );
  });

  it("carries it through the owner-only roster widening too", () => {
    const config = {
      hub: {
        getState: () => ({
          participants: [{ ...board[0], accountNumber: "PA3ABCDEF" }, board[1]],
        }),
      },
      isOwnerEmail: () => true,
      resolveOwnerIds: () => ["sauron"],
      rosterIds: () => new Set(["human-eric"]),
    } as unknown as DashboardServerConfig;
    const widened = rotatableAccountOptions(session("eric@example.com"), config);
    expect(widened.find((o) => o.id === "human-eric")?.accountNumber).toBe("PA3ABCDEF");
    // An account the board has no number for stays absent rather than carrying an empty string.
    expect(widened.find((o) => o.id === "sauron")).not.toHaveProperty("accountNumber");
  });

  it("falls back to owned accounts alone when rosterIds isn't wired", () => {
    const config = {
      hub,
      isOwnerEmail: () => true,
      resolveOwnerIds: () => ["sauron"],
    } as unknown as DashboardServerConfig;
    const options = rotatableAccountOptions(session("eric@example.com"), config);
    expect(options.map((o) => o.id)).toEqual(["sauron"]);
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

describe("idOf", () => {
  it("reads ?id= from the URL", () => {
    expect(idOf("/rotate?id=acct-1")).toBe("acct-1");
  });

  it("is empty when no ?id= is present", () => {
    expect(idOf("/rotate")).toBe("");
  });
});
