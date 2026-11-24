import { render, screen } from "@testing-library/react";
import type { RecentFiling } from "../../src/live/feedback";
import { RecentFeedback } from "../../src/shell/feedback-recent";

// "Try it" (#8005 slice 7; #7031's "the member who asked plays it"): a filing Moneypenny matched
// to a known problem stays open as evidence while the fix lands through the problem's plan. Once
// the server says that fix shipped, the member who asked is told on their own row and offered
// the screen to try it on.
describe("RecentFeedback — a matched filing whose fix shipped", () => {
  const filing = (over: Partial<RecentFiling>): RecentFiling => ({
    issueNumber: 9001,
    title: "Put every order in one list",
    kind: "idea",
    filedAt: "2026-11-23T00:00:00Z",
    url: "https://github.com/x/y/issues/9001",
    status: "open",
    ...over,
  });

  it("says it is fixed and links the screen to try it on, while the issue itself is still open", () => {
    render(
      <RecentFeedback
        recent={[
          filing({
            fixed: {
              problem: "One history, three homes",
              tryAt: { name: "Profile: Activity", route: "/app/accounts?section=ledger" },
            },
          }),
        ]}
        followupEnabled={false}
        appVersion="1.2.3"
      />,
    );
    expect(screen.getByText("Fixed — try it")).toBeInTheDocument();
    expect(screen.queryByText("Filed — waiting to be picked")).not.toBeInTheDocument();
    expect(screen.getByText(/Fixed as part of “One history, three homes”/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try it on Profile → Activity" })).toHaveAttribute(
      "href",
      "/app/accounts?section=ledger",
    );
    // the track reads all three steps done, in words as well as shape
    expect(
      screen.getByRole("img", { name: "Filed: done · Being built: done · Shipped: done" }),
    ).toBeInTheDocument();
    // its own issue is open, so the default Active view keeps it in front of the member
    expect(screen.queryByRole("button", { name: "Active" })).not.toBeInTheDocument();
  });

  it("says only that it is fixed when there is no screen to offer", () => {
    render(
      <RecentFeedback
        recent={[filing({ fixed: { problem: "plan #7000" } })]}
        followupEnabled={false}
      />,
    );
    expect(screen.getByText("Fixed")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Try it/ })).not.toBeInTheDocument();
  });

  it("leaves an unfixed matched filing on its own status words", () => {
    render(<RecentFeedback recent={[filing({})]} followupEnabled={false} />);
    expect(screen.getByText("Filed — waiting to be picked")).toBeInTheDocument();
    expect(screen.queryByText(/Fixed/)).not.toBeInTheDocument();
  });
});
