import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
const EPHEMERAL: Readonly<Record<string, string>> = {};

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

  it("mounts a volume the stores can be pinned to", () => {
    expect(mount).toBe("/data");
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
});
