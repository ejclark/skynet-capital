import { createFileRoute, Outlet } from "@tanstack/react-router";

/** The desk section's layout — exists so `/u/:id` (the blotter) and `/u/:id/decisions` are real
 *  siblings under one param scope; each child brings its own frame and rail. */
export const Route = createFileRoute("/u/$id")({ component: Outlet });
