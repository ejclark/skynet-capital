import { createRootRoute, Outlet } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useConnection } from "../live/connection";

/**
 * The shell frame (phase 0): brand, live-channel status, and the stage. The full nav rail,
 * themes, and density toggle land in phase 1 — this frame only proves the chrome/stage split
 * and gives the seam's status a visible, honest home.
 */

function StatusPill(): ReactElement {
  const status = useConnection((s) => s.status);
  const seq = useConnection((s) => s.seq);
  const label =
    status === "live" ? `live · seq ${seq}` : status === "resyncing" ? "resyncing…" : "connecting…";
  return (
    <span className={`status status-${status}`} aria-live="polite">
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

function RootShell(): ReactElement {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">
            SC
          </span>
          Skynet Capital
        </span>
        <span className="env-pill">SIM</span>
        <StatusPill />
      </header>
      <main id="main" className="stage">
        <Outlet />
      </main>
    </div>
  );
}

export const Route = createRootRoute({ component: RootShell });
