import { act, fireEvent, screen } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { flush, json, mount } from "./moneypenny-rail-harness";

// #5482 criterion 9: she drafts the member's view and the rail shows its card; only the member's
// tap (or the same words typed) saves it and hands it over — through the form's own two routes.
describe("MoneypennyRail — a drafted view", () => {
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
    title: "CRWV floor",
    checkOn: "2027-02-26",
    claims: [
      {
        tag: "underrated",
        statement: "CRWV's backlog outlasts the selloff.",
        bucket: "forward",
        evidence: "What I said.",
        falsifier: "CRWV closes under $45 on or before 2026-12-18.",
        scoreBy: "2026-12-18",
      },
    ],
    steers: ["CRWV-WHEEL"],
  };
  const DRAFTED = {
    draft: DRAFT,
    conviction: {
      ...DRAFT,
      id: "crwv-floor-2026-10",
      owner: "Joe",
      statedOn: "2026-10-19",
    },
    card: {
      label: "SIM",
      pairs: [
        {
          pair: "CRWV-WHEEL",
          name: "the wheel on CRWV",
          changes: [{ setting: "Contracts", before: "up to 2", after: "at most 1" }],
        },
      ],
      check: "Checked 2027-02-26, on net P/L: if it fails, every pair it steers stops opening.",
      timing: "The playbook still picks when to open and close inside these settings.",
    },
    takesOver: [{ pair: "CRWV-WHEEL", name: "the wheel on CRWV", from: "AI-dip view" }],
  };

  interface Stub {
    save?: unknown;
    handOver?: unknown;
  }

  function stub(answers: Stub = {}): { url: string; body: unknown }[] {
    const sent: { url: string; body: unknown }[] = [];
    let turns = 0;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      sent.push({ url, body });
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat") {
        turns += 1;
        const frames =
          turns === 1
            ? [
                `event: conviction\ndata: ${JSON.stringify(DRAFTED)}\n\n`,
                'event: delta\ndata: {"text":"here it is — tap to hand it over."}\n\n',
              ]
            : ['event: delta\ndata: {"text":"it narrows contracts to one."}\n\n'];
        return Promise.resolve(
          new Response([...frames, "event: done\ndata: {}\n\n"].join(""), {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          }),
        );
      }
      if (url === "/api/convictions/save")
        return Promise.resolve(
          json(
            answers.save ?? {
              ok: true,
              conviction: DRAFTED.conviction,
              card: DRAFTED.card,
              saved: true,
              note: "A draft: only you see it, and it steers nothing until you hand it to your bots.",
            },
          ),
        );
      if (url === "/api/convictions/hand-over")
        return Promise.resolve(
          json(
            answers.handOver ?? {
              ok: true,
              steering: [{ pair: "CRWV-WHEEL", name: "the wheel on CRWV" }],
              note: "Take it back any time.",
            },
          ),
        );
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
    return sent;
  }

  async function say(text: string): Promise<void> {
    fireEvent.change(screen.getByLabelText("Message Moneypenny"), { target: { value: text } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
  }

  async function draftShown(): Promise<void> {
    mount();
    await act(() => useMoneypenny.getState().openRail());
    await say("I think CRWV is underrated, cap my wheel at one contract");
    await screen.findByText("Moneypenny · here it is — tap to hand it over.");
  }

  it("shows the card: each change before → after, what it takes over, and its three exits", async () => {
    const sent = stub();
    await draftShown();
    const card = document.querySelector(".mp-draft");
    expect(card).toHaveTextContent("Draft view · SIM — CRWV floor");
    expect(card).toHaveTextContent("· Contracts: up to 2 → at most 1");
    expect(card).toHaveTextContent("takes over the wheel on CRWV from “AI-dip view”");
    expect(card).toHaveTextContent("nothing is saved until you tap");
    for (const name of ["Hand it to my bots", "Save it as a draft", "Not now"])
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(sent.some((c) => c.url.startsWith("/api/convictions/"))).toBe(false);
  });

  it("the tap saves the very draft she showed, then hands it over", async () => {
    const sent = stub();
    await draftShown();
    fireEvent.click(screen.getByRole("button", { name: "Hand it to my bots" }));
    expect(
      await screen.findByText(/handed to your bots: the wheel on CRWV\. Take it back any time\./),
    ).toBeInTheDocument();
    const posts = sent.filter((c) => c.url.startsWith("/api/convictions/"));
    expect(posts).toEqual([
      { url: "/api/convictions/save", body: { draft: DRAFT } },
      { url: "/api/convictions/hand-over", body: { id: "crwv-floor-2026-10" } },
    ]);
    expect(useMoneypenny.getState().conviction).toBeUndefined();
    expect(useMoneypenny.getState().convictionSeq).toBeGreaterThan(0);
  });

  it("a question about the card is a normal message: nothing is saved, the card stays parked", async () => {
    const sent = stub();
    await draftShown();
    await say("what does that change exactly?");
    expect(
      await screen.findByText("Moneypenny · it narrows contracts to one."),
    ).toBeInTheDocument();
    expect(sent.some((c) => c.url.startsWith("/api/convictions/"))).toBe(false);
    expect(useMoneypenny.getState().conviction).toBeDefined();
  });

  it("'Not now' drops it and keeps nothing", async () => {
    const sent = stub();
    await draftShown();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(
      await screen.findByText("Moneypenny · set aside — nothing was saved."),
    ).toBeInTheDocument();
    expect(sent.some((c) => c.url.startsWith("/api/convictions/"))).toBe(false);
    expect(useMoneypenny.getState().conviction).toBeUndefined();
  });

  it("a save the server refuses is said in its words, and nothing is handed over", async () => {
    const sent = stub({ save: { ok: false, label: "SIM", problems: ["the name is taken"] } });
    await draftShown();
    fireEvent.click(screen.getByRole("button", { name: "Hand it to my bots" }));
    expect(
      await screen.findByText(/i couldn't save it: the name is taken\. nothing was saved\./),
    ).toBeInTheDocument();
    expect(sent.some((c) => c.url === "/api/convictions/hand-over")).toBe(false);
  });

  it("a refused hand-over leaves a saved draft, and says why", async () => {
    stub({ handOver: { ok: false, label: "SIM", problems: ["none of your bots runs it"] } });
    await draftShown();
    fireEvent.click(screen.getByRole("button", { name: "Hand it to my bots" }));
    expect(
      await screen.findByText(
        /saved as a draft, but not handed to your bots: none of your bots runs it/,
      ),
    ).toBeInTheDocument();
  });
});
