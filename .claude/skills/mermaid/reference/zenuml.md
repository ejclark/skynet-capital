# zenuml — `zenuml`

**Status:** Experimental external plugin, not part of core Mermaid. The page has no beta label, but its Integration section says: "Zenuml uses the experimental lazy loading & async rendering features which could change in the future." It needs the @mermaid-js/mermaid-zenuml package registered with mermaid.registerExternalDiagrams([zenuml]). Package.json on develop: version 1.0.0, peer mermaid ^10 || ^11, depends on @zenuml/core ^3.47.9. Any Mermaid build that does not register the plugin fails with "No diagram type detected matching given configuration for text: zenuml". That includes github.com and the Mermaid Chart MCP validator.
**GitHub (11.17.2):** GitHub does NOT render zenuml. The Mermaid page says nothing about GitHub; it only says zenuml needs the external plugin registered with mermaid.registerExternalDiagrams. GitHub community discussion #150175 ('zenuml mermaid diagrams don't render') reports github.com showing 'No diagram type detected matching given configuration'. The Mermaid Chart MCP validator gives the identical error. This repo's scripts/mermaid-lint.mjs (pinned to GitHub's Mermaid 11.17.2, read from GitHub's production bundle 2026-09-25) already declines zenuml with the replacement advice 'write a sequenceDiagram', and docs/PICTURES.md forbids it. Use sequenceDiagram on every GitHub surface.

## When to reach for it
- None of this repo's GitHub-rendered surfaces. It fails on PR bodies, issue capsules, plans, research docs and docs/*.md, and the repo lint (scripts/mermaid-lint.mjs) refuses it. For all of these, write a sequenceDiagram.
- Conceptual fit only, rendered OFF GitHub (zenuml.com, the JetBrains/Chrome plugins, or an in-app page that registers @mermaid-js/mermaid-zenuml): code-shaped nested call trees inside the API server. Example: the placeTicket handler reserve-cash, then quote, then write fill, with a try/catch/finally rollback. Its method-call-and-return syntax mirrors the code, so it is compact when drafting a handler refactor.
- Recording return values alongside calls (quote = Market.quote(pick)), where sequenceDiagram needs a separate dashed reply line per return.

**Not for:**
- Any fridge-rule opening picture in a PR body: GitHub shows an error box as the opening frame.
- Issue capsules read by a zero-context build session: the source reads like pseudo-code and invites the builder to treat it as an implementation spec.
- State lifecycles (issue proposed -> ready -> executing -> done, PR verify -> auto-merge -> deploy gates): use stateDiagram-v2 or a flowchart.
- Architecture (browser app, API server, bot runner, ledger store, GitHub, market-data provider): use C4 or a flowchart. ZenUML shows one interaction, not structure.
- Time series and ratchets (fitness budget shrinking over weeks): use xychart or timeline.
- Call sheets, interrogation verdicts (verbatim/amended/reject/status-quo) and platter item lists: use a table, quadrantChart or flowchart. There is no call/return nesting to show.
- Diagrams where readers need to cite numbered steps: no autonumber.
- Wide interactions with more than about 5 participants at 390px phone width.

## Header forms
- zenuml   (bare keyword on the first line. The plugin detector is /^\s*zenuml/, so leading whitespace is allowed. Nothing else goes on the header line.)
- zenuml\n    title Demo   (the title is a body directive on the line after the header, not frontmatter. ZenUML core docs: title must be the first statement and is only recognised when not followed by '.', '(' or '='.)
- ---\ntitle: X\n---\nzenuml ...   (YAML frontmatter with title/config is NOT documented for zenuml. The renderer only strips the 'zenuml' keyword and passes the rest to @zenuml/core renderToSvg, so Mermaid title/config keys should be assumed ignored. Unverified.)
- %%{init: ...}%% directive: not documented for zenuml. The renderer reads only sequence.useMaxWidth and securityLevel from the Mermaid config.

