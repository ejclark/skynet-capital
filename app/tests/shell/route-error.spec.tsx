import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  lazyRouteComponent,
  Outlet,
  type RouteComponent,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import {
  isStaleChunkError,
  pageControls,
  RELOAD_MARKER,
  RELOAD_WINDOW_MS,
  RouteError,
  reportRouteError,
  routeErrorOptions,
  ShellError,
} from "../../src/shell/route-error";

/**
 * Keep the app on screen when a route fails (#4614, slice 2 of #4612). Before this, no route had an
 * error boundary, so one failed chunk or one bad render replaced the whole app — topbar included —
 * with "Something went wrong!". These specs mount a real memory-history router with the same
 * options `main.tsx` passes (`routeErrorOptions`) under a stand-in root that owns a topbar.
 */

const T0 = Date.parse("2026-10-04T22:05:00.000Z");

function chunkError(id = "775"): Error {
  // What rspack's runtime builds when a hashed route chunk is gone after a deploy.
  const error = new Error(
    `Loading chunk ${id} failed.\n(missing: http://127.0.0.1/app/static/js/async/${id}.0ldha5h000.js)`,
  );
  error.name = "ChunkLoadError";
  return error;
}

function Layout(): ReactElement {
  return (
    <div>
      <header className="topbar">
        <nav aria-label="Views">
          {/* `as never`: these test-only paths are not in the app's registered route tree. */}
          <Link to={"/fine" as never}>Fine</Link>
          <Link to={"/boom" as never}>Boom</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

function mount(
  path: string,
  pages: Record<string, RouteComponent>,
  root: { component?: RouteComponent; errorComponent?: typeof ShellError } = {},
) {
  const rootRoute = createRootRoute({ component: root.component ?? Layout, ...root });
  const children = Object.entries(pages).map(([p, component]) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, component }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren(children),
    history: createMemoryHistory({ initialEntries: [path] }),
    ...routeErrorOptions,
  });
  render(<RouterProvider router={router} />);
  return router;
}

function Fine(): ReactElement {
  return <p>All good here</p>;
}

let reload: ReturnType<typeof rstest.spyOn>;
let logged: ReturnType<typeof rstest.spyOn>;

beforeEach(() => {
  sessionStorage.clear();
  reload = rstest.spyOn(pageControls, "reload").mockImplementation(() => undefined);
  rstest.spyOn(pageControls, "now").mockReturnValue(T0);
  // React and the catch seam both log a caught error; the specs assert on the screen instead.
  logged = rstest.spyOn(console, "error").mockImplementation(() => undefined);
  rstest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  rstest.restoreAllMocks();
  rstest.unstubAllGlobals();
});

describe("which failures count as a stale chunk", () => {
  it.each([
    ["rspack's chunk loader", chunkError()],
    ["a CSS chunk", new Error("Loading CSS chunk 12 failed.\n(/app/static/css/async/12.css)")],
    ["Chromium's native import", new TypeError("Failed to fetch dynamically imported module: x")],
    ["Firefox's native import", new TypeError("error loading dynamically imported module: x")],
    ["Safari's native import", new TypeError("Importing a module script failed.")],
    ["HTML run as a script", new SyntaxError("Unexpected token '<'")],
  ])("%s", (_label, error) => {
    expect(isStaleChunkError(error)).toBe(true);
  });

  it.each([
    ["a render bug", new TypeError("Cannot read properties of undefined (reading 'filter')")],
    [
      "an HTML body read as JSON",
      new SyntaxError(`Unexpected token '<', "<!doctype "... is not valid JSON`),
    ],
    ["a thrown string", "Loading chunk 1 failed"],
    ["nothing", undefined],
  ])("not %s", (_label, error) => {
    expect(isStaleChunkError(error)).toBe(false);
  });
});

