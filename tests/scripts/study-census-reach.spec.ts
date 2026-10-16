import { describe, expect, it } from "@rstest/core";
import { censusReach } from "../../scripts/study/round-prepare.mjs";

// The first full round's census listed 856 controls, operated none, and preflight said done.
const of = (...s: string[]) => s.map((status) => ({ status }));

describe("censusReach — a census must operate what it listed", () => {
  it("refuses a census that operated nothing", () => {
    expect(censusReach(of("not-found", "not-found", "skipped")).ok).toBe(false);
  });
  it("does not count skipped controls (they leave the app) against it", () => {
    const r = censusReach(of("operated", "operated", "operated", "operated", "skipped", "skipped"));
    expect(r).toEqual({ ok: true, operated: 4, eligible: 4, why: "ok" });
  });
  it("refuses under 80% operated", () => {
    expect(censusReach(of("operated", "operated", "operated", "not-found", "not-found")).ok).toBe(
      false,
    );
  });
  it("refuses an empty census", () => {
    expect(censusReach([]).ok).toBe(false);
  });
});
