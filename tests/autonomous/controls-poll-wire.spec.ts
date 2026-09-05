import {
  CONTROLS_BOT_SHA_HEADER,
  controlsPollHeaders,
  controlsPollReport,
} from "../../src/autonomous/controls-poll-wire.js";

/**
 * The self-report the bots process stamps onto its `/controls` poll (#666). The property that
 * matters is that "not reported" and "reported something that isn't a commit" both read as
 * ABSENT, never as a commit — the value lands in owner-facing copy and in a GitHub compare URL.
 */
const SHA = "4f234c0000000000000000000000000000000bba";

describe("controlsPollHeaders (the bots side)", () => {
  it("stamps a real sha, normalised to lowercase", () => {
    expect(controlsPollHeaders(SHA)).toEqual({ [CONTROLS_BOT_SHA_HEADER]: SHA });
    expect(controlsPollHeaders(`  ${SHA.toUpperCase()}  `)).toEqual({
      [CONTROLS_BOT_SHA_HEADER]: SHA,
    });
    expect(controlsPollHeaders("4f234c0")).toEqual({ [CONTROLS_BOT_SHA_HEADER]: "4f234c0" });
  });

  it("stamps nothing at all when there is no sha to report", () => {
    for (const value of [undefined, "", "   ", "main", "v1.2.3", "zzzzzzz", "4f234c"]) {
      expect(controlsPollHeaders(value)).toEqual({});
    }
  });
});

describe("controlsPollReport (the app side)", () => {
  it("reads the reported commit back off the poll's headers", () => {
    expect(controlsPollReport({ [CONTROLS_BOT_SHA_HEADER]: SHA })).toEqual({ gitSha: SHA });
    expect(controlsPollReport({ [CONTROLS_BOT_SHA_HEADER]: SHA.toUpperCase() })).toEqual({
      gitSha: SHA,
    });
  });

  it("reports nothing for an absent, repeated, or non-sha header", () => {
    expect(controlsPollReport({})).toEqual({});
    expect(controlsPollReport({ [CONTROLS_BOT_SHA_HEADER]: "" })).toEqual({});
    expect(controlsPollReport({ [CONTROLS_BOT_SHA_HEADER]: [SHA, SHA] })).toEqual({});
    // A path-traversal attempt aimed at the GitHub compare URL this value is interpolated into.
    expect(controlsPollReport({ [CONTROLS_BOT_SHA_HEADER]: "../../../etc/passwd" })).toEqual({});
    expect(controlsPollReport({ [CONTROLS_BOT_SHA_HEADER]: `${SHA}?per_page=1` })).toEqual({});
  });
});
