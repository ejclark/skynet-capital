import { readingFrom, withReading } from "../../../scripts/moneypenny/pace-reading.mjs";
import { publishReading } from "../../../scripts/steer/publish-reading.mjs";

// THE WEEKLY READING ON THE DIAL (#6470). One hidden marker in #4153's body. These pin that a publish
// changes nothing else in the body, that a bad marker never reads as zero used, and that publishing
// can only ever touch the body, never a label.

const AT = Date.parse("2026-11-01T13:40:00Z");
const RESETS = Date.parse("2026-11-03T05:00:00Z");
const READING = { used: 34, at: AT, resetsAt: RESETS, source: "get_usage" };

describe("the marker in the body", () => {
  it("round-trips a reading", () => {
    expect(readingFrom(withReading("The dial.", READING))).toEqual(READING);
  });

  it("adds it at the end of a body with none, and keeps the prose word for word", () => {
    const body = withReading("The dial.\n\nDetails stay.", READING);
    expect(body.startsWith("The dial.\n\nDetails stay.\n\n<!-- pace-reading ")).toBe(true);
  });

  it("replaces the last reading in place, so readings never pile up", () => {
    const first = withReading("Above.\n\nBelow.", READING);
    const second = withReading(first, { ...READING, used: 50 });
    expect(second.match(/pace-reading/g)).toHaveLength(1);
    expect(readingFrom(second)?.used).toBe(50);
    expect(second.startsWith("Above.\n\nBelow.")).toBe(true);
  });

  it("is hidden: the marker is an HTML comment", () => {
    expect(withReading("x", READING)).toMatch(/<!-- pace-reading \{.*\} -->\n$/);
  });

  it("does not misread a dollar sign pattern in a later write", () => {
    const first = withReading("x", { ...READING, source: "$& $1" });
    expect(readingFrom(withReading(first, { ...READING, source: "$& $1" }))?.source).toBe("$& $1");
  });

  it.each([
    ["no body", null],
    ["no marker", "just prose"],
    ["a marker that does not parse", "<!-- pace-reading {nope} -->"],
    [
      "no number",
      '<!-- pace-reading {"readAt":"2026-11-01T13:40:00Z","resetsAt":"2026-11-03T05:00:00Z"} -->',
    ],
    ["a bad time", '<!-- pace-reading {"used":3,"readAt":"soon","resetsAt":"later"} -->'],
    [
      "a percent past 100",
      '<!-- pace-reading {"used":500,"readAt":"2026-11-01T13:40:00Z","resetsAt":"2026-11-03T05:00:00Z"} -->',
    ],
  ])("reads %s as no reading, never as zero used", (_case, body) => {
    expect(readingFrom(body)).toBeNull();
  });
});

describe("publishing a reading", () => {
  const fake = (body = "The dial.") => {
    const calls: string[][] = [];
    const exec = (_cmd: string, args: readonly string[]) => {
      calls.push([...args]);
      return args.includes("-X") ? "" : body;
    };
    return { exec, calls };
  };
  const opts = { used: 34, resetsAt: RESETS, readAt: AT, trackingIssue: 4153 };

  it("reads the body once and writes only the body, on the dial's issue", () => {
    const { exec, calls } = fake();
    publishReading({ ...opts, exec });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.slice(0, 4)).toEqual([
      "api",
      "-X",
      "PATCH",
      "repos/{owner}/{repo}/issues/4153",
    ]);
    expect(calls[1]?.at(-1)).toMatch(/^body=The dial\.\n\n<!-- pace-reading /);
    // Never a label: a publish cannot move the dial.
    expect(calls.flat().join(" ")).not.toMatch(/labels?\b|title=/);
  });

  it("asks for an empty body rather than the word null", () => {
    const { exec, calls } = fake();
    publishReading({ ...opts, exec });
    expect(calls[0]?.at(-1)).toBe('.body // ""');
  });

  it("writes nothing on a dry run", () => {
    const { exec, calls } = fake();
    expect(publishReading({ ...opts, exec, dryRun: true })).toContain("pace-reading");
    expect(calls).toHaveLength(1);
  });

  it.each([
    ["a percent over 100", { used: 140 }],
    ["a negative percent", { used: -1 }],
    ["a percent that is not a number", { used: Number.NaN }],
    ["a reset that is not a time", { resetsAt: Number.NaN }],
    ["a reset already past", { resetsAt: AT - 1 }],
  ])("refuses %s, and writes nothing", (_case, over) => {
    const { exec, calls } = fake();
    expect(() => publishReading({ ...opts, ...over, exec })).toThrow(/steer\/publish-reading/);
    expect(calls).toEqual([]);
  });
});
