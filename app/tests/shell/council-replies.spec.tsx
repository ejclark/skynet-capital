import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CouncilEntry } from "../../src/live/council";
import type { CouncilReply } from "../../src/live/council-replies";
import { CouncilLines } from "../../src/shell/council-lines";
import { CouncilReplies } from "../../src/shell/council-replies";

/**
 * Replies under each weekly Council line (#5097, #2224 option A). Behavioral: the fold is closed
 * with its count in words, a member answers a line, deletes only their own reply on the second tap,
 * and a reply to an edited line says so in words. The list attaches each line's thread by line id.
 */

let posted: { lineId: string; lineAt: string; text: string }[] = [];
let removed: { lineId: string; id: string }[] = [];
let answer: { ok: boolean; error?: string } = { ok: true };

rstest.mock("../../src/live/council-replies", () => ({
  submitCouncilReply: (lineId: string, lineAt: string, text: string) => {
    posted.push({ lineId, lineAt, text });
    return Promise.resolve(answer);
  },
  removeCouncilReply: (lineId: string, id: string) => {
    removed.push({ lineId, id });
    return Promise.resolve({ ok: true });
  },
}));

const LINE_AT = "2026-10-05T09:00:00.000Z";
const theirs: CouncilReply = {
  id: "r1",
  text: "The ruling isn't until November",
  at: "2026-10-06T10:00:00.000Z",
  mine: false,
  byLineAuthor: false,
  earlierLine: false,
};
const mine: CouncilReply = {
  id: "r2",
  text: "Disagree: the chop IS the trade",
  at: "2026-10-07T10:00:00.000Z",
  mine: true,
  byLineAuthor: false,
  earlierLine: false,
};
const writers: CouncilReply = {
  id: "r3",
  text: "Fair — sizing down",
  at: "2026-10-07T11:00:00.000Z",
  mine: false,
  byLineAuthor: true,
  earlierLine: true,
};

const noop = () => Promise.resolve();

describe("CouncilReplies", () => {
  beforeEach(() => {
    posted = [];
    removed = [];
    answer = { ok: true };
  });

  it("stays folded, with the count in words", () => {
    render(
      <CouncilReplies lineId="amy" lineAt={LINE_AT} replies={[theirs, mine]} onSaved={noop} />,
    );
    expect(screen.getByRole("button", { name: /2 replies/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText(theirs.text)).toBeNull();
  });

  it("answers a line with the version the member read, and says replies stay in the app", async () => {
    let saved = 0;
    render(
      <CouncilReplies
        lineId="amy"
        lineAt={LINE_AT}
        replies={[]}
        onSaved={() => {
          saved += 1;
          return Promise.resolve();
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));
    expect(screen.getByText(/Only the writer can delete one/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Your reply to this line"), "Disagree");
    await userEvent.click(screen.getByRole("button", { name: "Reply" }));
    expect(posted).toEqual([{ lineId: "amy", lineAt: LINE_AT, text: "Disagree" }]);
    expect(saved).toBe(1);
    expect(screen.getByLabelText("Your reply to this line")).toHaveValue("");
  });

  it("keeps the words and shows the server's reason when a reply is refused", async () => {
    answer = { ok: false, error: "That line was just edited — read it again, then reply." };
    render(<CouncilReplies lineId="amy" lineAt={LINE_AT} replies={[]} onSaved={noop} />);
    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));
    await userEvent.type(screen.getByLabelText("Your reply to this line"), "Disagree");
    await userEvent.click(screen.getByRole("button", { name: "Reply" }));
    expect(screen.getByText(/just edited/)).toBeInTheDocument();
    expect(screen.getByLabelText("Your reply to this line")).toHaveValue("Disagree");
  });

  it("deletes only your own reply, on the second tap", async () => {
    render(
      <CouncilReplies lineId="amy" lineAt={LINE_AT} replies={[theirs, mine]} onSaved={noop} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /2 replies/ }));
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(removed).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Tap again to delete" }));
    expect(removed).toEqual([{ lineId: "amy", id: "r2" }]);
  });

  it("names the line's writer and a reply to an earlier version, in words", async () => {
    render(<CouncilReplies lineId="amy" lineAt={LINE_AT} replies={[writers]} onSaved={noop} />);
    await userEvent.click(screen.getByRole("button", { name: /1 reply/ }));
    expect(screen.getByText("line's writer")).toBeInTheDocument();
    expect(screen.getByText(/answered an earlier version of this line/i)).toBeInTheDocument();
  });
});

describe("CouncilLines", () => {
  const entries: CouncilEntry[] = [
    { id: "amy", text: "GOOG chops all week", at: LINE_AT, playbookId: "G1-GOOG" },
    { id: "ben", text: "Rates stay put", at: "2026-10-05T08:00:00.000Z" },
  ];

  it("puts each line's own thread under it, with its play tag", () => {
    render(
      <CouncilLines
        week="2026-W41"
        entries={entries}
        threads={{ enabled: true, week: "2026-W41", replies: { amy: [theirs, mine] } }}
        onReplySaved={noop}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("GOOG chops all week");
    expect(items[0]).toHaveTextContent("G1-GOOG");
    expect(screen.getByRole("button", { name: /2 replies/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Reply/ })).toHaveLength(1);
  });

  it("drops the folds when the replies read is missing or for another week", () => {
    const { rerender } = render(
      <CouncilLines week="2026-W41" entries={entries} onReplySaved={noop} />,
    );
    expect(screen.queryByRole("button", { name: /repl/i })).toBeNull();
    rerender(
      <CouncilLines
        week="2026-W42"
        entries={entries}
        threads={{ enabled: true, week: "2026-W41", replies: { amy: [theirs] } }}
        onReplySaved={noop}
      />,
    );
    expect(screen.queryByRole("button", { name: /repl/i })).toBeNull();
    expect(screen.getByText("Rates stay put")).toBeInTheDocument();
  });
});