## Primitives
| Form | Syntax | Note |
|---|---|---|
| Implicit participant | `Alice->John: Hello John, how are you?` | Any name used in a message becomes a participant. Participants render in order of first appearance. |
| Explicit participant declaration (ordering) | `Bob Alice Alice->Bob: Hi Bob` | A bare name on its own line declares the participant and fixes left-to-right order. The page calls this optional. ZenUML core also accepts 'participant A'. |
| Annotator (participant type / icon) | `@Actor Alice @Database Bob` | The Mermaid page shows the full annotator list only as an image (img/zenuml-participant-annotators.png). The package README lists @Actor, @Database, @Boundary, @Control, @Entity, @Queue. ZenUML core DSL adds @Collections and treats any other @Name as a type annotation. |
| Alias (identifier + label) | `A as Alice J as John A->J: Hello John, how are you?` | Short identifier used in messages, descriptive label rendered. Core docs also show a quoted label: participant OrderService as "Order Service". |
| Creation (new object / participant) | `new A1 new A2(with, parameters)` | Creates a participant at that point in the timeline. Nestable with {}. Core also allows svc = new OrderService(cfg) { svc.init() }. |
| Participant full form (ZenUML core only, not on the Mermaid page) | `@Type <<Stereotype>> [emoji] ParticipantName Width as "Label" #COLOR` | Stereotype label, emoji shortcode, minimum pixel width and hex header colour come from @zenuml/core DSL_SYNTAX.md. The Mermaid page does not promise them. |
| @Starter (ZenUML core only) | `@Starter(Alice)` | Names the initiating participant. Without it, the first sender (or an implicit starter) initiates top-level sync calls. |

## Relations
| Form | Syntax | Note |
|---|---|---|
| Sync message (blocking call) | `A.SyncMessage A.SyncMessage(with, parameters)` | Method-call syntax. Parentheses are optional. Sender is the enclosing activation or the starter. Renders a solid arrow plus an activation. |
| Sync message with explicit sender | `Client->A.method() {   B.method() }` | The docs use this in the Reply example. The block {} nests calls made BY A. |
| Nested sync / creation (activation block) | `A.method() {   B.nested_sync_method()   B->C: nested async message }` | Only sync and creation messages can own a {} block. |
| Async message (fire and forget) | `Alice->Bob: How are you?` | Open arrowhead. Content runs to end of line. NOTE: ZenUML '->' is async; sequenceDiagram's '->' is a different thing (solid line, no arrowhead). |
| Reply 1: assignment | `a = A.SyncMessage() SomeType a = A.SyncMessage()` | Draws a return arrow labelled with the variable. The type is optional. |
| Reply 2: return keyword | `A.SyncMessage() {   return result }` | Returns from the current activation to its caller. |
| Reply 3: @return / @reply annotator on an async message | `@return A->Client: x11` | Rarely used. Returns one level up, e.g. an early return from deep inside nested calls. |
| Async return, dashed (ZenUML core only) | `A --> B: response text` | In core DSL_SYNTAX.md, not on the Mermaid page. |

