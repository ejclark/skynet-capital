# The Operating Model — portable (lift & shift)

A **lift-and-shift of how this repo operates** — the working conventions, not the code. Skynet
Capital runs on a small "idea operating system": Eric injects thoughts freely, Claude routes each one,
ideas live in a durable backlog, Claude hunts side quests in proximity to real work, and everything
ships as small green PRs. This document lets you **copy that operating model into any other repo.**

Two ways to use it:

- **One paste (recommended).** Open a Claude session on the target repo and paste the
  [Activation prompt](#activation-prompt) below. Claude inspects the repo, fills in the
  stack-specific blanks, and writes a tailored `CLAUDE.md` + `docs/IDEAS.md`.
- **Manual.** Copy the two [Templates](#templates) into the target repo and fill the `<placeholders>`
  yourself.

Nothing here is Skynet-specific — the domain details (options, canvas, personas) are deliberately
left out. What transfers is the *process*.

---

## Activation prompt

> Copy everything in this block into a Claude session opened on the repo you want to transform.

```
Install this repo's "operating model" — how we work together, not the code. Do the following:

1. Inspect the repo to learn its stack: read the README, package manifest / build files, and any
   existing contributor docs. Derive the real VERIFY COMMANDS (typecheck, lint, test, build) and the
   commit/PR conventions actually used here. If a convention is unclear, ask me one question rather
   than guess.

2. Create CLAUDE.md at the repo root (or merge into an existing one) with these sections, adapted to
   this repo:
   - A one-paragraph "what this project is."
   - "Working with <me>" — a profile of how I think and my quality bar. Seed it with sensible
     defaults, mark it as mine to edit, and tell me it sharpens as I correct it. Ask me nothing yet;
     infer from the repo and our conversation, and I'll refine.
   - "Idea capture & routing (the adapter pattern)" — I inject ideas freely; you classify EVERY
     injected thought with a visible one-liner saying where it landed: act now / park (to
     docs/IDEAS.md) / profile note (update the profile) / question (answer, don't build). Optional
     prefixes I may use as overrides: NOW: / PARK: / ME: / Q:. No prefix required.
   - "Side quests — Claude generates ideas too" — while working, hunt for questions/clues in
     proximity to the current task; capture the worthy ones to docs/IDEAS.md without derailing, and
     surface each as a one-liner. Every idea records source + context: (src: <me> | Claude · while:
     <what we were doing>). Bias to quality over volume.
   - "Exquisite detail is a scalable process" — where an element has a rich backstory/lore, that
     licenses overly-refined detail; depth compounds with time invested; treat "make it more refined"
     as an open invitation.
   - "Ship loop" — the VERIFY COMMANDS you derived in step 1; branch off the default branch per
     change; small, focused, independently-shippable PRs; verify before merge (+ a screenshot/render
     for visual work); the repo's commit convention; and any repo-specific traps you noticed.

3. Create docs/IDEAS.md as the durable backlog: an Inbox (with an attribution legend — every idea
   tagged (src: … · while: …)), an "In progress", and a "Shipped" section. Seed the Inbox with any
   real TODOs / open threads you found while inspecting the repo, tagged as Claude-sourced side
   quests with their context.

4. Show me the two files for review before committing. Then, from now on, operate this way: route
   every idea I inject with a visible one-liner, hunt side quests as you work, and ship small green
   PRs.

Do not copy any Skynet-specific domain content — only the process. Keep it concise enough to scan,
detailed enough to execute.
```

---

## What gets installed (the operating model)

1. **Idea OS — capture & routing.** The user externalizes ideas freely; Claude is the adapter that
   classifies each one (act now / park / profile note / question) and *states where it landed*, so the
   working context stays focused and nothing is lost. Optional `NOW:` / `PARK:` / `ME:` / `Q:`
   prefixes override the guess.
2. **A durable backlog** (`docs/IDEAS.md`). Ideas leave the context window into a committed file —
   critical when the working environment is ephemeral. The in-session task list is the working subset.
3. **Side quests.** Claude actively hunts adjacent questions/clues in proximity to real work and logs
   the worthy ones — every idea tagged with **source** (whose it is) and the **`while:` context**
   (the proximity that exposed it), so a revisit still carries the thread.
4. **The profile.** A "Working with <you>" section that teaches Claude your patterns so it reads terse
   notes generously. It's yours to edit and sharpens with each correction.
5. **Exquisite detail as process.** Backstory/lore licenses refined depth; "make it more refined" is
   an open, repeatable invitation, not a one-off.
6. **Ship loop.** Small, focused, independently-shippable PRs; branch off default; verify (typecheck +
   lint + test + a render for visual work) before merge on green; conventional commits.

---

## Templates

Fill every `<placeholder>`. These mirror this repo's own `CLAUDE.md` and `docs/IDEAS.md`.

### `CLAUDE.md` (template)

```markdown
# <Project> — working notes for Claude

<One paragraph: what this project is and its north star.>

Engineering standards live in <link, if any>. This file is about **how we work together**.

## Working with <you>

<Your name> externalizes ideas as they occur — often mid-task, often as a metaphor. Read terse notes
generously against these patterns:

- <quality bar — e.g. "anything short of lovable is inadequate">
- <how you think — metaphors? systems? visuals?>
- <momentum vs. deliberation preference>
- <boundaries: what Claude must never self-authorize (credentials, spend, outward-facing actions)>
- <domain values — accuracy, honesty, tone>

_This section is <your> to edit; it sharpens as you correct it._

## Idea capture & routing (the adapter pattern)

For **every** injected thought, respond with a visible one-liner saying where it landed:
- **Act now** → do it this session.
- **Park** → append to `docs/IDEAS.md` + add a task; ack in one line, don't derail current work.
- **Profile note** → update "Working with <you>".
- **Question** → answer; don't build.

Optional overrides: `NOW:` act · `PARK:` capture only · `ME:` profile note · `Q:` answer, don't build.
No prefix required — absent one, Claude classifies and states the routing.

### Side quests — Claude generates ideas too

While working, hunt for questions/clues in proximity to the current problem; capture the worthy ones
to `docs/IDEAS.md` without derailing, and surface each as a one-liner. Every idea records source +
context: `(src: <you> | Claude · while: <what we were doing>)`. Quality over volume.

## Exquisite detail is a scalable process

Where an element has a rich backstory/lore, that licenses overly-refined detail — bake it in. Depth
compounds with time invested; treat "make it more refined" as an open invitation.

## Ship loop

- Branch off `<default-branch>` per change; small focused PRs; merge on green.
- Verify before merge: `<verify commands>`, plus a screenshot/render for visual work.
- <repo-specific traps>. Commit convention: <convention>.
```

### `docs/IDEAS.md` (template)

```markdown
# Ideas & Backlog

Durable home for ideas so they leave the working context but never get lost. <You> injects thoughts;
Claude routes each here (see `CLAUDE.md`). The in-session task list is the working subset; this file
is the permanent record.

**Attribution:** every idea records source + proximity — `(src: <you> | Claude · while: <context>)`.
<You>-sourced entries are intent; Claude-sourced ones are proposals to prune.

## Inbox (captured, not yet started)
- <idea> — <one line>. _(src: … · while: …)_

### Side quests (surfaced by Claude while working — proposals to prune)
- <idea> — <one line>. _(src: Claude · while: …)_

## In progress
_(nothing yet)_

## Shipped (recent)
- <thing> — PR #<n>
```

---

_This operating model is itself a living artifact — improvements to how we work here should flow back
into this document so the next lift-and-shift starts from the better version._
