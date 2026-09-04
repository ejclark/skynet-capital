// NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow scripts run inside
// the Workflow tool's async harness, where top-level `await` and top-level `return` are legal.
// They are not Node modules; the linter's parser rejects the dialect, not the code.
export const meta = {
  name: 'grind',
  description: 'Fan out one repetitive per-item task across many similar targets, cheap model/effort by default',
  whenToUse: 'For a batch of near-identical, mechanical chores — the same fix applied across many files/PRs/branches/tickers — where doing them one at a time in the main thread burns turns without needing deep judgment per item. Not for anything requiring cross-item synthesis or a design call; that wants a purpose-built pipeline instead. Args: {items: [...], promptTemplate: "...{item}...", effort?, model?, isolation?}.',
  phases: [{ title: 'Grind' }],
}

const items = args?.items
if (!items?.length) throw new Error('grind requires args.items: a non-empty array')
if (!args?.promptTemplate) throw new Error('grind requires args.promptTemplate: a string containing "{item}"')

// Defaults are deliberately cheap: this workflow exists to burn through repetitive, low-judgment
// work fast, not to replicate Ultracode's xhigh bump. Override per call when a batch is subtler.
const EFFORT = args.effort || 'low'
const MODEL = args.model || 'sonnet'
// Isolation costs ~200-500ms + disk per agent — only pay it when items mutate shared files/branches
// in parallel (e.g. each item is a PR branch getting merge-conflict resolution).
const ISOLATION = args.isolation ? 'worktree' : undefined

const RESULT_SCHEMA = {
  type: 'object',
  required: ['status', 'summary'],
  properties: {
    status: { type: 'string', enum: ['done', 'blocked', 'skipped'] },
    summary: { type: 'string' },
  },
}

function labelFor(item) {
  if (typeof item === 'string') return item
  return item.label || item.id || item.sym || item.branch || JSON.stringify(item).slice(0, 40)
}

function promptFor(item) {
  const value = typeof item === 'string' ? item : JSON.stringify(item)
  return args.promptTemplate.split('{item}').join(value)
}

const results = await pipeline(items, (item) =>
  agent(promptFor(item), {
    phase: 'Grind',
    label: labelFor(item),
    effort: EFFORT,
    model: MODEL,
    isolation: ISOLATION,
    schema: RESULT_SCHEMA,
  })
)

const combined = items.map((item, i) => ({ item, result: results[i] }))
const done = combined.filter((c) => c.result?.status === 'done')
const blocked = combined.filter((c) => c.result?.status === 'blocked')
const skipped = combined.filter((c) => c.result?.status === 'skipped')
const errored = combined.filter((c) => !c.result)

log(`${done.length}/${items.length} done · ${blocked.length} blocked · ${skipped.length} skipped${errored.length ? ` · ${errored.length} errored` : ''}`)

return {
  total: items.length,
  done: done.length,
  blocked: blocked.map((c) => ({ item: labelFor(c.item), summary: c.result.summary })),
  results: combined.map((c) => ({ item: labelFor(c.item), ...(c.result || { status: 'errored', summary: 'agent failed after retries' }) })),
}
