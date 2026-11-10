import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { requestLight, useEyeLight } from "../../src/shell/eye-light";
import { EyeLight } from "../../src/shell/eye-light-layer";

// #7216 slice 2 — the ring and its label stay on the item her link names. happy-dom draws no Eye
// (no tower frame, no laid-out brand Eye), so these exercise the ring alone: the reduced-motion
// path and the no-Eye path are the same one.

function Shell() {
  const app = useRef<HTMLDivElement>(null);
  return (
    <div ref={app}>
      <Outlet />
      <EyeLight root={app} />
    </div>
  );
}

async function mount() {
  const root = createRootRoute({ component: Shell });
  const accounts = createRoute({
    getParentRoute: () => root,
    path: "/accounts",
    component: () => (
      <table>
        <tbody>
          <tr id="pos-NVDA">
            <td>NVDA</td>
          </tr>
          <tr id="pos-AAPL">
            <td>
              <button type="button">AAPL</button>
            </td>
          </tr>
        </tbody>
      </table>
    ),
  });
  const trade = createRoute({
    getParentRoute: () => root,
    path: "/trade",
    component: () => <p>the ticket</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([accounts, trade]),
    basepath: "/app",
    history: createMemoryHistory({ initialEntries: ["/app/accounts"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByText("NVDA");
  return router;
}

/** happy-dom lays nothing out; give every element one box so the light finds its item. */
function layOut(): () => void {
  const rects = Element.prototype.getClientRects;
  const box = Element.prototype.getBoundingClientRect;
  Element.prototype.getClientRects = function () {
    return [{}] as unknown as DOMRectList;
  };
  Element.prototype.getBoundingClientRect = function () {
    return { top: 300, left: 400, width: 600, height: 40, bottom: 340, right: 1000 } as DOMRect;
  };
  return () => {
    Element.prototype.getClientRects = rects;
    Element.prototype.getBoundingClientRect = box;
  };
}

describe("EyeLight · the ring on the item her link names", () => {
  let restore: () => void;
  beforeEach(() => {
    useEyeLight.setState({ request: undefined });
    restore = layOut();
  });
  afterEach(() => restore());

  it("rings the item and names the Eye on it", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-NVDA"));
    const ring = await waitFor(() => {
      const el = document.querySelector("[data-eye-ring]");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(ring).toHaveTextContent(/the Eye/i);
    // Outside the item's edge, never over it.
    expect(ring.style.top).toBe("297px");
    expect(ring.style.width).toBe("606px");
  });

  it("keeps the ring through a tap on the item itself, and lets it go on a tap elsewhere", async () => {
    await mount();
    act(() => requestLight("/accounts#pos-AAPL"));
    await waitFor(() => expect(document.querySelector("[data-eye-ring]")).not.toBeNull());
    fireEvent.pointerDown(screen.getByRole("button", { name: "AAPL" }));
    expect(document.querySelector("[data-eye-ring]")).not.toBeNull();
    fireEvent.pointerDown(screen.getByText("NVDA"));
    expect(document.querySelector("[data-eye-ring]")).toBeNull();
  });

  it("lets the ring go when the member leaves the page", async () => {
    const router = await mount();
    act(() => requestLight("/accounts#pos-NVDA"));
    await waitFor(() => expect(document.querySelector("[data-eye-ring]")).not.toBeNull());
    await act(() => router.navigate({ to: "/trade" }));
    await screen.findByText("the ticket");
    expect(document.querySelector("[data-eye-ring]")).toBeNull();
  });
});
