import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "@rstest/core";
import { SYMBOL_RE } from "../../src/domain/ask-input.js";

describe("the shape of an ask's input", () => {
  it("a ticker is a letter, then up to nine letters, digits or dots", () => {
    for (const ok of ["NVDA", "BRK.B", "X", "A1"]) expect(SYMBOL_RE.test(ok)).toBe(true);
    for (const bad of ["nvda", "1A", "", "ABCDEFGHIJK", "NVDA260116C00100000 ", "$NVDA"])
      expect(SYMBOL_RE.test(bad)).toBe(false);
  });

  // #7300: the chat's research-question tool imported its checks from campaigns.ts, which reads
  // src/domain/campaigns/ from the working directory on import, so the study composer — run from
  // a frozen corpus with no campaign files — crashed. The tool must load anywhere.
  it("the chat's research-question tool loads in a directory that holds no campaign files", () => {
    const tool = pathToFileURL(join(process.cwd(), "src/companion/companion-research-ask.ts")).href;
    const tsx = join(process.cwd(), "node_modules", ".bin", "tsx");
    const empty = mkdtempSync(join(tmpdir(), "ask-input-"));
    try {
      const out = spawnSync(
        tsx,
        [
          "-e",
          `import(${JSON.stringify(tool)}).then((m) => console.log(m.parseResearchAsk({ kind: "name", subject: "nvda" }).subject))`,
        ],
        { cwd: empty, encoding: "utf8" },
      );
      expect(out.stderr).toBe("");
      expect(out.stdout.trim()).toBe("NVDA");
      expect(out.status).toBe(0);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
