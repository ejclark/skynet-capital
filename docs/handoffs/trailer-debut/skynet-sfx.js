/* WebAudio score for the Skynet promo — preview only (not mixed into video export).
   A continuous taiko heartbeat runs the whole trailer, accelerating toward the battle;
   layers stack as tension builds (ember drone → bagpipe drone → anvils → double-time → war).
   Timeline (authored s): Prologue 0 · Sauron 12 · Party 24 · Forge 36 · Plan 46 · Battle 56 · Credits 68–82 */
(function () {
  let ctx = null, master = null;
  let droneNodes = null, pipeNodes = null, chantNodes = null, warNodes = null,
      lastT = -1, lastBeat = -10, beatCount = 0;
  const fired = new Set();
  let VOL = 0.76;

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = VOL; master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  /* autoplay policy: the trailer starts paused, so the play press is the unlocking
     gesture — resume the AudioContext on the first interaction anywhere. */
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, () => { try { ac(); } catch (e) {} }, { capture: true }));

  function noiseBuf(dur) {
    const c = ac(), b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function env(node, t0, a, peak, dec) {
    node.gain.setValueAtTime(0.0001, t0);
    node.gain.linearRampToValueAtTime(peak, t0 + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t0 + a + dec);
  }

  /* ---- one-shots ---- */
  function taiko(big = false, lvl = 1) {
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(big ? 105 : 150, t); o.frequency.exponentialRampToValueAtTime(big ? 40 : 58, t + 0.25);
    const g = c.createGain(); env(g, t, 0.005, (big ? 0.95 : 0.6) * lvl, big ? 0.75 : 0.42);
    o.connect(g).connect(master); o.start(t); o.stop(t + 1.1);
    const src = c.createBufferSource(); src.buffer = noiseBuf(0.12);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100;
    const ng = c.createGain(); env(ng, t, 0.002, 0.22 * lvl, 0.09);
    src.connect(lp).connect(ng).connect(master); src.start(t); src.stop(t + 0.14);
  }
  /* odaiko — the great drum: deep sub sweep, long boom */
  function odaiko(lvl = 1) {
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(64, t); o.frequency.exponentialRampToValueAtTime(26, t + 0.5);
    const g = c.createGain(); env(g, t, 0.004, 1.25 * lvl, 1.5);
    o.connect(g).connect(master); o.start(t); o.stop(t + 1.8);
    const o2 = c.createOscillator(); o2.type = "triangle";
    o2.frequency.setValueAtTime(120, t); o2.frequency.exponentialRampToValueAtTime(48, t + 0.3);
    const g2 = c.createGain(); env(g2, t, 0.003, 0.4 * lvl, 0.5);
    o2.connect(g2).connect(master); o2.start(t); o2.stop(t + 0.8);
    const src = c.createBufferSource(); src.buffer = noiseBuf(0.16);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
    const ng = c.createGain(); env(ng, t, 0.002, 0.3 * lvl, 0.12);
    src.connect(lp).connect(ng).connect(master); src.start(t); src.stop(t + 0.2);
  }
  function thunder(intensity = 1) {
    const c = ac(), t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuf(2.5);
    const lp = c.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(70, t + 2.2);
    const g = c.createGain(); env(g, t, 0.02, 0.9 * intensity, 2.3);
    src.connect(lp).connect(g).connect(master); src.start(t); src.stop(t + 2.6);
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(52, t); o.frequency.exponentialRampToValueAtTime(26, t + 1.8);
    const og = c.createGain(); env(og, t, 0.03, 0.6 * intensity, 1.9);
    o.connect(og).connect(master); o.start(t); o.stop(t + 2.1);
  }
  function cannon() {
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(24, t + 0.9);
    const g = c.createGain(); env(g, t, 0.004, 1.15, 1.1);
    o.connect(g).connect(master); o.start(t); o.stop(t + 1.3);
    const src = c.createBufferSource(); src.buffer = noiseBuf(1.2);
    const lp = c.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(120, t + 1.0);
    const ng = c.createGain(); env(ng, t, 0.004, 0.7, 1.0);
    src.connect(lp).connect(ng).connect(master); src.start(t); src.stop(t + 1.3);
  }
  function clash() {
    const c = ac(), t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuf(0.4);
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2800;
    const g = c.createGain(); env(g, t, 0.004, 0.45, 0.32);
    src.connect(hp).connect(g).connect(master); src.start(t); src.stop(t + 0.45);
    [3100, 4700, 6300].forEach((f, i) => {
      const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f * (1 + Math.random() * 0.02);
      const og = c.createGain(); env(og, t, 0.002, 0.15 / (i + 1), 0.5 + i * 0.15);
      o.connect(og).connect(master); o.start(t); o.stop(t + 0.9);
    });
  }
  function anvil() {
    const c = ac(), t = c.currentTime;
    [1580, 2390, 3860, 5230].forEach((f, i) => {
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01);
      const g = c.createGain(); env(g, t, 0.001, [0.5, 0.34, 0.2, 0.1][i], 1.1 - i * 0.15);
      o.connect(g).connect(master); o.start(t); o.stop(t + 1.3);
    });
    const src = c.createBufferSource(); src.buffer = noiseBuf(0.06);
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4000;
    const ng = c.createGain(); env(ng, t, 0.001, 0.3, 0.05);
    src.connect(hp).connect(ng).connect(master); src.start(t); src.stop(t + 0.08);
  }
  function whoosh() {
    const c = ac(), t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuf(0.8);
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.5);
    const g = c.createGain(); env(g, t, 0.12, 0.5, 0.5);
    src.connect(bp).connect(g).connect(master); src.start(t); src.stop(t + 0.85);
  }
  function brushTick() {
    const c = ac(), t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuf(0.16);
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900 + Math.random() * 500; bp.Q.value = 2;
    const g = c.createGain(); env(g, t, 0.03, 0.16, 0.13);
    src.connect(bp).connect(g).connect(master); src.start(t); src.stop(t + 0.2);
  }
  function spell() {
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(1900, t + 0.8);
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 6;
    bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.8);
    const g = c.createGain(); env(g, t, 0.08, 0.2, 0.85);
    o.connect(bp).connect(g).connect(master); o.start(t); o.stop(t + 1.1);
  }

  /* ---- sustained layers ---- */
  function emberOn() {
    if (droneNodes) return;
    const c = ac(), t = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3, t + 1.8); g.connect(master);
    const nodes = [g];
    [[36, "sine", 0.8], [54.2, "sine", 0.35], [72.5, "sawtooth", 0.05]].forEach(([f, ty, lv]) => {
      const o = c.createOscillator(); o.type = ty; o.frequency.value = f;
      const og = c.createGain(); og.gain.value = lv;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.13 + Math.random() * 0.1;
      const lg = c.createGain(); lg.gain.value = lv * 0.4;
      lfo.connect(lg).connect(og.gain);
      o.connect(og).connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
    });
    droneNodes = nodes;
  }
  function emberOff() {
    if (!droneNodes) return;
    const c = ac(), g = droneNodes[0], t = c.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.9);
    const nodes = droneNodes; droneNodes = null;
    setTimeout(() => nodes.slice(1).forEach((n) => { try { n.stop(); } catch (e) {} }), 1000);
  }
  function pipesOn() {
    if (pipeNodes) return;
    const c = ac(), t = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 2.2); g.connect(master);
    const nodes = [g];
    /* bagpipe drone: root + fifth, reedy saws through a formant-ish filter */
    [[110, 0.55], [110.7, 0.3], [165, 0.35]].forEach(([f, lv]) => {
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 620; bp.Q.value = 1.1;
      const og = c.createGain(); og.gain.value = lv;
      o.connect(bp).connect(og).connect(g); o.start(); nodes.push(o);
    });
    /* chanter: slow wandering reed */
    const ch = c.createOscillator(); ch.type = "square"; ch.frequency.value = 440;
    const vib = c.createOscillator(); vib.frequency.value = 5.2;
    const vg = c.createGain(); vg.gain.value = 7; vib.connect(vg).connect(ch.frequency);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.11;
    const lg = c.createGain(); lg.gain.value = 55; lfo.connect(lg).connect(ch.frequency);
    const cbp = c.createBiquadFilter(); cbp.type = "bandpass"; cbp.frequency.value = 900; cbp.Q.value = 1.4;
    const cg = c.createGain(); cg.gain.value = 0.14;
    ch.connect(cbp).connect(cg).connect(g); ch.start(); vib.start(); lfo.start(); nodes.push(ch, vib, lfo);
    pipeNodes = nodes;
  }
  function pipesOff() {
    if (!pipeNodes) return;
    const c = ac(), g = pipeNodes[0], t = c.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.0);
    const nodes = pipeNodes; pipeNodes = null;
    setTimeout(() => nodes.slice(1).forEach((n) => { try { n.stop(); } catch (e) {} }), 1100);
  }
  /* tribal chant — formant-filtered voices swelling with slow breath */
  function chantOn(level) {
    const c = ac(), t = c.currentTime;
    if (chantNodes) {
      if (Math.abs(chantNodes.lvl - level) > 0.01) {
        chantNodes[0].gain.cancelScheduledValues(t);
        chantNodes[0].gain.setValueAtTime(chantNodes[0].gain.value, t);
        chantNodes[0].gain.linearRampToValueAtTime(level, t + 1.2);
        chantNodes.lvl = level;
      }
      return;
    }
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 1.6); g.connect(master);
    const nodes = [g]; nodes.lvl = level;
    [[98, 520, 0.5], [110, 660, 0.42], [146.8, 840, 0.34]].forEach(([f, fm, lv], j) => {
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f * (1 + (j - 1) * 0.003);
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fm; bp.Q.value = 3.2;
      const og = c.createGain(); og.gain.value = lv;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.5 + j * 0.23;
      const lg = c.createGain(); lg.gain.value = lv * 0.55;
      lfo.connect(lg).connect(og.gain);
      o.connect(bp).connect(og).connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
    });
    chantNodes = nodes;
  }
  function chantOff() {
    if (!chantNodes) return;
    const c = ac(), g = chantNodes[0], t = c.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.0);
    const nodes = chantNodes; chantNodes = null;
    setTimeout(() => nodes.slice(1).forEach((n) => { try { n.stop(); } catch (e) {} }), 1100);
  }
  /* war layer — sub-bass foundation + harmonic-overtone shimmer for the battle */
  function warOn() {
    if (warNodes) return;
    const c = ac(), t = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.55, t + 0.7); g.connect(master);
    const nodes = [g];
    [[41.2, 0.55], [61.7, 0.28]].forEach(([f, lv]) => {
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320;
      const og = c.createGain(); og.gain.value = lv;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.3;
      const lg = c.createGain(); lg.gain.value = lv * 0.3; lfo.connect(lg).connect(og.gain);
      o.connect(lp).connect(og).connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
    });
    [659.3, 880, 1318.5].forEach((f, j) => {
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const og = c.createGain(); og.gain.value = 0.045 / (j + 1);
      const lfo = c.createOscillator(); lfo.frequency.value = 4.2 + j * 1.4;
      const lg = c.createGain(); lg.gain.value = 0.03 / (j + 1); lfo.connect(lg).connect(og.gain);
      o.connect(og).connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
    });
    warNodes = nodes;
  }
  function warOff() {
    if (!warNodes) return;
    const c = ac(), g = warNodes[0], t = c.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.8);
    const nodes = warNodes; warNodes = null;
    setTimeout(() => nodes.slice(1).forEach((n) => { try { n.stop(); } catch (e) {} }), 900);
  }
  /* pipe organ — stacked ranks, the bass engine of the build */
  let organNodes = null;
  function organOn(level) {
    const c = ac(), t = c.currentTime;
    if (organNodes) {
      if (Math.abs(organNodes.lvl - level) > 0.015) {
        organNodes[0].gain.cancelScheduledValues(t);
        organNodes[0].gain.setValueAtTime(organNodes[0].gain.value, t);
        organNodes[0].gain.linearRampToValueAtTime(level, t + 0.9);
        organNodes.lvl = level;
      }
      return;
    }
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 1.8); g.connect(master);
    const nodes = [g]; nodes.lvl = level;
    [[55, "sine", 0.75], [110, "sine", 0.5], [164.8, "sine", 0.3], [220, "sine", 0.22], [110, "sawtooth", 0.12]].forEach(([f, ty, lv]) => {
      const o = c.createOscillator(); o.type = ty; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.002);
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = ty === "sawtooth" ? 900 : 2000;
      const og = c.createGain(); og.gain.value = lv;
      const lfo = c.createOscillator(); lfo.frequency.value = 4.8;
      const lg = c.createGain(); lg.gain.value = lv * 0.12; lfo.connect(lg).connect(og.gain);
      o.connect(lp).connect(og).connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
    });
    organNodes = nodes;
  }
  function organOff() {
    if (!organNodes) return;
    const c = ac(), g = organNodes[0], t = c.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    const nodes = organNodes; organNodes = null;
    setTimeout(() => nodes.slice(1).forEach((n) => { try { n.stop(); } catch (e) {} }), 700);
  }
  /* war horn — a long low brass swell */
  function horn() {
    const c = ac(), t = c.currentTime;
    [82.4, 87, 164.8].forEach((f, i) => {
      const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
      const lp = c.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(280, t); lp.frequency.linearRampToValueAtTime(950, t + 0.8);
      const g = c.createGain(); env(g, t, 0.55, 0.3 / (i + 1), 2.2);
      o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + 3.1);
    });
  }

  /* ---- drum heartbeat: steadily accelerating scene over scene, layers stacking,
          dead silence at the cliff’s edge — then the leap ---- */
  const TEMPO = [
    { from: 0, to: 12, iv: 2.2, lvl: 0.8 },     // prologue: slow lone taiko
    { from: 12, to: 24, iv: 1.6, lvl: 0.9 },    // sauron: quickening + ember drone
    { from: 24, to: 36, iv: 1.1, lvl: 0.95 },   // party: pipes join, drums build
    { from: 36, to: 46, iv: 0.8, lvl: 1 },      // forge: faster still, anvils + chant murmurs
    { from: 46, to: 56, iv: 0.5, lvl: 1.15 },   // plan: double-time, organ + odaiko, bass swelling
    { from: 56, to: 57.6, iv: 0, lvl: 0 },      // the cliff — total silence before the leap
    { from: 57.6, to: 68, iv: 0.32, lvl: 1.35 },// battle: full gallop, great drums
    { from: 68, to: 75.6, iv: 2.6, lvl: 0.7 },  // credits: slow heartbeat out — then silence for the tease
  ];
  function tempoAt(T) { for (const s of TEMPO) if (T >= s.from && T < s.to) return s; return null; }

  /* ---- cued one-shots ---- */
  const ONESHOTS = [
    ...[0.4, 1.6, 3.8, 4.6, 6.4].map((at) => ({ at, fn: brushTick })),   // strokes paint the village
    { at: 9.2, fn: spell },                                              // red energy crackles
    { at: 10.2, fn: () => thunder(0.6) },                                 // the burn spreads
    { at: 11.3, fn: () => thunder(1) },                                   // embers take the scene
    { at: 13.8, fn: () => thunder(0.9) },                                 // brimstone reveal
    { at: 15.8, fn: spell },                                              // the rings are offered
    { at: 23.4, fn: whoosh },
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ at: 26.4 + i * 0.25, fn: brushTick })), // each soul steps up
    ...[33.5, 33.9, 34.3, 34.7, 35.1, 35.5, 35.9, 36.3].map((at) => ({ at, fn: brushTick })), // footsteps to the anvil
    ...[37.6, 38.75, 39.9, 41.05, 42.2].map((at) => ({ at, fn: anvil })), // the forge
    { at: 45.4, fn: whoosh },
    { at: 45.9, fn: () => thunder(0.5) },                                 // lights out — the war room
    ...[0, 1, 2, 3, 4].map((i) => ({ at: 76.4 + i * 0.5, fn: brushTick })),   // eyes blink open
    { at: 77.2, fn: () => taiko(true, 1.7) },                             // the lone deep drum — towers stir on the horizon
    ...[0, 1, 2, 3, 4].map((i) => ({ at: 51.8 + i * 0.4, fn: brushTick })), // candles rise
    { at: 57.6, fn: cannon }, { at: 57.65, fn: horn },                    // BOOM — battle erupts
    { at: 58.2, fn: clash }, { at: 58.7, fn: clash },
    { at: 59.4, fn: spell },
    { at: 60.6, fn: cannon }, { at: 60.7, fn: horn }, { at: 61.2, fn: clash }, { at: 61.8, fn: clash },
    { at: 62.4, fn: spell },
    { at: 63.8, fn: cannon }, { at: 63.9, fn: horn }, { at: 64.4, fn: clash },
    { at: 66.0, fn: () => thunder(1) },
    { at: 67.4, fn: whoosh },
    { at: 68.3, fn: () => taiko(true, 1) },                               // mark lands
  ];
  const EMBER_DRONE = [{ from: 12.3, to: 24.0 }, { from: 48.0, to: 55.9 }];   /* returns as the plan sharpens */
  const PIPES = { from: 24.5, to: 55.9 };                                      /* pipes carry through to the cliff */

  window.SFX = {
    setVolume(v) { VOL = v; if (master) master.gain.value = v; },
    sync(T, playing) {
      if (!playing) { emberOff(); pipesOff(); chantOff(); warOff(); organOff(); lastT = T; return; }
      if (T < lastT - 0.3 || T > lastT + 1.5) { fired.clear(); lastBeat = T; beatCount = 0; }
      if (master) master.gain.value = VOL * (T >= 57.6 && T < 68 ? 1.65 : T >= 46 && T < 56 ? 1.15 + 0.2 * ((T - 46) / 10) : T >= 36 && T < 46 ? 1.08 : 1);
      const s = tempoAt(T);
      if (s && s.iv > 0 && T >= lastBeat + s.iv) {
        lastBeat = T; beatCount++;
        const down = beatCount % 4 === 1;
        if (down && T >= 46) odaiko(T >= 57.6 ? 1.15 : 0.85);   /* the great drum enters with the plan */
        else taiko(down, s.lvl);
        if (T >= 46 && T < 56 && beatCount % 2 === 0) setTimeout(brushTick, 140);        // plan: ticks between beats
        if (T >= 57.6 && T < 68) {
          if (beatCount % 2 === 0) setTimeout(clash, 90);                                // blades between beats
          if (down) setTimeout(() => taiko(false, 1.1), 130);                            // war flam on the downbeat
        }
      }
      for (const c of ONESHOTS) {
        if (T >= c.at && T < c.at + 0.4 && lastT < c.at && !fired.has(c.at)) { fired.add(c.at); try { c.fn(); } catch (e) {} }
      }
      if (EMBER_DRONE.some((w) => T >= w.from && T < w.to)) emberOn(); else emberOff();
      if (T >= PIPES.from && T < PIPES.to) pipesOn(); else pipesOff();
      /* the chant grows with the story: murmurs at the forge, voices at the plan, full cry in battle */
      if (T >= 36 && T < 46) chantOn(0.12);
      else if (T >= 46 && T < 55.9) chantOn(0.22 + 0.14 * ((T - 46) / 10));
      else if (T >= 57.6 && T < 68) chantOn(0.62);
      else chantOff();
      /* the organ: bass energy swelling through the plan, released full in the battle */
      if (T >= 46 && T < 55.9) organOn(0.14 + 0.3 * ((T - 46) / 10));
      else if (T >= 57.6 && T < 68) organOn(0.55);
      else organOff();
      if (T >= 57.6 && T < 68) warOn(); else warOff();
      lastT = T;
    },
    stop() { emberOff(); pipesOff(); chantOff(); warOff(); organOff(); },
  };
})();
