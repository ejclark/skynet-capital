import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shelfFileFor } from "../../src/domain/discovery-pass.js";
import { shelfAnswered } from "../../src/server/discovery-answered.js";

describe("shelfAnswered (#7034 slice 3b)", () => {
  it("is true only for the ask whose write-up is on the shelf", () => {
    const root = mkdtempSync(join(tmpdir(), "shelf-"));
    const pltr = { kind: "name", subject: "PLTR" } as const;
    const answered = shelfAnswered(root);
    expect(answered(pltr)).toBe(false);
    mkdirSync(join(root, "docs/research/discovery"), { recursive: true });
    writeFileSync(join(root, shelfFileFor(pltr)), "# PLTR\n");
    expect(answered(pltr)).toBe(true);
    expect(answered({ kind: "name", subject: "PLTR", campaign: "energy-for-ai" })).toBe(false);
  });
});
