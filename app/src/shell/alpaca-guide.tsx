import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import type { JoinIndex } from "../live/join";
import { JoinForm, STARTING_LINE_LABEL } from "./join-form";

/**
 * THE ALPACA SETUP GUIDE (design handoff 2026-09-03, "Streamlined Onboarding") — five steps to a
 * connected paper account, as PROGRESSIVE-DISCLOSURE ACCORDIONS. Most of these steps happen in
 * another app (Alpaca's), so each is a card the member opens when they reach it: step 1 is open
 * by default, and steps open and close INDEPENDENTLY — opening one never collapses another, so a
 * member can keep several open and the open one is the "you are here" cue.
 *
 * This reverses the 2026-09-02 call that made the guide five flat cards ("an accordion hid the
 * $1,000,000 reset"). The handoff carries the reset differently: step 3's title says INCREASE, not
 * set — the word itself reinforces overriding Alpaca's $100,000 default — and the connect form
 * lives INSIDE step 5's body, so nobody reaches the form without passing the steps above it.
 *
 * The form is `JoinForm` unchanged: every validation (display name, the `PK` paper-key check, the
 * secret length, the $1,000,000 balance check with its reset walkthrough) holds exactly as before.
 * The open set persists per browser so a deep link restores the member's place.
 */

interface GuideStep {
  readonly title: string;
  readonly body: string;
  readonly link?: { readonly href: string; readonly label: string };
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    title: "Create a free Alpaca account",
    body: "Sign up at alpaca.markets — it's free and needs no funding. Paper trading is simulated money, so there's nothing to deposit.",
    link: { href: "https://alpaca.markets", label: "alpaca.markets" },
  },
  {
    title: "Switch to Paper Trading",
    body: "In the Alpaca dashboard, use the toggle near the top-left to switch from Live to Paper. This is important — we only ever use paper keys.",
    link: { href: "https://app.alpaca.markets", label: "Alpaca dashboard" },
  },
  {
    title: "Increase your paper balance to $1,000,000",
    body: "Alpaca paper accounts default to $100,000. Everyone in the league starts from the same capital, so use the paper dashboard's reset option to set your balance to exactly $1,000,000 USD before generating your keys.",
  },
  {
    title: "Generate your paper API keys",
    body: "On the paper dashboard's right side, find API Keys and click Generate. Copy the secret immediately — it is shown only once. The key stays visible and can be copied any time.",
  },
  {
    title: "Copy/paste account key and secret below",
    body: "Paste the key and secret into the form and give yourself a display name.",
  },
];

const OPEN_KEY = "sc.alpaca-guide.open";

/** The persisted open set — step 1 alone when nothing is stored or storage is unavailable. */
function readOpen(): ReadonlySet<number> {
  try {
    const raw = localStorage.getItem(OPEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) return new Set(parsed);
  } catch {
    // storage unavailable or corrupt — fall through to the default
  }
  return new Set([0]);
}

function writeOpen(open: ReadonlySet<number>): void {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify([...open]));
  } catch {
    // storage unavailable — the open set just doesn't persist
  }
}

function Step({
  index,
  step,
  open,
  onToggle,
  children,
}: {
  readonly index: number;
  readonly step: GuideStep;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children?: ReactNode;
}): ReactElement {
  const bodyId = `alpaca-guide-step-${index + 1}`;
  return (
    <li className={`ag-step${open ? " ag-open" : ""}`}>
      <button
        type="button"
        className="ag-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className="ag-n num" aria-hidden="true">
          {index + 1}
        </span>
        <span className="ag-title">{step.title}</span>
        <span className="ag-chev" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div id={bodyId} className="ag-body">
          <p className="ag-text">{step.body}</p>
          {step.link ? (
            <a
              className="ag-link num"
              href={step.link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {step.link.label} ↗
            </a>
          ) : null}
          {children}
        </div>
      ) : null}
    </li>
  );
}

/** @category onboarding */
export function AlpacaGuide({
  join,
  onJoined,
}: {
  /** `/api/join`'s index — undefined while loading. The form renders only when it's wired. */
  readonly join: JoinIndex | undefined;
  readonly onJoined: (result: { readonly id: string; readonly displayName: string }) => void;
}): ReactElement {
  const [open, setOpen] = useState<ReadonlySet<number>>(readOpen);
  const toggle = (i: number) => {
    const next = new Set(open);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setOpen(next);
    writeOpen(next);
  };
  const last = GUIDE_STEPS.length - 1;
  return (
    <ol className="ag" aria-label="Five steps to connect">
      {GUIDE_STEPS.map((step, i) => (
        <Step key={step.title} index={i} step={step} open={open.has(i)} onToggle={() => toggle(i)}>
          {i === last ? (
            <div className="ag-connect">
              {join?.wired ? (
                <JoinForm data={join} onJoined={onJoined} />
              ) : join ? (
                <p className="note">Joining isn't wired in this deployment.</p>
              ) : null}
              <p className="ag-caveat">
                Paper keys only · balance verified at {STARTING_LINE_LABEL} USD · alpaca.markets →
                Paper Trading → API Keys. Keys are checked with read-only calls, then stored
                encrypted — no orders are ever placed on your behalf.
              </p>
            </div>
          ) : null}
        </Step>
      ))}
    </ol>
  );
}
