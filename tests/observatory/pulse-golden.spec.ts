import { readFileSync } from "node:fs";
import { deskPulseView } from "../../src/observatory/pulse-json-view.js";
import { pulseHistoryFixture } from "../support/pulse-history.js";

/**
 * The Pulse payload, byte for byte (#4613). The golden file was written by `deskPulseView` as it
 * stood at 4ba54e84 — a formatter per sample, three day-keying passes — over the production-shaped
 * fixture in tests/support/pulse-history.ts. Caching the formatters and keying each day once must
 * not move a single label, point, tile or streak; if this fails, the speed-up changed what a member
 * reads, and the golden must not be regenerated to make it pass.
 */
describe("deskPulseView — golden payload", () => {
  it("renders the fixture desk exactly as it did before the formatter cache", () => {
    const { snapshot, samples, durable } = pulseHistoryFixture();
    const golden: unknown = JSON.parse(
      readFileSync(
        new URL("../fixtures/pulse/desk-pulse-view.golden.json", import.meta.url),
        "utf8",
      ),
    );
    expect(JSON.parse(JSON.stringify(deskPulseView(snapshot, samples, durable)))).toEqual(golden);
  });
});
