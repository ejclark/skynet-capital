import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { DATA_STORE_ENV, offlineBootEnv } from "../../scripts/crawl/server.mjs";

// A journey boot (the crawl, and the member playthroughs CI runs before every merge) must never
// touch the repo's `data/`: the main e2e boot writes there at the same time, and a playthrough
// that reads its writes stops being a frozen, repeatable check (#7031 slice 1).

/** Every `SKYNET_*` env var src/ reads with a `data/…` fallback. */
function dataFallbacks(dir = "src"): Set<string> {
  const found = new Set<string>();
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      for (const key of dataFallbacks(path)) found.add(key);
    } else if (path.endsWith(".ts") && !path.endsWith(".test.ts")) {
      const text = readFileSync(path, "utf8");
      for (const m of text.matchAll(/env(?:\.|\[")(SKYNET_[A-Z_]+)"?\]?\s*\?\?\s*"data\//g)) {
        found.add(m[1] as string);
      }
    }
  }
  return found;
}

describe("a journey boot's env", () => {
  const env = offlineBootEnv({
    mode: "open",
    port: 8790,
    bridgePort: 8791,
    fixtures: "/tmp/frozen",
  });

  it("covers every store the server would otherwise keep under the repo's data/", () => {
    const missing = [...dataFallbacks()].filter((key) => !(key in DATA_STORE_ENV));
    expect(missing).toEqual([]);
  });

  it("points every store into the boot's own frozen dir", () => {
    for (const key of Object.keys(DATA_STORE_ENV)) {
      expect(env[key]?.startsWith("/tmp/frozen/")).toBe(true);
    }
  });

  it("pins both the dashboard and the insights-bridge port", () => {
    expect(env.PORT).toBe("8790");
    expect(env.SKYNET_DASHBOARD_PORT).toBe("8790");
    expect(env.SKYNET_INSIGHTS_BRIDGE_PORT).toBe("8791");
  });

  it("never carries a feedback token, and reads no saved one", () => {
    expect(env.SKYNET_FEEDBACK_GITHUB_TOKEN).toBe("");
    expect(env.SKYNET_GITHUB_TOKEN_STORE).toBe("/tmp/frozen/no-github-token.json");
  });

  it("signs members in only on a session boot", () => {
    const session = offlineBootEnv({
      mode: "session",
      port: 8792,
      bridgePort: 8793,
      fixtures: "/tmp/s",
    });
    expect(env.SKYNET_SESSION_SECRET).toBeUndefined();
    expect(session.SKYNET_SESSION_SECRET).toBeDefined();
    expect(session.SKYNET_ALLOWLIST_STORE).toBe("/tmp/s/allowlist.json");
  });
});
