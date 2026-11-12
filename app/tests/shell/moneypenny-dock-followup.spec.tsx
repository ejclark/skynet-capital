import { fireEvent, screen } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { flush, inHistory, json, mount, showHistory } from "./moneypenny-dock-harness";

/**
 * A follow-up card on the member's OWN filing (#7286, named next slice 8). EARS:
 *  - WHEN she drafts a follow-up, the rail SHALL show it as a card with two exits and post nothing.
 *  - WHEN the member taps "Post the follow-up", the rail SHALL post the very issue number and text
 *    she showed to `/api/feedback/followup`, once, and say what the server says it did.
 *  - WHEN the member taps "Not now", the rail SHALL drop the card and post nothing.
 *  - IF the server refuses (not their filing, a plan, can't check), the rail SHALL say the
 *    server's own words and keep the card for another tap.
 *  - Any other message SHALL be a normal message, and the card SHALL stay parked.
 */
describe("MoneypennyDock — a drafted follow-up on the member's own filing", () => {
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

  const DRAFT = {
    issueNumber: 6007,
    title: "Chart freezes on the phone",
    details: "It also freezes on the iPad.",
  };

  /** Her first turn drafts the follow-up; any later turn just answers. */
  const turn = (n: number) =>
    new Response(
      [
        ...(n === 1
          ? [
              `event: followup\ndata: ${JSON.stringify(DRAFT)}\n\n`,
              'event: delta\ndata: {"text":"here it is — tap to add it."}\n\n',
            ]
          : ['event: delta\ndata: {"text":"it adds the iPad to #6007."}\n\n']),
        "event: done\ndata: {}\n\n",
      ].join(""),
      { status: 200, headers: { "content-type": "text/event-stream" } },
    );

  function stub(post: () => Response = () => json({ ok: true, outcome: "backlog" })) {
    const sent: { url: string; body: unknown }[] = [];
    let turns = 0;
    const routes: Record<string, () => Response> = {
      "/api/companion": () => json({ enabled: true, disclosure: "" }),
      "/api/companion/chat": () => turn(++turns),
      "/api/feedback/followup": post,
    };
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      sent.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return Promise.resolve(routes[url]?.() ?? new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    return sent;
  }

  const posts = (sent: { url: string; body: unknown }[]) =>
    sent.filter((c) => c.url === "/api/feedback/followup");

  async function say(text: string): Promise<void> {
    fireEvent.change(screen.getByLabelText("Message Moneypenny"), { target: { value: text } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
  }

  async function cardShown(): Promise<void> {
    mount();
    await showHistory();
    await say("add to my chart bug that it freezes on the iPad too");
    await inHistory().findByText("Moneypenny · here it is — tap to add it.");
  }

  it("shows the card and its two exits, and posts nothing yet", async () => {
    const sent = stub();
    await cardShown();
    const card = document.querySelector(".mp-draft");
    expect(card).toHaveTextContent("Follow-up on #6007 · “Chart freezes on the phone”");
    expect(card).toHaveTextContent("“It also freezes on the iPad.”");
    expect(card).toHaveTextContent("nothing is posted until you tap");
    for (const name of ["Post the follow-up", "Not now"])
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(posts(sent)).toEqual([]);
  });

  it("the tap posts the very follow-up she showed, once, and says what it did", async () => {
    const sent = stub();
    await cardShown();
    fireEvent.click(screen.getByRole("button", { name: "Post the follow-up" }));
    expect(useMoneypenny.getState().streaming).toBe(true);
    expect(
      await inHistory().findByText(
        "Moneypenny · Sent — it's on your issue; it builds once it's picked from the queue.",
      ),
    ).toBeInTheDocument();
    expect(posts(sent)).toEqual([
      {
        url: "/api/feedback/followup",
        body: { issueNumber: 6007, details: "It also freezes on the iPad." },
      },
    ]);
    expect(useMoneypenny.getState().followup).toBeUndefined();
    expect(useMoneypenny.getState().streaming).toBe(false);
  });

  it("'Not now' drops it and posts nothing", async () => {
    const sent = stub();
    await cardShown();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(
      await inHistory().findByText("Moneypenny · set aside — nothing was posted."),
    ).toBeInTheDocument();
    expect(posts(sent)).toEqual([]);
    expect(useMoneypenny.getState().followup).toBeUndefined();
  });

  it("another message is a normal message: nothing is posted, the card stays parked", async () => {
    const sent = stub();
    await cardShown();
    await say("what will that add?");
    expect(
      await inHistory().findByText("Moneypenny · it adds the iPad to #6007."),
    ).toBeInTheDocument();
    expect(posts(sent)).toEqual([]);
    expect(useMoneypenny.getState().followup).toEqual(DRAFT);
  });

  it("a refusal is said in the server's words and the card stays for another tap", async () => {
    const sent = stub(() =>
      json({
        ok: false,
        error:
          "That filing has become a plan, and follow-ups aren't taken on plans here, so nothing was posted.",
      }),
    );
    await cardShown();
    fireEvent.click(screen.getByRole("button", { name: "Post the follow-up" }));
    expect(
      await inHistory().findByText(
        "Moneypenny · That filing has become a plan, and follow-ups aren't taken on plans here, so nothing was posted.",
      ),
    ).toBeInTheDocument();
    expect(posts(sent)).toHaveLength(1);
    expect(useMoneypenny.getState().followup).toEqual(DRAFT);
    expect(screen.getByRole("button", { name: "Post the follow-up" })).toBeInTheDocument();
  });

  it("a refusal without those words still says nothing was posted", async () => {
    stub(() => json({ ok: false, error: "That doesn't look like one of your own filings." }));
    await cardShown();
    fireEvent.click(screen.getByRole("button", { name: "Post the follow-up" }));
    expect(
      await inHistory().findByText(
        "Moneypenny · That doesn't look like one of your own filings. nothing was posted.",
      ),
    ).toBeInTheDocument();
  });
});
