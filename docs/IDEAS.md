# Ideas & Backlog

The durable home for ideas so they leave the working context but never get lost. Eric injects
thoughts freely; Claude routes each one here (see the routing convention in
[`CLAUDE.md`](../CLAUDE.md)). The in-session task list is the *working subset* pulled from this file;
this file is the permanent record (the session environment is ephemeral — uncommitted notes die with
it).

**Format:** newest ideas at the top of _Inbox_. When one is picked up, move it to _In progress_, and
to _Shipped_ (with the PR#) when done. Keep entries one or two lines — enough to reconstruct intent.

---

## Inbox (captured, not yet started)

### Larger tasks (need dedicated focus)
- **Login terminal drawer + backstory** — convert the canvas play-panel into a terminal-style DOM
  drawer that opens with a preamble/backstory. (tasks #68/#72; canvas→DOM migration; best done live.)
- **Two modes** — intro `/login` = fast preview (gist, gloss details); logged-in = slow, controllable,
  studyable inspection. (task #54)
- **Decoupled playcall drawer** — a left collapsible drawer housing Signal→Play→profit, decoupled from
  the trend chart, carried into the logged-in view; move the playcall recap into it with a connector
  line to its chart position. (tasks #49 + #51-remainder)
- **North-star autonomous pipeline** — recycle the playbook artifact as a systems-level pipeline
  toward autonomous deployment (recognize signal → recommend → trade, with safeguards). (task #41)
- **Lore universe (mixed multiverse)** — give each persona a character card (name, archetype,
  allegiance, one-line legend) surfaced on `/u/:id` and woven into trade narration + cityscape + copy;
  keep the system extensible to adopt others' ideas. Confirm the pantheon direction with Eric before
  broad rollout. (task #79; Sauron + the Eye of Sauron are the first thread.)

### Eric's governance calls (do not build unattended)
- **Feedback triage / auto-fix automation** on the issues the in-app funnel now creates. (task #74)
- **Self-service "request feedback access"** collaborator flow — largely *superseded* by the in-app
  feedback funnel (PR #80); likely closeable. (task #76)
- **History / persistence backend** — append-only equity + realized-P/L history to unlock
  performance-over-time, win rate, and "which plays worked" across the four observatory views (they
  currently ship with honest "coming once we have history" seams).

---

## In progress

_(nothing right now)_

---

## Shipped (recent)

- Eye of Sauron crowns a left-side empire tower and commands the tractor beam — PR #88, #89
- Sauron persona (the cold order-imposer bot) — PR #87
- Taller RSI oscillator lane — PR #86
- Cityscape: rain + blue-lightning storm — PR #85
- Cityscape: sparse red/amber accents — PR #84
- Cityscape: market-hours lighting — PR #83
- Cityscape: ticker billboards — PR #82
- In-app self-service feedback funnel + setup runbook — PR #80, #81
