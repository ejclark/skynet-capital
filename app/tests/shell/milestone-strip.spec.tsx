import { render, screen } from "@testing-library/react";
import type { PlayInfo } from "../../src/live/options";
import type { DeskOrderRow } from "../../src/live/orders";
import { ladderStatus, queuedRung } from "../../src/shell/milestone-strip";

/**
 * The trade page's ladder line (#6257): a queued first order reads "waiting for the open", and only
 * a share order can claim a share rung — an option row carries no ticket tag, so it claims none.
 */

const row = (over: Partial<DeskOrderRow>): DeskOrderRow => ({
  id: "o-1",
  symbol: "AAPL",
  side: "buy",
  orderType: "market",
  quantity: 10,
  filledQuantity: 0,
  state: "working",
  cancelable: true,
  ...over,
});

const play = (code: string, name: string, over: Partial<PlayInfo> = {}): PlayInfo =>
  ({ code, name, earned: false, locked: false, ...over }) as PlayInfo;

describe("queuedRung", () => {
  it("names 101 for a working stock buy and 102 for a working stock sell", () => {
    expect(queuedRung("101", [row({})])).toBe("101");
    expect(queuedRung("102", [row({ side: "sell" })])).toBe("102");
  });

  it("claims nothing for the wrong side, an option order, or an option rung", () => {
    expect(queuedRung("101", [row({ side: "sell" })])).toBeUndefined();
    expect(queuedRung("101", [row({ symbol: "AAPL261120C00200000" })])).toBeUndefined();
    expect(queuedRung("201", [row({})])).toBeUndefined();
    expect(queuedRung("101", [])).toBeUndefined();
  });
});

describe("ladderStatus", () => {
  const plays = [play("101", "Buy shares"), play("201", "Long call", { locked: true })];

  it("says the queued rung is waiting for the open", () => {
    render(<p>{ladderStatus({ plays, wheels: true, nextUp: "101", waiting: "101" })}</p>);
    expect(screen.getByText(/waiting for the open/)).toBeInTheDocument();
  });

  it("never says 'nothing is locked' to a member with no linked account", () => {
    const line = ladderStatus({ plays, wheels: false, linked: false });
    expect(String(line)).toMatch(/^Locked — link an account first/);
    expect(String(line)).not.toContain("nothing is locked");
  });
});
