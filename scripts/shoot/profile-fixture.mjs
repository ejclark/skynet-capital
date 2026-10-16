// The Profile page's head for a shoot that lands on one of its sections (#3807 slice 2b): since
// /learn, /onboarding, /playbooks and /feedback became sections of /app/accounts, every harness
// that photographs them needs the two reads the head makes — the owned accounts and the net worth
// the head condenses off the Overview. One fresh paper account, honest round numbers. Each
// account's desk too: the page reads it on every section, and an unstubbed `{}` desk crashed the
// route ("Cannot read properties of undefined (reading 'error')", found shooting #5150).

/** `/api/settings` + `/api/accounts/networth` + `/api/desk/<id>` stubs for a member who owns
 *  `accounts` — an empty desk each (no positions, nothing considered). */
export function profileStubs(accounts) {
  const stats = {
    value: "$1,000,000.00",
    valueKnown: true,
    dayChange: "$0.00",
    dayTone: "flat",
    dayKnown: true,
    cash: "$1,000,000.00",
    cashKnown: true,
    bookedPl: "$0.00",
    bookedTone: "flat",
    bookedKnown: true,
    onPaper: "$0.00",
    onPaperTone: "flat",
    onPaperKnown: true,
    positionCount: 0,
    windows: [],
    idle: "100% idle",
    idlePct: 100,
    invested: "$0.00",
  };
  return {
    "/api/settings": { accounts },
    "/api/accounts/networth": {
      generatedAt: "2026-09-26T00:00:00Z",
      accounts: accounts.map((a) => ({ ...a, ...stats })),
      total: stats,
    },
    ...Object.fromEntries(
      accounts.map((a) => [
        `/api/desk/${a.id}`,
        {
          generatedAt: "2026-09-26T00:00:00Z",
          desk: { id: a.id, name: a.name, kind: a.kind, considerations: [], positions: [] },
        },
      ]),
    ),
  };
}

export const JOE = { id: "human-joe", name: "Uncle Joe", kind: "human", suspended: false };
