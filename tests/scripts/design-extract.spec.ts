import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// The design→code pull's resolver, driven through the real entrypoint the way every other script
// spec here works — `--explain` feeds the candidate list in as JSON instead of walking the
// filesystem, so this runs offline and identically on a machine with no Claude Code bundle.
//
// WHY THE VERSION COMPARE IS THE LOAD-BEARING CASE. `seed-canvas.mjs` is extracted from the Claude
// Code binary to a version-scoped temp path, and the `.dc.html` format ships with that binary. Sort
// those versions as strings and `2.1.240` lands BELOW `2.1.99` — pinning an older extractor against
// a newer canvas format. That failure is silent: it parses something, just not correctly.

const SCRIPT = fileURLToPath(new URL("../../scripts/design-extract.mjs", import.meta.url));
const at = (version: string) =>
  `/tmp/claude-0/bundled-skills/${version}/hash/design/seed-canvas.mjs`;

type Pick = { resolved: string; reason: string; considered: number; version?: string };

function explain(state: { env?: Record<string, string>; candidates?: string[] }): Pick {
  return JSON.parse(
    execFileSync("node", [SCRIPT, "--explain"], {
      input: JSON.stringify(state),
      encoding: "utf8",
    }),
  );
}

/** Run the entrypoint for real and report its exit code plus what it said. */
function run(args: string[], env: Record<string, string> = {}) {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], {
      encoding: "utf8",
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out: stdout };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? -1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

describe("when several bundled extractors are present", () => {
  it("picks the newest version numerically, not as a string", () => {
    const pick = explain({ candidates: [at("2.1.99"), at("2.1.240"), at("2.1.7")] });
    expect(pick.version).toBe("2.1.240");
    expect(pick.reason).toBe("newest");
  });

  it("ranks on the major segment before the minor", () => {
    expect(explain({ candidates: [at("1.9.999"), at("2.0.1")] }).version).toBe("2.0.1");
  });

  it("never lets a malformed version outrank a real release", () => {
    expect(explain({ candidates: [at("next"), at("2.1.240")] }).version).toBe("2.1.240");
  });

  it("reports how many it considered, so a surprise pick is diagnosable", () => {
    expect(explain({ candidates: [at("1.0.0"), at("2.0.0")] }).considered).toBe(2);
  });
});

describe("when SKYNET_SEED_CANVAS names an extractor", () => {
  it("uses it even when a newer bundled one exists", () => {
    const pick = explain({
      env: { SKYNET_SEED_CANVAS: "/pinned/seed-canvas.mjs" },
      candidates: [at("9.9.9")],
    });
    expect(pick.resolved).toBe("/pinned/seed-canvas.mjs");
    expect(pick.reason).toBe("override");
  });
});

describe("when no extractor can be found", () => {
  it("resolves to nothing rather than guessing a path", () => {
    const pick = explain({ candidates: [] });
    expect(pick.resolved).toBe("");
    expect(pick.reason).toBe("none");
  });

  it("exits non-zero and names the remedy instead of failing quietly", () => {
    const { code, out } = run(["--which"], { SKYNET_BUNDLED_SKILLS: "/nonexistent" });
    expect(code).toBe(1);
    expect(out).toContain("/design");
    expect(out).toContain("SKYNET_SEED_CANVAS");
  });

  it("refuses to vendor a copy, and says why in the failure itself", () => {
    const { out } = run(["--which"], { SKYNET_BUNDLED_SKILLS: "/nonexistent" });
    expect(out).toContain("Never vendor a copy");
  });
});

describe("when the arguments are incomplete", () => {
  it("exits with a usage error rather than extracting somewhere unintended", () => {
    const { code, out } = run(["--to"], { SKYNET_SEED_CANVAS: SCRIPT });
    expect(code).toBe(2);
    expect(out).toContain("usage:");
  });
});
