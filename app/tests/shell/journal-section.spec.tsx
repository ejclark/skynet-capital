import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { FeedbackIndex } from "../../src/live/feedback";
import type { JournalAnswer, JournalIndex, JournalPost } from "../../src/live/journal";
import { JournalSection } from "../../src/shell/journal-section";

// #8190's acceptance criteria for the screen, behavioral only (docs/ENGINEERING.md): render the
// Journal section over stubbed reads, look, type, click, and read what was posted.

let feedback: FeedbackIndex;
// When set, the feedback read fails — a deploy's restart or a network drop (#8355).
let feedbackDown = false;
let journal: JournalIndex;
let answer: JournalAnswer;
let posted: JournalPost[] = [];

rstest.mock("../../src/live/feedback", () => ({
  fetchFeedbackIndex: () =>
    feedbackDown ? Promise.reject(new Error("503")) : Promise.resolve(feedback),
}));
rstest.mock("../../src/live/journal", () => ({
  fetchJournal: () => (journal ? Promise.resolve(journal) : Promise.reject(new Error("down"))),
  postJournal: (post: JournalPost) => {
    posted.push(post);
    return Promise.resolve(answer);
  },
}));
rstest.mock("../../src/live/moneypenny", () => ({ meetMoneypenny: () => Promise.resolve() }));

beforeEach(() => {
  posted = [];
  feedbackDown = false;
  feedback = {
    enabled: true,
    coachEnabled: false,
    followupEnabled: false,
    appVersion: "1.0.0",
    feedbackCount: 2,
    celebrating: [],
    recent: [
      {
        issueNumber: 41,
        title: "A calmer chart at night",
        kind: "idea",
        filedAt: "2026-11-20T00:00:00Z",
        url: "https://github.com/x/y/issues/41",
        status: "up-next",
        source: "journal",
      },
      {
        issueNumber: 40,
        title: "Chart glitch",
        kind: "bug",
        filedAt: "2026-11-19T00:00:00Z",
        url: "https://github.com/x/y/issues/40",
        status: "building",
      },
    ],
  };
  journal = {
    available: true,
    wishesEnabled: true,
    notes: [
      {
        kind: "trade",
        uuid: "n2",
        savedAt: "2026-11-22T10:00:00Z",
        symbol: "SPY",
        whyIn: "Bounce off the 200-day.",
      },
      {
        kind: "experience",
        uuid: "n1",
        savedAt: "2026-11-21T10:00:00Z",
        text: "<b>not bold</b> — the ticket felt fast",
      },
    ],
  };
  answer = { ok: true, kind: "wish", url: "https://github.com/x/y/issues/42", number: 42 };
});

let client: QueryClient;

function mount() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <JournalSection />
    </QueryClientProvider>,
  );
}

const sendWish = () => screen.getByRole("button", { name: "Send wish" });

describe("JournalSection — the screen (#8190)", () => {
  it("orders the composer, then wishes and filings with status words, then notes", async () => {
    mount();
    await screen.findByRole("heading", { name: "Your journal" });
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "Your journal",
      "Write a wish or a note",
      "Your wishes and filings",
      "Your notes",
    ]);
    // The wish row says so in words, with the status words members already know.
    const wishRow = screen.getByText(/A calmer chart at night/).closest("li");
    expect(wishRow).not.toBeNull();
    expect(within(wishRow as HTMLElement).getByText("Wish")).toBeInTheDocument();
    expect(within(wishRow as HTMLElement).getByText("Up next")).toBeInTheDocument();
    const bugRow = screen.getByText(/Chart glitch/).closest("li") as HTMLElement;
    expect(within(bugRow).queryByText("Wish")).toBeNull();
    expect(within(bugRow).getByText("Being built")).toBeInTheDocument();
  });

  it("shows the picked choice by a check mark and aria-pressed, not colour alone", async () => {
    mount();
    const wish = await screen.findByRole("button", { name: /I wish…/ });
    expect(wish).toHaveAttribute("aria-pressed", "true");
    expect(wish).toHaveTextContent("✓");
    fireEvent.click(screen.getByRole("button", { name: /Trade note/ }));
    expect(screen.getByRole("button", { name: /Trade note/ })).toHaveTextContent("✓");
    expect(screen.getByRole("button", { name: /I wish…/ })).not.toHaveTextContent("✓");
  });

  it("files a wish as the member's words alone — no kind, title or criteria asked", async () => {
    mount();
    const box = await screen.findByPlaceholderText("I wish it…");
    fireEvent.change(box, { target: { value: "I wish it showed my week in one line." } });
    fireEvent.click(sendWish());
    await screen.findByText(/Sent to the builders as issue #42/);
    expect(posted).toEqual([{ kind: "wish", text: "I wish it showed my week in one line." }]);
    expect(box).toHaveValue("");
  });

  it("keeps the words and says plainly a wish was not sent when the server refuses", async () => {
    answer = { ok: false, error: "Your wish wasn't sent: GitHub said no." };
    mount();
    const box = await screen.findByPlaceholderText("I wish it…");
    fireEvent.change(box, { target: { value: "I wish for dark mode." } });
    fireEvent.click(sendWish());
    await screen.findByText("Your wish wasn't sent: GitHub said no.");
    expect(box).toHaveValue("I wish for dark mode.");
    expect(screen.queryByText(/as issue #/)).toBeNull();
  });

  it("does not offer to send a wish where filing is off, and says why", async () => {
    journal = { ...journal, wishesEnabled: false };
    mount();
    const box = await screen.findByPlaceholderText("I wish it…");
    fireEvent.change(box, { target: { value: "I wish." } });
    expect(sendWish()).toBeDisabled();
    expect(screen.getByText(/a wish can't be sent from here/)).toBeInTheDocument();
  });

  it("saves a trade note with only the boxes that hold words, and says no order moves", async () => {
    answer = {
      ok: true,
      kind: "trade",
      note: { kind: "trade", uuid: "n3", savedAt: "2026-11-24T00:00:00Z", learned: "Size down." },
    };
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Trade note/ }));
    expect(screen.getByText(/Nothing here places or changes an order/)).toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Save note" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Symbol (optional)"), { target: { value: "qqq" } });
    // A symbol alone is a heading with no note under it.
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("What I learned"), { target: { value: "Size down." } });
    fireEvent.click(save);
    await screen.findByText(/Saved to your journal/);
    expect(posted).toEqual([{ kind: "trade", symbol: "QQQ", learned: "Size down." }]);
  });

  it("shows notes as plain text, newest first, with their kind in words", async () => {
    mount();
    await screen.findByRole("heading", { name: "Your notes" });
    const notes = screen.getAllByRole("listitem").filter((li) => li.classList.contains("jr-note"));
    expect(notes.map((n) => n.textContent)).toEqual([
      expect.stringMatching(/^Trade note · SPY · saved 2026-11-22.*Why I'm in.*200-day/),
      expect.stringMatching(/^What happened · saved 2026-11-21/),
    ]);
    // Member words are text, never markup.
    expect(screen.getByText("<b>not bold</b> — the ticket felt fast")).toBeInTheDocument();
  });

  it("keeps the filings when the notes read fails, saying the notes are unreachable", async () => {
    journal = undefined as unknown as JournalIndex;
    mount();
    await screen.findByRole("heading", { name: "Your journal" });
    await waitFor(() => expect(screen.getAllByText(/unreachable/).length).toBeGreaterThan(0));
    expect(screen.getByText(/Chart glitch/)).toBeInTheDocument();
  });
});

