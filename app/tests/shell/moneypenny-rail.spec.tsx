import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { MoneypennyRail } from "../../src/shell/moneypenny-rail";

// The Moneypenny rail (handoff 2026-09-03 §6) — the feedback modal's replacement. The lane behind
// it is the real one, so fetch is stubbed per route: onboarding for the intro steer, the feedback
// index for what's wired, the coach for its question, and the submit that files.
type Handler = (body: unknown) => unknown;

function stubFetch(routes: Record<string, Handler>, calls: { url: string; body: unknown }[]) {
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body });
    const handler = routes[url];
    if (!handler) return Promise.resolve(new Response("{}", { status: 404 }));
    return Promise.resolve(
      new Response(JSON.stringify(handler(body)), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;
}

const onboarding = (connected: boolean) => ({
  linked: true,
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [
    { id: "connect", done: connected },
    { id: "first-feedback", done: false },
    { id: "first-trade", done: false },
  ],
  done: connected ? 1 : 0,
  total: 3,
  points: 0,
  totalPoints: 30,
  complete: false,
  ...(connected ? { account: { id: "human-joe", displayName: "Joe" } } : {}),
});

/** Let the store's chained awaits (fetch → typing beat → append) settle before a negative check. */
const flush = () => act(async () => new Promise((ok) => setTimeout(ok, 20)));

function mount() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MoneypennyRail />
    </QueryClientProvider>,
  );
}

