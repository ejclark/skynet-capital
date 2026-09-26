# Secretary digest loop

**Technology:** claude.ai Routine (daily 12:00, trig_01KaMC2uR3cFW5XTUL6rzPuS), scripts/digest-scan.mjs, /secretary skill, ride-along scans, /ship

**Responsibility:** Protects Eric's attention: when digest-scan says a digest is due (5 commits or 7 days), assemble the three tiers (needs-you, headlines, noise absorbed) into docs/digests/<date>.md, fold in config-audit, comment-bloat, incident and doctrine findings, ship it, push-notify the needs-you count

**Code roots:** `.claude/skills/secretary/SKILL.md` · `scripts/digest-scan.mjs` · `scripts/config-audit.mjs` · `scripts/comment-bloat-scan.mjs` · `scripts/incident-scan.mjs` · `scripts/doctrine-scan.mjs` · `scripts/comms-scan.mjs` · `docs/digests/` · `docs/ROUTINES.md` · `docs/plans/secretary.md`

**Entrypoints:** `node scripts/digest-scan.mjs --due` · `docs/ROUTINES.md Active table (the Routine row)`

**Grounding:** docs/ROUTINES.md 'Secretary digest' row; scripts/digest-scan.mjs header; docs/digests/2026-09-24.md is the latest artifact

**Refuter's verdict:** grounded — Label comms-scan.mjs as the digest's landing-meter table (SKILL.md:44), not as a Needs-you ride-along. The Routine row names only four ride-alongs: config-audit, comment-bloat, incident and doctrine. The push is the Need

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| ccp | secretary | Fires the daily digest Routine | claude.ai Routine trig_01KaMC2uR3cFW5XTUL6rzPuS | grounded — Optional wording: "Fires daily 12:00 digest Routine (trig_01KaMC2u…; gated by digest-scan --due; also runs the config, comment-bloat, incident and doctrine audits)". As labelled now, the element would not mislead a build |
| secretary | ledgers | Writes docs/digests/<date>.md and ships it | /ship | grounded — Optional: label it "Writes docs/digests/<YYYY-MM-DD>.md (from TEMPLATE.md) and ships it via /ship (auto-merged docs PR)", and add a separate secretary → Eric edge for the push notification (Needs-you count + top headline |
| secretary | eric | Push-notifies the needs-you count and top headline | claude.ai push notification | grounded — Optional precision: label the edge "push-notifies (claude.ai Routine, daily, only when a digest is due): Needs-you count + top headline". It should also show that the sender is the claude.ai Routine, not a repo process. |
