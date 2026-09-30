import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FilingComment } from "../../src/live/filing-comments";
import { FilingComments } from "../../src/shell/filing-comments";

/**
 * A filing's comments on its Feedback-pulse card (issue #2224 shape 3). Behavioral: open the fold,
 * comment, delete your own. The filer's own card offers Follow up instead of a comment box.
 */

let posted: { issueNumber: number; text: string }[] = [];
let removed: { issueNumber: number; id: string }[] = [];

rstest.mock("../../src/live/filing-comments", () => ({
  submitFilingComment: (issueNumber: number, text: string) => {
    posted.push({ issueNumber, text });
    return Promise.resolve({ ok: true });
  },
  removeFilingComment: (issueNumber: number, id: string) => {
    removed.push({ issueNumber, id });
    return Promise.resolve({ ok: true });
  },
}));

const theirs: FilingComment = {
  id: "c1",
  text: "Want this too",
  at: "2026-09-30T10:00:00Z",
  mine: false,
};
const mine: FilingComment = { id: "c2", text: "Same here", at: "2026-09-30T11:00:00Z", mine: true };

describe("FilingComments", () => {
  beforeEach(() => {
    posted = [];
    removed = [];
  });

  it("stays folded, with the count in words", () => {
    render(
      <FilingComments
        issueNumber={42}
        comments={[theirs, mine]}
        isOwn={false}
        onSaved={() => Promise.resolve()}
      />,
    );
    expect(screen.getByRole("button", { name: /2 comments/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Want this too")).toBeNull();
  });

  it("posts a comment and says it stays in the app", async () => {
    let saved = 0;
    render(
      <FilingComments
        issueNumber={42}
        comments={[]}
        isOwn={false}
        onSaved={() => {
          saved += 1;
          return Promise.resolve();
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Comment/ }));
    expect(screen.getByText(/don't go to the GitHub issue/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Your comment on #42"), "Yes please");
    await userEvent.click(screen.getByRole("button", { name: "Comment" }));
    expect(posted).toEqual([{ issueNumber: 42, text: "Yes please" }]);
    expect(saved).toBe(1);
  });

  it("deletes only your own comment, on the second tap", async () => {
    render(
      <FilingComments
        issueNumber={42}
        comments={[theirs, mine]}
        isOwn={false}
        onSaved={() => Promise.resolve()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /2 comments/ }));
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(removed).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Tap again to delete" }));
    expect(removed).toEqual([{ issueNumber: 42, id: "c2" }]);
  });

  it("points the filer to Follow up instead of a comment box", async () => {
    render(
      <FilingComments
        issueNumber={42}
        comments={[theirs]}
        isOwn
        onSaved={() => Promise.resolve()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /1 comment/ }));
    expect(screen.queryByLabelText("Your comment on #42")).toBeNull();
    expect(screen.getByText(/This is your filing/)).toBeInTheDocument();
  });
});
