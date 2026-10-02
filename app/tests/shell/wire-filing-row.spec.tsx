import { render, screen } from "@testing-library/react";
import type { FilingComments } from "../../src/live/filing-comments";
import type { WireFeedbackItem } from "../../src/live/wire";
import { FilingRow } from "../../src/shell/wire-filing-row";

/**
 * One filing row on the Activity feed (#784 slice 3) — the second kind of the page's one list.
 * Behavioral only: that the row says what it is at its left edge the way a trade row says BUY, that
 * it never asserts a status nobody observed, and that the comments fold is absent rather than broken
 * when the comments read is unwired.
 */

const filing = (over: Partial<WireFeedbackItem> = {}): WireFeedbackItem => ({
  issueNumber: 4271,
  icon: "🐞",
  kindLabel: "Bug",
  title: "The feed drops a filing",
  url: "https://github.com/ejclark/skynet-capital/issues/4271",
  meta: "#4271 · 10/1/2026",
  at: "2026-10-01T12:00:00.000Z",
  ...over,
});

const threads: FilingComments = {
  enabled: true,
  comments: {
    "4271": [{ id: "c1", text: "Seen it too.", at: "2026-10-01T13:00:00Z", mine: false }],
  },
  ownFilings: [],
};

const noop = () => Promise.resolve();

describe("FilingRow", () => {
  it("leads with the kind as a WORD, not an icon alone", () => {
    render(<FilingRow filing={filing()} onCommentSaved={noop} />);
    expect(screen.getByText(/Bug/)).toBeInTheDocument();
  });

  it("links the title out to the filing itself, in a new tab and without leaking the referrer", () => {
    render(<FilingRow filing={filing()} onCommentSaved={noop} />);
    const link = screen.getByRole("link", { name: "The feed drops a filing" });
    expect(link).toHaveAttribute("href", "https://github.com/ejclark/skynet-capital/issues/4271");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows where the filing landed when something has observed it", () => {
    render(
      <FilingRow
        filing={filing({ status: "Shipped", statusKey: "shipped" })}
        onCommentSaved={noop}
      />,
    );
    expect(screen.getByText("Shipped")).toBeInTheDocument();
  });

  it("asserts no status at all when nobody has observed one", () => {
    render(<FilingRow filing={filing()} onCommentSaved={noop} />);
    expect(screen.queryByText("In the queue")).not.toBeInTheDocument();
    expect(screen.queryByText("Shipped")).not.toBeInTheDocument();
  });

  it("renders the comments fold when threads are wired, collapsed", () => {
    render(<FilingRow filing={filing()} threads={threads} onCommentSaved={noop} />);
    const toggle = screen.getByRole("button", { name: /1 comment/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("still renders the row, minus the fold, when the comments read is unwired", () => {
    render(<FilingRow filing={filing()} onCommentSaved={noop} />);
    expect(screen.getByRole("link", { name: "The feed drops a filing" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