// #8355: a background refresh that fails after the journal has loaded (a tab return during a
// deploy's restart) must keep what is on screen — the composer, an unsent draft, a sent wish's
// issue number, the notes — and say the refresh failed beside it, never in place of it.
describe("JournalSection — a failed refresh after it loaded (#8355)", () => {
  const STALE = /Couldn't refresh your wishes and filings/;

  /** The member returns to the tab while the feedback read is down. */
  async function failARefresh() {
    feedbackDown = true;
    act(() => {
      window.dispatchEvent(new Event("visibilitychange"));
    });
    await screen.findByText(STALE);
  }

  it("keeps an unsent trade note and the notes, saying the refresh failed", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Trade note/ }));
    fireEvent.change(screen.getByLabelText("Symbol (optional)"), { target: { value: "qqq" } });
    fireEvent.change(screen.getByLabelText("What I learned"), { target: { value: "Size down." } });
    await failARefresh();
    expect(client.getQueryState(["feedback"])?.status).toBe("error");
    expect(screen.queryByText("Your journal is unreachable.")).toBeNull();
    expect(screen.getByRole("button", { name: /Trade note/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("What I learned")).toHaveValue("Size down.");
    expect(screen.getByText("Bounce off the 200-day.")).toBeInTheDocument();
    // The filings it already had stay, as the last good read.
    expect(screen.getByText(/Chart glitch/)).toBeInTheDocument();
  });

  it("drops the line once a refresh lands, with the draft still there", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Trade note/ }));
    fireEvent.change(screen.getByLabelText("What I learned"), { target: { value: "Size down." } });
    await failARefresh();
    feedbackDown = false;
    await act(async () => {
      await client.refetchQueries({ queryKey: ["feedback"] });
    });
    await waitFor(() => expect(screen.queryByText(STALE)).toBeNull());
    expect(screen.getByLabelText("What I learned")).toHaveValue("Size down.");
  });

  it("keeps a sent wish's issue number when the refresh its send starts fails", async () => {
    mount();
    const box = await screen.findByPlaceholderText("I wish it…");
    fireEvent.change(box, { target: { value: "I wish it showed my week in one line." } });
    feedbackDown = true;
    fireEvent.click(sendWish());
    await screen.findByText(STALE);
    expect(screen.getByText(/Sent to the builders as issue #42/)).toBeInTheDocument();
    expect(screen.queryByText("Your journal is unreachable.")).toBeNull();
  });

  it("when the first read never lands, says the filings are unreachable and still saves a note", async () => {
    feedbackDown = true;
    answer = {
      ok: true,
      kind: "experience",
      note: {
        kind: "experience",
        uuid: "n3",
        savedAt: "2026-11-24T00:00:00Z",
        text: "Filled fast.",
      },
    };
    mount();
    await screen.findByText(/wishes and filings are unreachable/);
    expect(screen.queryByText(STALE)).toBeNull();
    // A read failing never takes away the place to write, or the notes it could still read.
    expect(screen.getByRole("heading", { name: "Write a wish or a note" })).toBeInTheDocument();
    expect(screen.getByText("Bounce off the 200-day.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /What happened/ }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Filled fast." } });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    await screen.findByText(/Saved to your journal/);
    expect(posted).toEqual([{ kind: "experience", text: "Filled fast." }]);
  });
});
