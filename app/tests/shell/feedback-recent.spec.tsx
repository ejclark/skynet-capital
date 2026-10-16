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
          filing({
            issueNumber: 2,
            title: "Needs your info",
            status: "needs-info",
          }),
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
          filing({
            issueNumber: 2,
            title: "Already shipped",
            status: "shipped",
          }),
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
          filing({
            issueNumber: 2,
            title: "Already shipped",
            status: "shipped",
          }),
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
          filing({
            issueNumber: 1,
            title: "First slice shipped",
            status: "next-slice",
          }),
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
    expect(screen.getByText("Shipped")).toBeInTheDocument();
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
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.queryByText(/confirmed live in/)).not.toBeInTheDocument();
  });

  it("never stamps a version on a filing that hasn't shipped", () => {
    render(
      <RecentFeedback
        recent={[
          filing({
            issueNumber: 1,
            title: "Still cooking",
            status: "needs-info",
          }),
        ]}
        followupEnabled={false}
        appVersion="1.129.0"
      />,
    );
    expect(screen.queryByText(/confirmed live in/)).not.toBeInTheDocument();
  });
});

// #5253 (option B of #5159's round 2): a small three-step track at the right end of each filed
// line, plain words below it. The words carry the meaning; the track names its steps for a reader.
describe("RecentFeedback — the status track and its words", () => {
  const filing = (over: Partial<RecentFiling>): RecentFiling => ({
    issueNumber: 1,
    title: "Untitled",
    kind: "bug",
    filedAt: "2026-08-01T00:00:00Z",
    url: "https://github.com/x/y/issues/1",
    ...over,
  });
  const show = (status: RecentFiling["status"]) =>
    render(<RecentFeedback recent={[filing({ status })]} followupEnabled={false} />);

  it.each([
    ["open", "In the build queue", "Filed: done · Being built: not yet · Shipped: not yet"],
    [
      "needs-info",
      "Waiting on your answer",
      "Filed: done · Being built: paused · Shipped: not yet",
    ],
    [
      "needs-eric",
      "Waiting on Eric's decision",
      "Filed: done · Being built: paused · Shipped: not yet",
    ],
    ["next-slice", "First part shipped", "Filed: done · Being built: done · Shipped: partly"],
  ] as const)("a %s filing reads %s, with its track", (status, words, track) => {
    show(status);
    expect(screen.getByText(words)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: track })).toBeInTheDocument();
  });

  it("draws every step filled once a filing has shipped", () => {
    show("shipped");
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(
      screen.getByRole("img", {
        name: "Filed: done · Being built: done · Shipped: done",
      }),
    ).toBeInTheDocument();
  });

  it("says a declined filing in words alone — no track implies it was built", () => {
    show("not-built");
    expect(screen.getByText("Closed, not built")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows neither track nor words while a filing's status is unknown", () => {
    show(undefined);
    expect(screen.getByText(/Untitled/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps the same three steps for every kind of filing", () => {
    render(
      <RecentFeedback
        recent={[
          filing({ issueNumber: 1, kind: "bug", status: "open" }),
          filing({ issueNumber: 2, kind: "idea", status: "open" }),
          filing({ issueNumber: 3, kind: "feature", status: "open" }),
        ]}
        followupEnabled={false}
      />,
    );
    const name = "Filed: done · Being built: not yet · Shipped: not yet";
    expect(screen.getAllByRole("img", { name })).toHaveLength(3);
  });
});
