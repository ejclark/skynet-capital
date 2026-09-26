import { createFileRoute, Outlet } from "@tanstack/react-router";

/** The any-account page's layout (#3807 slice 2d) — exists so `/u/:id`'s sections (Overview,
 *  Activity, Pulse, Heartbeat at `/decisions`, Thesis, and the `/playbooks` redirect) are real
 *  siblings under one param scope; each child brings its frame and the page's own head
 *  (`account-head.tsx`). */
export const Route = createFileRoute("/u/$id")({ component: Outlet });
