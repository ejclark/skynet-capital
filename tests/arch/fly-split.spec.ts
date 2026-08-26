import { readFileSync } from "node:fs";

// The deploy split's cross-app contract, enforced the way volume-persistence.spec.ts enforces the
// /data contract: parse both Fly configs and assert the facts the split depends on, so a tidy-up
// that "simplifies" one file cannot silently sever the bots↔dashboard bridge or open the bots app
// to the public. Line-level string checks on purpose — no TOML parser dependency for four facts.
const dashboard = readFileSync("fly.toml", "utf8");
const bots = readFileSync("fly.bots.toml", "utf8");

/** Config lines only — fly.bots.toml's comments MENTION the very sections it must not declare. */
const configOnly = (toml: string): string =>
  toml
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");

/** The [env] assignment for `key`, unquoted, or undefined. Good enough for our flat configs. */
const envValue = (toml: string, key: string): string | undefined =>
  toml.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, "m"))?.[1];

describe("fly deploy split (fly.toml ↔ fly.bots.toml)", () => {
  it("gives the bots app NO public surface and NO volume — the stateless-disk contract", () => {
    // The shared image's default CMD is the dashboard with no auth store on this app; a public
    // surface here would be an unauthenticated dashboard. See fly.bots.toml's contract comments.
    expect(configOnly(bots)).not.toContain("[http_service]");
    expect(configOnly(bots)).not.toContain("[mounts]");
  });

  it("keeps the bots app's bridge URL pointed at the dashboard app's `app` process group", () => {
    const url = envValue(bots, "SKYNET_INSIGHTS_BRIDGE_URL");
    expect(url).toBeTruthy();
    // The hostname is derived from fly.toml, not restated: <group>.process.<app>.internal, where
    // the group must exist in fly.toml's [processes]. Renaming either side breaks the bridge —
    // this assertion is what makes that rename loud instead of silently env-only.
    const appName = dashboard.match(/^app\s*=\s*"([^"]+)"/m)?.[1];
    expect(appName).toBeTruthy();
    expect(url).toContain(`.process.${appName}.internal`);
    const group = url?.match(/^http:\/\/([^.]+)\.process\./)?.[1] ?? "";
    expect(
      new RegExp(`^\\s*${group}\\s*=`, "m").test(dashboard),
      `process group "${group}" must exist in fly.toml [processes]`,
    ).toBe(true);
  });

  it("boots the bots app safe by default — observe mode, exactly like the shared app did", () => {
    expect(envValue(bots, "SKYNET_AUTONOMOUS_MODE")).toBe("observe");
  });

  it("runs ONLY the bots process — the [processes] override is what keeps the image CMD dark", () => {
    expect(bots).toContain("[processes]");
    expect(bots).toMatch(/^\s*bots\s*=\s*"npm run run:autonomous"/m);
    expect(bots).not.toMatch(/^\s*app\s*=\s*"npm run serve:dashboard"/m);
  });
});
