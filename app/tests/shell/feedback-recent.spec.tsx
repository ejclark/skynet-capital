import { fireEvent, render, screen } from "@testing-library/react";
import type { RecentFiling } from "../../src/live/feedback";
import { RecentFeedback } from "../../src/shell/feedback-recent";

// #429's still-open EARS box: "member views their feedback list, live state, completed filtered
// out by default with a toggle." Behavioral only — render, look, click, per docs/ENGINEERING.md.
describe("RecentFeedback — the completed filter", () => {
  const filing = (over: Partial<RecentFiling>): RecentFiling => ({
    issueNumber: 1,
    title: "Untitled",
    kind: "bug",
    filedAt: "2026-08-01T00:00:00Z",
    url: "https://github.com/x/y/issues/1",
    ...over,
  });

  it("renders nothing when there is no filing history", () => {
    const { container } = render(<RecentFeedback recent={[]} followupEnabled={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows open and in-flight items with no toggle when nothing has shipped yet", () => {
    render(
      <RecentFeedback
        recent={[
          filing({ issueNumber: 1, title: "Chart glitch", status: "open" }),
          filing({ issueNumber: 2, title: "Needs your info", status: "needs-info" }),
        ]}
        followupEnabled={false}
      />,
    );
    expect(screen.getByText(/Chart glitch/)).toBeInTheDocument();
    expect(screen.getByText(/Needs your info/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Active" })).not.toBeInTheDocument();
  });

  it("hides shipped items by default, behind an 'Active'/'All' toggle", () => {
    render(
      <RecentFeedback
        recent={[
          filing({ issueNumber: 1, title: "Still open", status: "open" }),
          filing({ issueNumber: 2, title: "Already shipped", status: "shipped" }),
        ]}
        followupEnabled={false}
      />,
    );
    expect(screen.getByText(/Still open/)).toBeInTheDocument();
    expect(screen.queryByText(/Already shipped/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");
  });

  it("reveals shipped items once the member picks 'All'", () => {
    render(
      <RecentFeedback
        recent={[
          filing({ issueNumber: 1, title: "Still open", status: "open" }),
          filing({ issueNumber: 2, title: "Already shipped", status: "shipped" }),
        ]}
        followupEnabled={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText(/Already shipped/)).toBeInTheDocument();
    expect(screen.getByText(/Still open/)).toBeInTheDocument();
  });

  it("keeps a sliced item (next-slice) visible by default — it isn't done yet", () => {
    render(
      <RecentFeedback
        recent={[
          filing({ issueNumber: 1, title: "First slice shipped", status: "next-slice" }),
          filing({ issueNumber: 2, title: "Fully shipped", status: "shipped" }),
        ]}
        followupEnabled={false}
      />,
    );
    expect(screen.getByText(/First slice shipped/)).toBeInTheDocument();
    expect(screen.queryByText(/Fully shipped/)).not.toBeInTheDocument();
  });

  it("says so, honestly, when everything on file has shipped", () => {
    render(
      <RecentFeedback
        recent={[filing({ issueNumber: 1, title: "Done deal", status: "shipped" })]}
        followupEnabled={false}
      />,
    );
    expect(screen.getByText(/Everything you've filed has shipped/)).toBeInTheDocument();
    expect(screen.queryByText(/Done deal/)).not.toBeInTheDocument();
  });
});

// #429's other still-open EARS box: "stamped with the release version, and celebrate it."
describe("RecentFeedback — the shipped celebration", () => {
  const filing = (over: Partial<RecentFiling>): RecentFiling => ({
    issueNumber: 1,
    title: "Untitled",
    kind: "bug",
    filedAt: "2026-08-01T00:00:00Z",
    url: "https://github.com/x/y/issues/1",
    ...over,
  });

  it("stamps a shipped filing with the running app version, once revealed", () => {
    render(
      <RecentFeedback
        recent={[filing({ issueNumber: 1, title: "Shipped thing", status: "shipped" })]}
        followupEnabled={false}
        appVersion="1.129.0"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText(/confirmed live in v1\.129\.0/)).toBeInTheDocument();
    expect(screen.getByText("🚀 shipped")).toBeInTheDocument();
  });

  it("omits the version line rather than showing a blank one when appVersion is empty", () => {
    render(
      <RecentFeedback
        recent={[filing({ issueNumber: 1, title: "Shipped thing", status: "shipped" })]}
        followupEnabled={false}
        appVersion=""
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("🚀 shipped")).toBeInTheDocument();
    expect(screen.queryByText(/confirmed live in/)).not.toBeInTheDocument();
  });

  it("never stamps a version on a filing that hasn't shipped", () => {
    render(
      <RecentFeedback
        recent={[filing({ issueNumber: 1, title: "Still cooking", status: "needs-info" })]}
        followupEnabled={false}
        appVersion="1.129.0"
      />,
    );
    expect(screen.queryByText(/confirmed live in/)).not.toBeInTheDocument();
  });
});
