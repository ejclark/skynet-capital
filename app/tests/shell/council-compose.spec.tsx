import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CouncilWeek } from "../../src/live/council";
import { CouncilCompose } from "../../src/shell/council-compose";

/**
 * The Council's composer, shared by Activity → Council and the Profile Overview (#3963). Behavioral
 * only — type, click, look. The submit call is the seam that proves ONE record: both callers post to
 * the same `/api/council` through this component and refresh through its `onSaved`.
 */

let posted: { text: string; playbookId?: string }[] = [];
let response: { ok: boolean; error?: string } = { ok: true };
let throws: Error | undefined;

rstest.mock("../../src/live/council", () => ({
  submitThesis: (text: string, playbookId?: string) => {
    posted.push({ text, ...(playbookId ? { playbookId } : {}) });
    if (throws) return Promise.reject(throws);
    return Promise.resolve(response);
  },
}));

const week = (over: Partial<CouncilWeek> = {}): CouncilWeek => ({
  enabled: true,
  week: "2026-W40",
  entries: [],
  plays: [],
  ...over,
});

const mine = { id: "opaque1", text: "NVDA runs into the print.", at: "2026-09-29T10:00:00.000Z" };

describe("CouncilCompose", () => {
  beforeEach(() => {
    posted = [];
    response = { ok: true };
    throws = undefined;
  });

  it("opens empty with a dead submit until there is something to say", () => {
    render(<CouncilCompose week={week()} onSaved={() => Promise.resolve()} />);
    expect(screen.getByLabelText("Your council line for the week")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Commit" })).toBeDisabled();
    expect(screen.getByText("280 left")).toBeInTheDocument();
  });

  it("prefills this week's own line and offers to update it, not to post again", () => {
    render(<CouncilCompose week={week({ mine })} onSaved={() => Promise.resolve()} />);
    expect(screen.getByLabelText("Your council line for the week")).toHaveValue(
      "NVDA runs into the print.",
    );
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
  });

  it("posts the line and refreshes the shared read once it saves", async () => {
    let refreshed = 0;
    render(
      <CouncilCompose
        week={week()}
        onSaved={() => {
          refreshed += 1;
          return Promise.resolve();
        }}
      />,
    );
    await userEvent.type(
      screen.getByLabelText("Your council line for the week"),
      "GOOG stays flat",
    );
    await userEvent.click(screen.getByRole("button", { name: "Commit" }));
    expect(posted).toEqual([{ text: "GOOG stays flat" }]);
    expect(refreshed).toBe(1);
  });

  it("tags the bot's play from the week's own options, never a hardcoded list", async () => {
    render(
      <CouncilCompose
        week={week({ mine, plays: [{ id: "S1-NVDA", symbol: "NVDA" }] })}
        onSaved={() => Promise.resolve()}
      />,
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "S1-NVDA");
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(posted).toEqual([{ text: "NVDA runs into the print.", playbookId: "S1-NVDA" }]);
  });

  it("shows the server's own refusal rather than claiming a save", async () => {
    response = { ok: false, error: "Sign in to speak at the Council." };
    let refreshed = 0;
    render(
      <CouncilCompose
        week={week({ mine })}
        onSaved={() => {
          refreshed += 1;
          return Promise.resolve();
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await screen.findByText("Sign in to speak at the Council.")).toBeInTheDocument();
    expect(refreshed).toBe(0);
  });

  it("surfaces a thrown transport error in the same place", async () => {
    throws = new Error("council 500");
    render(<CouncilCompose week={week({ mine })} onSaved={() => Promise.resolve()} />);
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await screen.findByText("council 500")).toBeInTheDocument();
  });
});
