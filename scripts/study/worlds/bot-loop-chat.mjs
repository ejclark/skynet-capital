// MONEYPENNY'S DOCK IN A BOT-LOOP WORLD — the named hook for the chat-in-a-world module (#8005
// slice 4; built in the session `i8005-s4prep`). Plan #8005: "WHILE a simulated member works a
// task in a study world, Moneypenny's chat SHALL be available to them", answering from the world's
// own fixtures, every draft harvested as a finding and never filed.
//
// Until that module lands, a bot-loop world serves the dock exactly as the profile's worlds do:
// the real `/api/companion` handler with no model behind it, so the dock opens and a sent message
// is a recorded write that gets no reply (shell-artifacts.mjs says so). The module replaces
// `chatHook` below — one function, one call site per world (`chat:` on bot-loop-*.mjs) — and
// nothing else here needs to change: compose and parity ignore `chat` until it returns something.

/**
 * What a world's Moneypenny may answer from. Today: nothing (`undefined`), so the dock is the
 * shell's as production serves it with no model. The chat module returns its own world-backed
 * answerer here, keyed by the world's name.
 * @param {string} _world
 * @returns {undefined}
 */
export function chatHook(_world) {
  return undefined;
}
