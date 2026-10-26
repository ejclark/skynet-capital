import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { fetchGithubToken, rotateGithubTokenRequest } from "../live/admin";
import { InlineResult } from "../ui";

/**
 * GITHUB ACCESS — the owner renews the token Moneypenny files issues with, from a form instead of
 * a terminal (Eric, 2026-10-24). The Alpaca key rotation's twin: paste, the server checks it with
 * GitHub, seals it to the volume and swaps it in live; the token is never shown back.
 *
 * Self-gating like the guest list: renders only on the server's own owner answer. Status words
 * carry the meaning, never colour alone (BRAND.md → Accessibility).
 */

const DAY_MS = 86_400_000;
/** Warn this many days before GitHub's expiry, so a renewal happens before filing breaks. */
const WARN_DAYS = 7;

function daysLeft(expiresAt: string | undefined, now: number): number | undefined {
  return expiresAt ? Math.floor((Date.parse(expiresAt) - now) / DAY_MS) : undefined;
}

/** GitHub's fine-grained token page, pre-filled with the name, owner, a year, and the one
 *  permission filing needs. The repo itself can't be pre-filled — the steps say to pick it. */
function newTokenUrl(repo: string): string {
  const owner = repo.split("/")[0] ?? "";
  const q = new URLSearchParams({
    name: "skynet-capital-moneypenny",
    description: "Moneypenny files member feedback as issues",
    target_name: owner,
    expires_in: "366",
    issues: "write",
  });
  return `https://github.com/settings/personal-access-tokens/new?${q.toString()}`;
}

const SOURCE: Readonly<Record<"saved" | "host" | "none", string>> = {
  saved: "saved here",
  host: "host secret",
  none: "none set",
};

function expiryText(
  expiresAt: string | undefined,
  left: number | undefined,
  soon: boolean,
): string {
  if (expiresAt === undefined || left === undefined) return "no expiry on record";
  const day = expiresAt.slice(0, 10);
  if (left < 0) return `expired ${day}`;
  return `${day} · ${left} day${left === 1 ? "" : "s"} left${soon ? " — renew now" : ""}`;
}

/** The three steps to a new token, the first one a pre-filled link to GitHub's form. */
function NewTokenSteps({ repo }: { readonly repo: string }): ReactElement {
  return (
    <ol className="set-hint">
      <li>
        <a href={newTokenUrl(repo)} target="_blank" rel="noreferrer">
          Create a token on GitHub
        </a>{" "}
        — name, expiry and the Issues permission come pre-filled.
      </li>
      <li>
        Under <b>Repository access</b>, choose <b>Only select repositories</b> →{" "}
        <span className="num">{repo}</span>, then <b>Generate token</b>.
      </li>
      <li>Copy it, paste it below, and save. It's checked with GitHub before it's used.</li>
    </ol>
  );
}

/** @category admin */
export function GithubTokenCard(): ReactElement | null {
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: ["admin-github-token"], queryFn: fetchGithubToken });
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | undefined>();
  if (!status.data?.owner) return null;
  const view = status.data;
  const left = daysLeft(view.expiresAt, Date.now());
  const soon = left !== undefined && left <= WARN_DAYS;
  const save = async () => {
    setBusy(true);
    try {
      const answer = await rotateGithubTokenRequest(token.trim());
      setNote({ ok: answer.ok, text: answer.message ?? answer.error ?? "" });
      if (answer.ok) setToken("");
      await queryClient.invalidateQueries({ queryKey: ["admin-github-token"] });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="set-card adm">
      <h2 className="set-card-h">🔑 GitHub access</h2>
      <p className="mc-sub">
        The token Moneypenny uses to file feedback as issues on{" "}
        <span className="num">{view.repo}</span>. Paste a new one here when it expires — no restart,
        and it's never shown again.
      </p>
      <div className="adm-rows">
        <div className="adm-row">
          <span className="adm-main">{view.working ? "✓ Working" : "✕ Not working"}</span>
          <span className="adm-meta">
            {view.working ? "GitHub accepts the token in use." : view.problem}
          </span>
          <span className={`adm-chip${view.working && !soon ? " adm-ok" : ""}`}>
            {SOURCE[view.source]}
          </span>
        </div>
        <div className="adm-row">
          <span className="adm-main">Expires</span>
          <span className={`adm-meta num${soon ? " adm-warn" : ""}`}>
            {expiryText(view.expiresAt, left, soon)}
          </span>
          {view.savedAt ? (
            <span className="adm-meta num">
              saved {view.savedAt.slice(0, 10)} by {view.savedBy}
            </span>
          ) : null}
        </div>
      </div>
      {view.secure ? (
        <>
          <NewTokenSteps repo={view.repo} />
          <div className="adm-form">
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={token}
              placeholder="github_pat_…"
              aria-label="New GitHub token"
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary mc-btn"
              disabled={busy || token.trim() === ""}
              onClick={() => void save()}
            >
              {busy ? "Checking with GitHub…" : "Save new token"}
            </button>
          </div>
        </>
      ) : (
        <InlineResult tone="err" live={false}>
          Saving a token is off: this deployment has no store secret to encrypt it with.
        </InlineResult>
      )}
      {note ? <InlineResult tone={note.ok ? "ok" : "err"}>{note.text}</InlineResult> : null}
    </section>
  );
}
