import {
  DEFAULT_ROOT_ON_FLY,
  dataRoot,
  dataRootProblem,
  OPT_IN_STORES,
  PERSISTED_STORES,
  resolveStorePath,
  volumePersistenceWarnings,
} from "../../src/runtime/volume-guard.js";

// Boot-time half of the volume-persistence guard (tests/arch/volume-persistence.spec.ts is the
// pre-merge half). This is the net that catches the drift the CI gate structurally cannot: a
// store that reaches production unpinned by any means other than editing src/ or fly.toml.
describe("volumePersistenceWarnings", () => {
  const pinned = Object.fromEntries(
    Object.keys(PERSISTED_STORES).map((name) => [name, `/data/${name.toLowerCase()}`]),
  );

  it("is silent outside Fly — a bare FLY_APP_NAME is the only trigger", () => {
    expect(volumePersistenceWarnings({})).toEqual([]);
    expect(
      volumePersistenceWarnings({
        SKYNET_ALLOWLIST_STORE: "data/allowlist.json",
      }),
    ).toEqual([]);
  });

  it("is silent on Fly once every store is pinned under the mount", () => {
    expect(volumePersistenceWarnings({ FLY_APP_NAME: "skynet-capital", ...pinned })).toEqual([]);
  });

  it("warns when a store is left unset — the exact failure that locked members out", () => {
    // SKYNET_ALLOWLIST_STORE missing entirely, so it falls back to the relative default.
    const { SKYNET_ALLOWLIST_STORE: _omit, ...rest } = pinned;
    const warnings = volumePersistenceWarnings({
      FLY_APP_NAME: "skynet-capital",
      ...rest,
    });
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

  it("leaves an unset opt-in store alone — unset means the feature is dark, not unpinned", () => {
    const env = { FLY_APP_NAME: "skynet-capital", ...pinned };
    for (const name of OPT_IN_STORES) expect(env).not.toHaveProperty(name);
    expect(volumePersistenceWarnings(env)).toEqual([]);
  });

  it("warns when an opt-in store is set off the mount, and not when it is on it", () => {
    const base = { FLY_APP_NAME: "skynet-capital", ...pinned };
    expect(volumePersistenceWarnings({ ...base, SKYNET_AUDIT_DIR: "/data/audit" })).toEqual([]);
    const warnings = volumePersistenceWarnings({
      ...base,
      SKYNET_BOTS_DB_PATH: "bots-state.db",
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("SKYNET_BOTS_DB_PATH");
  });
});

// Derived stores (#4604): a new store takes its path from one root instead of its own fly.toml
// line, so adding one never needs a protected-file merge.
describe("derived store paths", () => {
  const fly = { FLY_APP_NAME: "skynet-capital" };

  it("roots at the Fly mount on Fly, a disposable relative dir elsewhere, and the override over both", () => {
    expect(dataRoot(fly)).toBe(DEFAULT_ROOT_ON_FLY);
    expect(dataRoot({})).toBe("data");
    expect(dataRoot({ NODE_ENV: "production" })).toBe("data"); // a VM sets SKYNET_DATA_ROOT
    expect(dataRoot({ ...fly, SKYNET_DATA_ROOT: "/data/stores" })).toBe("/data/stores");
    expect(dataRoot({ SKYNET_DATA_ROOT: "/srv/skynet" })).toBe("/srv/skynet");
  });

  it("puts a store under the root, and lets its own explicit var win", () => {
    expect(resolveStorePath(fly, "SKYNET_WATCHLIST_DIR", "watchlist")).toBe("/data/watchlist");
    expect(resolveStorePath({}, "SKYNET_WATCHLIST_DIR", "watchlist")).toBe("data/watchlist");
    expect(
      resolveStorePath(
        { ...fly, SKYNET_WATCHLIST_DIR: "/data/elsewhere" },
        "SKYNET_WATCHLIST_DIR",
        "watchlist",
      ),
    ).toBe("/data/elsewhere");
  });
});

describe("dataRootProblem — the derived root must be a real mount on Fly", () => {
  const fly = { FLY_APP_NAME: "skynet-capital" };
  const stores = { SKYNET_WATCHLIST_DIR: "watchlist" };
  const devices =
    (map: Record<string, number>) =>
    (path: string): number | undefined =>
      map[path];

  it("passes when the root sits on a different device than /", () => {
    expect(dataRootProblem(fly, devices({ "/": 1, "/data": 2 }), stores)).toBeUndefined();
  });

  it("refuses when the root is on the image's own filesystem, naming the first store", () => {
    const problem = dataRootProblem(fly, devices({ "/": 1, "/data": 1 }), stores);
    expect(problem).toContain("Refusing to boot");
    expect(problem).toContain('SKYNET_WATCHLIST_DIR would write to "/data/watchlist"');
    expect(problem).toContain("not on a mounted volume");
  });

  it("refuses when the root is missing — the volume never attached", () => {
    expect(dataRootProblem(fly, devices({ "/": 1 }), stores)).toContain("missing");
  });

  it("checks the overridden root, not the default", () => {
    const env = { ...fly, SKYNET_DATA_ROOT: "/app/data" };
    expect(dataRootProblem(env, devices({ "/": 1, "/data": 2, "/app/data": 1 }), stores)).toContain(
      '"/app/data/watchlist"',
    );
  });

  it("names the root itself when no store derives from it yet", () => {
    expect(dataRootProblem(fly, devices({ "/": 1, "/data": 1 }), {})).toContain(
      'the data root "/data"',
    );
  });

  it("is silent off Fly — a VM's root disk persists, so a shared device is not a defect", () => {
    expect(dataRootProblem({}, devices({ "/": 1, data: 1 }), stores)).toBeUndefined();
    expect(
      dataRootProblem({ NODE_ENV: "production" }, devices({ "/": 1, data: 1 }), stores),
    ).toBeUndefined();
  });
});
