import { addShell } from "./page-shell.js";

/**
 * The self-service onboarding guide (public /welcome). Documents what Skynet Capital is and the
 * league format, then lays out the join path in numbered steps, so an invite can be a one-line
 * greeting plus this link. Fully self-serve to sign-in. Split out of dashboard-server.ts to keep
 * the router within its arch budget — this is static copy with no routing logic.
 */
export function welcomeHtml(): string {
  return addShell(
    "Welcome — Skynet Capital",
    `<div class="hero-eyebrow">Invite-only · paper sandbox</div>
<h1 class="hero-title">A sandbox to learn options — with friends, family, and a few <b>machines</b>.</h1>
<p class="hero-lede">Skynet Capital is a friendly, <b>paper-money</b> trading league. Everyone trades a simulated
account, autonomous <b>bots</b> trade alongside the humans, and a live observatory shows how everyone's
doing. It's for learning the plays and having fun — <b>no real money, ever</b>. Everybody's welcome to win.</p>
<div class="feat-grid">
  <div class="feat"><div class="feat-ic">📈</div><div class="feat-h">Paper trading</div><div class="feat-p">Practice real options strategies with a simulated account. Zero risk — it's all on paper.</div></div>
  <div class="feat"><div class="feat-ic">🤖</div><div class="feat-h">Humans &amp; bots</div><div class="feat-p">Trade solo, co-op against the machines, or just watch the board. The bots each run a persona.</div></div>
  <div class="feat"><div class="feat-ic">🏆</div><div class="feat-h">Friendly league</div><div class="feat-p">A leaderboard for bragging rights among friends and family — everyone doing well is the point.</div></div>
</div>
<p class="sec-label">Join in three steps</p>
<div class="steps">
  <div class="step"><div class="step-n">1</div><div class="step-b"><h3>Sign in</h3><p>Use your Google account — the same email Eric added to the guest list. That's your seat at the table.</p></div></div>
  <div class="step"><div class="step-n">2</div><div class="step-b"><h3>Create a free Alpaca paper account</h3><p>Alpaca provides the simulated brokerage. It's free, takes a minute, and needs no funding — we'll walk you through it after you sign in.</p></div></div>
  <div class="step"><div class="step-n">3</div><div class="step-b"><h3>Connect it</h3><p>Paste your Alpaca <b>paper</b> API keys once. We read them only to show your balance and trades on the board — nothing is ever placed on your behalf.</p></div></div>
</div>
<a class="cta" href="/login">Get started → Sign in</a>
<p class="fineprint">New to options? Once you're in, the <a href="/learn">Learn</a> section starts you on the safest play and unlocks more as you're ready.<br>
Already set up? Head straight to the <a href="/login">observatory</a>. Not on the guest list yet? Ask Eric to add your email.<br>
Found a bug or spotted a side quest? <a href="/feedback">Share feedback</a> — we build this together.</p>`,
    true,
  );
}
