import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openRunMarker, runMarkerPath } from "../../src/server/run-marker.js";

// The unclean-restart marker (#4618): written at boot, refreshed by the gauge, removed only by the
// SIGTERM drain's exit. A boot that finds it knows the last run died some other way.
let dir: string;
let path: string;
const at = (iso: string) => () => new Date(iso);
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "skynet-run-marker-"));
  path = join(dir, "run-marker.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("the run marker", () => {
  it("lives beside the stores on the volume, with no env var of its own", () => {
    expect(runMarkerPath({ SKYNET_HISTORY_DIR: "/data/history" })).toBe("/data/run-marker.json");
    expect(runMarkerPath({})).toBe(join("data", "run-marker.json"));
  });

  it("finds nothing to report on a first boot, and claims the marker", () => {
    const m = openRunMarker(path, "abc123", at("2026-10-09T10:00:00Z"));
    expect(m.previous).toBeUndefined();
    expect(JSON.parse(readFileSync(path, "utf8"))).toMatchObject({
      bootedAt: "2026-10-09T10:00:00.000Z",
      gitSha: "abc123",
    });
  });

  it("reports nothing after a clean exit cleared it", () => {
    openRunMarker(path, "abc123").clear();
    expect(existsSync(path)).toBe(false);
    expect(openRunMarker(path, "def456").previous).toBeUndefined();
  });

  it("hands the next boot the last run's heartbeat when it never exited cleanly", () => {
    const first = openRunMarker(path, "abc123", at("2026-10-09T10:00:00Z"));
    first.touch({ rssMb: 340, peakRssMb: 362, loopMaxMs: 1800 });
    // …the machine is OOM-killed here: nothing clears the marker.
    const second = openRunMarker(path, "abc123", at("2026-10-09T10:07:00Z"));
    expect(second.previous).toMatchObject({
      bootedAt: "2026-10-09T10:00:00.000Z",
      lastRssMb: 340,
      peakRssMb: 362,
      lastLoopMaxMs: 1800,
    });
  });

  it("counts a marker torn by the kill it records as an unclean exit", () => {
    writeFileSync(path, '{"bootedAt": "2026-10');
    expect(openRunMarker(path, null).previous).toMatchObject({ bootedAt: "unknown" });
  });

  it("carries the last report time across a crash loop, so it reports once", () => {
    const first = openRunMarker(path, null);
    first.reported(new Date("2026-10-09T10:01:00Z"));
    const second = openRunMarker(path, null);
    expect(second.previous?.reportedAt).toBe("2026-10-09T10:01:00.000Z");
    const third = openRunMarker(path, null);
    expect(third.previous?.reportedAt).toBe("2026-10-09T10:01:00.000Z");
  });

  it("never throws when the volume cannot be written", () => {
    writeFileSync(path, "a file where a directory should be");
    const warnings: string[] = [];
    const m = openRunMarker(join(path, "x.json"), null, undefined, (l) => warnings.push(l));
    expect(() => m.touch()).not.toThrow();
    expect(warnings.length).toBeGreaterThan(0);
  });
});
