# userJourney (User Journey Diagram) — https://mermaid.js.org/syntax/userJourney.html. What it IS for: an as-is UX map of the steps one or more actors take to finish a task, split into phases. Each step gets a 1-5 score (satisfaction or effort), drawn as a face whose mouth shape and height show the score. It is a friction/sentiment chart, not a flow, state or reasoning diagram. The house lint (scripts/mermaid-lint.mjs DECLINED map) currently refuses every `journey` block. — `journey`

**Status:** stable (not marked beta or experimental on the docs page or in the sidebar; no -beta suffix). A long-standing core type. It parses on Mermaid 11.17.2, GitHub's version (verified locally against node_modules/mermaid 11.17.2).
**GitHub (11.17.2):** The docs page says nothing about GitHub or renderer support. Verified: journey parses on Mermaid 11.17.2, which docs/PICTURES.md records as github.com's production renderer version (read 2026-09-25). There is no click/link syntax in this type, so GitHub's disabled callbacks don't matter. It renders on a phone browser but not in the GitHub mobile app (which renders no Mermaid). No theme or themeVariables are allowed, so the default fillType colours apply in light and dark. Face fill (#FFF8DC) is hard-coded unless faceColor is set, so faces stay light in dark mode. The repo's own gate refuses all journey blocks (scripts/mermaid-lint.mjs DECLINED), so nothing reaches GitHub today without a lint change. Still verify the render on github.com before relying on it.

## When to reach for it
- UX friction audits of one member-facing flow on the trading surfaces, scored step by step as-is. Examples: bot call sheet, then prefilled ticket, then paper fill, then finding it in history; or onboarding, or the feedback form. The frown steps become the scope of a plan issue. The one honest use: the chart's subject IS a per-step judgement.
- /teardown output that compares a reference app's flow with ours. Two small journeys, 'theirs' and 'ours', over the same 2-3 steps can feed the borrow / adapt / skip call sheet, with the rubric in the caption.
- Plan or issue capsules for a UX redesign, as the 'as-is' picture under a proposed-design caption, with an EARS criterion targeting the frown step (e.g. WHEN a member opens the fill history THE app SHALL show the latest fill first).
- Reviewer-experience audits of the operating model from Eric's seat: e.g. PR notification, picture, call sheet, approve; or digest arrival, triage, decision. Useful for the secretary skill when redesigning a feedback template, with the score framed as effort or attention cost.
- Only with ≤3 tasks, one actor, a stated 1-5 rubric in accDescr and the caption, and after the house lint's DECLINED rule is narrowed. Scores should be grounded in something observable (taps, seconds, abandon rate bucketed to 1-5) to stay within the honesty rules.

**Not for:**
- Reasoning journeys (docs/JOURNEYS/, the /journey skill): house-banned and the wrong shape. Claims that moved, branches killed and open forks are a flowchart or timeline, not a satisfaction curve.
- PR bodies under the fridge rule, including platter PRs. PICTURES.md honesty rule 2 ('No verdicts: the picture states what changed, never how good it is') conflicts with a chart whose whole payload is a 1-5 verdict per step. Use a flowchart/sequence/state picture or a before/after screenshot.
- Pipelines and lifecycles: a PR going verify, auto-merge, deploy, or an issue moving proposed, ready, executing, done. There are no edges, branches, guards or loops, so the picture would imply a satisfaction story that doesn't exist. Use stateDiagram-v2 or flowchart LR.
- System request paths: bot recommends, then ticket, then broker fill as a message exchange. Use sequenceDiagram; journey only fits if the subject is how the member felt at each step.
- Quantitative series such as a fitness budget ratcheting down over weeks. The 1-5 integer score is not a data axis and faces would editorialise the numbers. Use xychart-beta or a table.
- Research call sheets (call · confidence · why · falsifier) and the interrogation call sheet (verbatim/amended/reject/status-quo). These are tables. Mapping confidence to smiley faces misreads confidence as sentiment and drops the falsifier.
- Anything that must distinguish several actors (bot personas vs member vs broker). Actor identity is hue-only dots, which fails the colourblind reader.
- Any journey with more than 3 tasks meant for a 390px phone. It renders 700-1500px wide and shrinks to unreadable text.
- Architecture: there is no structure at all. Use C4 or flowchart.

