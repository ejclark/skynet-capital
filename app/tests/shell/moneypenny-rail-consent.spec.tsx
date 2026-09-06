import { act, fireEvent, screen } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { flush, mount, onboarding } from "./moneypenny-rail-harness";

describe("MoneypennyRail — consent and identity", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.getState().closeRail();
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
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "report it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/\[bug\] Step 2 never completes/)).toBeInTheDocument();
    // an unrelated question keeps the draft parked and is answered live
    fireEvent.change(box, { target: { value: "what's a covered call?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Moneypenny · a call you sell.")).toBeInTheDocument();
    expect(useMoneypenny.getState().draft?.title).toBe("Step 2 never completes");
    expect(sent.filter((c) => c.url === "/api/feedback" && c.body)).toHaveLength(0);
    // never mind drops it
    fireEvent.click(screen.getByRole("button", { name: "Never mind" }));
    expect(
      await screen.findByText("Moneypenny · dropped — nothing was filed."),
    ).toBeInTheDocument();
    expect(useMoneypenny.getState().draft).toBeUndefined();
    expect(sent.filter((c) => c.url === "/api/feedback" && c.body)).toHaveLength(0);
    // the disclosure the companion is told the UI carries is rendered
    expect(screen.getByText("paper only")).toHaveClass("mp-disclosure");
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
    await act(() => useMoneypenny.getState().openRail({ intro: true }));
    expect(await screen.findByText(/^Moneypenny · hi, I'm Moneypenny/)).toBeInTheDocument();
    expect(localStorage.getItem("sc.moneypenny.v1.member-a")).toContain("hi, I'm Moneypenny");

    viewer = "member-b";
    await act(() => useMoneypenny.getState().closeRail());
    await act(() => useMoneypenny.getState().openRail());
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
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "report it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText(/\[bug\] Step 2 never completes/);
    const stored = JSON.parse(localStorage.getItem("sc.moneypenny.v1.anon") ?? "{}") as Record<
      string,
      unknown
    >;
    expect(stored).not.toHaveProperty("draft");
    expect(useMoneypenny.getState().draft?.title).toBe("Step 2 never completes");
  });

  it("the ✦ toggle opens on her intro, and + starts a fresh conversation", async () => {
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/onboarding" ? json(onboarding(true)) : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
    mount();
    await act(() => useMoneypenny.getState().toggleRail());
    expect(await screen.findByText(/^Moneypenny · hi, I'm Moneypenny/)).toBeInTheDocument();
    expect(screen.getByText(/should be open right now|closed right now/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Message Moneypenny"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    await act(() => useMoneypenny.getState().newConversation());
    const intros = await screen.findAllByText(/^Moneypenny · hi, I'm Moneypenny/);
    expect(intros).toHaveLength(1);
    expect(screen.queryByText("hello")).not.toBeInTheDocument();
  });

  it("a real question typed after the setup offer is a question, not a 'no'", async () => {
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/onboarding" ? json(onboarding(false)) : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
    mount();
    await act(() => useMoneypenny.getState().openRail({ intro: true }));
    await screen.findByText(/isn't connected yet/);
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "What time is it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    expect(screen.queryByText(/no problem — the step-by-step cards/)).not.toBeInTheDocument();
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
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "what's a covered call?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Moneypenny · a covered call is — cut off")).toBeInTheDocument();
  });
});
