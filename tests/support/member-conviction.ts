import type { Conviction } from "../../src/playbooks/conviction-record.js";

/** A member's view as the store keeps it and the controls poll carries it (#5482 slice 6): one
 *  forward-test claim, steering the CRWV wheel down to one contract. It keeps every store rule. */
export function aMemberConviction(overrides: Partial<Conviction> = {}): Conviction {
  return {
    id: "crwv-floor-2026-10",
    title: "CRWV floor",
    owner: "Ada Lovelace",
    statedOn: "2026-10-19",
    checkOn: "2027-02-26",
    claims: [
      {
        tag: "underrated",
        statement: "1. CRWV's backlog outlasts the selloff.",
        bucket: "forward",
        evidence: "The 2026-10-16 premium-fit re-run.",
        falsifier: "CRWV closes under $45 on or before 2026-12-18.",
        scoreBy: "2026-12-18",
      },
    ],
    steers: ["CRWV-WHEEL"],
    narrowings: [{ pair: "CRWV-WHEEL", fromClaims: [], narrow: [{ kind: "contracts", max: 1 }] }],
    ...overrides,
  };
}
