import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import "../src/styles/index.css";

/**
 * THE PROVIDER WRAPPER every mounted component renders inside — the CT half of `app/src/main.tsx`.
 *
 * Two things a component test needs that a bare `createRoot` does not give it:
 *
 *  1. **A stamped theme.** `styles/theme.css` resolves dark for an un-stamped `<html>` only when
 *     the OS does not explicitly prefer light; Playwright's Chromium reports a LIGHT
 *     `prefers-color-scheme` by default, so an un-stamped harness would quietly baseline every
 *     component in the light palette while the app ships dark-first. (Confirmed: every CT baseline
 *     committed before this fix — #3335, #3338 — was captured this way; this PR regenerates them
 *     all.) Stamping removes the ambient input entirely, and makes the palette a per-test CHOICE —
 *     which is what lets one spec assert both palettes, the standing requirement in
 *     `docs/BRAND.md` → Accessibility that text hold AA in both.
 *  2. **A query client.** `retry: false` makes a component that starts fetching fail fast and
 *     visibly instead of retrying into a timeout — this is what unblocks mounting a component that
 *     has a query-connected child (e.g. `TradeGate`'s `QuoteHeader`/`RecentOrdersStrip`) without a
 *     real server. The router is deliberately NOT here — its wrapper shape is still an open
 *     question (`shelf-parts.tsx`'s `Link` usage) and guessing it now would bake in the guess.
 */
export interface HarnessOptions {
  /** Which palette to stamp on `<html>`. Defaults to dark — the app's own default. */
  readonly theme?: "dark" | "light";
}

function Providers({ children }: { readonly children: ReactElement }): ReactElement {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeMount<HarnessOptions>(({ App, hooksConfig }) => {
  document.documentElement.setAttribute("data-theme", hooksConfig?.theme ?? "dark");
  return Promise.resolve(
    <Providers>
      <App />
    </Providers>,
  );
});
