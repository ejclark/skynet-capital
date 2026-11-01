import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";

/**
 * No token is a named skip, not a crash (#6470). incident-scan and pr-provenance-scan exit 0 with
 * one line, so a session with no token can run every scan in a loop. A token GitHub refuses is a
 * different fact and stays loud: the fake curl answers 401, so that case needs no network.
 *
 * `flagRows` holds each way of asking for GitHub data, flags joined by a space.
 */
export function describeNoTokenSkip(name: string, flagRows: readonly string[]): void {
  const noToken = { ...process.env, GH_TOKEN: "", GITHUB_TOKEN: "" };
  const scan = (flags: string[], env: NodeJS.ProcessEnv, input = "") =>
    spawnSync("node", [`scripts/${name}.mjs`, ...flags], { env, input, encoding: "utf8" });

  describe(`${name}: with no token`, () => {
    it.each(flagRows)("exits 0 with one skip line (flags: %s)", (flags) => {
      const r = scan(flags.split(" ").filter(Boolean), noToken);
      expect(r.status).toBe(0);
      expect(r.stdout.trim().split("\n")).toEqual([
        `${name}: no GH_TOKEN/GITHUB_TOKEN — skipping (offline no-op).`,
      ]);
      expect(r.stderr).toBe("");
    });

    it("still scans --explain, whose input is stdin and needs no token", () => {
      const r = scan(["--explain", "--today=2026-08-29"], noToken, "{}");
      expect(r.status).toBe(0);
      expect(r.stdout).not.toContain("skipping");
    });

    it("still rejects a malformed --today, which no token cannot excuse", () => {
      expect(scan(["--today=Sept"], noToken).status).not.toBe(0);
    });

    it("stays loud when a token is set and GitHub refuses it", () => {
      const bin = mkdtempSync(join(tmpdir(), "fake-curl-"));
      const curl = join(bin, "curl");
      writeFileSync(
        curl,
        '#!/bin/sh\necho "curl: (22) The requested URL returned error: 401" >&2\nexit 22\n',
      );
      chmodSync(curl, 0o755);
      try {
        const r = scan([], {
          ...noToken,
          GH_TOKEN: "refused",
          PATH: `${bin}:${process.env.PATH}`,
        });
        expect(r.status).toBe(1);
        expect(r.stdout).not.toContain("skipping");
      } finally {
        rmSync(bin, { recursive: true, force: true });
      }
    });
  });
}
