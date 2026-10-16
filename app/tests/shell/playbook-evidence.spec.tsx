import { render, screen } from "@testing-library/react";
import type { PairRowView } from "../../src/live/playbook-store";
import { callSentence, PairEvidence, sureWhy } from "../../src/shell/playbook-evidence";

/**
 * A ticker's evidence as a call (#5444; rows by #5448). WHEN a ready row renders, it SHALL read: the
 * call in one sentence with its until-date; how sure, as a scale with its word and no number; this
 * report's forecast first, past reports second — never merged into one number; and why it is only
 * as sure as it is. WHEN no call exists for the coming report, the row SHALL say so. No p-value, no
 * "print", no "rose".
 */

const NVDA: PairRowView = {
  id: "S1-NVDA",
  symbols: ["NVDA"],
  status: "researched",
  qualifier: "weakened",
  statusLabel: "△ researched, below the house bar",
  stale: false,
  call: "Long from 20 trading sessions before a confirmed print to 6 before; flat from 5.",
  confidence: "medium",
  number: "15 of 15 run-ups positive, p=0.0032 (the house bar is ~0.001)",
  shelfOn: "2027-03-31",
  plainCall: "Buy NVDA's run-up before its earnings report",
  past: {
    line: "NVDA's price went up in the first two weeks of the hold before 13 of its last 14 reports.",
    up: 13,
    of: 14,
    era: "2023–26",
  },
  forecast: {
    reportOn: "2026-11-18",
    dateSet: false,
    call: "Stand aside",
    confidence: "high",
    wrongIf: "NVIDIA's call notice posted before 2026-10-21",
    href: "/research/events/nvda-2026-11-18-print",
  },
};

describe("the call sentence", () => {
  it("says what it does on the ticker and until when", () => {
    expect(callSentence(NVDA)).toMatch(
      /^Buy NVDA's run-up before its earnings report, until Mar 31/,
    );
  });

  it("says a conviction's check date instead", () => {
    expect(
      callSentence({ ...NVDA, status: "conviction", checkOn: "2027-01-29", shelfOn: undefined }),
    ).toMatch(/, on its owner's conviction, checked Jan 29/);
  });

  it("says why a weakened or borrowed row is only medium", () => {
    expect(sureWhy(NVDA)).toBe(
      "Only medium: the record isn't yet strong enough for the house's bar.",
    );
    expect(sureWhy({ ...NVDA, qualifier: "borrowed" })).toMatch(/the run-up's/);
    expect(sureWhy({ ...NVDA, qualifier: undefined })).toBeUndefined();
  });
});

describe("the evidence block", () => {
  it("draws the call, how sure at medium, this report then past reports, and no p-value", () => {
    render(<PairEvidence pair={NVDA} />);
    expect(screen.getByText(/^How sure ·/)).toHaveTextContent("How sure · medium");
    const now = screen.getByRole("region", { name: /^This report/ });
    const past = screen.getByRole("region", { name: "Past reports · 2023–26" });
    expect(now.compareDocumentPosition(past) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(now).toHaveTextContent("Stand aside");
    expect(now).toHaveTextContent("How sure: high · date not confirmed yet");
    expect(now).toHaveTextContent("Wrong if: NVIDIA's call notice posted before 2026-10-21");
    expect(past.querySelectorAll(".pbe-dots span")).toHaveLength(14);
    expect(past.querySelectorAll(".pbe-dots span[data-up]")).toHaveLength(13);
    expect(document.body).not.toHaveTextContent(/p=|\brose\b/);
  });

  it("says there is no call yet for a report R&D has not called — never blank", () => {
    render(
      <PairEvidence pair={{ ...NVDA, forecast: { reportOn: "2026-11-18", dateSet: true } }} />,
    );
    expect(screen.getByRole("region", { name: /^This report/ })).toHaveTextContent(
      /No call for the Nov 18 report yet · date confirmed/,
    );
  });

  it("says a report call is about the report itself on a play not timed to it", () => {
    render(<PairEvidence pair={NVDA} reportKeyed={false} />);
    expect(screen.getByRole("region", { name: /^This report/ })).toHaveTextContent(
      "R&D on trading the report itself: Stand aside",
    );
  });

  it("says when no report is on file for the ticker", () => {
    render(<PairEvidence pair={{ ...NVDA, forecast: undefined }} />);
    expect(screen.getByText("No earnings report on file for NVDA yet.")).toBeInTheDocument();
  });

  it("calls a record that is not a count 'the study', with no dots", () => {
    render(<PairEvidence pair={{ ...NVDA, past: { line: "Options paid for smaller moves." } }} />);
    const study = screen.getByRole("region", { name: "The study" });
    expect(study.querySelector(".pbe-dots")).toBeNull();
  });
});
