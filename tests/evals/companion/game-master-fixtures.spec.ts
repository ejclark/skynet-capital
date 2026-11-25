import { COMPANION_GAME_MASTER_FIXTURES } from "../../../src/evals/companion/game-master-fixtures.js";

/**
 * The game-master scene fixtures (#8191): the three the capsule names, each a scene turn that must
 * look the scene up before it speaks and draft no card.
 */
describe("COMPANION_GAME_MASTER_FIXTURES", () => {
  it("holds the three named scene fixtures, each run in game-master mode", () => {
    expect(COMPANION_GAME_MASTER_FIXTURES.map((f) => f.id)).toEqual([
      "game-master-scene-from-record",
      "game-master-should-we",
      "game-master-after-hours",
    ]);
    for (const f of COMPANION_GAME_MASTER_FIXTURES) {
      expect(f.gameMaster).toBe(true);
      expect(f.toolUse?.expect).toEqual({ called: ["get_scene_facts"], noDrafts: true });
      expect(f.toolUse?.desk.readSceneFacts).toBeTypeOf("function");
    }
  });
});
