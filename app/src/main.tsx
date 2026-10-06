import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { parseSearch, stringifySearch } from "./live/search-params";
import { routeTree } from "./routeTree.gen";
import { routeErrorOptions } from "./shell/route-error";
import "./styles/index.css";

const queryClient = new QueryClient();
// Every route gets its own error boundary, so a failed route (a stale chunk after a deploy, a bad
// render) shows inside the shell and the topbar stays — #4614, slice 2 of #4612.
const router = createRouter({
  routeTree,
  basepath: "/app",
  parseSearch,
  stringifySearch,
  ...routeErrorOptions,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
