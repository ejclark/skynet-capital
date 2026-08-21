/**
 * The coach's client half — progressive enhancement on the /feedback form. Plain concatenated
 * strings and classic functions only: this ships inside a TS template literal, where a backtick
 * or dollar-brace is the recurring TS1005 trap (CLAUDE.md, ship loop). Split out of
 * feedback-coach.ts (#449) — a static client script and the server-side coach logic are distinct
 * concerns, and the combined file had grown past its architecture budget.
 *
 * Flow (#449, AI-first): the member picks a kind and drops a rough note in the guided intro →
 * "Let's shape it" → up to three short question/answer rounds → the draft fills the
 * title/details fields and the intro gives way to the real form, ready to review → the member
 * uses the ordinary Send button. "Skip →", or any coach failure, reveals the plain form directly
 * instead. The coach never submits.
 */
export const COACH_SCRIPT = `
(function () {
  function init() {
  var box = document.getElementById('coach-box');
  var form = document.getElementById('fdbk-form');
  if (!box || !form) return;
  var thread = document.getElementById('coach-thread');
  var start = document.getElementById('coach-start');
  var skip = document.getElementById('coach-skip');
  var noteEl = document.getElementById('coach-note');
  var coachKindEl = document.getElementById('coach-kind');
  if (!thread || !start || !skip || !noteEl || !coachKindEl) return;
  var titleEl = form.querySelector('[name="title"]');
  var detailsEl = form.querySelector('[name="details"]');
  var kindEl = form.querySelector('[name="kind"]');
  var msgs = [];

  function line(who, text) {
    var p = document.createElement('p');
    p.className = 'coach-' + who;
    p.textContent = (who === 'ai' ? '✨ ' : 'You: ') + text;
    thread.appendChild(p);
  }

  function setBusy(on) {
    var el = document.getElementById('coach-busy');
    if (on && !el) {
      el = document.createElement('p');
      el.id = 'coach-busy';
      el.className = 'coach-ai';
      el.textContent = '✨ …';
      thread.appendChild(el);
    } else if (!on && el) {
      el.remove();
    }
  }

  function revealForm() {
    if (kindEl) kindEl.value = coachKindEl.value;
    box.style.display = 'none';
    form.style.display = 'flex';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (titleEl) titleEl.focus();
  }

  function askAnswer(question) {
    line('ai', question);
    var row = document.createElement('div');
    var input = document.createElement('input');
    input.placeholder = 'Your answer…';
    var go = document.createElement('button');
    go.type = 'button';
    go.textContent = 'Answer';
    row.appendChild(input);
    row.appendChild(go);
    thread.appendChild(row);
    input.focus();
    function send() {
      if (!input.value.trim()) return;
      row.remove();
      line('you', input.value);
      msgs.push({ role: 'assistant', content: question });
      msgs.push({ role: 'user', content: input.value });
      turn();
    }
    go.addEventListener('click', send);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  }

  function turn() {
    setBusy(true);
    fetch('/feedback/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: coachKindEl.value, messages: msgs }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        setBusy(false);
        if (!res || res.ok === false) {
          line('ai', (res && res.error) || 'The coach is unavailable right now — your own words work great too.');
          revealForm();
          return;
        }
        if (res.done) {
          if (titleEl) titleEl.value = res.title;
          if (detailsEl) detailsEl.value = res.details;
          line('ai', 'Drafted! Review it below, tweak anything, then hit Send.');
          revealForm();
        } else {
          askAnswer(res.question);
        }
      })
      .catch(function () {
        setBusy(false);
        line('ai', 'The coach is unreachable — your own words work great too.');
        revealForm();
      });
  }

  start.addEventListener('click', function () {
    var raw = noteEl.value.trim();
    if (!raw) { line('ai', 'Jot a rough note above first — even one messy sentence — then I can help shape it.'); return; }
    start.disabled = true;
    noteEl.disabled = true;
    coachKindEl.disabled = true;
    msgs = [{ role: 'user', content: raw }];
    turn();
  });

  skip.addEventListener('click', function (e) {
    e.preventDefault();
    revealForm();
  });
  }
  // Attach only once the whole document is parsed. This script is inlined mid-page, and on
  // 2026-08-20 it ran ABOVE the (later-parsed) #fdbk-form, hit the guard's early return
  // silently, and left the entire coach front door dead with the real form display:none —
  // the funnel down for every member. Readiness-guarded, markup order can never break it again.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
