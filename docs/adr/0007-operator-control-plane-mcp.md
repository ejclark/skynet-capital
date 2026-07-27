# ADR-0007: An operator control-plane MCP for the autonomous fleet

- **Status:** Proposed
- **Date:** 2026-07-27

## Context

The autonomy stack is built and safe-by-default (see `docs/AUTONOMY-PLAN.md`): a persona decides,
`applyGuards` clamps the intent, `AutonomousTrader.evaluate()` places (or, in observe mode, only
records), `SafetyController` holds the kill switch + circuit breakers, and `assessReadiness()` gates
whether a persona may go live at all. Today an operator drives all of this through **environment
variables + a CLI runner + `fly secrets set`** (the runbook in `docs/AUTONOMY-DEPLOY.md`).

That works, but operating the fleet means remembering env-var names, redeploying to change a mode, and
reading JSONL logs to see what a bot decided. As the fleet grows, we want a **conversational operator
surface** — "put the Day Trader in observe," "what did Sauron decide in the last hour," "halt
everything" — with the safety rails enforced by the *interface*, not by the operator's discipline.

### What an MCP server is (plain-language primer — no prior MCP assumed)

**MCP (Model Context Protocol)** is a small, standard way to hand an AI assistant a set of **typed
tools** it can call, plus **resources** it can read. Think of it as a USB-C port for AI: instead of an
assistant improvising by running shell commands or scraping logs, you publish a fixed list of named
operations — `list_bots`, `halt`, `get_decisions` — each with a declared input/output shape. The
assistant can only call what you publish, with the arguments you allow.

Mechanically, an MCP **server** is just a small program (a Node process, in our stack) that:

1. **Declares** its tools (name + JSON schema for inputs) and resources (readable URIs).
2. **Handles** each call by running ordinary code — for us, calling the autonomy primitives that
   already exist (`SafetyController.halt()`, `JsonlAuditStore.list()`, `assessReadiness()`).
3. **Returns** a structured result the assistant renders back to the operator.

The assistant (Claude Desktop, Claude Code, or a hosted agent) is the **client**; it never touches our
internals directly — it goes through the tool handlers, which is exactly where we put the guardrails.

### Why this fits the guardrail problem

The key realization: **prompt-level guardrails are advisory; tool-handler guardrails are mechanical.**
Telling a model "don't over-trade" is a request it can ignore or get confused about. A tool handler
that *refuses* to place a live order for a not-ready persona, or that requires an explicit human
confirmation before flipping to live, cannot be talked out of it. The runaway-prevention lives in the
server, independent of whatever the model decides — which is precisely the CLAUDE.md "safety scales to
stakes" and "irreversible class is always Eric's call" boundary, made structural.

Note that MCP does **not** add new safety logic — `SafetyController`, `applyGuards`, and the readiness
gate already are the safety. MCP is the *interface* that exposes and enforces them cleanly and auditably.

## Decision

We will build an **operator control-plane MCP server** (`src/mcp/`) that wraps the existing autonomy
primitives, with every tool handler enforcing the safety substrate and the **irreversible-class tools
gated behind an explicit human confirmation**. Tools split into three access tiers:

| Tier | Tools | Gate |
|------|-------|------|
| **Read-only** | `list_bots`, `get_decisions`, `get_readiness`, `get_safety_state` | none |
| **Safe-direction** | `set_mode(persona,"observe")`, `halt(persona)`, `reset()` | none (observe + kill switch only ever *reduce* risk) |
| **Irreversible** | `enable_live(persona)`, `set_spend_cap`, credential/secret ops | **human confirm required; never auto-callable** |

The server reuses the audit store, `SafetyController`, and `assessReadiness()` as its backing —
`enable_live` fails closed if readiness is not green, regardless of the request. It ships **read-only +
safe-direction first** (offline-testable, zero governance risk); the irreversible tier lands only after
the Phase-4 live go-live validation, and its handlers require a confirmation token that only a human
supplies.

## Alternatives considered

- **Keep the env-var + CLI + `fly secrets` operating model** — already works and is the simplest thing;
  but it scales poorly (redeploy to change a mode, read JSONL to inspect) and puts no structural guard
  between an operator/agent and the irreversible actions. Kept as the underlying mechanism the MCP calls
  into, not the operator interface.
- **A bespoke REST admin API + web console** — more UI work, another auth surface to secure, and it
  doesn't give the *conversational* operation that motivated this. An MCP server is less code and lands
  the AI-native interface directly.
- **An in-product, member-facing agent MCP** (members chat to build/tune their own bots) — genuinely
  valuable and a natural Living-Universe extension, but a much larger, member-facing lift with its own
  authz story. Deferred; this ADR is scoped to the **operator/Eric-facing control plane** only.
- **Guardrails in the prompt/system message** — advisory and bypassable; rejected as the *primary*
  control for anything irreversible (it may still assist, but never gate).

## Consequences

- **Easier:** operating the fleet becomes conversational and auditable; the read-only tier is a safe,
  offline-buildable first slice that immediately improves observability (no more hand-reading JSONL).
- **Structural safety:** the irreversible boundary stops depending on operator discipline — a handler
  refuses go-live for a not-ready persona and requires a human confirmation token to flip live or move
  spend. This makes the CLAUDE.md hard boundary mechanical.
- **Harder / to live with:** a new long-lived surface to build, host, secure, and version; MCP is new
  territory for the owner, so the first slice doubles as a learning vehicle (hence read-only first).
  Credentials the server can reach must be scoped tightly and never exposed through a tool.
- **Sequencing:** read-only + safe-direction tiers are buildable and unit-testable now against the
  in-memory broker; the irreversible tier is gated behind Phase-4 go-live validation and stays Eric's
  to authorize. The member-facing agent MCP remains a separate, later decision.
- **Follow-ups:** a thin `src/mcp/` server + tool tests (first PR, read-only + halt); an operator
  setup note (how to point Claude Desktop/Code at it); later, the confirmation-token design for the
  irreversible tier; later still, the member-facing agent MCP as its own ADR.
