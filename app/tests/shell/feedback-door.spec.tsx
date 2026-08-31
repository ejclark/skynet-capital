import { act, fireEvent, render, screen } from "@testing-library/react";
import { FeedbackDoor } from "../../src/shell/feedback-door";

// The bug this locks down (#981): manual mode used to be a one-way trip — the "skip" button
// vanished with the coach and only a page reload brought AI-assisted back. Same BDD doctrine as
// the rest of the repo (docs/ENGINEERING.md): click what a member clicks, assert what they see.
describe("FeedbackDoor", () => {
  const open = (coachEnabled = true) =>
    render(<FeedbackDoor coachEnabled={coachEnabled} onFiled={() => undefined} />);

  const switchButton = () => screen.getByRole("button", { name: /(manual feedback|AI-assisted)/ });

  it("opens in AI-assisted mode, offering the switch to manual", () => {
    open();

    expect(screen.getByText("✨ Let's shape your feedback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to manual feedback →" })).toBeInTheDocument();
  });

  it("keeps the form mounted but out of the way while the coach has the floor", () => {
    open();

    expect(screen.getByLabelText("Title")).not.toBeVisible();
  });

  it("switching to manual reveals the same form and offers the way back", () => {
    open();

    fireEvent.click(switchButton());

    expect(screen.getByLabelText("Title")).toBeVisible();
    expect(screen.queryByText("✨ Let's shape your feedback")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "← Return to AI-assisted mode" }),
    ).toBeInTheDocument();
  });

  it("switching back returns to the coach and re-offers manual mode", () => {
    open();

    fireEvent.click(switchButton());
    fireEvent.click(switchButton());

    expect(screen.getByText("✨ Let's shape your feedback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to manual feedback →" })).toBeInTheDocument();
  });

  it("does not lose what the member typed on a round trip through the coach", () => {
    open();

    fireEvent.click(switchButton());
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Half a thought" } });
    fireEvent.click(switchButton());
    fireEvent.click(switchButton());

    expect(screen.getByLabelText("Title")).toHaveValue("Half a thought");
  });

  it("offers no switch when the coach is not configured — manual is the only mode", () => {
    open(false);

    expect(screen.getByLabelText("Title")).toBeVisible();
    expect(screen.queryByRole("button", { name: /AI-assisted|manual feedback/ })).toBeNull();
  });

  it("labels the third category objectively in both modes", () => {
    open();

    expect(
      screen.getByRole("option", { name: "🧪 Enhancement — extend current functionality" }),
    ).toBeInTheDocument();

    fireEvent.click(switchButton());

    expect(screen.getByText("🧪 Enhancement — extend current functionality")).toBeInTheDocument();
  });

  // #1020 — the AI-assisted path lacked a way to set a custom title or attach a screenshot before
  // the coach drafts. Both now live on the coach's opening screen and carry into the review form.
  describe("the coach's opening note (#1020)", () => {
    const jsonResponse = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    let realFetch: typeof globalThis.fetch;
    let lastRequestBody: unknown;

    beforeEach(() => {
      realFetch = globalThis.fetch;
      globalThis.fetch = ((_url: string, init?: RequestInit) => {
        lastRequestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        return Promise.resolve(
          jsonResponse({
            ok: true,
            done: true,
            title: "The coach's own title",
            details: "d",
            spec: {},
          }),
        );
      }) as typeof globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = realFetch;
    });

    it("shows a custom-title field distinct from the review form's own Title field", () => {
      open();

      expect(screen.getByLabelText("Custom title")).toBeInTheDocument();
      // Two "Title"-ish fields exist at once (coach + hidden review form) — they must not collide.
      expect(screen.getAllByLabelText(/title/i)).toHaveLength(2);
    });

    it("a member-typed title wins over the coach's own generated title in the review form", async () => {
      open();

      fireEvent.change(screen.getByLabelText("Custom title"), {
        target: { value: "My own title" },
      });
      fireEvent.change(screen.getByLabelText("What's on your mind?"), {
        target: { value: "the board looks wrong" },
      });
      await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Shape it with me" })),
      );

      expect(screen.getByLabelText("Title")).toHaveValue("My own title");
    });

    it("leaves the coach's own title in place when the member left the custom field blank", async () => {
      open();

      fireEvent.change(screen.getByLabelText("What's on your mind?"), {
        target: { value: "the board looks wrong" },
      });
      await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Shape it with me" })),
      );

      expect(screen.getByLabelText("Title")).toHaveValue("The coach's own title");
    });

    it("sends no images field on a turn with nothing attached", async () => {
      open();

      fireEvent.change(screen.getByLabelText("What's on your mind?"), {
        target: { value: "the board looks wrong" },
      });
      await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Shape it with me" })),
      );

      const sentMessages = (lastRequestBody as { messages: readonly { images?: unknown }[] })
        .messages;
      expect(sentMessages[0]?.images).toBeUndefined();
    });
  });

  // The coach talks to the server, so these two hold its reply open and decide when it lands.
  describe("when a coach turn is in flight", () => {
    const jsonResponse = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    let land: ((reply: Response) => void) | undefined;
    let realFetch: typeof globalThis.fetch;

    beforeEach(() => {
      realFetch = globalThis.fetch;
      globalThis.fetch = (() =>
        new Promise<Response>((resolve) => {
          land = resolve;
        })) as typeof globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = realFetch;
      land = undefined;
    });

    const startATurn = () => {
      open();
      fireEvent.change(screen.getByLabelText("What's on your mind?"), {
        target: { value: "the board looks wrong" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Shape it with me" }));
    };

    it("says why the coach bowed out and leaves the member in manual mode", async () => {
      startATurn();

      await act(async () => land?.(jsonResponse({ ok: false, error: "coach is offline" })));

      expect(screen.getByText(/coach is offline/)).toBeInTheDocument();
      expect(screen.getByLabelText("Title")).toBeVisible();
    });

    it("ignores a draft that lands after the member already switched to manual", async () => {
      startATurn();
      fireEvent.click(switchButton());
      fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Mine, by hand" } });

      await act(async () =>
        land?.(
          jsonResponse({ ok: true, done: true, title: "The coach's title", details: "", spec: {} }),
        ),
      );

      expect(screen.getByLabelText("Title")).toHaveValue("Mine, by hand");
    });
  });
});
