// @ts-expect-error — the shoot harness is plain ESM JS with no type declarations (scripts/, not src/)
import { stubBody } from "../../scripts/shoot/lib.mjs";

/**
 * The screenshot harness's stub matcher (#1327). This is the one piece of the consolidation that is
 * logic rather than plumbing: every app-shell shoot now depends on it picking the right fixture for
 * a request, and a silently-wrong pick would show up only as a frame that quietly photographs the
 * wrong state — the exact failure a picture is supposed to catch, inverted.
 */
describe("shoot harness — stub matching", () => {
  it("answers an exact pathname with its own body", () => {
    expect(stubBody({ "/api/learn": { rank: "Trader" } }, "/api/learn")).toEqual({
      rank: "Trader",
    });
  });

  it("answers a prefix key for any path beneath it", () => {
    expect(stubBody({ "/api/desk/*": { cash: 10 } }, "/api/desk/human-joe")).toEqual({ cash: 10 });
  });

  it("prefers an exact key over a prefix that also matches", () => {
    const stubs = { "/api/trade/*": { all: true }, "/api/trade/plays": { plays: [] } };
    expect(stubBody(stubs, "/api/trade/plays")).toEqual({ plays: [] });
  });

  it("prefers the longest matching prefix", () => {
    const stubs = { "/api/*": { broad: true }, "/api/desk/*": { narrow: true } };
    expect(stubBody(stubs, "/api/desk/human-joe")).toEqual({ narrow: true });
  });

  it("calls a function stub with the path, so a script can swap state mid-run", () => {
    let connected = false;
    const stubs = { "/api/onboarding": () => ({ done: connected ? 1 : 0 }) };
    expect(stubBody(stubs, "/api/onboarding")).toEqual({ done: 0 });
    connected = true;
    expect(stubBody(stubs, "/api/onboarding")).toEqual({ done: 1 });
  });

  it("answers an unmatched path with an empty object rather than failing the shoot", () => {
    expect(stubBody({ "/api/learn": { rank: "Trader" } }, "/api/nobody-stubbed-this")).toEqual({});
  });
});