## Grouping
- Nesting block: A.method() { ... } and new X() { ... } (activation scope)
- Loop: while(condition) { ... } | for(...) { ... } | forEach(...) / foreach(...) { ... } | loop(...) { ... }. All render as one loop fragment. Core says the condition is optional.
- Alt: if(condition1) { ... } else if(condition2) { ... } else { ... }
- Opt: opt { ... }   (core also allows opt(cond) { ... })
- Parallel: par { statement1 statement2 }
- Try/Catch/Finally (the page's 'Break'): try { ... } catch { ... } finally { ... }. The README shows catch (BookNotFoundException). Core allows several catch blocks.
- ZenUML core only (not on the Mermaid page): critical(mutex) { }, section(Label) { } / frame(Label) { }, an anonymous { } block, ref(OtherDiagram), and participant boxes: group "Frontend" { @Actor User  @Boundary WebApp }

## Annotations
- title <text>: first line after the zenuml header
- // comment: rendered ABOVE the next message or fragment, with Markdown support (e.g. **bold**). Comments on participants or anywhere else are ignored (not rendered).
- @return / @reply before an async message marks it as a reply
- @Actor/@Database/... annotators mark the participant type
- Not documented on the page, so treat as unavailable: autonumber, Note over/left/right, click/link/tooltip, %% comments, accTitle/accDescr
- ZenUML core only: '== Phase ==' dividers (must start at column 0), @Starter(X), <<Stereotype>> labels

## Emphasis without hue (the colourblind rule)
- Annotator icon shape per participant: @Actor stick figure vs @Database cylinder vs @Boundary/@Control/@Entity/@Queue glyphs. Role is carried by shape, not hue.
- Line style by message kind: sync = solid arrow with activation bar, async = open arrowhead, reply = return arrow (assignment/return/@return), core '-->' = dashed
- Activation bars from {} nesting show who holds control and for how long
- Labelled fragment frames: loop / alt (if/else) / opt / par / try-catch-finally draw boxes with keyword and condition text
- Markdown **bold** inside // comments, rendered as a note above the message or fragment
- title line
- ZenUML core only: '== Phase ==' dividers, <<Stereotype>> labels, section(Label) frames, group "Name" participant boxes
- Missing: autonumber and notes, so steps cannot be numbered for a 'see step 4' reference

## Styling hooks
- None documented on the Mermaid page. No classDef, style, linkStyle, ::: or zenuml-specific themeVariables.
- Drawing is done by @zenuml/core renderToSvg with its own look. The Mermaid theme or themeVariables should be assumed NOT to apply.
- ZenUML core only: a participant header hex colour (participant Alice #FF5733). It is hue-only, so it is banned in this repo as a meaning carrier.

## Config keys
- The page names no zenuml config keys.
- Integration (the page's only setup): import zenuml from '@mermaid-js/mermaid-zenuml'; await mermaid.registerExternalDiagrams([zenuml]). The page's CDN lines pin mermaid@10 and @mermaid-js/mermaid-zenuml@0.1.0/dist/mermaid-zenuml.esm.min.mjs. The package README uses mermaid@11 and @0.2.0/dist/mermaid-zenuml.core.mjs.
- From renderer source (packages/mermaid-zenuml/src/zenumlRenderer.ts, not the page): reads sequence.useMaxWidth (default true, sets width=100% with max-width=<natural px>) and securityLevel ('sandbox' resolves the iframe document). Nothing else from the Mermaid config is consumed.

## Gotchas — what silently breaks
- PLUGIN REQUIRED: core Mermaid does not know 'zenuml'. Without registerExternalDiagrams you get 'No diagram type detected matching given configuration for text: zenuml'. This is the exact error from github.com and from the Mermaid Chart MCP validator (probed 2026-09-25 with the docs' own first example).
- This repo already refuses it: scripts/mermaid-lint.mjs DECLINED map says "`zenuml` is a plugin GitHub does not load — write a `sequenceDiagram`", and docs/PICTURES.md says 'never zenuml (a plugin)'.
- Experimental: the docs warn that lazy loading and async rendering 'could change in the future'.
- Not a header swap: sequenceDiagram accepts none of A.method(), {} blocks, if/while/try, or '// comment'. Moving to sequenceDiagram means a rewrite.
- Arrow false friend: ZenUML 'A->B: msg' is an ASYNC message. In sequenceDiagram '->' is a solid line with no arrowhead and '->>' is the usual arrow.
- Comments are '//' and only render when placed directly above a message or fragment. Comments on participants or elsewhere are silently dropped.
- Participant order = first appearance. Declare bare names up front to control it.
- @return is 'rarely used'. It returns one level up, which is easy to misread.
- The annotator list on the Mermaid page is an image, not text. The README lists 6 annotators and core lists 7 (@Collections). Unknown @Name tokens are accepted as types, so a typo does not error.
- Docs CDN snippet is stale (mermaid@10 + mermaid-zenuml@0.1.0 esm.min.mjs vs README mermaid@11 + 0.2.0 core.mjs vs package 1.0.0).
- ZenUML core rules the Mermaid page does not mention: title must be the first statement; '== divider ==' must start at column 0, so an indented divider inside an indented mermaid block may not parse as one; trailing ';' is an optional no-op; Unicode identifiers and emoji are allowed.
- Async message text runs to end of line, so no quoting is needed there. Method arguments are code-like tokens, so keep spaces and punctuation out of call names and params.
- No theming, classDef or links. Mermaid theme/dark-mode variables are not documented to apply, so appearance in GitHub's two colour modes is outside our control.
- Phone width (inference from the renderer, not the page): useMaxWidth scales the whole SVG down to fit, so beyond about 4-5 lifelines the labels shrink below readable at 390px.

## Starters (validated mcp__Mermaid_Chart__validate_and_render_mermaid_diagram was available and called 3 times: the minimal example, the docs' own first example verbatim, and the rich example. All three were rejected with the same error because the validator's Mermaid build does not register the zenuml external plugin, so it cannot judge zenuml syntax at all. I fell back to careful reading against the Mermaid zenuml page, the mermaid-zenuml README and @zenuml/core docs/DSL_SYNTAX.md.; minimal ✗, rich ✗ — Tool error for every input, including the docs' own example: 'Mermaid rendering failed: No diagram type detected matching given configuration for text: zenuml'. This is a missing plugin, not a syntax fault; github.com gives the same error. Reading check: the minimal example is the page's async form (Alice->Bob: text). The rich example uses only documented constructs: title first; annotators @Actor/@Control/@Boundary/@Entity/@Database (README list); an explicit-sender sync call with a {} block (as in the page's 'Client->A.method() {'); assignment reply; return; if/else; try/catch/finally nested inside a sync block (as in the README's Borrow example); async messages; // comments with **Markdown** above messages. Not proven by a render: the exact visual result and whether the Mermaid-pinned @zenuml/core version accepts every construct together.)

Minimal:

```text
zenuml
    Alice->Bob: Hi Bob
```
_(declined on GitHub surfaces — shown for recognition only)_

Rich (grounded in this repo):

```text
zenuml
    title Bot trade from recommend to fill
    @Actor Eric
    @Control Bot
    @Boundary API
    @Entity Market
    @Database Ledger
    // **Recommend**: the bot reads the live chain
    Eric->Bot.recommend(SPY) {
      chain = Market.optionChain(SPY)
      return pick
    }
    if(approved) {
      Eric->API.placeTicket(pick) {
        Ledger.reserveCash(cost)
        try {
          quote = Market.quote(pick)
          Ledger.writeFill(pick, quote)
        } catch {
          API->Eric: fill rejected
        } finally {
          Ledger.releaseHold(pick)
        }
        return ticketId
      }
    } else {
      // declined picks are still logged
      Bot->Ledger: log declined
    }
```
_(declined on GitHub surfaces — shown for recognition only)_

## Sources
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid/src/docs/syntax/zenuml.md
- https://mermaid.js.org/syntax/zenuml.html
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid-zenuml/README.md
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid-zenuml/src/detector.ts
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid-zenuml/src/zenumlRenderer.ts
- https://raw.githubusercontent.com/mermaid-js/mermaid/develop/packages/mermaid-zenuml/package.json
- https://raw.githubusercontent.com/mermaid-js/zenuml-core/main/README.md
- https://raw.githubusercontent.com/mermaid-js/zenuml-core/main/docs/DSL_SYNTAX.md
- https://github.com/orgs/community/discussions/150175
- /home/user/skynet-capital/scripts/mermaid-lint.mjs
- /home/user/skynet-capital/docs/PICTURES.md
