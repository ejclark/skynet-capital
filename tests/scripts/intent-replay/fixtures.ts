// The fixture every part of the intent-replay spec reads: three clean cases, whose answers are marked so a
// prompt that leaked one would show it.
export const kase = (id: string, over = {}) => ({
  id,
  date: "2026-10-01",
  said: `the words of ${id}`,
  context: `the context of ${id}`,
  route: "act-now",
  ask: "must-not-ask",
  mustDo: [`THE-MUST-DO of ${id}`],
  mustNotDo: [`THE-MUST-NOT of ${id}`],
  evidence: `THE-EVIDENCE of ${id}`,
  confidence: "high",
  ...over,
});
export const SET = {
  header: { wordsThatAreNotNames: [] },
  cases: [kase("C1"), kase("C2", { route: "question" }), kase("C3")],
};
export const IDS = ["C1", "C2", "C3"];
