// The Profile page's head for a shoot that lands on one of its sections (#3807 slice 2b): since
// /learn, /onboarding, /playbooks and /feedback became sections of /app/accounts, every harness
// that photographs them needs the two reads the head makes — the owned accounts and the net worth
// the head condenses off the Overview. One fresh paper account, honest round numbers.

/** `/api/settings` + `/api/accounts/networth` stubs for a member who owns `accounts`. */
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
  };
  return {
    "/api/settings": { accounts },
    "/api/accounts/networth": {
      generatedAt: "2026-09-26T00:00:00Z",
      accounts: accounts.map((a) => ({ ...a, ...stats })),
      total: stats,
    },
  };
}

export const JOE = { id: "human-joe", name: "Uncle Joe", kind: "human", suspended: false };
