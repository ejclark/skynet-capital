import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { makeCaller, userMessage } from "../../scripts/study/sealed.mjs";

// A resumed round replays an answer it already paid for, and asks again only when anything differs.
const ROLE_PATH = "/nowhere/expert.md";
const recorded = (dir: string, text: string, answer: unknown) =>
  writeFileSync(
    join(dir, "expert-001.json"),
    JSON.stringify({ role: "expert", n: 1, message: userMessage(text), answer }),
  );

describe("makeCaller — replay on resume", () => {
  it("returns the recorded answer to the identical message without calling anything", async () => {
    const dir = mkdtempSync(join(tmpdir(), "study-replay-"));
    recorded(dir, "batch one", { findings: [1] });
    // `stub` points nowhere: a real or stubbed call would throw, so a pass proves it was replayed.
    const call = makeCaller({ record: dir, stub: join(dir, "no-stub-here") });
    const answer = await call({
      role: "expert",
      rolePath: ROLE_PATH,
      schema: "{}",
      message: userMessage("batch one"),
    });
    expect(answer).toEqual({ findings: [1] });
    expect(JSON.parse(readFileSync(join(dir, "expert-001.json"), "utf8")).replayed).toBe(true);
  });
  it("asks again when the message differs", async () => {
    const dir = mkdtempSync(join(tmpdir(), "study-replay-"));
    recorded(dir, "batch one", { findings: [1] });
    const call = makeCaller({ record: dir, stub: join(dir, "no-stub-here") });
    await expect(
      call({
        role: "expert",
        rolePath: ROLE_PATH,
        schema: "{}",
        message: userMessage("batch two"),
      }),
    ).rejects.toThrow(/stub/);
  });
});
