import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { MemberConvictionView, SteerablePairView } from "../../src/live/member-convictions";
import { draftOf, emptyFields, fieldsFrom, placeProblems } from "../../src/shell/conviction-fields";
import { ConvictionForm } from "../../src/shell/conviction-form";
import { YourConvictions } from "../../src/shell/your-convictions";

/**
 * THE CONVICTION FORM AND "YOUR CONVICTIONS" (#5482 slice 6b, criteria 1, 3, 8).
 *
 * WHEN a member has no ◆ pair a bot of theirs runs, the door SHALL stay drawn, disabled, with the
 * reason. WHEN a field the server can't read is blank, the form SHALL say where before anything is
 * sent. WHEN the member previews, it SHALL send the draft to `/draft` and show each pair's before →
 * after, labelled SIM, and only then offer Save; an edit SHALL put the card away. WHEN the server
 * refuses, each problem SHALL sit under the claim or pair it names. A saved view SHALL read as a
 * draft that steers nothing.
 *
 * Slice 6c: WHEN a member taps "Hand to my bots", the row SHALL ask once, naming the pairs and any it
 * takes over, and only "Hand over" SHALL send it. A steering view SHALL say so in a glyph and words,
 * name the pairs the server read, and take back in one tap. A refusal SHALL show the server's words.
 */

const WHEEL: SteerablePairView = {
  pair: "CRWV-WHEEL",
  name: "the wheel on CRWV",
  strategy: "wheel",
  bounds: {
    dte: { min: 14, max: 45 },
    contracts: { conservative: 1, standard: 1, aggressive: 2 },
  },
};

const CARD = {
  label: "SIM",
  pairs: [
    {
      pair: "CRWV-WHEEL",
      name: "the wheel on CRWV",
      changes: [{ setting: "Contracts", before: "up to 2", after: "at most 1" }],
    },
  ],
  check: "Checked 2027-02-26, on net P/L and each playbook's own retire test.",
  timing: "The playbook still picks when to open and close inside these settings.",
} as const;

const CONVICTION = {
  id: "crwv-floor-2026-10",
  title: "CRWV floor",
  owner: "Ada",
  statedOn: "2026-10-19",
  checkOn: "2027-02-26",
  claims: [
    {
      tag: "underrated",
      statement: "1. CRWV's backlog outlasts the selloff.",
      bucket: "forward",
      evidence: "The premium-fit re-run.",
      falsifier: "CRWV closes under $45.",
      scoreBy: "2026-12-18",
    },
  ],
  steers: ["CRWV-WHEEL"],
  narrowings: [{ pair: "CRWV-WHEEL", fromClaims: [], narrow: [{ kind: "contracts", max: 1 }] }],
} as const;

const SAVED = {
  status: "draft",
  conviction: CONVICTION,
  createdAt: "2026-10-19T15:00:00.000Z",
  updatedAt: "2026-10-19T15:00:00.000Z",
  card: CARD,
} as unknown as MemberConvictionView;

