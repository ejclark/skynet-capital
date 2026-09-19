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
 *     component in the light palette while the app ships dark-first. Stamping removes the ambient
 *     input entirely, and makes the palette a per-test CHOICE — which is what lets one spec assert
 *     both palettes, the standing requirement in `docs/BRAND.md` → Accessibility that text hold AA
 *     in both.
 *  2. **A query client.** Nothing mounted today issues a query — `retry: false` is what keeps it
 *     that way honestly: a component that starts fetching fails fast and visibly instead of
 *     retrying into a timeout. The provider is here as the seam #3333's slice 5 grows into when it
 *     brings the query-connected components in; the router is deliberately NOT here, because its
 *     wrapper shape is that slice's open question and guessing it now would bake in the guess.
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
