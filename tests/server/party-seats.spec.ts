import type { LadderEvidence } from "../../src/server/ladder-evidence.js";
import { PartySeats } from "../../src/server/party-seats.js";

/** A member's first fill seats them (#8253): proof is a fill in our journal, never a claim. */

const evidence = (hasFill: boolean): LadderEvidence => ({ earned: [], hasFill });

describe("PartySeats", () => {
  it("seats a member once their first fill lands, and tells subscribers once", async () => {
    const fills = new Set<string>();
    const reads: string[] = [];
    const seats = new PartySeats((id) => {
      reads.push(id);
      return Promise.resolve(evidence(fills.has(id)));
    });
    let told = 0;
    seats.subscribe(() => {
      told += 1;
    });

    await seats.refresh(["m-a", "m-b"]);
    expect(seats.isSeated("m-a")).toBe(false);
    expect(told).toBe(0);

    fills.add("m-a");
    await seats.refresh(["m-a", "m-b"]);
    expect(seats.isSeated("m-a")).toBe(true);
    expect(told).toBe(1);

    reads.length = 0;
    await seats.refresh(["m-a", "m-b"]);
    expect(reads).toEqual(["m-b"]); // a seat is never re-read or taken back
    expect(told).toBe(1);
  });

  it("never seats on a failed read", async () => {
    const seats = new PartySeats(() => Promise.reject(new Error("journal unreadable")));
    await seats.refresh(["m-a"]);
    expect(seats.isSeated("m-a")).toBe(false);
  });

  it("runs one refresh at a time and still reads the newest ids", async () => {
    let inFlight = 0;
    let most = 0;
    const seats = new PartySeats(async () => {
      inFlight += 1;
      most = Math.max(most, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight -= 1;
      return evidence(true);
    });
    await Promise.all([seats.refresh(["m-a"]), seats.refresh(["m-b"]), seats.refresh(["m-c"])]);
    expect(most).toBe(1);
    expect(seats.isSeated("m-a")).toBe(true);
    expect(seats.isSeated("m-c")).toBe(true);
  });
});
