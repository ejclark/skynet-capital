import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ChainForm } from "../../../src/playbooks/chain-form";
import type { MemberChainView } from "../../src/live/playbook-chains";
import { AuthorChain } from "../../src/shell/playbook-chain-author";
import { YourChains } from "../../src/shell/playbook-chains";

/**
 * THE CHAIN FORM AND "YOUR CHAINS" (#6959 slice 3b).
 *
 * WHEN a member picks a playbook and an event, the form SHALL offer only the events that playbook's
 * position can reach. WHEN the next playbook can't hold what would be handed to it, the menu SHALL
 * mark it in words and the form SHALL say why under the link, before anything is sent. WHEN the
 * member saves, it SHALL send the form once and say the chain is shadow only. A chain SHALL be
 * drawable with no bot, and no condition can be typed.
 */

const SOUND: ChainForm = {
  title: "Sell a CRWV put, then a call",
  links: [{ from: "CRWV-WHEEL", on: "expired", date: "", to: "CRWV-LONG-CALL" }],
};
const view = (over: Partial<MemberChainView> = {}): MemberChainView => ({
  id: "sell-a-crwv-put-then-a-call",
  title: SOUND.title,
  form: SOUND,
  updatedAt: "2026-11-08T12:00:00.000Z",
  ...over,
});

const posts: { url: string; body: Record<string, unknown> }[] = [];
let listed: MemberChainView[] = [];
let saveReply: unknown;
const realFetch = globalThis.fetch;
beforeEach(() => {
  posts.length = 0;
  listed = [];
  saveReply = { ok: true, chain: view() };
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const json = (body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    if (init?.method === "POST") {
      posts.push({ url: String(url), body: JSON.parse(String(init.body ?? "{}")) });
      return json(String(url).endsWith("/save") ? saveReply : { ok: true });
    }
    return json({ chains: listed });
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const pick = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

function mountForm(editing?: MemberChainView) {
  const onSaved = rstest.fn();
  const onCancel = rstest.fn();
  render(<AuthorChain {...(editing ? { editing } : {})} onSaved={onSaved} onCancel={onCancel} />);
  return { onSaved, onCancel };
}

describe("the chain form", () => {
  it("offers a playbook's own events only once it is picked", () => {
    mountForm();
    expect(screen.getByLabelText("When")).toBeDisabled();
    pick("Starts with", "CRWV-LONG-CALL");
    const events = Array.from(screen.getByLabelText("When").querySelectorAll("option")).map(
      (o) => o.textContent,
    );
    expect(events).toContain("it sells at its profit target");
    expect(events).not.toContain("its sold contract is assigned");
  });

  it("marks a playbook that can't take the handoff, in words, and says why under the link", () => {
    mountForm();
    pick("Starts with", "CRWV-WHEEL");
    pick("When", "assigned");
    const options = Array.from(screen.getByLabelText("Then takes over").querySelectorAll("option"));
    expect(options.map((o) => o.textContent)).toContain("CRWV-LONG-CALL — can't take this over");
    pick("Then takes over", "CRWV-LONG-CALL");
    expect(screen.getByText(/can't manage shares/, { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/can't take this over/, { selector: "summary" })).toBeInTheDocument();
  });

  it("takes a date only for the date event, and has no place to type a condition", () => {
    mountForm();
    expect(screen.queryByLabelText("Date")).toBeNull();
    pick("Starts with", "CRWV-WHEEL");
    pick("When", "on-date");
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox").map((t) => t.getAttribute("placeholder"))).not.toContain(
      expect.stringMatching(/price|if /i),
    );
  });

  it("Save with a blank link shows what's missing and sends nothing", () => {
    mountForm();
    fireEvent.click(screen.getByRole("button", { name: "Save chain" }));
    expect(screen.getByText("Say in a line what the chain does.")).toBeInTheDocument();
    expect(screen.getByText(/Pick the playbook that hands off/)).toBeInTheDocument();
    expect(posts).toEqual([]);
  });

  it("limits a chain to three links and lets a later link start only from a playbook it owns", () => {
    mountForm();
    pick("Starts with", "CRWV-WHEEL");
    pick("When", "expired");
    pick("Then takes over", "CRWV-LONG-CALL");
    fireEvent.click(screen.getByRole("button", { name: /Add a link/ }));
    const second = screen.getByRole("listitem", { name: "Link 2" });
    const starts = Array.from(
      second.querySelectorAll("select")[0]?.querySelectorAll("option") ?? [],
    );
    expect(starts.map((o) => o.getAttribute("value"))).toEqual([
      "",
      "CRWV-WHEEL",
      "CRWV-LONG-CALL",
    ]);
    fireEvent.click(screen.getByRole("button", { name: /Add a link/ }));
    expect(screen.queryByRole("button", { name: /Add a link/ })).toBeNull();
    expect(screen.getByText("A chain has at most 3 links.")).toBeInTheDocument();
  });

  it("saves a sound chain once and says it is shadow only", async () => {
    const { onSaved } = mountForm();
    expect(
      screen.getByText("A saved chain is shadow only — it doesn't trade."),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("What the chain does"), {
      target: { value: SOUND.title },
    });
    pick("Starts with", "CRWV-WHEEL");
    pick("When", "expired");
    pick("Then takes over", "CRWV-LONG-CALL");
    fireEvent.click(screen.getByRole("button", { name: "Save chain" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(posts).toEqual([{ url: "/api/playbook-chains/save", body: { form: SOUND } }]);
  });

  it("shows the server's refusal under its link when it answers one", async () => {
    saveReply = {
      ok: false,
      refusals: [{ field: "title", reason: "You already have a chain with that name." }],
    };
    mountForm(view());
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("You already have a chain with that name.")).toBeInTheDocument();
    expect(posts[0]?.body).toEqual({ form: SOUND, replaceId: "sell-a-crwv-put-then-a-call" });
  });
});

describe("Your chains", () => {
  const mount = () =>
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <YourChains />
      </QueryClientProvider>,
    );

  it("draws the door with no bot needed, and no row when there are no chains", async () => {
    mount();
    expect(screen.getByRole("button", { name: /New chain/ })).toBeEnabled();
    await waitFor(() => expect(globalThis.fetch).toBeDefined());
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("lists a chain with each link as a sentence and its shadow-only standing", async () => {
    listed = [view()];
    mount();
    expect(await screen.findByText(SOUND.title)).toBeInTheDocument();
    expect(
      screen.getByText(
        "CRWV-WHEEL: when its sold contract expires worthless, CRWV-LONG-CALL takes over.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Shadow only · doesn't trade/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `Change ${SOUND.title}` }));
    expect(screen.getByLabelText("What the chain does")).toHaveValue(SOUND.title);
  });
});
