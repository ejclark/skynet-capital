import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { startBoardChannel } from "./live/channel";
import { routeTree } from "./routeTree.gen";
import "./styles/board.css";
import "./styles/shell.css";
import "./styles/theme.css";

const queryClient = new QueryClient();
const router = createRouter({ routeTree, basepath: "/app" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// One channel per app, outside the render cycle — components read the cache, never the socket.
startBoardChannel(queryClient);

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
