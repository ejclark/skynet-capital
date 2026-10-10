import { describe, expect, it } from "@rstest/core";
import {
  activeMinutes,
  decisionsFrom,
  fitBudget,
  parseSteerMarker,
  recordPath,
  roundPath,
  roundRecords,
  SECTIONS,
  safeKey,
  steerMarker,
  TAP_GAP_CAP_MS,
} from "../../scripts/steer/model.mjs";
import { historyFrom } from "../../scripts/steer/reel.mjs";
import { centralToUtc, nextTouchPoint, touchPoint } from "../../scripts/steer/time.mjs";

// #5056 criterion 9: saved records are keyed by touch point, so a republish never overwrites an
// earlier round. Round 1 of the profile critique saved to `critique/q1`…`q8` with no round in the
// path — round 2 on the same page would have written over Eric's only copy of round 1.

/** The artifact store's grammar (db.d.ts): even segment count = a document; these characters only. */
const isDocPath = (p: string) =>
  p.split("/").length % 2 === 0 &&
  p.split("/").every((s) => /^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(s));

describe("round-keyed records", () => {
  const ids = ["2026-10-10-am", "2026-10-10-pm", "2026-10-11-am"];
  const keys = ["5037-q1", "5037-q2", "2224", "4437"];

  it("never collide: every (round, section, key) has its own path", () => {
    const paths = ids.flatMap((id) =>
      SECTIONS.flatMap((s) => keys.map((k) => recordPath(id, s, k))),
    );
    expect(new Set(paths).size).toBe(ids.length * SECTIONS.length * keys.length);
  });

  it("are documents the store accepts, and the round's meta is its own document", () => {
    for (const id of ids) {
      expect(isDocPath(roundPath(id))).toBe(true);
      for (const s of SECTIONS)
        for (const k of keys) expect(isDocPath(recordPath(id, s, k))).toBe(true);
    }
  });

  it("never land on round 1's critique paths, which stay readable", () => {
    expect(recordPath("2026-10-10-pm", "decisions", "5037-q1").startsWith("critique/")).toBe(false);
    expect(recordPath("2026-10-10-pm", "decisions", "5037-q1")).toBe(
      "tp/2026-10-10-pm/decisions/5037-q1",
    );
  });

  it("turns any key into a legal segment, and refuses an unknown section", () => {
    expect(safeKey("5037 q1/option A")).toBe("5037-q1-option-A");
    expect(() => recordPath("2026-10-10-pm", "notes", "1")).toThrow(/unknown section/);
    expect(() => safeKey("..")).toThrow();
  });

  it("reads a round's answers back without picking up another round's", () => {
    const records = {
      "tp/2026-10-10-am": { openedAt: "2026-10-10T13:05:00Z" },
      "tp/2026-10-10-am/decisions/2224": { verdict: "build" },
      "tp/2026-10-10-pm/decisions/2224": { verdict: "not" },
      "tp/2026-10-10-pm/queue/4437": { data: { verdict: "veto" }, version: 3 },
    };
    const pm = roundRecords(records, "2026-10-10-pm");
    expect(pm.decisions["2224"]?.verdict).toBe("not");
    expect(pm.queue["4437"]?.verdict).toBe("veto");
    expect(pm.meta).toBeNull();
    expect(roundRecords(records, "2026-10-10-am").decisions["2224"]?.verdict).toBe("build");
  });
});

