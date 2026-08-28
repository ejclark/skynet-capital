import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./styles/board.css";
import "./styles/compare.css";
import "./styles/decisions.css";
import "./styles/desk.css";
import "./styles/drawer.css";
import "./styles/gate.css";
import "./styles/hero.css";
import "./styles/hovercard.css";
import "./styles/kbd.css";
import "./styles/motion.css";
import "./styles/pulse.css";
import "./styles/settings.css";
import "./styles/shell.css";
import "./styles/theme.css";
import "./styles/views.css";
import "./styles/wire.css";

const queryClient = new QueryClient();
const router = createRouter({ routeTree, basepath: "/app" });

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
