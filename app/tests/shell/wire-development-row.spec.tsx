import { render, screen } from "@testing-library/react";
import type { WireDevelopmentItem } from "../../src/live/wire";
import { DevelopmentRow } from "../../src/shell/wire-development-row";

/**
 * One merged pull request on the Activity feed (#784 slice 4) — the third kind of the page's one list.
 * Behavioral only: that the row says what it is at its left edge the way a trade row says BUY, that it
 * never claims an author GitHub did not name, and that it asserts nothing else — no status, no fold,
 * because this app only observed the merge.
 */

const merge = (over: Partial<WireDevelopmentItem> = {}): WireDevelopmentItem => ({
  pullRequest: 4272,
  icon: "🚀",
  kindLabel: "Merged",
  title: "Development events for merged PRs",
  url: "https://github.com/ejclark/skynet-capital/pull/4272",
  author: "claude",
  meta: "#4272 · 10/2/2026",
  at: "2026-10-02T12:00:00.000Z",
  ...over,
});

describe("DevelopmentRow", () => {
  it("leads with the kind as a WORD, not an icon alone", () => {
    render(<DevelopmentRow merge={merge()} />);
    expect(screen.getByText(/Merged/)).toBeInTheDocument();
  });

  it("links the title out to the pull request, in a new tab and without leaking the referrer", () => {
    render(<DevelopmentRow merge={merge()} />);
    const link = screen.getByRole("link", { name: "Development events for merged PRs" });
    expect(link).toHaveAttribute("href", "https://github.com/ejclark/skynet-capital/pull/4272");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("names the author GitHub reported", () => {
    render(<DevelopmentRow merge={merge()} />);
    expect(screen.getByText("by claude")).toBeInTheDocument();
  });

  it("claims no author at all when GitHub named none", () => {
    render(<DevelopmentRow merge={merge({ author: undefined })} />);
    expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Development events/ })).toBeInTheDocument();
  });

  it("carries no status pill and no comments fold — this app only observed the merge", () => {
    render(<DevelopmentRow merge={merge()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Shipped")).not.toBeInTheDocument();
  });
});
