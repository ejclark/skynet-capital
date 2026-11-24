// Shared fixtures for the assignments specs, so every spec file reads the same world: one clock, a
// needs-eric callout and an issue builder.
// #4289 (#3818 slice 5): `needs-eric` means one thing — a decision only Eric can make. The dry run
// lists every such issue with the decision it waits on and says what it WOULD assign; it writes
// nothing (live assignment is a separate step after Eric reads a dry run).
export const NOW = Date.parse("2026-09-30T12:00:00Z");
export const CALLOUT =
  "**Ask.**\n\n> [!IMPORTANT]\n> **Needs from you**\n> 1. Pick A or B? — why\n> 2. second";
export const CALLOUT_WITH_OPTIONS = [
  "> [!IMPORTANT]",
  "> **Needs from you**",
  "> 1. Re-arm the breaker? — a bot safety rule",
  ">    - A (predicted, medium): yes",
  ">    - B: no",
].join("\n");
export const issue = (over: Record<string, unknown> = {}) => ({
  number: 1,
  title: "t",
  body: CALLOUT,
  state: "open",
  created_at: "2026-09-28T12:00:00Z",
  labels: [{ name: "needs-eric" }],
  assignees: [],
  user: { login: "skynet-envoy[bot]" },
  ...over,
});
