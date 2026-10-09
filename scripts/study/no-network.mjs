// No request leaves a study composer (#4943 slice 2). Area-agnostic.
//
// The real route handlers the composer calls are production code, and a few reach the network
// on their own — the guidance route asks SEC EDGAR for a company's recent filings through its
// built-in client, a seam no config field reaches. A world must not depend on what a third party
// answers today (two composes of one commit would differ), and must not send anything anywhere.
// So `fetch` is replaced for the whole process: a URL the world's inputs answer gets that answer;
// every other URL is refused (the caller sees a network failure, its honest degrade) and recorded,
// so the manifest says exactly which reads ran on a refusal.

/**
 * @param {(url: string) => unknown} answer  JSON for a URL the world holds, or undefined
 * @returns {{refused: string[], answered: string[]}} what was asked, for the manifest
 */
export function guardNetwork(answer) {
  const log = { refused: [], answered: [] };
  globalThis.fetch = (input) => {
    const url = typeof input === "string" ? input : (input.url ?? String(input));
    const body = answer(url);
    if (body === undefined) {
      log.refused.push(url);
      return Promise.reject(new TypeError(`study world: no network (${url})`));
    }
    log.answered.push(url);
    const headers = { "content-type": "application/json" };
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers }));
  };
  return log;
}
