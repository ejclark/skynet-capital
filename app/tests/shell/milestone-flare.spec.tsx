import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { CommunityUnlockBanner } from "../../src/shell/community-banner";
import { Takeover } from "../../src/shell/takeover";
import { setVantageFrame, useTowerBus } from "../../src/shell/tower-bus";
import { UnlockBanner } from "../../src/shell/unlock-gate";

/**
 * The milestone flare (#3977 slice 3): the tower answers a milestone the member claims — once, on
 * a claim the server accepted, never on a refused one — and the shared takeover carries its own
 * flare kind, so the level-up celebration (#469) plugs in with `flare="milestone"`.
 */
function crest() {
  const flares: unknown[] = [];
  const frame = document.createElement("iframe");
  Object.defineProperty(frame, "contentWindow", {
    value: { postMessage: (m: { type: string }) => m.type === "tower:flare" && flares.push(m) },
  });
  setVantageFrame(frame);
  useTowerBus.setState({ on: true });
  return flares;
}

let realFetch: typeof globalThis.fetch;
const answer = (status: number, body: unknown) => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as typeof globalThis.fetch;
};
beforeEach(() => {
  realFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  setVantageFrame(null);
  useTowerBus.setState({ on: false });
});

const milestone = { type: "tower:flare", kind: "milestone" };

describe("claiming a milestone tells the tower", () => {
  const earn = [{ milestoneId: "m-101", code: "101", name: "Buy stock" }];

  it("flares once when the claim is accepted", async () => {
    const flares = crest();
    answer(200, { ok: true });
    const claimed: string[] = [];
    render(<UnlockBanner celebrations={earn} onClaimed={() => claimed.push("yes")} />);
    fireEvent.click(screen.getByRole("button", { name: "Claim 🎉" }));
    await waitFor(() => expect(claimed).toEqual(["yes"]));
    expect(flares).toEqual([milestone]);
  });

  it("stays dark when the claim is refused, and says why", async () => {
    const flares = crest();
    answer(200, { ok: false, error: "already claimed" });
    render(<UnlockBanner celebrations={earn} onClaimed={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Claim 🎉" }));
    expect(await screen.findByText("already claimed")).toBeInTheDocument();
    expect(flares).toEqual([]);
  });

  it("flares for a community milestone the same way", async () => {
    const flares = crest();
    answer(200, { ok: true });
    const claimed: string[] = [];
    render(
      <CommunityUnlockBanner
        celebrations={[{ milestoneId: "c-1", title: "First filing", issueNumber: 12 }]}
        onClaimed={() => claimed.push("yes")}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Claim 🎉" }));
    await waitFor(() => expect(claimed).toEqual(["yes"]));
    expect(flares).toEqual([milestone]);
  });
});

describe("Takeover — the shared celebration shell", () => {
  function LevelUp({ onLeave }: { readonly onLeave: () => void }) {
    const back = useRef<HTMLButtonElement>(null);
    return (
      <Takeover titleId="lv-title" flare="milestone" focus={back} onLeave={onLeave}>
        {(leave) => (
          <>
            <h2 id="lv-title">Course 201 open</h2>
            <button ref={back} type="button" onClick={leave}>
              Back
            </button>
          </>
        )}
      </Takeover>
    );
  }

  it("names itself by its heading, focuses the way back, and flares its own kind once on leaving", () => {
    const flares = crest();
    const left: string[] = [];
    render(<LevelUp onLeave={() => left.push("left")} />);
    expect(screen.getByRole("dialog", { name: "Course 201 open" })).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Back" }));
    expect(flares).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(left).toEqual(["left", "left"]);
    expect(flares).toEqual([milestone]);
  });
});
