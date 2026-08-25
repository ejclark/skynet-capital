import { PERSISTED_STORES, volumePersistenceWarnings } from "../../src/runtime/volume-guard.js";

// Boot-time half of the volume-persistence guard (tests/arch/volume-persistence.spec.ts is the
// pre-merge half). This is the net that catches the drift the CI gate structurally cannot: a
// store that reaches production unpinned by any means other than editing src/ or fly.toml.
describe("volumePersistenceWarnings", () => {
  const pinned = Object.fromEntries(
    Object.keys(PERSISTED_STORES).map((name) => [name, `/data/${name.toLowerCase()}`]),
  );

  it("is silent outside Fly — a bare FLY_APP_NAME is the only trigger", () => {
    expect(volumePersistenceWarnings({})).toEqual([]);
    expect(volumePersistenceWarnings({ SKYNET_ALLOWLIST_STORE: "data/allowlist.json" })).toEqual(
      [],
    );
  });

  it("is silent on Fly once every store is pinned under the mount", () => {
    expect(volumePersistenceWarnings({ FLY_APP_NAME: "skynet-capital", ...pinned })).toEqual([]);
  });

  it("warns when a store is left unset — the exact failure that locked members out", () => {
    // SKYNET_ALLOWLIST_STORE missing entirely, so it falls back to the relative default.
    const { SKYNET_ALLOWLIST_STORE: _omit, ...rest } = pinned;
    const warnings = volumePersistenceWarnings({ FLY_APP_NAME: "skynet-capital", ...rest });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("SKYNET_ALLOWLIST_STORE");
    expect(warnings[0]).toContain("data/allowlist.json");
  });

  it("warns when a store is set but not under the mount, not just when it's missing", () => {
    const warnings = volumePersistenceWarnings({
      FLY_APP_NAME: "skynet-capital",
      ...pinned,
      SKYNET_HISTORY_DIR: "history", // set, but relative — a typo'd pin, not an omission
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("SKYNET_HISTORY_DIR");
  });

  it("respects a custom mount prefix rather than hardcoding /data", () => {
    const custom = Object.fromEntries(
      Object.keys(PERSISTED_STORES).map((name) => [name, `/srv/${name.toLowerCase()}`]),
    );
    expect(
      volumePersistenceWarnings({ FLY_APP_NAME: "skynet-capital", ...custom }, "/srv"),
    ).toEqual([]);
  });
});