const posts: { url: string; body: Record<string, unknown> }[] = [];
let reply: unknown;
let mine: unknown;
const realFetch = globalThis.fetch;
beforeEach(() => {
  posts.length = 0;
  reply = { ok: true, conviction: CONVICTION, card: CARD, saved: false, note: "A draft." };
  mine = { label: "SIM", note: "A draft.", convictions: [], steerable: [WHEEL] };
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const json = (body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    if (init?.method === "POST") {
      posts.push({ url: String(url), body: JSON.parse(String(init.body ?? "{}")) });
      return json(reply);
    }
    return json(mine);
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const type = (label: string | RegExp, value: string, scope: HTMLElement = document.body) =>
  fireEvent.change(within(scope).getByLabelText(label), { target: { value } });

function mountForm(over: { editing?: MemberConvictionView } = {}) {
  render(
    <ConvictionForm steerable={[WHEEL]} {...over} onSaved={rstest.fn()} onCancel={rstest.fn()} />,
  );
}

function fillOneClaim() {
  type("The view, in a few words", "CRWV floor");
  type("The claim", "CRWV's backlog outlasts the selloff.");
  type("What it rests on", "The premium-fit re-run.");
  type("Wrong if", "CRWV closes under $45.");
  type("By", "2026-12-18");
  type("Checked on", "2027-02-26");
}

describe("ConvictionForm", () => {
  it("says what is blank, where, before anything is sent", async () => {
    mountForm();
    fireEvent.click(screen.getByRole("button", { name: "Preview what it changes" }));
    expect(await screen.findByText("Name the view.")).toBeTruthy();
    expect(
      screen.getByText(
        "Fill in the claim, what it rests on, what proves it wrong, the day that is read.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Pick the day it is checked.")).toBeTruthy();
    expect(posts).toEqual([]);
  });

  it("previews the view as before → after with SIM, and only then offers Save", async () => {
    mountForm();
    fillOneClaim();
    // The only pair the member runs is ticked already; narrow its contracts.
    type("Contracts, at most", "1");
    fireEvent.click(screen.getByRole("button", { name: "Preview what it changes" }));
    const card = await screen.findByRole("region", { name: "What this view changes" });
    expect(within(card).getByText("SIM")).toBeTruthy();
    expect(within(card).getByText("up to 2")).toBeTruthy();
    expect(within(card).getByText("at most 1")).toBeTruthy();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.url).toBe("/api/convictions/draft");
    expect(posts[0]?.body).toEqual({
      draft: {
        title: "CRWV floor",
        checkOn: "2027-02-26",
        claims: [
          {
            tag: "underrated",
            statement: "CRWV's backlog outlasts the selloff.",
            bucket: "forward",
            evidence: "The premium-fit re-run.",
            falsifier: "CRWV closes under $45.",
            scoreBy: "2026-12-18",
          },
        ],
        steers: ["CRWV-WHEEL"],
        narrowings: [
          { pair: "CRWV-WHEEL", fromClaims: [], narrow: [{ kind: "contracts", max: 1 }] },
        ],
      },
    });
    expect(screen.getByRole("button", { name: "Save draft" })).toBeTruthy();
  });

  it("puts the card away on any edit, so the view saved is the one just read", async () => {
    mountForm();
    fillOneClaim();
    fireEvent.click(screen.getByRole("button", { name: "Preview what it changes" }));
    await screen.findByRole("button", { name: "Save draft" });
    type("Contracts, at most", "2");
    expect(screen.queryByRole("region", { name: "What this view changes" })).toBeNull();
    expect(screen.getByRole("button", { name: "Preview what it changes" })).toBeTruthy();
  });

  it("places the server's problems under the claim and the pair they name", async () => {
    reply = {
      ok: false,
      label: "SIM",
      problems: [
        "claim 1: scored before it was stated",
        "narrowing of CRWV-WHEEL: contracts 3 is above the playbook's 2",
      ],
    };
    mountForm();
    fillOneClaim();
    fireEvent.click(screen.getByRole("button", { name: "Preview what it changes" }));
    const claim = screen.getByRole("group", { name: "Claim 1" });
    expect(await within(claim).findByText("scored before it was stated")).toBeTruthy();
    const pair = screen.getByRole("group", { name: "On the wheel on CRWV, narrow" });
    expect(within(pair).getByText("contracts 3 is above the playbook's 2")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save draft" })).toBeNull();
  });

  it("opens a saved view on what was saved, and replaces it in place", async () => {
    mountForm({ editing: SAVED });
    expect(screen.getByLabelText("The claim")).toHaveProperty(
      "value",
      "CRWV's backlog outlasts the selloff.",
    );
    expect(screen.getByLabelText("Contracts, at most")).toHaveProperty("value", "1");
    fireEvent.click(screen.getByRole("button", { name: "Preview what it changes" }));
    await screen.findByRole("button", { name: "Save draft" });
    expect(posts[0]?.body.replaceId).toBe("crwv-floor-2026-10");
  });
});

describe("conviction fields", () => {
  it("sends no narrowing for a pair left at the playbook's own settings", () => {
    const fields = { ...fieldsFrom(CONVICTION as never), pairs: {} };
    expect(draftOf(fields).narrowings).toBeUndefined();
  });

  it("ticks the only pair a member runs, and none when there are several", () => {
    expect(emptyFields([WHEEL]).steers).toEqual(["CRWV-WHEEL"]);
    expect(emptyFields([WHEEL, { ...WHEEL, pair: "CRWV-LONG-CALL" }]).steers).toEqual([]);
  });

  it("keeps a problem it can't place for the foot of the form", () => {
    expect(placeProblems(["steers no pair"], [WHEEL])).toEqual([
      { place: { at: "general" }, text: "steers no pair" },
    ]);
  });
});

describe("YourConvictions", () => {
  const mount = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <YourConvictions />
      </QueryClientProvider>,
    );

  it("keeps the door drawn and says why when no bot of theirs runs a ◆ pair", async () => {
    mine = { label: "SIM", note: "", convictions: [], steerable: [] };
    mount();
    const door = await screen.findByRole("button", { name: "State a conviction" });
    expect(door).toHaveProperty("disabled", true);
    expect(screen.getByText(/none of yours runs one yet/)).toBeTruthy();
  });

  it("saves the previewed view and says it steers nothing yet", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "State a conviction" }));
    fillOneClaim();
    fireEvent.click(screen.getByRole("button", { name: "Preview what it changes" }));
    reply = { ...(reply as object), saved: true };
    fireEvent.click(await screen.findByRole("button", { name: "Save draft" }));
    expect(
      await screen.findByText(
        "Saved CRWV floor as a draft. It steers nothing until you hand it to your bots.",
      ),
    ).toBeTruthy();
    expect(posts.map((p) => p.url)).toEqual(["/api/convictions/draft", "/api/convictions/save"]);
  });

  it("lists a saved view as a draft that steers nothing yet", async () => {
    mine = { label: "SIM", note: "", convictions: [SAVED], steerable: [WHEEL] };
    mount();
    const row = await screen.findByRole("button", { name: "Change CRWV floor" });
    expect(within(row).getByText("1 claim · steers the wheel on CRWV")).toBeTruthy();
    expect(within(row).getByText(/Draft · steers nothing yet/)).toBeTruthy();
    expect(within(row).getByText("2027-02-26")).toBeTruthy();
  });

  it("hands a draft to the bots only after one ask that names the pairs and what it takes over", async () => {
    const takesOver = [{ pair: "CRWV-WHEEL", name: "the wheel on CRWV", from: "AI-dip view" }];
    mine = { label: "SIM", note: "", convictions: [{ ...SAVED, takesOver }], steerable: [WHEEL] };
    reply = { ok: true, steering: [{ pair: "CRWV-WHEEL", name: "the wheel on CRWV" }], note: "" };
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Hand to my bots" }));
    const ask = screen.getByRole("group", { name: "Hand CRWV floor to your bots?" });
    expect(within(ask).getByText(/They run the wheel on CRWV inside its settings/)).toBeTruthy();
    expect(
      within(ask).getByText("On the wheel on CRWV it takes over from AI-dip view."),
    ).toBeTruthy();
    expect(posts).toEqual([]);
    fireEvent.click(within(ask).getByRole("button", { name: "Hand over" }));
    expect(
      await screen.findByText(
        "Handed CRWV floor to your bots. They steer by it from their next check-in.",
      ),
    ).toBeTruthy();
    expect(posts).toEqual([
      { url: "/api/convictions/hand-over", body: { id: "crwv-floor-2026-10" } },
    ]);
  });

  it("shows the server's refusal under the ask", async () => {
    mine = { label: "SIM", note: "", convictions: [SAVED], steerable: [WHEEL] };
    reply = { ok: false, problems: ["none of your bots runs the wheel on CRWV any more"] };
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Hand to my bots" }));
    fireEvent.click(screen.getByRole("button", { name: "Hand over" }));
    expect(
      await screen.findByText("none of your bots runs the wheel on CRWV any more"),
    ).toBeTruthy();
  });

  it("lists a steering view in words and takes it back in one tap", async () => {
    const steering = {
      ...SAVED,
      status: "steering",
      accounts: ["sauron"],
      steering: [{ pair: "CRWV-WHEEL", name: "the wheel on CRWV" }],
    };
    mine = { label: "SIM", note: "", convictions: [steering], steerable: [WHEEL] };
    reply = { ok: true, note: "" };
    mount();
    const row = await screen.findByRole("button", { name: "Change CRWV floor" });
    expect(within(row).getByText(/Steering your bots · 1 pair/)).toBeTruthy();
    expect(screen.getByText("Your bots run the wheel on CRWV inside its settings.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Take back" }));
    expect(
      await screen.findByText(
        "Took CRWV floor back. Its pairs run as they did before you handed it over.",
      ),
    ).toBeTruthy();
    expect(posts).toEqual([
      { url: "/api/convictions/take-back", body: { id: "crwv-floor-2026-10" } },
    ]);
  });

  it("says plainly when a handed-over view can't steer now, and why", async () => {
    const refused = {
      ...SAVED,
      status: "steering",
      accounts: ["sauron"],
      steering: [],
      refused: ["narrows CRWV-WHEEL past its playbook's room"],
    };
    mine = { label: "SIM", note: "", convictions: [refused], steerable: [WHEEL] };
    mount();
    const row = await screen.findByRole("button", { name: "Change CRWV floor" });
    expect(within(row).getByText(/Handed over · can't steer now/)).toBeTruthy();
    expect(screen.getByText(/Your bots can't steer by it now/)).toBeTruthy();
    expect(screen.getByText("narrows CRWV-WHEEL past its playbook's room")).toBeTruthy();
  });
});
