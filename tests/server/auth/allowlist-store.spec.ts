import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileAllowlistStore } from "../../../src/server/auth/allowlist-store.js";

/**
 * The guest list on disk. This is the sole authorization gate for an invite-only universe holding
 * other members' trades, so the assertions here are about failure DIRECTION as much as behavior:
 * every unhappy path must admit fewer people, never more, and must never take the owner's own
 * access down with it.
 */
describe("file allowlist store", () => {
  let dir: string;
  const path = () => join(dir, "allowlist.json");
  const entry = (value: string) => ({
    value,
    kind: "email" as const,
    addedAt: "2026-08-14T00:00:00.000Z",
    addedBy: "owner@example.com",
  });

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "allowlist-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("is empty before anything is written", () => {
    expect(new FileAllowlistStore(path(), "s").entries()).toEqual([]);
    expect(new FileAllowlistStore(path(), "s").emails().size).toBe(0);
  });

  it("round-trips an invite and exposes it as an email", () => {
    const store = new FileAllowlistStore(path(), "s");
    expect(store.add(entry("guest@example.com"))).toBe(true);
    const reopened = new FileAllowlistStore(path(), "s");
    expect(reopened.emails().has("guest@example.com")).toBe(true);
    expect(reopened.entries()[0]?.addedBy).toBe("owner@example.com");
  });

  it("lowercases on the way in, so a capitalised sign-in still matches", () => {
    const store = new FileAllowlistStore(path(), "s");
    store.add(entry("Guest@Example.COM"));
    expect(store.emails().has("guest@example.com")).toBe(true);
  });

  it("treats a repeat invite as a no-op rather than an error", () => {
    const store = new FileAllowlistStore(path(), "s");
    expect(store.add(entry("guest@example.com"))).toBe(true);
    expect(store.add(entry("guest@example.com"))).toBe(false);
    expect(store.entries()).toHaveLength(1);
  });

  it("keeps emails and logins in separate buckets", () => {
    const store = new FileAllowlistStore(path(), "s");
    store.add(entry("guest@example.com"));
    store.add({ ...entry("octocat"), kind: "login" });
    expect([...store.emails()]).toEqual(["guest@example.com"]);
    expect([...store.logins()]).toEqual(["octocat"]);
  });

  it("writes the guest list encrypted, not as readable addresses", () => {
    const store = new FileAllowlistStore(path(), "s");
    store.add(entry("guest@example.com"));
    const raw = require("node:fs").readFileSync(path(), "utf8");
    expect(raw).not.toContain("guest@example.com");
  });

  // Fail closed on writes: refusing beats silently storing people's addresses in the clear.
  it("refuses to write without a store secret", () => {
    const store = new FileAllowlistStore(path(), undefined);
    expect(store.canStoreSecurely()).toBe(false);
    expect(() => store.add(entry("guest@example.com"))).toThrow(/refusing to store/);
  });

  // Fail closed on reads: an unreadable list admits NOBODY from this source, and must not throw —
  // a 500 on the sign-in page would lock the owner out too, which the env break-glass exists to
  // prevent.
  it("admits nobody, without throwing, when the file cannot be read", () => {
    writeFileSync(path(), "this is not json");
    const store = new FileAllowlistStore(path(), "s");
    expect(store.entries()).toEqual([]);
    expect(store.emails().size).toBe(0);
  });

  it("admits nobody when the blob is encrypted and the secret is missing", () => {
    new FileAllowlistStore(path(), "s").add(entry("guest@example.com"));
    expect(new FileAllowlistStore(path(), undefined).emails().size).toBe(0);
  });

  it("admits nobody when the secret is wrong, rather than returning junk", () => {
    new FileAllowlistStore(path(), "s").add(entry("guest@example.com"));
    expect(new FileAllowlistStore(path(), "different").emails().size).toBe(0);
  });

  it("stamps joinedAt the first time, and is a no-op after that", () => {
    const store = new FileAllowlistStore(path(), "s");
    store.add(entry("guest@example.com"));
    expect(store.markJoined("Guest@Example.com", "2026-08-20T00:00:00.000Z")).toBe(true);
    const reopened = new FileAllowlistStore(path(), "s");
    expect(reopened.entries()[0]?.joinedAt).toBe("2026-08-20T00:00:00.000Z");
    expect(reopened.markJoined("guest@example.com", "2026-08-21T00:00:00.000Z")).toBe(false);
    expect(reopened.entries()[0]?.joinedAt).toBe("2026-08-20T00:00:00.000Z");
  });

  it("markJoined is a no-op for an identity not on the list", () => {
    const store = new FileAllowlistStore(path(), "s");
    expect(store.markJoined("nobody@example.com", "2026-08-20T00:00:00.000Z")).toBe(false);
  });

  it("markJoined never throws without a store secret — it must not break the board", () => {
    const store = new FileAllowlistStore(path(), undefined);
    expect(store.markJoined("guest@example.com", "2026-08-20T00:00:00.000Z")).toBe(false);
  });

  it("removes an entry", () => {
    const store = new FileAllowlistStore(path(), "s");
    store.add(entry("guest@example.com"));
    expect(store.remove("GUEST@example.com")).toBe(true);
    expect(store.emails().size).toBe(0);
    expect(store.remove("nobody@example.com")).toBe(false);
  });
});
