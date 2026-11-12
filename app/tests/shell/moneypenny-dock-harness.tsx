import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { useMoneypenny } from "../../src/live/moneypenny";
import { MoneypennyDock } from "../../src/shell/moneypenny-dock";

/**
 * The dock specs' shared harness (#7487 slice 2; was the rail's): a per-route fetch stub that
 * records every call, a stub onboarding view, a settle helper, the mount under a fresh QueryClient,
 * and `showHistory` — the rail's old `openRail`: open the History sheet and wake the store.
 *
 * The dock reads the router (History closes on every location change; a "go" move navigates), so
 * the mount gives it a memory router through `RouterContextProvider`: the dock renders at once,
 * with no route tree to load. Specs that navigate build a real `RouterProvider` tree instead.
 */

export type Handler = (body: unknown) => unknown;

export function stubFetch(
  routes: Record<string, Handler>,
  calls: { url: string; body: unknown }[],
): void {
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body });
    const handler = routes[url];
    if (!handler) return Promise.resolve(new Response("{}", { status: 404 }));
    return Promise.resolve(
      new Response(JSON.stringify(handler(body)), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;
}

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const onboarding = (connected: boolean) => ({
  linked: true,
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [
    { id: "connect", done: connected },
    { id: "first-message", done: false },
    { id: "first-trade", done: false },
  ],
  done: connected ? 1 : 0,
  total: 3,
  points: 0,
  totalPoints: 30,
  complete: false,
  ...(connected ? { account: { id: "human-joe", displayName: "Joe" } } : {}),
});

/** Let the store's chained awaits (fetch → typing beat → append) settle before a negative check. */
export const flush = () => act(async () => new Promise((ok) => setTimeout(ok, 20)));

/** A memory router for the dock to read; nothing is mounted from its (empty) route tree. */
export function memoryRouter(path = "/") {
  return createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
}

/** Mount the dock alone, beside whatever `extra` a spec draws (the landing page's quick questions). */
export function mount(extra?: ReactElement): ReturnType<typeof render> & {
  readonly router: ReturnType<typeof memoryRouter>;
} {
  const client = new QueryClient();
  const router = memoryRouter();
  const tree: ReactElement = (
    <QueryClientProvider client={client}>
      <RouterContextProvider router={router}>
        {extra}
        <MoneypennyDock />
      </RouterContextProvider>
    </QueryClientProvider>
  );
  return { ...render(tree), router };
}

/** The rail's old `openRail(opts)`: History open, the store woken (bound; the intro with `intro`). */
export const showHistory = (opts?: { readonly intro?: boolean }) =>
  act(async () => {
    useMoneypenny.setState({ history: true });
    await useMoneypenny.getState().wake(opts);
  });

/** The History sheet, when open — the conversation lives here, not in the dock's latest line. */
export const historySheet = () =>
  screen.getByRole("region", { name: "Conversation with Moneypenny" });

/** Queries scoped to the History sheet: her latest line also shows in the dock, so a bare text
 *  query would find it twice. */
export const inHistory = () => within(historySheet());
