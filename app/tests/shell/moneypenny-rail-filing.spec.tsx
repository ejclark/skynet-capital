import { act, fireEvent, screen } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { flush, mount, onboarding } from "./moneypenny-rail-harness";

// The rail's filing side (handoff 2026-09-03 §6; P0 of docs/research/moneypenny-chat-ux.md):
// she drafts from the whole thread, the member sees the draft, and only their "send" files it.
describe("MoneypennyRail — the drafted filing", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  it("holds her draft; 'send' runs it through the coach's capsule shaping and files that, with the link", async () => {
    const sent: { url: string; body: unknown }[] = [];
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      sent.push({ url, body });
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat")
        return Promise.resolve(
          new Response(
            [
              'event: handoff\ndata: {"kind":"bug","title":"Onboarding step 2 never completes","details":"Filed 5 times; step 2 still not done."}\n\n',
              'event: delta\ndata: {"text":"drafted — reply send to file it."}\n\n',
              "event: done\ndata: {}\n\n",
            ].join(""),
            { status: 200, headers: { "content-type": "text/event-stream" } },
          ),
        );
      if (url === "/feedback/coach")
        return Promise.resolve(
          json({
            ok: true,
            done: true,
            title: "Mark onboarding step 2 done once feedback is filed",
            details: "- M·01 step 2 stays open after filing\n\n<details>the brief</details>",
            area: "onboarding",
            spec: { readiness: "spec-complete" },
          }),
        );
      if (url === "/api/feedback")
        return Promise.resolve(
          body
            ? json({ ok: true, url: "https://github.com/x/y/issues/1170", number: 1170 })
            : json({
                enabled: true,
                coachEnabled: true,
                followupEnabled: false,
                feedbackCount: 5,
                celebrating: [],
                recent: [],
              }),
        );
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    mount();
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "yes, report it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(
      await screen.findByText("Moneypenny · drafted — reply send to file it."),
    ).toBeInTheDocument();

    fireEvent.change(box, { target: { value: "send" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const link = await screen.findByRole("link", { name: "https://github.com/x/y/issues/1170" });
    expect(link).toHaveAttribute("href", "https://github.com/x/y/issues/1170");
    expect(link.closest(".mp-msg")).toHaveTextContent(
      /filed as issue #1170 — “Mark onboarding step 2 done once feedback is filed”/,
    );
    // the coach saw her draft, told to finish; the issue is the coach's capsule, not the transcript
    const coach = sent.find((c) => c.url === "/feedback/coach");
    expect(coach?.body).toMatchObject({ kind: "bug" });
    expect(JSON.stringify(coach?.body)).toContain("Filed 5 times; step 2 still not done.");
    expect(JSON.stringify(coach?.body)).toContain("Please finish the draft with what you have.");
    const filing = sent.find((c) => c.url === "/api/feedback" && c.body);
    expect(filing?.body).toMatchObject({
      kind: "bug",
      title: "Mark onboarding step 2 done once feedback is filed",
      area: "onboarding",
    });
    // no build spec rides a rail filing — `curated` is the interview's to earn (red-team A5)
    expect(filing?.body).not.toHaveProperty("spec");
  });

  it("files her draft as is when the coach isn't wired — never loses the filing to shaping", async () => {
    const sent: { url: string; body: unknown }[] = [];
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      sent.push({ url, body });
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat")
        return Promise.resolve(
          new Response(
            'event: handoff\ndata: {"kind":"idea","title":"Show my rank in the rail","details":"The header could carry it."}\n\nevent: delta\ndata: {"text":"drafted."}\n\nevent: done\ndata: {}\n\n',
            { status: 200, headers: { "content-type": "text/event-stream" } },
          ),
        );
      if (url === "/api/feedback")
        return Promise.resolve(
          body
            ? json({ ok: true, url: "u", number: 8 })
            : json({
                enabled: true,
                coachEnabled: false,
                followupEnabled: false,
                feedbackCount: 1,
                celebrating: [],
                recent: [],
              }),
        );
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    mount();
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "report it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Moneypenny · drafted.")).toBeInTheDocument();
    // the draft is shown before anything files
    expect(screen.getByText(/\[idea\] Show my rank in the rail/)).toHaveClass("mp-draft");
    fireEvent.click(screen.getByRole("button", { name: "Send it" }));
    expect(await screen.findByText(/filed as issue #8/)).toBeInTheDocument();
    expect(sent.filter((c) => c.url === "/feedback/coach")).toHaveLength(0);
    expect(sent.find((c) => c.url === "/api/feedback" && c.body)?.body).toMatchObject({
      kind: "idea",
      title: "Show my rank in the rail",
      details: "The header could carry it.",
    });
  });

  it("says plainly when the live chat didn't answer, instead of a scripted stand-in", async () => {
    globalThis.fetch = ((url: string) => {
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat")
        return Promise.resolve(json({ ok: false, error: "Lots of chatting just now" }, 429));
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    mount();
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "what time is it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(
      await screen.findByText(/couldn't answer that just now: Lots of chatting just now/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/i can help you get set up/)).not.toBeInTheDocument();
  });

  it("re-greets instead of re-introducing when the intro fires mid-thread", async () => {
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/onboarding" ? json(onboarding(true)) : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
    mount();
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "what time is it" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    await act(() => useMoneypenny.getState().openRail({ intro: true }));
    expect(await screen.findByText("Moneypenny · hi again.")).toBeInTheDocument();
    expect(screen.queryByText(/^Moneypenny · hi, I'm Moneypenny/)).not.toBeInTheDocument();
    expect(screen.getByText(/the last step is your first trade/)).toBeInTheDocument();
  });
});

// P0/P1 of docs/research/moneypenny-chat-ux.md — consent, identity, and the first minute.
