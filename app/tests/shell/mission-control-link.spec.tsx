import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MissionControlLink } from "../../src/shell/mission-control";

/**
 * The bot account card's "Mission Control ↓" jump appears only where the panel it points at
 * renders: `/api/controls` answers `{owner:false}` to a bot owner who is not a fleet owner, and
 * Mission Control then renders nothing — a link there would land on an empty anchor.
 */

let controls: unknown = { owner: false };
const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify(controls), { status: 200 }))) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe("MissionControlLink", () => {
  it("offers the jump to a fleet owner", async () => {
    controls = { owner: true, fleet: { allSuspended: false, bots: {} } };
    render(withClient(<MissionControlLink />));
    expect(await screen.findByRole("link", { name: "Mission Control ↓" })).toHaveAttribute(
      "href",
      "#mission-control",
    );
  });

  it("offers nothing to a bot owner who is not a fleet owner", async () => {
    controls = { owner: false };
    const { container } = render(withClient(<MissionControlLink />));
    await new Promise((r) => setTimeout(r, 20));
    expect(container.querySelector('a[href="#mission-control"]')).toBeNull();
  });
});
