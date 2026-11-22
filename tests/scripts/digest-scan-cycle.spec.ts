import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// `digest-scan --needs-you` dynamically imports assignments → … → rank, and rank imports
// digest-scan back. While the script's own entry was `await main()`, that import waited on a module
// that was waiting on it: node exit 13, "unsettled top-level await", no list (digest 2026-11-22,
// #7939). The deadlock is at import time, so a `gh` that refuses every call still reaches it; what
// is pinned is that the script finishes with an answer or an ordinary error, never exit 13.

describe("digest-scan --needs-you — the import cycle", () => {
  it("WHEN gh refuses every call, THEN it ends by its own error, never an unsettled await", () => {
    const dir = mkdtempSync(join(tmpdir(), "digest-cycle-"));
    try {
      const gh = join(dir, "gh");
      writeFileSync(gh, '#!/bin/sh\necho "HTTP 403" >&2\nexit 1\n');
      chmodSync(gh, 0o755);
      const r = spawnSync("node", ["scripts/digest-scan.mjs", "--needs-you"], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
        timeout: 60_000,
      });
      expect(r.stderr).not.toContain("unsettled top-level await");
      expect(r.status).not.toBe(13);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
