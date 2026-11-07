import {
  CONTROLS_BOT_GATE_HEADER,
  CONTROLS_BOT_MODE_HEADER,
  CONTROLS_BOT_SHA_HEADER,
  controlsPollGateHeaders,
  controlsPollHeaders,
  controlsPollModeHeaders,
  controlsPollReport,
  modeGate,
  type PersonaGateVerdict,
} from "../../src/autonomous/controls-poll-wire.js";

/**
 * The self-report the bots process stamps onto its `/controls` poll (#666). The property that
 * matters is that "not reported" and "reported something that isn't a commit" both read as
 * ABSENT, never as a commit — the value lands in owner-facing copy and in a GitHub compare URL.
 */
const SHA = "4f234c0000000000000000000000000000000bba";

/** Reads a single-string header out of a `controlsPollGateHeaders()` result without a non-null
 *  assertion (`noUncheckedIndexedAccess` + this repo's `noNonNullAssertion` lint rule). */
function requiredHeader(headers: Record<string, string>, key: string): string {
  const value = headers[key];
  if (typeof value !== "string") throw new Error(`test setup: expected header "${key}"`);
  return value;
}

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

/**
 * The persona gate header (#666 slice 3): each live bot's boot-time readiness verdict, base64'd
 * JSON riding the same poll. The property that matters is the same as the sha header's — anything
 * short of a clean, well-shaped payload reads as "not reported", never as a partial/wrong roster.
 */
describe("controlsPollGateHeaders (the bots side)", () => {
  const VERDICTS: readonly PersonaGateVerdict[] = [
    { id: "sauron", ready: true, reason: "passed the readiness pack" },
    { id: "banker", ready: false, reason: "failed the safety battery" },
  ];

  it("base64-encodes the verdicts into one header", () => {
    const headers = controlsPollGateHeaders(VERDICTS);
    expect(Object.keys(headers)).toEqual([CONTROLS_BOT_GATE_HEADER]);
    const decoded = JSON.parse(
      Buffer.from(requiredHeader(headers, CONTROLS_BOT_GATE_HEADER), "base64").toString("utf8"),
    );
    expect(decoded).toEqual(VERDICTS);
  });

  it("stamps nothing when there are no verdicts to report", () => {
    expect(controlsPollGateHeaders(undefined)).toEqual({});
    expect(controlsPollGateHeaders([])).toEqual({});
  });
});

describe("controlsPollReport reads the gate header back (the app side)", () => {
  const VERDICTS: readonly PersonaGateVerdict[] = [
    { id: "sauron", ready: true, reason: "passed the readiness pack" },
  ];

  it("round-trips exactly what the bots side encoded", () => {
    const headers = controlsPollGateHeaders(VERDICTS);
    expect(controlsPollReport(headers)).toEqual({ gate: VERDICTS });
  });

  it("reports nothing for an absent gate header", () => {
    expect(controlsPollReport({})).toEqual({});
  });

  it("drops a malformed base64/JSON payload rather than guessing", () => {
    expect(controlsPollReport({ [CONTROLS_BOT_GATE_HEADER]: "not-base64-json!!" })).toEqual({});
  });

  it("drops a well-formed but wrongly-shaped payload", () => {
    const bad = Buffer.from(JSON.stringify([{ id: "sauron" }]), "utf8").toString("base64");
    expect(controlsPollReport({ [CONTROLS_BOT_GATE_HEADER]: bad })).toEqual({});
  });

  it("drops an oversized roster rather than truncating it", () => {
    const many = Array.from({ length: 33 }, (_, i) => ({
      id: `bot-${i}`,
      ready: true,
      reason: "ok",
    }));
    const encoded = Buffer.from(JSON.stringify(many), "utf8").toString("base64");
    expect(controlsPollReport({ [CONTROLS_BOT_GATE_HEADER]: encoded })).toEqual({});
  });

  it("drops a repeated header rather than picking one arbitrarily", () => {
    const headers = controlsPollGateHeaders(VERDICTS);
    const encoded = requiredHeader(headers, CONTROLS_BOT_GATE_HEADER);
    expect(controlsPollReport({ [CONTROLS_BOT_GATE_HEADER]: [encoded, encoded] })).toEqual({});
  });
});

/**
 * The mode the bots run in (#6954 slice 1): the house mode on its own header, and each gate verdict's
 * `wanted` and `mode`. Same posture as the headers above — anything but a clean value reads as not
 * reported, never as watching or placing.
 */
describe("the house mode and each bot's mode on the poll (#6954 slice 1)", () => {
  it("round-trips the house mode", () => {
    expect(controlsPollReport(controlsPollModeHeaders("live"))).toEqual({ processMode: "live" });
    expect(controlsPollReport(controlsPollModeHeaders("observe"))).toEqual({
      processMode: "observe",
    });
  });

  it("stamps nothing before the process knows its mode", () => {
    expect(controlsPollModeHeaders(undefined)).toEqual({});
  });

  it("reads anything but observe or live as not reported", () => {
    for (const raw of ["LIVE", "", "paper", ["live", "live"]]) {
      expect(controlsPollReport({ [CONTROLS_BOT_MODE_HEADER]: raw })).toEqual({});
    }
  });

  it("round-trips each verdict's wanted and actual mode", () => {
    const verdicts: readonly PersonaGateVerdict[] = [
      { id: "sauron", ready: true, reason: "passed", wanted: "live", mode: "live" },
      { id: "banker", ready: false, reason: "not ready", wanted: "live", mode: "observe" },
    ];
    expect(controlsPollReport(controlsPollGateHeaders(verdicts))).toEqual({ gate: verdicts });
  });

  it("drops the whole roster when one verdict carries a mode it cannot read", () => {
    const bad = Buffer.from(
      JSON.stringify([{ id: "sauron", ready: true, reason: "ok", mode: "real-money" }]),
      "utf8",
    ).toString("base64");
    expect(controlsPollReport({ [CONTROLS_BOT_GATE_HEADER]: bad })).toEqual({});
  });
});

describe("modeGate — which gate holds a bot to watching", () => {
  const verdict = (over: Partial<PersonaGateVerdict>): PersonaGateVerdict => ({
    id: "sauron",
    ready: true,
    reason: "passed",
    wanted: "live",
    mode: "live",
    ...over,
  });

  it("is none for a bot placing paper orders under a live house", () => {
    expect(modeGate("live", verdict({}))).toBeNull();
  });

  it("names the house first: an observe house holds every bot, whatever else holds it", () => {
    expect(modeGate("observe", verdict({ wanted: "observe", mode: "observe" }))).toBe("house");
    expect(modeGate("observe", verdict({ ready: false, mode: "observe" }))).toBe("house");
  });

  it("names the owner's setting before the readiness gate", () => {
    expect(modeGate("live", verdict({ wanted: "observe", mode: "observe" }))).toBe("owner");
    expect(modeGate("live", verdict({ wanted: "observe", mode: "observe", ready: false }))).toBe(
      "owner",
    );
  });

  it("names the readiness gate for a bot that wanted live and was pinned", () => {
    expect(modeGate("live", verdict({ ready: false, mode: "observe" }))).toBe("readiness");
  });

  it("is not reported for a verdict from a build that predates the mode", () => {
    expect(modeGate("live", { id: "sauron", ready: true, reason: "passed" })).toBeUndefined();
  });
});
