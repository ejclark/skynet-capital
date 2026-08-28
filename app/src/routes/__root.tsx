import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useConnection } from "../live/connection";
import { KeyboardChords } from "../shell/keyboard";
import { type Density, type Theme, usePrefs } from "../shell/prefs";

/**
 * The shell (#738, live-review round): the topbar carries the APP-LEVEL navigation — the views —
 * as the top dimension; each route brings its own left-rail sub-navigation through `PageFrame`
 * (or none). Views the shell doesn't own yet are plain links to the server-rendered pages.
 */

const SERVER_VIEWS = [
  ["/wire", "The Wire"],
  ["/research", "Research"],
  ["/collections", "Collections"],
  ["/learn", "Milestones"],
] as const;

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

function Toggle<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly (readonly [T, string])[];
  readonly onPick: (next: T) => void;
}): ReactElement {
  return (
    <fieldset className="toggle-group">
      <legend className="visually-hidden">{label}</legend>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={key === value} onClick={() => onPick(key)}>
          <span className="toggle-text">{text}</span>
        </button>
      ))}
    </fieldset>
  );
}

function RootShell(): ReactElement {
  const theme = usePrefs((s) => s.theme);
  const density = usePrefs((s) => s.density);
  const setTheme = usePrefs((s) => s.setTheme);
  const setDensity = usePrefs((s) => s.setDensity);
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
        <nav className="topnav" aria-label="Views">
          <Link
            to="/"
            search={{ by: "equity" }}
            className="topnav-link"
            activeProps={{ "aria-current": "page" }}
            activeOptions={{ includeSearch: false }}
          >
            Standings
          </Link>
          {SERVER_VIEWS.map(([href, label]) => (
            <a key={href} href={href} className="topnav-link">
              {label}
            </a>
          ))}
        </nav>
        <div className="topbar-actions">
          <Toggle<Density>
            label="Density"
            value={density}
            options={[
              ["comfortable", "Comfortable"],
              ["compact", "Compact"],
            ]}
            onPick={setDensity}
          />
          <Toggle<Theme>
            label="Theme"
            value={theme}
            options={[
              ["dark", "Dark"],
              ["light", "Light"],
            ]}
            onPick={setTheme}
          />
          <span className="env-pill">SIM</span>
          <StatusPill />
        </div>
      </header>
      <Outlet />
      <KeyboardChords />
    </div>
  );
}

export const Route = createRootRoute({ component: RootShell });
