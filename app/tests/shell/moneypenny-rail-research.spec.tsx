import { act, fireEvent, screen } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { flush, json, mount } from "./moneypenny-rail-harness";

// The Moneypenny operator plan, research slice: she drafts an open question as a card, and only the
// member's tap (or the same words typed) puts it on the house's research list.
describe("MoneypennyRail — a drafted research question", () => {
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

  const DRAFT = { kind: "name", subject: "PLTR", label: "PLTR", question: "Why is it moving?" };
  const TELL =
    "Kept. The house's research doesn't read this list yet, so there's no wait to promise.";

  /** Her first turn drafts the question; any later turn just answers. */
  const turn = (n: number) =>
    new Response(
      [
        ...(n === 1
          ? [
              `event: research-ask\ndata: ${JSON.stringify(DRAFT)}\n\n`,
              'event: delta\ndata: {"text":"here is the question — tap to ask."}\n\n',
            ]
          : ['event: delta\ndata: {"text":"it asks why PLTR is moving."}\n\n']),
        "event: done\ndata: {}\n\n",
      ].join(""),
      { status: 200, headers: { "content-type": "text/event-stream" } },
    );

  function stub(ask: () => Response = () => json({ ok: true, status: "queued", tell: TELL })) {
    const sent: { url: string; body: unknown }[] = [];
    let turns = 0;
    const routes: Record<string, () => Response> = {
      "/api/companion": () => json({ enabled: true, disclosure: "" }),
      "/api/companion/chat": () => turn(++turns),
      "/api/campaigns/ask": ask,
    };
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      sent.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return Promise.resolve(routes[url]?.() ?? new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    return sent;
  }

  const asks = (sent: { url: string; body: unknown }[]) =>
    sent.filter((c) => c.url === "/api/campaigns/ask");

  async function say(text: string): Promise<void> {
    fireEvent.change(screen.getByLabelText("Message Moneypenny"), { target: { value: text } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
  }

  async function cardShown(): Promise<void> {
    mount();
    await act(() => useMoneypenny.getState().openRail());
    await say("why is PLTR moving this week?");
    await screen.findByText("Moneypenny · here is the question — tap to ask.");
  }

  it("shows the card and its two exits, and asks nothing yet", async () => {
    const sent = stub();
    await cardShown();
    const card = document.querySelector(".mp-draft");
    expect(card).toHaveTextContent("Research question · PLTR");
    expect(card).toHaveTextContent("“Why is it moving?”");
    expect(card).toHaveTextContent("nothing is asked until you tap");
    for (const name of ["Ask the research desk", "Not now"])
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(asks(sent)).toEqual([]);
  });

  it("the tap posts the very question she showed, once, and says the server's sentence", async () => {
    const sent = stub();
    await cardShown();
    fireEvent.click(screen.getByRole("button", { name: "Ask the research desk" }));
    expect(useMoneypenny.getState().streaming).toBe(true);
    expect(await screen.findByText(`Moneypenny · ${TELL}`)).toBeInTheDocument();
    expect(asks(sent)).toEqual([
      {
        url: "/api/campaigns/ask",
        body: { kind: "name", subject: "PLTR", question: "Why is it moving?" },
      },
    ]);
    expect(useMoneypenny.getState().researchAsk).toBeUndefined();
    expect(useMoneypenny.getState().streaming).toBe(false);
  });

  it("'Not now' drops it and posts nothing", async () => {
    const sent = stub();
    await cardShown();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(
      await screen.findByText("Moneypenny · set aside — nothing was asked."),
    ).toBeInTheDocument();
    expect(asks(sent)).toEqual([]);
    expect(useMoneypenny.getState().researchAsk).toBeUndefined();
  });

  it("another message is a normal message: nothing is asked, the card stays parked", async () => {
    const sent = stub();
    await cardShown();
    await say("what would that question cover?");
    expect(await screen.findByText("Moneypenny · it asks why PLTR is moving.")).toBeInTheDocument();
    expect(asks(sent)).toEqual([]);
    expect(useMoneypenny.getState().researchAsk).toEqual(DRAFT);
  });

  it("a refused ask is said in the server's words and the card stays for another tap", async () => {
    const sent = stub(() =>
      json({ ok: false, error: "Questions aren't wired in this deployment." }),
    );
    await cardShown();
    fireEvent.click(screen.getByRole("button", { name: "Ask the research desk" }));
    expect(
      await screen.findByText(/Questions aren't wired in this deployment\. nothing was asked\./),
    ).toBeInTheDocument();
    expect(asks(sent)).toHaveLength(1);
    expect(useMoneypenny.getState().researchAsk).toEqual(DRAFT);
    expect(screen.getByRole("button", { name: "Ask the research desk" })).toBeInTheDocument();
  });
});