describe("a stale chunk reloads the page once", () => {
  it("reloads once and says it is fetching the newest version", async () => {
    const lazy = lazyRouteComponent(() => Promise.reject(chunkError()));
    mount("/boom", { "/boom": lazy, "/fine": Fine });

    expect(await screen.findByRole("status")).toHaveTextContent(/newest version/i);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(Number(sessionStorage.getItem(RELOAD_MARKER))).toBe(T0);
    // The shell stayed: the reload is the shell's own doing, not a blank page.
    expect(document.querySelector("header.topbar")).not.toBeNull();
  });

  it("does not reload again for the same failure on a re-render", () => {
    const error = chunkError();
    const { rerender } = render(<RouteError error={error} reset={() => undefined} />);
    rerender(<RouteError error={error} reset={() => undefined} />);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("stops after one try: a second failure inside the window shows the message and a Reload button", async () => {
    sessionStorage.setItem(RELOAD_MARKER, String(T0 - 5_000));
    const lazy = lazyRouteComponent(() => Promise.reject(chunkError()));
    mount("/boom", { "/boom": lazy, "/fine": Fine });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/couldn.t load/i);
    expect(reload).not.toHaveBeenCalled();
    expect(document.querySelector("header.topbar")).not.toBeNull();

    fireEvent.click(within(alert).getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("tries again once the window has passed — a later deploy is a new failure, not a loop", () => {
    sessionStorage.setItem(RELOAD_MARKER, String(T0 - RELOAD_WINDOW_MS - 1));
    render(<RouteError error={chunkError()} reset={() => undefined} />);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("never reloads when it cannot leave a marker — no marker, no guard, no loop", () => {
    // Safari's private mode and a full quota both throw on write. A stand-in global, because
    // happy-dom's storage proxy binds its methods on first touch and ignores a prototype stub.
    rstest.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    render(<RouteError error={chunkError()} reset={() => undefined} />);
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t load/i);
  });
});

describe("any other route error stays inside the route area", () => {
  function Boom(): ReactElement {
    throw new TypeError("Cannot read properties of undefined (reading 'filter')");
  }

  it("keeps the topbar and shows the error in plain words with its message", async () => {
    mount("/boom", { "/boom": Boom, "/fine": Fine });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/this page hit an error/i);
    expect(alert).toHaveTextContent("Cannot read properties of undefined (reading 'filter')");
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(within(alert).getByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(document.querySelector("header.topbar")).not.toBeNull();
    expect(screen.queryByText(/something went wrong/i)).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it("lets the member leave through the topbar, which clears the error", async () => {
    mount("/boom", { "/boom": Boom, "/fine": Fine });
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("link", { name: "Fine" }));
    expect(await screen.findByText("All good here")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("Try again re-renders the route", async () => {
    let fail = true;
    function Flaky(): ReactElement {
      if (fail) throw new Error("A passing hiccup");
      return <p>Recovered</p>;
    }
    mount("/flaky", { "/flaky": Flaky });
    const alert = await screen.findByRole("alert");

    fail = false;
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Recovered")).toBeInTheDocument();
    expect(document.querySelector("header.topbar")).not.toBeNull();
  });

  it("says plainly when no page lives at an address, inside the shell", async () => {
    mount("/no-such-page", { "/fine": Fine });
    expect(await screen.findByRole("heading", { name: /no page at this address/i })).toBeVisible();
    expect(document.querySelector("header.topbar")).not.toBeNull();
  });
});

describe("only an error in the shell itself replaces the shell", () => {
  it("renders a full-page fallback with Reload when the root layout throws", async () => {
    function BrokenShell(): ReactElement {
      throw new Error("The topbar could not render");
    }
    mount("/fine", { "/fine": Fine }, { component: BrokenShell, errorComponent: ShellError });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/the app hit an error/i);
    expect(alert).toHaveTextContent("The topbar could not render");
    fireEvent.click(within(alert).getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("the catch seam", () => {
  it("logs every caught route error to the console", () => {
    const error = new Error("seen");
    reportRouteError(error, { componentStack: "\n    at Boom" });
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining("route error"),
      error,
      "\n    at Boom",
    );
  });
});
