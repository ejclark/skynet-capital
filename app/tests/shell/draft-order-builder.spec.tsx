import { emptyDraft } from "../../src/live/draft-order";
import { gateStatus } from "../../src/shell/draft-order-builder";

/**
 * The multi-leg gate's headline is the server's word, not the phase's (#3407 P0): a submit the
 * deployment refused to send (`executed: false`) reads "Reviewed — not sent", never "Confirmed".
 */
describe("gateStatus — submitted", () => {
  const submitted = { ...emptyDraft(), phase: "submitted" as const };

  it("says Confirmed only when the server says it executed", () => {
    expect(gateStatus(submitted, true)).toEqual({ tone: "filled", headline: "Confirmed" });
  });

  it("says reviewed, not sent, when the server says it didn't — or said nothing", () => {
    expect(gateStatus(submitted, false)).toEqual({
      tone: "checks",
      headline: "Reviewed — not sent",
    });
    expect(gateStatus(submitted)).toEqual({ tone: "checks", headline: "Reviewed — not sent" });
  });

  it("leaves the other phases as they were", () => {
    expect(gateStatus({ ...emptyDraft(), phase: "reviewed" }).headline).toBe(
      "Reviewed — ready to confirm",
    );
  });
});
