// A toy check in the shape of scripts/fitness.mjs: pure judges, then a CONTRACTS list that names
// them. The audit's own spec breaks this file on purpose, so keep it small and keep the boundary
// in judgeAge unpinned by toy.check.ts: that gap is the survivor the spec expects.
const FRESH_MS = 300;

/** A stamp is fresh when it is at most FRESH_MS old. */
export function judgeAge(ageMs) {
  return ageMs > FRESH_MS ? "fail" : "pass";
}

/** A fleet needs at least one machine. */
export function judgeCount(machines) {
  return machines.length > 0 ? "pass" : "fail";
}

export const CONTRACTS = [
  {
    id: "fresh-stamp",
    probe: (stamp) => judgeAge(stamp.ageMs),
  },
  {
    id: "has-machines",
    probe: (machines) => judgeCount(machines),
  },
];
