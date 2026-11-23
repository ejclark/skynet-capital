import { describe, expect, it } from "@rstest/core";
import { serverRead } from "../../scripts/study/server-reads.mjs";
import { buildBook } from "../../scripts/study/worlds/book.mjs";
import { serverConfig, sessionFor } from "../../scripts/study/worlds/server-config.mjs";
import { createBoardChannel } from "../../src/server/board-patch-routes.js";

/**
 * The route families a pin may predate (#8005): server-reads.mjs loads them so an older pin still
 * composes. They must also answer here, under the spec runner, or every spec that reads a quest,
 * a book wait or a target split through the real chain reads nothing (the 2026-11-23 repair
 * brief on #8025: a variable-path `import()` skipped the bundler and came back empty).
 */
describe("the families a pin may predate", () => {
  const config = serverConfig(buildBook("workbench-today"));
  const read = async (url: string) =>
    (await serverRead(url, config, createBoardChannel(), sessionFor("eric@study.world")))?.body;

  it("answer through the real chain under the spec runner", async () => {
    expect(await read("/api/target-split")).toEqual({ wired: true, target: null });
    expect(await read("/api/book-wait?participantId=eric")).toEqual({ wait: null });
    expect(await read("/api/quests")).toMatchObject({ available: true });
  });
});