## Header forms
- journey   (the header must be exactly lowercase: `JOURNEY` fails diagram detection with 'No diagram type detected'. Keywords inside the body such as title and section are case-insensitive.)
- journey\n    title <text>   (inline title; may appear anywhere in the body, even after tasks)
- ---\ntitle: <text>\n---\njourney   (a YAML frontmatter title renders as the bold diagram title; verified in the Mermaid Chart MCP render)
- ---\nconfig:\n  journey:\n    <key>: <value>\n---\njourney   (type-specific config in frontmatter; verified that taskMargin/width/diagramMarginX/leftMargin take effect)
- %%{init: {"journey": {"taskMargin": 10}}}%%\njourney   (a directive; parses, but is deprecated upstream and flagged as a note by the house lint)
- %% comment line(s) before `journey` are allowed
- journey   (with an empty body; parses as a valid empty diagram)

## Primitives
| Form | Syntax | Note |
|---|---|---|
| task | `<Task name>: <score>: <Actor1>, <Actor2>` | Documented form: `Task name: <score>: <comma separated list of actors>`. Tasks render left-to-right in source order as 150x50 boxes. Leading indentation is optional; tabs are OK. |
| task without actors | `<Task name>: <score>` | Undocumented but accepted by the parser: no actor dots and no legend entry. A trailing colon (`T: 5:`) creates an empty-string actor "". |
| score | `the number between the two colons, e.g. `: 4 :`` | Docs say 1 to 5 inclusive, but the parser only runs Number(). 0, 7 and 3.5 are all accepted, a word gives NaN, and an empty score (`T: : Me`) gives 0. Rendering: score >3 draws a smile, <3 a frown, =3 a flat mouth. The face sits at y = 300 + (5 - score) * 30, so height also encodes the score. Out-of-range values draw the face off the 1-5 band. |
| actor | `the comma-separated names after the second colon, e.g. `: Member, Bot (Kestrel)`` | Actors are implied; there is no declaration. They are trimmed, de-duplicated and sorted alphabetically into a left legend (a coloured dot plus the name). Colours come from actorColours by sorted index and cycle after 6. In each task box an actor appears only as a coloured dot (r=7, 10px apart, overlapping) with an SVG <title> hover tooltip, never as text. |
| title | `title <text>` | Rendered bold at the top left (titleFontSize default 4ex). Colons and parentheses are fine. `#` truncates it and `;` is a parse error. |
| section header (rendered) | `section <name>` | A coloured bar above its tasks whose width spans the consecutive tasks in that section. See grouping. |

## Relations
| Form | Syntax | Note |
|---|---|---|
| implicit sequence | `(none; source order only)` | journey has NO edge or arrow syntax. Tasks are placed left to right in the order written. The renderer draws one fixed thick black arrow (stroke-width 4, arrowhead marker) across the diagram as the timeline. It connects nothing and cannot be styled or labelled. |
| task drop line (rendered) | `(automatic)` | Each task gets a dashed vertical line (stroke-dasharray 4 2) from its box down to its score face. Not controllable. |
| task-actor membership | `<Task>: <score>: A, B` | The only 'relationship' in the type: which actors took part in a step. It is shown by hue-only dots (see achromatic_emphasis). |

## Grouping
- section <name>: groups all following tasks until the next section. The header bar spans that run of consecutive tasks. Sections are flat (no nesting).
- Section names cannot contain `:` (a parse error, e.g. `section Step 1: ticket`), `;` (a parse error) or `#` (silently truncates the name, e.g. `section Issue #42 work` becomes 'Issue ').
- A bare `section` with no name is a parse error, because the keyword needs whitespace plus text.
- Duplicate section names are allowed. Each non-consecutive occurrence draws a new header bar and takes the next fill in the colour cycle.
- Tasks before the first `section` get no header bar (section '').
- Section fill cycles by section index through the theme's fillType0..fillType7 (CSS on .section-type-N / .task-type-N); task boxes share their section's fill.