describe("active minutes", () => {
  const min = 60_000;

  it("sums the gaps between taps", () => {
    expect(activeMinutes([0, min, 2 * min])).toBe(2);
  });

  it("caps each gap at 3 minutes, so a tab left open through a meeting is not steering", () => {
    expect(TAP_GAP_CAP_MS).toBe(3 * min);
    expect(activeMinutes([0, min, 45 * min, 46 * min])).toBe(1 + 3 + 1);
  });

  it("reads one tap, no taps, unsorted and repeated taps sensibly", () => {
    expect(activeMinutes([])).toBe(0);
    expect(activeMinutes([5 * min])).toBe(0);
    expect(activeMinutes([2 * min, 0, min, min])).toBe(2);
  });

  it("feeds the strip's history: each round's minutes and the last Done", () => {
    const h = historyFrom({
      "tp/2026-10-09-pm": {
        openedAt: "2026-10-09T21:00:00Z",
        doneAt: "2026-10-09T21:20:00Z",
        taps: [0, min],
        shown: ["2224"],
      },
      "tp/2026-10-10-am": {
        openedAt: "2026-10-10T13:00:00Z",
        doneAt: null,
        taps: [],
        shown: ["2224"],
      },
      "tp/2026-10-10-am/decisions/2224": { verdict: "build", at: "2026-10-10T13:00:00Z" },
    });
    expect(h.metas.map((m) => m.minutes)).toEqual([1, 0]);
    expect(h.lastDoneAt).toBe("2026-10-09T21:20:00Z");
    // First shown on the 10-09 evening page, answered the next morning: 16 hours.
    expect(h.waits).toEqual([16 / 24]);
  });
});

describe("touch points, in Central time", () => {
  it("names the page by its Central date and half of the day", () => {
    expect(touchPoint("2026-10-10T13:30:00Z").id).toBe("2026-10-10-am"); // 08:30 CDT
    expect(touchPoint("2026-10-10T21:30:00Z").id).toBe("2026-10-10-pm"); // 16:30 CDT
    expect(touchPoint("2026-11-02T14:30:00Z").id).toBe("2026-11-02-am"); // 08:30 CST
  });

  it("finds the next page across the CDT → CST switch", () => {
    expect(centralToUtc("2026-10-10", 16)).toBe("2026-10-10T21:00:00Z");
    expect(centralToUtc("2026-11-02", 8)).toBe("2026-11-02T14:00:00Z");
    const next = nextTouchPoint({ date: "2026-10-31", slot: "pm" }, "2026-10-31T21:30:00Z");
    expect(next.id).toBe("2026-11-01-am");
    expect(next.at).toBe("2026-11-01T14:00:00Z");
  });
});

describe("the decisions, in the rank's order", () => {
  const row = (number: number) => ({
    number,
    title: `t${number}`,
    criterion: 1 as const,
    why: "w",
    decision: `decide ${number}`,
  });
  const iss = (number: number, labels: string[], created: string) => ({
    number,
    labels: labels.map((name) => ({ name })),
    created_at: created,
  });

  it("lets Eric's hand-set P-label win, then oldest — no second ordering", () => {
    const ds = decisionsFrom({
      needsYou: [row(1), row(2), row(3)],
      issues: [
        iss(1, ["needs-eric"], "2026-09-01T00:00:00Z"),
        iss(2, ["needs-eric", "P0"], "2026-10-01T00:00:00Z"),
        iss(3, ["needs-eric"], "2026-08-01T00:00:00Z"),
      ],
      now: "2026-10-10T00:00:00Z",
    });
    expect(ds.map((d) => d.issue)).toEqual([2, 3, 1]);
  });

  it("fits the page's minutes and rolls the rest over as a count", () => {
    const ds = decisionsFrom({
      needsYou: [row(1), row(2), row(3)],
      issues: [1, 2, 3].map((n) => iss(n, ["needs-eric"], `2026-10-0${n}T00:00:00Z`)),
      now: "2026-10-10T00:00:00Z",
    });
    const fit = fitBudget(ds, 6);
    expect(fit.shown.map((d) => d.issue)).toEqual([1, 2]);
    expect(fit.deferred.map((d) => d.issue)).toEqual([3]);
  });
});

describe("the read-back's marker", () => {
  it("round-trips the round, the key and Eric's first quoted line", () => {
    const body = `x\n\n> keep the row, lose the card\n> second line\n\n${steerMarker("2026-10-10-pm", "5037-q1")}`;
    expect(parseSteerMarker(body)).toEqual({
      round: "2026-10-10-pm",
      key: "5037-q1",
      note: "keep the row, lose the card",
    });
    expect(parseSteerMarker("no marker")).toBeNull();
  });
});
