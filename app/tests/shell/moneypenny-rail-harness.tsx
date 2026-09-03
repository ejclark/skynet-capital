import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MoneypennyRail } from "../../src/shell/moneypenny-rail";

/**
 * The rail specs' shared harness: a per-route fetch stub that records every call, a stub
 * onboarding view, a settle helper, and the mount under a fresh QueryClient. Two spec files share
 * it (`moneypenny-rail.spec.tsx`, `moneypenny-rail-filing.spec.tsx`) — split at the 300-line cap.
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
    { id: "first-feedback", done: false },
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

export function mount(): ReturnType<typeof render> {
  const client = new QueryClient();
  const tree: ReactElement = (
    <QueryClientProvider client={client}>
      <MoneypennyRail />
    </QueryClientProvider>
  );
  return render(tree);
}
