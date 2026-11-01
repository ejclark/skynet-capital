# What makes a check good — the rubric

Twelve rows. Score a check with Y (yes), P (part) or N (no); Y counts 1 and P counts half. The
score is one line in the audit row the skill ends with. Opened on demand from
`.claude/skills/fitness/SKILL.md` step 9; nothing loads it otherwise.

Words used here: a *seeded failure* is a broken input fed to a check. A *deliberate bug* is a
small error put in the check itself, to see whether its spec notices.

| # | Criterion | How to check it | Can a spec enforce it? | Source |
|---|---|---|---|---|
| 1 | **Names the outcome and the gap.** It says what must stay true, what it actually reads, and the difference | Name one state of the world that passes while the outcome fails | Partly: a required field and a seed. A person or the adversary pass judges the meaning | Anthropic evals (grade the end state, not the claim); Thoughtworks; `docs/PILLARS.md` |
| 2 | **Grown from real failures** | Cites failures and carries their shape as seeds | Partly: the citation exists. Whether the seed is faithful is a person's call | Anthropic (start from real failures); Hamel (read failures before writing evaluators) |
| 3 | **A seeded failure turns it red and a healthy seed stays green**, boundaries included | Table of seeds through the judge | **Yes** | Anthropic (balanced sets); DeMillo, Lipton, Sayward 1978 |
| 4 | **The wiring is tested, not only the judge** | Stub binaries record arguments; deliberate bugs in the probes get caught; plus one live read as a receipt | **Yes**, except the live receipt | Petrović and Ivanković; `docs/LESSONS.md` (stubs alone passed a harness that then failed three ways) |
| 5 | **Cannot read is unknown, and unknown ages into someone hearing** | Blind and malformed stubs read unknown; an age rule | **Yes** | Anthropic (give judges an unknown option); `docs/PILLARS.md` |
| 6 | **Runs where it can see, independent of what it watches** | A where-it-runs field against the runner; not skippable by what it watches | Partly: the field. Independence is a person's call | SRE book (symptoms, black-box); `docs/PILLARS.md` |
| 7 | **Classified on purpose:** atomic or holistic, triggered, continual or temporal, static or dynamic, automated or manual | The class matches the claim (an atomic read cannot prove a holistic outcome) | Field only | Ford, Parsons, Kua |
| 8 | **Detection and reset times measured on the real clock** | Replay on history at the real tick times; state both numbers | Yes where history exists | SRE workbook |
| 9 | **One incident, one notification, no alarm from normal operation** | Replay counts notifications; every alert is actionable | **Yes** for dedupe and flapping | SRE workbook and book |
| 10 | **The declared ending is the wired ending:** who hears, what corrects, what budget | Code reads the fields; corrector paths exist | **Yes** for wiring. Whether the fix heals is shown on first fire | Owner's item 7; SRE book (could the response be automated?) |
| 11 | **The cheapest grader that decides.** Code first. Where a person is the oracle: binary verdicts, one failure mode each, held-out true positive and negative rates, a different model grading | Numbers file beside the judge | Partly: the file. Labels are a person's | Anthropic; Hamel; Shankar et al. |
| 12 | **It can die, and can be shown alive:** a dated falsifier, and a seeded drill proving it can still fire | Date field read by `scripts/loop-check.mjs` | Partly: the date, not the meaning | `CLAUDE.md` research rule; Anthropic (capability against regression); Hamel (a 100% pass rate is a warning) |

**How much a spec can do, measured** (the #6470 study, 2026-11-01): seeds and stub binaries took
deliberate bugs caught from 16 of 40 to 39 of 40 on the list the spec was written against, and
from 3 of 28 to 7 of 28 on fresh bugs the spec's author had not seen. The second number is the
honest one; that is why step 7 of the skill uses a bug list from a separate pass.

## Sources

- https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- https://platform.claude.com/docs/en/docs/test-and-evaluate/develop-tests
- https://hamel.dev/blog/posts/evals-faq/
- https://arxiv.org/abs/2404.12272 (Shankar et al., who validates the validators)
- https://www.thoughtworks.com/insights/articles/fitness-function-driven-development
- Ford, Parsons, Kua: Building Evolutionary Architectures (fitness function classes)
- https://research.google/pubs/state-of-mutation-testing-at-google/ (Petrović and Ivanković)
- https://sre.google/workbook/alerting-on-slos/
- https://sre.google/sre-book/monitoring-distributed-systems/
- DeMillo, Lipton, Sayward 1978, DOI 10.1109/C-M.1978.218136