## Annotations
- title <text> (inline) or frontmatter `title:`. Either one renders a bold title.
- accTitle: <text>  (becomes SVG <title> plus aria-labelledby; verified in render)
- accDescr: <single line>  or  accDescr {\n multi\n line\n}  (becomes SVG <desc> plus aria-describedby; verified)
- %% comment: only a whole-line %% comment is safe. A trailing `%% ...` after a task is NOT stripped: it becomes part of the last actor's name (verified: `T: 3: Me %% trailing` gives actor 'Me %% trailing').
- `#` also starts a comment anywhere on a line (lexer rule `\#[^\n]*`). After an actor list it is harmless, but it truncates titles and sections and breaks task names.
- The SVG root carries aria-roledescription="journey" automatically.
- Actor dots in tasks carry an SVG <title> (hover tooltip = actor name). There is no click, link, href, callback, note or tooltip syntax in this type.

## Emphasis without hue (the colourblind rule)
- Score is the one channel that is natively hue-free. The mouth shape (smile >3, flat =3, frown <3) plus the face's height (y = 300 + (5 - score) * 30) survive red/green colourblindness and dark mode. Caveat: 4 and 5 are both smiles and 1 and 2 are both frowns, so only height separates them. Use the extremes (1, 3, 5) when the distinction matters.
- Section header text is the grouping carrier, because the section fill is only hue. Number the sections in their names ('1 Recommend', '2 Ticket', '3 Fill') so phase order reads without colour.
- Put the emphasis in the task text itself, since there is no bold or markdown. Use a plain-word prefix ('NEW', 'CUT', 'PAIN') or a monochrome unicode glyph (✓ ✗ ▲ ▼ ⚠ →). All parse fine (verified). `<b>` and other HTML render as literal text; avoid coloured emoji like 🟢, which carry meaning only by hue.
- Actor identity is HUE-ONLY inside task boxes: an unlabelled coloured dot. The default palette has two greens (#8FBC8F, #7CFC00) and cycles after 6 actors, so a red/green colourblind reader cannot tell actors apart. Mitigation: one actor per diagram, or name the actor in the task text ('Bot posts call sheet') and keep each task's actor list to one name.
- Position and order: the left-to-right order along the fixed timeline arrow is the sequence cue. There are no edge styles (no thick, dotted or dashed variants) to use.
- accTitle/accDescr: state the scoring rubric in words ('1 = abandoned, 5 = no friction') so screen readers and raw-text readers get the meaning. Repeat the rubric in the markdown caption, per the PICTURES.md provenance rule.

## Styling hooks
- No classDef, style, linkStyle, `:::`, or click. `classDef` inside a journey is a parse error (verified).
- themeVariables fillType0..fillType7: section and task fills, 1st..8th section (documented in the theming page's 'User Journey Colors' table). Quirk in styles.js: fillType1-7 only apply when fillType0 is set, which every built-in theme does.
- themeVariables actor0..actor5: CSS fill for .actor-N dots (styles.js; not in the theming docs). They override the actorColours attribute fill.
- themeVariables faceColor: score face fill (default #FFF8DC; styles.js, undocumented).
- Generic theme vars it reads: textColor (labels, legend, lines), fontFamily, mainBkg/nodeBorder (unused .node rules), titleColor.
- CSS classes you could target in a custom stylesheet (not possible on GitHub): .journey-section, .section-type-N, .task, .task-type-N, .task-line, .face, .mouth, .actor-N, .legend, .label.
- Config colour arrays: journey.actorColours (works, via the fill attribute), journey.sectionFills / sectionColours (effectively dead: the renderer captures them at module load, and the .section-type-N CSS overrides the rect fill attribute anyway).
- House rule: `theme:` and `themeVariables` in frontmatter or init are a lint PROBLEM (docs/PICTURES.md, dark mode), so on GitHub every hook above is off-limits in practice.

## Config keys
- Key (default) → effect, from config.schema.yaml JourneyDiagramConfig and journeyRenderer.ts/svgDraw.js.
- journey.diagramMarginX (50): outer X margin. Also used as the inter-task gap when computing SECTION bar width (see gotchas).
- journey.diagramMarginY (10): outer Y margin.
- journey.leftMargin (150): space reserved left of the first task, plus the widest legend label.
- journey.maxLabelWidth (360): max actor-legend label width before wrapping or hyphenating.
- journey.width (150): task box width.
- journey.height (50): task and section box height; the timeline arrow sits at height*4.
- journey.taskMargin (50): gap between tasks. Tasks sit at i * (taskMargin + width).
- journey.taskFontSize (14) and journey.taskFontFamily ('"Open Sans", sans-serif'): task text in tspan mode.
- journey.textPlacement ('fo'; also 'tspan' or 'old'). fo uses an HTML div in a foreignObject, wraps, and shows `<br>` literally. tspan splits the task text on `<br>` into lines. old is a single SVG text.
- journey.boxMargin (10) and journey.boxTextMargin (5): bounds padding and legend text margin.
- journey.actorColours (['#8FBC8F','#7CFC00','#00FFFF','#20B2AA','#B0E0E6','#FFFFE0']): actor dot fills by alphabetical actor index.
- journey.sectionFills and journey.sectionColours: nominal section fills and text colours. The fills are overridden by the theme fillTypeN CSS, and both arrays are captured at import time, so user values are effectively ignored.
- journey.titleColor (''), journey.titleFontFamily ('"trebuchet ms", verdana, arial, sans-serif') and journey.titleFontSize ('4ex'): title styling.
- journey.useMaxWidth (true, from BaseDiagramConfig): scales the SVG to the container width.
- Schema keys copied from the sequence config that the journey renderer never reads: noteMargin (10), messageMargin (35), messageAlign (center), bottomMarginAdj (1), rightAngles (false), activationWidth (10).
- Measured widths: defaults give about 500px for 1 task, +200px per extra task (6 tasks = 1500px). The compact config {width:120, taskMargin:10, diagramMarginX:10, leftMargin:10} gives 3 tasks = 439px.

## Gotchas — what silently breaks
- HOUSE BAN: scripts/mermaid-lint.mjs lists `journey` in DECLINED, so ANY journey block fails `ship.sh checkbody`, `issue:lint` and the CI corpus scan (tests/arch/mermaid-lint.spec.ts), not just blocks in reasoning journeys. Using it anywhere means first narrowing that rule (e.g. allow outside docs/JOURNEYS/). docs/PICTURES.md and .claude/skills/journey/SKILL.md both forbid it for reasoning journeys.
- Header must be lowercase `journey`. `JOURNEY` fails detection, even though the body lexer is case-insensitive.
- Colon inside a task name SILENTLY MISPARSES (verified). `Fill at 09:31: 5: Me` becomes task 'Fill at 09' with score 31 and actor '5'. Write times as 0931. A colon in a `title` is fine; a colon in a `section` name is a parse error.
- `#` silently truncates titles and section names (`title PR #123 ships` becomes 'PR '; `section Issue #42 work` becomes 'Issue '), and `Fix #123: 5: Me` is a parse error. Never put PR or issue numbers with # in a journey. Write 'PR 123'.
- `;` anywhere in a title, section or task line is a parse error (INVALID token).
- Task names that START with a keyword break (case-insensitive). 'Title search: 3: Me' is silently swallowed as the diagram TITLE ('search: 3: Me') and the task disappears. 'Section review: 3: Me' and 'Journey map: 3: Me' are parse errors. The keyword mid-name is fine ('Map the journey').
- A bare `title` with no text on its line swallows the NEXT line as the title, because the `title\s` regex matches the newline (verified: the task vanished into the title).
- Double quotes are NOT an escape. `"Quoted: task": 4: Me` still splits on the colon and yields score NaN with actor '4'. Parentheses and brackets are safe unquoted in titles, sections, tasks and actors (verified: `Ticket (SPY 450C): 4: Member, Bot (Kestrel)`).
- Scores are not validated. 0, 7, 3.5 and words are accepted; 0 or 7 draw the face outside the 1-5 band, and a word gives NaN with a broken face position. Nothing errors.
- Missing score (`Make tea`) is a parse error. A trailing colon with no actors (`Make tea: 5:`) creates a phantom empty-named actor in the legend.
- A trailing `%%` comment on a task line becomes part of the actor name. Use whole-line comments only.
- HTML in labels is literal. `<br>` shows as text in the default textPlacement 'fo' and only breaks lines under textPlacement 'tspan'. `<b>` never bolds. There is no markdown-string support.
- WIDTH, the phone killer: the layout grows only horizontally, about 500px + 200px per extra task with defaults (6 tasks measured at 1500px), while height is fixed at about 470-540px. With useMaxWidth the SVG shrinks to fit a 390px phone, so 6 tasks render at about 0.26x (14px text becomes about 4px). Budget: 1-2 tasks at defaults, or at most 3 with the compact config.
- Config trap: the section bar width uses diagramMarginX as the inter-task gap, while task spacing uses taskMargin. Change taskMargin without matching diagramMarginX and section headers overlap or misalign (measured: 350px bars on 320px-pitch sections). Shrinking both can clip the rightmost task past the viewBox (measured: task edge 449 > viewBox 439). Re-render after any geometry change.
- Actor colours cycle after 6 actors (actorColours has 6 entries), so 7+ actors produce duplicate dot colours. Dots in a task are 10px apart with r=7 and overlap, so more than 3 actors in one task becomes an unreadable blob.
- Unicode (é, →, ✓) and emoji parse fine (verified).
- No links, no click, no notes, no classDef or style. Any attempt is a parse error or a no-op.
- Not documented on the page but true in the source: tasks outside any section are allowed, sections can repeat, and title can come after tasks.

## Starters (validated mcp__Mermaid_Chart__validate_and_render_mermaid_diagram (valid:true, diagramType 'journey' for both; the rich render showed the frontmatter title bold, accTitle/accDescr as SVG <title>/<desc>, 3 section bars, and faces at y=330/390/300/360/300/420 for scores 4/2/5/3/5/1, with a 1500px-wide viewBox). The Mermaid version behind the MCP tool is not reported. Also parsed all edge-case probes with the repo's pinned node_modules/mermaid 11.17.2 (= github.com's renderer per docs/PICTURES.md), via mermaid.parse plus getDiagramFromText, read-only. The compact-config probe (3 tasks, width 120 / taskMargin 10 / diagramMarginX 10 / leftMargin 10) also rendered valid at 439px. context7 was unavailable (invalid API key).; minimal ✓, rich ✓ — No errors on the two examples. Probe errors (expected; they document gotchas): `JOURNEY` header gives 'No diagram type detected'. `Fix #123: 5: Me` gives Expecting 'taskData', got 'NEWLINE'. `Section review: 3: Me` and `section Step 1: ticket` give got 'taskData'. `Journey map: 3: Me` gives got 'journey'. `Buy; sell` and `title A; B` give INVALID. `Make tea` (no score) gives got 'NEWLINE'. `classDef` gives got ':'.)

Minimal:

```text
journey
    Make tea: 5: Me
```
_(declined on GitHub surfaces — shown for recognition only)_

Rich (grounded in this repo):

```text
---
title: Member trade from a bot call (as-is friction)
---
journey
    accTitle: Member journey from bot recommendation to paper fill
    accDescr: Score 1 to 5 is how the step felt. The face mouth and its height carry the score, not colour.
    %% one actor per task keeps identity off hue; Bot named in the task text instead
    section 1 Recommend
      Read Bot call sheet: 4: Member
      Check why and falsifier: 2: Member
    section 2 Ticket
      Open prefilled ticket: 5: Member
      Adjust strike and qty: 3: Member
    section 3 Fill
      Paper fill confirms: 5: Member
      Find fill in history: 1: Member
```
_(declined on GitHub surfaces — shown for recognition only)_

## Sources
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/docs/syntax/userJourney.md
- https://mermaid.js.org/syntax/userJourney.html
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/diagrams/user-journey/parser/journey.jison
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/diagrams/user-journey/journeyDb.js
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/diagrams/user-journey/journeyRenderer.ts
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/diagrams/user-journey/svgDraw.js
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/diagrams/user-journey/styles.js
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/schemas/config.schema.yaml (JourneyDiagramConfig)
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/themes/theme-base.js, theme-default.js, theme-neutral.js (fillType0-7)
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/docs/config/theming.md (User Journey Colors table)
- /home/user/skynet-capital/docs/PICTURES.md
- /home/user/skynet-capital/scripts/mermaid-lint.mjs
- /home/user/skynet-capital/.claude/skills/journey/SKILL.md
- /home/user/skynet-capital/node_modules/mermaid (v11.17.2, local parse probes)
