import { act, fireEvent, screen } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { flush, inHistory, mount, onboarding, showHistory } from "./moneypenny-dock-harness";

describe("MoneypennyDock — consent and identity", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.getState().closeHistory();
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  const handoffStream = () =>
    new Response(
      'event: handoff\ndata: {"kind":"bug","title":"Step 2 never completes","details":"Filed 5 times."}\n\nevent: delta\ndata: {"text":"drafted — reply send to file it."}\n\nevent: done\ndata: {}\n\n',
      { status: 200, headers: { "content-type": "text/event-stream" } },
    );

  it("'never mind' drops a parked draft and files nothing; any other reply leaves it parked", async () => {
    const sent: { url: string; body: unknown }[] = [];
    let turns = 0;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      sent.push({ url, body });
      if (url === "/api/companion")
        return Promise.resolve(json({ enabled: true, disclosure: "paper only" }));
      if (url === "/api/companion/chat")
        return Promise.resolve(
          turns++ === 0
            ? handoffStream()
            : new Response(
                'event: delta\ndata: {"text":"a call you sell."}\n\nevent: done\ndata: {}\n\n',
                {
                  status: 200,
                  headers: { "content-type": "text/event-stream" },
                },
              ),
        );
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    mount();
    await showHistory();
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "report it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await inHistory().findByText(/\[bug\] Step 2 never completes/)).toBeInTheDocument();
    // an unrelated question keeps the draft parked and is answered live
    fireEvent.change(box, { target: { value: "what's a covered call?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await inHistory().findByText("Moneypenny · a call you sell.")).toBeInTheDocument();
    expect(useMoneypenny.getState().draft?.title).toBe("Step 2 never completes");
    expect(sent.filter((c) => c.url === "/api/feedback" && c.body)).toHaveLength(0);
    // never mind drops it
    fireEvent.click(screen.getByRole("button", { name: "Never mind" }));
    expect(
      await inHistory().findByText("Moneypenny · dropped — nothing was filed."),
    ).toBeInTheDocument();
    expect(useMoneypenny.getState().draft).toBeUndefined();
    expect(sent.filter((c) => c.url === "/api/feedback" && c.body)).toHaveLength(0);
    // the disclosure the companion is told the UI carries is rendered
    expect(inHistory().getByText("paper only")).toHaveClass("mp-disclosure");
  });

  it("keys the thread by the member — a second member on the same device sees nothing of the first", async () => {
    let viewer = "member-a";
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/onboarding"
          ? json({ ...onboarding(false), viewerId: viewer })
          : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
    mount();
    await showHistory({ intro: true });
    expect(await inHistory().findByText(/^Moneypenny · hi, I'm Moneypenny/)).toBeInTheDocument();
    expect(localStorage.getItem("sc.moneypenny.v1.member-a")).toContain("hi, I'm Moneypenny");

    viewer = "member-b";
    await act(() => useMoneypenny.getState().closeHistory());
    await showHistory();
    expect(useMoneypenny.getState().messages).toHaveLength(0);
    expect(localStorage.getItem("sc.moneypenny.v1.member-a")).toBeNull();
  });

  it("a parked draft is never persisted", async () => {
    globalThis.fetch = ((url: string) => {
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat") return Promise.resolve(handoffStream());
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    mount();
    await showHistory();
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "report it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await inHistory().findByText(/\[bug\] Step 2 never completes/);
    const stored = JSON.parse(localStorage.getItem("sc.moneypenny.v1.anon") ?? "{}") as Record<
      string,
      unknown
    >;
    expect(stored).not.toHaveProperty("draft");
    expect(useMoneypenny.getState().draft?.title).toBe("Step 2 never completes");
  });

  it("the dock's History button opens on her intro, and New conversation starts a fresh one", async () => {
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/onboarding" ? json(onboarding(true)) : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
    mount();
    fireEvent.click(screen.getByRole("button", { name: /^History \d+/ }));
    expect(await inHistory().findByText(/^Moneypenny · hi, I'm Moneypenny/)).toBeInTheDocument();
    expect(inHistory().getByText(/should be open right now|closed right now/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Message Moneypenny"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    await act(() => useMoneypenny.getState().newConversation());
    const intros = await inHistory().findAllByText(/^Moneypenny · hi, I'm Moneypenny/);
    expect(intros).toHaveLength(1);
    expect(inHistory().queryByText("hello")).not.toBeInTheDocument();
  });

  it("a real question typed after the setup offer is a question, not a 'no'", async () => {
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/onboarding" ? json(onboarding(false)) : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
    mount();
    await showHistory({ intro: true });
    await inHistory().findByText(/isn't connected yet/);
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "What time is it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    expect(inHistory().queryByText(/no problem — the step-by-step cards/)).not.toBeInTheDocument();
    expect(useMoneypenny.getState().flow).toBe("idle");
  });

  it("marks a stream that ends without done as cut off, and keeps what arrived", async () => {
    globalThis.fetch = ((url: string) => {
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat")
        return Promise.resolve(
          new Response('event: delta\ndata: {"text":"a covered call is"}\n\n', {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          }),
        );
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    mount();
    await showHistory();
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "what's a covered call?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(
      await inHistory().findByText("Moneypenny · a covered call is — cut off"),
    ).toBeInTheDocument();
  });

  const chatStreaming = (frames: string) => {
    globalThis.fetch = ((url: string) => {
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat")
        return Promise.resolve(
          new Response(frames, { status: 200, headers: { "content-type": "text/event-stream" } }),
        );
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
  };
  const ask = async (question: string) => {
    mount();
    await showHistory();
    fireEvent.change(screen.getByLabelText("Message Moneypenny"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
  };

  it("drops a partial line that ends in a refusal and shows the decline alone (#6214)", async () => {
    chatStreaming(
      'event: delta\ndata: {"text":"Sure, the first step is"}\n\nevent: error\ndata: {"error":"that one\'s outside what I can help with","refused":true}\n\n',
    );
    await ask("what's a strangle?");
    expect(
      await inHistory().findByText(
        "Moneypenny · i couldn't answer that just now: that one's outside what I can help with",
      ),
    ).toBeInTheDocument();
    expect(inHistory().queryByText(/Sure, the first step is/)).not.toBeInTheDocument();
    expect(useMoneypenny.getState().messages.some((m) => m.text.includes("Sure, the first"))).toBe(
      false,
    );
  });

  it("keeps a partial line marked cut off when the error frame is not a refusal", async () => {
    chatStreaming(
      'event: delta\ndata: {"text":"The three plays are"}\n\nevent: error\ndata: {"error":"my reply ran past its length limit"}\n\n',
    );
    await ask("list the plays");
    expect(
      await inHistory().findByText("Moneypenny · The three plays are — cut off"),
    ).toBeInTheDocument();
  });
});
