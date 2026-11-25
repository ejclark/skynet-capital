import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

// A Home tap made while the first page is still loading shows the home (#8494, #8189 criterion 7).
// A real router, so the rule is checked against how router-core actually orders its events: the
// first page's loader stands in for a slow chunk, and the Home tap supersedes that load before it
// commits, the case the old `onResolved` settle missed.

type LastApp = typeof import("../../src/shell/last-app");

/** A fresh copy of the module each time: the page-load flag is per page, so per test. */
function freshLastApp(): Promise<LastApp> {
  rstest.resetModules();
  return import("../../src/shell/last-app");
}

function mount(lastApp: LastApp, firstPath: string, slow: Promise<void>) {
  const root = createRootRoute();
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    // The same rule `routes/index.tsx` runs, minus its search forwards.
    beforeLoad: ({ location, preload }) => {
      const reopen = lastApp.reopenTarget({
        preload,
        searchStr: location.searchStr,
        hash: location.hash,
      });
      if (reopen) throw redirect({ to: reopen, replace: true });
    },
  });
  const activity = createRoute({
    getParentRoute: () => root,
    path: "/activity",
    loader: () => slow,
  });
  const trade = createRoute({ getParentRoute: () => root, path: "/trade" });
  const router = createRouter({
    routeTree: root.addChildren([home, activity, trade]),
    history: createMemoryHistory({ initialEntries: [firstPath] }),
  });
  lastApp.settleAfterPageLoad(router);
  return router;
}

describe("a Home tap during the page load", () => {
  beforeEach(() => window.localStorage.setItem("skynet.last-app", "/trade"));
  afterEach(() => window.localStorage.removeItem("skynet.last-app"));

  it("shows the home, not the last app, when the first page has not resolved yet", async () => {
    const lastApp = await freshLastApp();
    const chunk = Promise.withResolvers<void>();
    const router = mount(lastApp, "/activity", chunk.promise);

    const firstLoad = router.load();
    await router.navigate({ to: "/" });
    chunk.resolve();
    await firstLoad;

    expect(router.state.location.pathname).toBe("/");
    expect(router.state.resolvedLocation?.pathname).toBe("/");
  });

  it("still reopens the last app on a fresh load at bare /", async () => {
    const lastApp = await freshLastApp();
    const router = mount(lastApp, "/", Promise.resolve());

    await router.load();

    expect(router.state.location.pathname).toBe("/trade");
  });

  it("shows the home on a Home tap after the reopen", async () => {
    const lastApp = await freshLastApp();
    const router = mount(lastApp, "/", Promise.resolve());

    await router.load();
    await router.navigate({ to: "/" });

    expect(router.state.location.pathname).toBe("/");
  });
});
