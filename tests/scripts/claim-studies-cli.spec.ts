import { parseArgs } from "../../src/scripts/claim-studies.js";

/** #5482 — `npm run research:claims` is run unattended by the event lane with `--event <id>`, which
 *  must never fall through to a full pass: a full pass re-runs studies, and a study's reading sets a
 *  live narrowing (claim 7's floor band is CRWV-WHEEL's strike ceiling). */
describe("research:claims arguments", () => {
  it("reads --event in either form, and it implies scores only", () => {
    for (const argv of [["--event", "crwv-2026-11-10-print"], ["--event=crwv-2026-11-10-print"]]) {
      expect(parseArgs(argv)).toEqual({
        ids: [],
        dry: false,
        event: "crwv-2026-11-10-print",
        scoreOnly: true,
      });
    }
  });

  it("refuses a misspelled or unknown flag instead of running a full pass", () => {
    expect(parseArgs(["--events", "crwv-2026-11-10-print"])).toEqual({
      error: "unknown flag --events (accepted: --dry, --score-only, --cap, --event)",
    });
    expect(parseArgs(["--score_only"])).toHaveProperty("error");
  });

  it("refuses a flag that needs a value and has none", () => {
    expect(parseArgs(["--event"])).toEqual({ error: "--event needs a value" });
    expect(parseArgs(["--event", "--dry"])).toEqual({ error: "--event needs a value" });
    expect(parseArgs(["--event="])).toEqual({ error: "--event needs a value" });
    expect(parseArgs(["--cap"])).toEqual({ error: "--cap needs a value" });
  });

  it("keeps a full pass a full pass, with ids, the cap and a dry run", () => {
    expect(parseArgs(["ai-dip-2026-10", "--cap", "1", "--dry"])).toEqual({
      ids: ["ai-dip-2026-10"],
      dry: true,
      scoreOnly: false,
      cap: "1",
    });
    expect(parseArgs(["--score-only"])).toEqual({ ids: [], dry: false, scoreOnly: true });
  });
});
