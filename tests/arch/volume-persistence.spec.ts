import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_ROOT_ON_FLY,
  DERIVED_STORES,
  OPT_IN_STORES,
  PERSISTED_STORES,
} from "../../src/runtime/volume-guard.js";

// Volume-persistence gate — the mechanical answer to "will this store survive a deploy?".
//
// Every durable store in src/ resolves its path as `env.SKYNET_X ?? "data/…"`. That default is
// RELATIVE, so on Fly (WORKDIR /app) an unset var writes to /app/data — inside the container
// image, not on the volume mounted at /data. Every push to main redeploys, so an unmapped store
// is erased on every merge. It fails silently in both directions: the writer succeeds, and the
// reader treats an absent file as an empty one.
//
// That is exactly how the guest list kept vanishing — members invited through /invite were wiped
// on each deploy while owners on SKYNET_ALLOWED_EMAILS (a Fly *secret*) kept working, so the app
// looked healthy to the only person who could see it. The same class had already been caught once
// for SKYNET_HISTORY_DIR and never generalized; this gate is the generalization.
//
// Tested in BOTH directions: the scan must actually FIND the stores (a gate that passes because it
// discovered nothing is the failure mode this repo has banked before), and each one it finds must
// be pinned to the mount.

const SRC = "src";
const FLY = "fly.toml";

/** Stores deliberately left off the volume, each with the reason it is safe to lose on deploy. */
const EPHEMERAL: Readonly<Record<string, string>> = {
  // Holds only which community-track celebrations were already claimed (#567) — never the earned
  // truth itself, which re-derives from SKYNET_FEEDBACK_LOG_DIR (on the volume) on every read.
  // Losing this on a deploy means, at worst, a member who earned it moments before sees the
  // celebration banner once more — self-correcting, never a false or missing earn. `fly.toml` is
  // envelope-protected (spend/deploy topology, envelope.json), so pinning this to the volume is
  // Eric's one-line call to make (`SKYNET_COMMUNITY_PROGRESSION_FILE = "/data/community-progression.json"`
  // alongside the other stores in `[env]`), not this lane's to self-authorize.
  SKYNET_COMMUNITY_PROGRESSION_FILE:
    "claim-state only, not earned truth; loses at most a repeat celebration on deploy",
};

/** Path-shaped `SKYNET_*` reads that are not data this server writes, each with the reason. */
const NOT_A_STORE: Readonly<Record<string, string>> = {
  SKYNET_HALT_FILE: "the kill switch: an operator touches it, the bots only test it exists",
  SKYNET_RESEARCH_DIR: "read-only research shelf; points the suite at a frozen fixture",
};

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return tsFiles(path);
    return e.isFile() && path.endsWith(".ts") ? [path] : [];
  });
}

/** `env.SKYNET_X ?? "data/…"` → the env var name, wherever it appears in src/. */
function declaredStores(): Map<string, string> {
  const found = new Map<string, string>();
  const pattern = /(?:process\.)?env\.(SKYNET_[A-Z0-9_]+)\s*\?\?\s*"(data\/[^"]*)"/g;
  for (const file of tsFiles(SRC)) {
    for (const [, name, fallback] of readFileSync(file, "utf8").matchAll(pattern)) {
      found.set(name as string, fallback as string);
    }
  }
  return found;
}

/** The `[env]` table and the `[mounts] destination` from fly.toml. */
function flyConfig(): { env: Map<string, string>; mount: string } {
  const lines = readFileSync(FLY, "utf8").split("\n");
  const env = new Map<string, string>();
  let mount = "";
  let table = "";
  for (const line of lines) {
    const header = /^\s*\[+([a-z_.]+)\]+/.exec(line);
    if (header) {
      table = header[1] as string;
      continue;
    }
    const pair = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"]*)"/.exec(line);
    if (!pair) continue;
    const [, key, value] = pair as unknown as [string, string, string];
    if (table === "env") env.set(key, value);
    if (table === "mounts" && key === "destination") mount = value;
  }
  return { env, mount };
}

