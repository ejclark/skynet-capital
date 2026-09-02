import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchPlaybooks, type HumanPlaybook } from "../live/playbooks";
import { PageFrame } from "../shell/frame";
import { ProfileRail } from "../shell/profile-rail";

/**
 * MILESTONE M·03 — PLAYBOOKS (#1119), WIP — SEASON 1. Every playbook is a strategy a member first
 * runs by hand on the desk; the rung that proves it unlocks the playbook as a PREVIEW. Nothing here
 * arms or fires — the Arm control is disabled and says so — and the unlock state is the server's
 * reading of the fill ledger (`/api/playbooks`). Automation is earned; judgment stays the member's.
 */
function PlaybookCard({ p }: { readonly p: HumanPlaybook }): ReactElement {
  return (
    <div className={`pbk${p.unlocked ? " pbk-unlocked" : ""}`}>
      <span className={`chip pbk-glyph${p.unlocked ? " pbk-glyph-on" : ""}`} aria-hidden="true">
        {p.glyph}
      </span>
      <div className="pbk-body">
        <div className="pbk-head">
          <span className="pbk-title">{p.title}</span>
          <span className="pbk-kind num">{p.kind}</span>
        </div>
        <p className="pbk-detail">{p.detail}</p>
        <p className={`pbk-crit num${p.unlocked ? " pbk-crit-on" : ""}`}>
          {p.unlocked ? "✓" : "◷"} unlock: fill rung {p.unlocksAfter} ·{" "}
          {p.unlocksAfterName.toLowerCase()}
          {" — "}Season 1 adds: {p.seasonOneCriteria}
        </p>
      </div>
      <div className="pbk-side">
        <span className={`mc-badge num ${p.unlocked ? "mc-badge-complete" : "mc-badge-locked"}`}>
          {p.unlocked ? "✓ EARNED · PREVIEW" : "◷ LOCKED"}
        </span>
        {p.unlocked ? (
          <button
            type="button"
            className="btn"
            disabled
            title="Arming opens to human accounts with Season 1"
          >
            Arm · soon
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PlaybooksPage(): ReactElement {
  const playbooks = useQuery({ queryKey: ["playbooks"], queryFn: fetchPlaybooks });
  const rail = <ProfileRail current="playbooks" />;
  if (playbooks.isPending)
    return (
      <PageFrame rail={rail}>
        <p className="note">Opening the playbooks…</p>
      </PageFrame>
    );
  if (playbooks.isError || !playbooks.data)
    return (
      <PageFrame rail={rail}>
        <p className="note">Playbooks are unreachable.</p>
      </PageFrame>
    );
  const data = playbooks.data;
  return (
    <PageFrame rail={rail}>
      <header className="page-header">
        <div className="join-eyebrow">Milestone M·03 · Playbooks · earned automation</div>
        <h1>Prove the play by hand, then arm it</h1>
        <p>
          Every playbook is a strategy you first run <b>manually</b> on the desk. Fill the rung that
          proves it and the playbook unlocks as a preview — armed, it will draft the ticket for you
          whenever its setup appears.
        </p>
      </header>
      <p className="pbk-wip">
        <b>WIP</b> — Season 1 release. Nothing arms yet; the cards show what your fills will earn.{" "}
        <span className="num">
          {data.unlocked} / {data.total} unlocked
        </span>
      </p>
      <div className="pbk-list">
        {data.playbooks.map((p) => (
          <PlaybookCard key={p.id} p={p} />
        ))}
      </div>
      <p className="note">
        Armed playbooks will never fire on their own — they draft the ticket and wait for your
        confirm. Automation is earned, judgment stays yours.
      </p>
    </PageFrame>
  );
}

export const Route = createFileRoute("/playbooks")({ component: PlaybooksPage });