describe("MoneypennyRail", () => {
  let realFetch: typeof globalThis.fetch;
  let calls: { url: string; body: unknown }[];
  beforeEach(() => {
    realFetch = globalThis.fetch;
    calls = [];
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("renders nothing until opened", () => {
    mount();
    expect(screen.queryByRole("complementary", { name: "Moneypenny" })).not.toBeInTheDocument();
  });

  it("plays the intro once, steering an unconnected member toward setup", async () => {
    stubFetch({ "/api/onboarding": () => onboarding(false) }, calls);
    mount();
    await act(() => useMoneypenny.getState().openRail({ intro: true }));
    await flush();
    expect(await screen.findByText(/^Moneypenny · hi, I'm Moneypenny/)).toBeInTheDocument();
    expect(await screen.findByText(/isn't connected yet/)).toBeInTheDocument();
    // the setup offer is a flow — no chips while she waits on the yes/no
    expect(screen.queryByRole("button", { name: "File feedback" })).not.toBeInTheDocument();

    await act(() => useMoneypenny.getState().closeRail());
    await act(() => useMoneypenny.getState().openRail({ intro: true }));
    await flush();
    expect(screen.getAllByText(/^Moneypenny · hi, I'm Moneypenny/)).toHaveLength(1);
  });

  it("a yes walks the five-step path; Enter sends, the composer clears", async () => {
    stubFetch({ "/api/onboarding": () => onboarding(false) }, calls);
    mount();
    await act(() => useMoneypenny.getState().openRail({ intro: true }));
    await flush();
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "yes" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await flush();
    expect(box).toHaveValue("");
    expect(screen.getByText("yes")).toHaveClass("mp-user");
    expect(await screen.findByText(/the short path: create a free account/)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Help me get set up" })).toBeInTheDocument();
  });

  it("files feedback through the coach: note → its one question → answer → issue → ops line", async () => {
    stubFetch(
      {
        "/api/onboarding": () => onboarding(true),
        "/api/feedback": (body) =>
          body
            ? { ok: true, url: "https://github.com/x/y/issues/1042", number: 1042 }
            : {
                enabled: true,
                coachEnabled: true,
                followupEnabled: false,
                feedbackCount: 0,
                celebrating: [],
                recent: [],
              },
        "/feedback/coach": (body) => {
          const messages = (body as { messages: { role: string }[] }).messages;
          return messages.length === 1
            ? { ok: true, done: false, question: "on the board, or on a player page?" }
            : { ok: true, done: true, title: "Fix the equity column", details: "d", spec: {} };
        },
      },
      calls,
    );
    mount();
    await act(() => useMoneypenny.getState().openRail());
    fireEvent.click(screen.getByRole("button", { name: "File feedback" }));
    await flush();
    expect(await screen.findByText(/what's confusing, broken, or missing/)).toBeInTheDocument();

    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, {
      target: { value: "the equity column on the board is wrong for bots" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    expect(
      await screen.findByText("Moneypenny · on the board, or on a player page?"),
    ).toBeInTheDocument();

    fireEvent.change(box, { target: { value: "on the board" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    expect(
      await screen.findByText(/filed as issue #1042 — “Fix the equity column”/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^sauron·ops · filed → triaged: trading milestone M·02/),
    ).toHaveClass("mp-sys");
    const submit = calls.find((c) => c.url === "/api/feedback" && c.body);
    expect(submit?.body).toMatchObject({ kind: "bug", title: "Fix the equity column" });
  });

  it("without the coach, asks the scripted question and files the member's own words", async () => {
    stubFetch(
      {
        "/api/onboarding": () => onboarding(true),
        "/api/feedback": (body) =>
          body
            ? { ok: true, url: "u", number: 7 }
            : {
                enabled: true,
                coachEnabled: false,
                followupEnabled: false,
                feedbackCount: 3,
                celebrating: [],
                recent: [],
              },
      },
      calls,
    );
    mount();
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "idea: show my rank in the rail header please" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    expect(await screen.findByText(/where in the app does this bite you/)).toBeInTheDocument();
    fireEvent.change(box, { target: { value: "the rail" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    expect(await screen.findByText(/filed as issue #7/)).toBeInTheDocument();
    expect(
      await screen.findByText(/^sauron·ops · triaged · on the build queue/),
    ).toBeInTheDocument();
    expect(calls.filter((c) => c.url === "/feedback/coach")).toHaveLength(0);
    const submit = calls.find((c) => c.url === "/api/feedback" && c.body);
    expect(submit?.body).toMatchObject({
      kind: "idea",
      title: "idea: show my rank in the rail header please",
    });
  });

  it("says so when feedback isn't switched on, and sends nothing", async () => {
    stubFetch(
      {
        "/api/feedback": () => ({
          enabled: false,
          coachEnabled: false,
          followupEnabled: false,
          feedbackCount: 0,
          celebrating: [],
          recent: [],
        }),
      },
      calls,
    );
    mount();
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "bug: the wire never loads for me today" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    fireEvent.change(box, { target: { value: "the wire" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
    expect(await screen.findByText(/feedback isn't switched on/)).toBeInTheDocument();
    expect(calls.filter((c) => c.url === "/api/feedback" && c.body)).toHaveLength(0);
  });
});

// Eric, 2026-09-03: "she can look up information on the fly and be a self service tool" — a
// general question goes to the companion chat (Claude, on the coach's key) and streams into the
// thread; the scripted line stands in only when the chat isn't switched on.
describe("MoneypennyRail — live answers", () => {
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

  const sse = (frames: readonly string[]) =>
    new Response(frames.join(""), {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    });
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  it("streams a general question through the companion, prefixed as her line", async () => {
    const sent: { url: string; body: unknown }[] = [];
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      sent.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat")
        return Promise.resolve(
          sse([
            'event: delta\ndata: {"text":"a covered call is "}\n\n',
            'event: delta\ndata: {"text":"a call you sell against shares you own."}\n\n',
            "event: done\ndata: {}\n\n",
          ]),
        );
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    mount();
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "what's a covered call?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(
      await screen.findByText(
        "Moneypenny · a covered call is a call you sell against shares you own.",
      ),
    ).toHaveClass("mp-mp");
    const turn = sent.find((c) => c.url === "/api/companion/chat");
    expect(turn?.body).toEqual({
      messages: [{ role: "user", content: "what's a covered call?" }],
    });
  });

  it("falls back to the scripted nudge when the chat isn't switched on", async () => {
    globalThis.fetch = ((url: string) =>
      Promise.resolve(
        url === "/api/companion"
          ? json({ enabled: false, disclosure: "" })
          : new Response("{}", { status: 404 }),
      )) as typeof globalThis.fetch;
    mount();
    await act(() => useMoneypenny.getState().openRail());
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "what's a covered call?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/i can help you get set up/)).toBeInTheDocument();
  });
});

// The hand-off (Eric's transcript, 2026-09-03): she drafts the filing from the whole thread and
// the member's reply sends it — no separate door, no amnesia. A dead stream says so honestly.
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
      spec: { readiness: "spec-complete" },
    });
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
    fireEvent.change(box, { target: { value: "also it should be mono" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/filed as issue #8/)).toBeInTheDocument();
    expect(sent.filter((c) => c.url === "/feedback/coach")).toHaveLength(0);
    expect(sent.find((c) => c.url === "/api/feedback" && c.body)?.body).toMatchObject({
      kind: "idea",
      title: "Show my rank in the rail",
      details: "The header could carry it.\n\nMember's follow-up: also it should be mono",
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
    expect(await screen.findByText(/couldn't reach the desk just now/)).toBeInTheDocument();
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