describe("volume persistence", () => {
  const stores = declaredStores();
  const { env, mount } = flyConfig();

  it("finds the durable stores declared in src/ — the scan itself must not go blind", () => {
    // Anchors, so a refactor that changes the `?? "data/…"` idiom breaks this test loudly instead
    // of quietly reducing the gate to a no-op.
    expect(stores.get("SKYNET_ALLOWLIST_STORE")).toBe("data/allowlist.json");
    expect(stores.get("SKYNET_PARTICIPANT_STORE")).toBe("data/participants.json");
    expect(stores.size).toBeGreaterThanOrEqual(8);
  });

  it("declares every path-shaped env var the server reads, defaulted or opt-in (#4621)", () => {
    const pattern = /(?:process\.)?env\.(SKYNET_[A-Z0-9_]*(?:DIR|FILE|STORE|PATH))\b/g;
    const read = new Set<string>();
    for (const file of tsFiles(SRC)) {
      for (const [, name] of readFileSync(file, "utf8").matchAll(pattern)) read.add(name as string);
    }
    expect(read.size).toBeGreaterThanOrEqual(20); // the scan must not go blind
    const undeclared = [...read].filter(
      (n) => !(n in PERSISTED_STORES || OPT_IN_STORES.includes(n) || n in NOT_A_STORE),
    );
    expect(
      undeclared,
      "read from src/ but declared nowhere: add to PERSISTED_STORES (it has a data/ default), " +
        "OPT_IN_STORES (no default, dark when unset) or NOT_A_STORE with the reason",
    ).toEqual([]);
    const stale = OPT_IN_STORES.filter((n) => !read.has(n));
    expect(stale, "in OPT_IN_STORES but no longer read in src/ — remove").toEqual([]);
  });

  it("mounts a volume the stores can be pinned to", () => {
    expect(mount).toBe("/data");
  });

  // This CI-time scan is only half the guard — src/runtime/volume-guard.ts runs the other half
  // at boot, against whatever the process actually has, so drift is caught even when it never
  // touched src/ or fly.toml at all (a manual override, a config edit outside git). The two
  // lists are hand-kept in sync rather than sharing code (the runtime guard must not scan the
  // filesystem on every boot), so this is what keeps that sync honest instead of assumed.
  it("keeps the runtime boot-time guard in sync with what's actually declared in src/", () => {
    for (const [name, fallback] of stores) {
      expect(
        PERSISTED_STORES[name],
        `${name} is declared in src/ but missing from PERSISTED_STORES in ` +
          `src/runtime/volume-guard.ts — the boot-time warning can't see it. Add it there too.`,
      ).toBe(fallback);
    }
    for (const name of Object.keys(PERSISTED_STORES)) {
      expect(
        stores.has(name),
        `${name} is in PERSISTED_STORES but no longer declared in src/ — remove the stale entry.`,
      ).toBe(true);
    }
  });

  it.each([...declaredStores().keys()].sort())(
    "%s is pinned to the volume, so a deploy cannot erase it",
    (name) => {
      if (name in EPHEMERAL) return;
      const value = env.get(name);
      expect(
        value,
        `${name} defaults to a relative path, so fly.toml [env] must pin it under ${mount} ` +
          `or it is erased on every deploy. Add it, or record why it is safe to lose in EPHEMERAL.`,
      ).toBeDefined();
      expect(value?.startsWith(`${mount}/`), `${name} = "${value}" is not under ${mount}`).toBe(
        true,
      );
    },
  );

  // Derived stores (#4604): a new store resolves `storePath(env, "SKYNET_X")` under one root, so
  // the gate proves the ROOT is the mount — by reading fly.toml, never by asking for a new line.
  describe("derived stores", () => {
    const derived: Readonly<Record<string, string>> = DERIVED_STORES;

    it("roots them at the volume fly.toml mounts", () => {
      expect(DEFAULT_ROOT_ON_FLY).toBe(mount);
      const override = env.get("SKYNET_DATA_ROOT");
      if (override !== undefined) {
        expect(
          override === mount || override.startsWith(`${mount}/`),
          `SKYNET_DATA_ROOT = "${override}" is not under ${mount}`,
        ).toBe(true);
      }
    });

    it("keeps an explicit pin for a derived store on the volume too", () => {
      for (const name of Object.keys(derived)) {
        const value = env.get(name);
        if (value === undefined) continue;
        expect(value.startsWith(`${mount}/`), `${name} = "${value}" is not under ${mount}`).toBe(
          true,
        );
      }
    });

    it("gives each one a unique name and var that no other store already uses", () => {
      const names = Object.values(derived);
      expect(new Set(names).size, "two derived stores share a name").toBe(names.length);
      const taken = new Set(Object.values(PERSISTED_STORES).map((p) => p.split("/")[1]));
      for (const [envVar, name] of Object.entries(derived)) {
        expect(
          /^[a-z0-9][a-z0-9._-]*$/.test(name),
          `${envVar} → "${name}" is not a bare name`,
        ).toBe(true);
        expect(taken.has(name), `${envVar} → "${name}" collides with a PERSISTED_STORES path`).toBe(
          false,
        );
        expect(envVar in PERSISTED_STORES || OPT_IN_STORES.includes(envVar), envVar).toBe(false);
        expect(envVar in NOT_A_STORE || envVar in EPHEMERAL, envVar).toBe(false);
      }
    });

    it("resolves the root only through volume-guard.ts, so no store can skip the registry", () => {
      // `storePath` takes a key of DERIVED_STORES, so the type system enforces registration; a
      // hand-rolled `join(dataRoot(env), …)` would not, so it is refused here.
      const allowed = new Set([
        join(SRC, "runtime", "volume-guard.ts"),
        join(SRC, "server", "store-sizes.ts"),
      ]);
      const bypass = tsFiles(SRC).filter(
        (file) =>
          !allowed.has(file) &&
          /\b(?:dataRoot|resolveStorePath)\(|SKYNET_DATA_ROOT/.test(readFileSync(file, "utf8")),
      );
      expect(bypass, 'use storePath(env, "SKYNET_X") with a DERIVED_STORES entry').toEqual([]);
    });
  });
});
