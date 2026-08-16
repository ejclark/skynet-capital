/* Skynet Capital — Season One promo: "Take down Sauron". Ghost-of-Yōtei-inspired sumi-e:
   the scene paints itself in ink, single-tint washes, lone mountain, layered taiko score.
   Arc: peaceful village in ink → leaves fall & burn (transition) → brimstone Sauron & the rings
   → seven souls → the forge → battle plan → darkness then battle → end credits.  ~77s, 16:9. */
const { CompositionStage, useComposition, Shot, Easing, interpolate, clamp,
        useTweaks, TweaksPanel, TweakSection, TweakToggle } = window;

const PAPER = "#EDE6D8", PAPER2 = "#DCD2BC", INK = "#161310", INKSOFT = "#2B261F",
      INKMUTE = "#6E6455", GOLD = "#E3A83A", GOLDDIM = "#B98A2E", RED = "#A93226",
      PAPTXT = "#EDE6D8", EMBER = "#FF7A2E", EMBER2 = "#FFC24D";
const SERIF = "'Iowan Old Style', Palatino, 'Book Antiqua', Georgia, serif";
const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace";
const R = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const MOTION = {
  enter: (T, at, dur = 1.1, rise = 34) => {
    const e = Easing.easeOutCubic(clamp((T - at) / dur, 0, 1));
    return { opacity: e, transform: `translateY(${(1 - e) * rise}px)` };
  },
  draw: (T, at, dur = 1.6) => Easing.easeInOutCubic(clamp((T - at) / dur, 0, 1)),
  fade: (T, at, until, f = 0.8) =>
    clamp((T - at) / f, 0, 1) * (until == null ? 1 : clamp((until - T) / f, 0, 1)),
};

function Stroke({ d, len, p, color, w, op = 1, cap = "round" }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap={cap}
               strokeDasharray={len} strokeDashoffset={len * (1 - p)} filter="url(#omBrush)" opacity={op} />;
}

/* ---- ambient drifting petals ---- */
const PETALS = Array.from({ length: 30 }, (_, i) => ({
  x0: R(i) * 1920, y0: R(i + 40) * 1080, sp: 38 + R(i + 7) * 70,
  amp: 26 + R(i + 11) * 55, fr: 0.35 + R(i + 13) * 0.5, red: R(i + 31) < 0.3,
  s: 7 + R(i + 17) * 9, rs: (R(i + 19) - 0.5) * 130, op: 0.4 + R(i + 23) * 0.45,
}));
function Petals({ T, dark, on }) {
  if (!on) return null;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      {PETALS.map((p, i) => {
        const y = ((p.y0 + T * p.sp) % 1170) - 45;
        const x = ((p.x0 + T * 18) % 1990) - 35 + Math.sin(T * p.fr + i * 1.7) * p.amp;
        const col = p.red ? RED : (dark ? GOLD : GOLDDIM);
        return (
          <path key={i} d="M0 -7 Q6.5 -2.5 0 7 Q-6.5 -2.5 0 -7 Z"
                transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(T * p.rs + i * 47).toFixed(1)}) scale(${(p.s / 8).toFixed(2)})`}
                fill={col} opacity={p.op * (dark ? 1 : 0.8)} />
        );
      })}
    </svg>
  );
}

const RIDGE = "M -40 840 L 300 720 L 560 780 L 960 330 L 1360 780 L 1620 720 L 1980 800";

/* ---- 1 · Prologue: a peaceful village beneath the great cliffs, painted stroke by stroke (0–12) ---- */
const FIELD = Array.from({ length: 9 }, (_, i) => ({
  y: 850 + i * 28, x0: -40 - R(i) * 80, x1: 1980, w: 24 + R(i + 2) * 22, ph: R(i + 5) * 6,
}));
/* soft distant hills — the mountain is saved for the climb */
const HILLS = [
  { cx: 240, cy: 920, rx: 500, ry: 280, op: 0.12 },
  { cx: 880, cy: 950, rx: 440, ry: 190, op: 0.08 },
  { cx: 1760, cy: 940, rx: 480, ry: 250, op: 0.1 },
];
/* the family tree — golden ginkgo canopy over the crown and left boughs */
const CANOPY = Array.from({ length: 36 }, (_, i) => ({
  x: 1130 + (R(i) - 0.68) * 640, y: 400 + (R(i + 3) - 0.5) * 250 - Math.abs(R(i) - 0.5) * 110,
  r: 28 + R(i + 6) * 52,
}));
/* golden leaf carpet across the whole ground */
const CARPET = Array.from({ length: 36 }, (_, i) => ({
  x: 80 + R(i + 40) * 1780, y: 880 + R(i + 41) * 170, rx: 16 + R(i + 42) * 40, ry: 4 + R(i + 43) * 7,
}));
/* the village on the left, beneath the falls */
const HUTS = [
  { x: 200, y: 856, w: 110, h: 64, n: "the Clarks" }, { x: 415, y: 838, w: 150, h: 84, n: "the home farm", home: true },
  { x: 660, y: 854, w: 116, h: 66, n: "Narayan’s elders" },
];
function Prologue({ T }) {
  const sky = MOTION.draw(T, 0.4, 1.6);
  const moon = MOTION.fade(T, 1.6, null, 1.2);
  const sway = Math.sin(T * 0.9);
  const cr = clamp((T - 10.0) / 1.7, 0, 1);              /* the crimson turn — Sauron nears */
  const dim = 1 - 0.4 * clamp((T - 11.0) / 1.2, 0, 1);
  const out = 1 - clamp((T - 12.0) / 1.1, 0, 1);         /* long cross-dissolve into the brimstone */
  return (
    <div style={{ position: "absolute", inset: 0, opacity: dim * out, background: PAPER }}>
      {/* depth: warm sky wash, and a drifting mist band between the hills and the field */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(220,205,170,0.5), transparent 34%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "58%", height: "14%", filter: "blur(7px)",
        background: "linear-gradient(90deg, transparent, rgba(237,230,216,0.55) 30%, rgba(237,230,216,0.4) 70%, transparent)",
        transform: `translateX(${Math.sin(T * 0.35) * 30}px)`, opacity: 0.8 * (1 - cr) }} />
      {/* golden hour — soft sun shaft over the farm, dying as the crimson comes */}
      <div style={{ position: "absolute", inset: 0, opacity: (1 - cr), background:
        "radial-gradient(ellipse 55% 46% at 26% 12%, rgba(255,214,120,0.20), transparent 68%), radial-gradient(ellipse 40% 30% at 70% 80%, rgba(255,200,100,0.07), transparent 70%)" }} />
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* sky washes */}
        <Stroke d="M -40 110 L 1980 90" len={2100} p={sky} color={PAPER2} w={110} op={0.6} cap="butt" />
        <circle cx="1680" cy="150" r="92" fill={GOLD} opacity={0.85 * moon} filter="url(#omBrush)" />
        <circle cx="1680" cy="150" r="128" fill={GOLD} opacity={0.12 * moon} />
        {/* (moon rises early — the scene sets itself in a few strokes) */}
        {/* mottled paper blotches */}
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} cx={R(i + 90) * 1920} cy={R(i + 91) * 1080} rx={90 + R(i + 92) * 160} ry={40 + R(i + 93) * 80}
                   fill={INK} opacity={0.028} filter="url(#omBrush)" />
        ))}
        {/* the far mountain — Sauron's — ghosted on the horizon for the cut to scene 2 */}
        <path d="M -40 1080 L 420 830 L 960 430 L 1500 830 L 1980 1080 Z" fill={INK}
              opacity={(0.05 + 0.4 * cr) * MOTION.draw(T, 0.6, 1.4)} />
        {/* a small fire wakes on the far mountain — the first sign of him */}
        {T > 9.0 && [0, 1, 2].map((k) => {
          const ff = clamp((T - 9.0 - k * 0.45) / 1.3, 0, 1);
          const fl2 = 0.6 + 0.4 * Math.sin(T * 7 + k * 2.1);
          const fx = 880 + k * 62;
          return (
            <g key={k} opacity={ff}>
              <circle cx={fx + 8} cy="788" r={24 + 9 * fl2} fill={EMBER} opacity={0.13} />
              <path d={`M ${fx} 800 Q ${fx - 9} ${772 - 24 * fl2} ${fx + 8} ${754 - 28 * fl2} Q ${fx + 19} ${776 - 16 * fl2} ${fx + 16} 800 Z`}
                    fill={k % 2 ? EMBER : EMBER2} opacity={0.8 * fl2} />
            </g>
          );
        })}
        {/* soft distant hills */}
        {HILLS.map((h, i) => (
          <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry * MOTION.draw(T, 0.4 + i * 0.25, 1.0)}
                   fill={INK} opacity={h.op} filter="url(#omBrush)" />
        ))}
        {/* fences along the near field */}
        <Stroke d="M 90 870 L 640 862 M 130 870 L 130 836 M 300 866 L 300 832 M 470 864 L 470 830 M 620 862 L 620 830"
                len={900} p={MOTION.draw(T, 4.2, 1.0)} color={INK} w={5} op={0.5} />
        {/* the gold field, stroke by stroke, swaying in wind */}
        {FIELD.map((f, i) => {
          const p = MOTION.draw(T, 2.6 + i * 0.22, 1.0);
          return (
            <g key={i} transform={`translate(${sway * (4 + i * 1.5) + Math.sin(T * 1.3 + f.ph) * 3} 0)`}>
              <Stroke d={`M ${f.x0} ${f.y} Q 960 ${f.y - 26} ${f.x1} ${f.y}`} len={2200} p={p}
                      color={i % 3 === 2 ? GOLDDIM : GOLD} w={f.w} op={0.45 + 0.06 * i} cap="butt" />
            </g>
          );
        })}
        {/* grass blades ticking above the field strokes */}
        {Array.from({ length: 26 }, (_, i) => {
          const bx = 60 + R(i + 100) * 1800, by = 872 + R(i + 101) * 26;
          const p = MOTION.draw(T, 3.6 + R(i + 102) * 1.2, 0.5);
          return <path key={i} d={`M ${bx} ${by} q ${4 + sway * 5} ${-16 - R(i + 103) * 14} ${10 + sway * 7} ${-20 - R(i + 103) * 16}`}
                       fill="none" stroke={GOLDDIM} strokeWidth="4" strokeLinecap="round" opacity={0.7 * p}
                       filter="url(#omBrush)" />;
        })}
        {/* the village, living peacefully */}
        {HUTS.map((h, i) => {
          const p = MOTION.draw(T, 4.4 + i * 0.7, 0.9);
          const smoke = clamp((T - (5.4 + i * 0.7)) / 1.2, 0, 1);
          return (
            <g key={i} opacity={p}>
              <path d={`M ${h.x} ${h.y} h ${h.w * p} v ${h.h * p} h ${-h.w * p} Z`}
                    fill="none" stroke={INK} strokeWidth="6" filter="url(#omBrush)" />
              <path d={`M ${h.x - 12} ${h.y} L ${h.x + h.w / 2} ${h.y - 46 * p} L ${h.x + h.w + 12} ${h.y}`}
                    fill={INK} opacity="0.85" filter="url(#omBrush)" />
              <path d={`M ${h.x + h.w * 0.42} ${h.y + h.h * p} v ${-h.h * 0.55 * p} h ${h.w * 0.16} v ${h.h * 0.55 * p}`}
                    fill="none" stroke={INK} strokeWidth="4" opacity={0.7 * p} filter="url(#omBrush)" />
              <path d={`M ${h.x + 8} ${h.y - 10} L ${h.x + h.w / 2} ${h.y - 38 * p} M ${h.x + h.w - 8} ${h.y - 10} L ${h.x + h.w / 2} ${h.y - 38 * p}`}
                    fill="none" stroke={INK} strokeWidth="3" opacity={0.35 * p} filter="url(#omBrush)" />
              {smoke > 0 && (
                <path d={`M ${h.x + h.w * 0.7} ${h.y - 40} q 10 -24 -4 -46 q -12 -20 4 -44`}
                      fill="none" stroke={INKMUTE} strokeWidth="6" strokeLinecap="round"
                      opacity={0.5 * smoke * (0.7 + 0.3 * Math.sin(T * 1.7 + i))} filter="url(#omBrush)"
                      transform={`translate(${Math.sin(T * 0.8 + i) * 5} ${-smoke * 8})`} />
              )}
              <text x={h.x + h.w / 2} y={h.y + h.h + (h.home ? 34 : 58)} textAnchor="middle" fontFamily={SERIF} fontSize={h.home ? 22 : 19}
                    fill={h.home ? INK : INKMUTE} opacity={(h.home ? 0.9 : 0.75) * clamp((T - (5.2 + i * 0.7)) / 1.0, 0, 1)}>{h.n}</text>
            </g>
          );
        })}
        {/* the windbreak — the pine row that shelters the home farm */}
        {[0, 1, 2, 3, 4].map((i) => {
          const p = MOTION.draw(T, 5.0 + i * 0.16, 0.6);
          const px = 60 + i * 40, py = 866;
          return <path key={i} d={`M ${px} ${py} L ${px + 20} ${py - 58 * p} L ${px + 40} ${py} Z`}
                       fill={INK} opacity={0.55 * p} filter="url(#omBrush)" />;
        })}
        {/* BRUCE — bearer of the torch, standing before the home farm */}
        {(() => {
          const p = MOTION.draw(T, 6.2, 0.8);
          if (p <= 0) return null;
          const bx = 570, by = 980;
          const flick = 0.75 + 0.25 * Math.sin(T * 11) * Math.sin(T * 7.3);
          return (
            <g opacity={p}>
              <g stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" filter="url(#omBrush)">
                <circle cx={bx} cy={by - 96} r="10" strokeWidth="5" />
                <path d={`M ${bx} ${by - 84} L ${bx} ${by - 38}`} />
                <path d={`M ${bx} ${by - 38} L ${bx - 14} ${by}`} /><path d={`M ${bx} ${by - 38} L ${bx + 14} ${by}`} />
                <path d={`M ${bx} ${by - 72} L ${bx - 16} ${by - 44}`} />
                <path d={`M ${bx} ${by - 72} L ${bx + 22} ${by - 104}`} />
              </g>
              {/* the patriarchal torch — raised into the clear sky between the rooflines */}
              <path d={`M ${bx + 22} ${by - 104} L ${bx + 28} ${by - 148}`} stroke={INK} strokeWidth="5" strokeLinecap="round" filter="url(#omBrush)" />
              <path d={`M ${bx + 28} ${by - 148} q -8 -14 0 -26 q 10 12 6 24 Z`} fill={cr > 0.5 ? EMBER : GOLD}
                    opacity={0.9 * flick} filter="url(#omBrush)" />
              <circle cx={bx + 29} cy={by - 160} r={16 + 3 * flick} fill={cr > 0.5 ? EMBER : GOLD} opacity={0.16 * flick} />
              <text x={bx} y={by + 52} textAnchor="middle" fontFamily={SERIF} fontSize="19" fill={INK}
                    opacity={0.85 * clamp((T - 7.0) / 1.0, 0, 1)}>Bruce — bearer of the torch</text>
            </g>
          );
        })()}
        {/* a worn path from the village into the field, and birds on the wind */}
        <Stroke d="M 420 1010 Q 760 960 1020 1000 Q 1320 1044 1620 1010" len={1300}
                p={MOTION.draw(T, 5.6, 1.2)} color={PAPER2} w={26} op={0.8} cap="butt" />
        {[0, 1].map((i) => {
          const bp = MOTION.fade(T, 4.6 + i * 0.7, null, 1.0);
          const bx = 500 + i * 130 + T * 26, by = 250 + i * 40 + Math.sin(T * 1.9 + i) * 12;
          return <path key={i} d={`M ${bx} ${by} q 9 -9 18 0 q 9 -9 18 0`} fill="none"
                       stroke={INK} strokeWidth="4" strokeLinecap="round" opacity={0.55 * bp} />;
        })}
        {/* THE FAMILY TREE — great gnarled trunk, bare boughs right, golden canopy over the crown */}
        <path d={`M 1210 950 Q 1190 800 1200 700 Q 1206 620 1226 560 L 1250 555 Q 1244 640 1252 700 Q 1262 800 1290 950 Z`}
               fill={INK} opacity={0.85 * MOTION.draw(T, 0.5, 1.2)} filter="url(#omBrush)" />
        <Stroke d="M 1226 600 Q 1330 520 1440 480 Q 1540 450 1640 460 M 1440 480 Q 1500 420 1560 400 M 1236 560 Q 1300 460 1360 420 M 1236 640 Q 1120 560 1020 540 M 1080 552 Q 1030 500 1010 460 M 1640 460 Q 1720 470 1780 500 M 1560 400 Q 1600 370 1660 360"
                len={2400} p={MOTION.draw(T, 1.0, 1.4)} color={INK} w={11} />
        {CANOPY.map((m, i) => {
          const p = Easing.easeOutCubic(clamp((T - (2.0 + i * 0.06)) / 0.7, 0, 1));
          const gold = i % 5 === 4 ? GOLDDIM : GOLD;
          return (
            <g key={i}>
              <circle cx={m.x + sway * 6 + Math.sin(T * 1.1 + i) * 3} cy={m.y} r={m.r * p}
                      fill={gold} opacity={(0.5 + R(i + 9) * 0.3) * (1 - cr)} filter="url(#omBrush)" />
              <circle cx={m.x + sway * 6 + Math.sin(T * 1.1 + i) * 3} cy={m.y} r={m.r * p}
                      fill={RED} opacity={(0.55 + R(i + 9) * 0.3) * cr} filter="url(#omBrush)" />
              {T > 9.3 && (
                <circle cx={m.x + sway * 6 + Math.sin(T * 1.1 + i) * 3} cy={m.y} r={m.r * p * 0.85}
                        fill={EMBER}
                        opacity={0.4 * clamp((T - 9.3 - R(i + 60) * 1.3) / 0.9, 0, 1) * (0.55 + 0.45 * Math.sin(T * 9 + i * 1.8))} />
              )}
            </g>
          );
        })}
        {/* the tree's grounding shadow */}
        <ellipse cx="1300" cy="946" rx={220 * MOTION.draw(T, 3.0, 1.2)} ry="24" fill={INK} opacity="0.1" />
        {/* the golden carpet — turns crimson at the end */}
        {CARPET.map((c, i) => {
          const p = MOTION.draw(T, 3.2 + i * 0.05, 0.7);
          return <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx * p} ry={c.ry}
                          fill={cr > 0.5 ? RED : GOLD} opacity={0.3 + R(i + 44) * 0.25} filter="url(#omBrush)" />;
        })}
      </svg>
      {/* the crimson turn — light and harmony drain as Sauron nears */}
      <div style={{ position: "absolute", inset: 0, opacity: cr * 0.75, background:
        "radial-gradient(ellipse 100% 90% at 50% 60%, rgba(169,50,38,0.5), rgba(90,16,10,0.8) 70%, rgba(14,8,5,0.96) 100%)" }} />
      <div style={{ position: "absolute", left: 150, top: 120, ...MOTION.enter(T, 2.6, 1.2, 26) }}>
        <div style={{ fontFamily: SERIF, fontSize: 48, lineHeight: 1.35, color: INK, maxWidth: 860 }}>
          It began with a boy’s vision —<br />a farm drawn generations ahead,<br />built field by patient field.
        </div>
      </div>
    </div>
  );
}

/* ---- transition: the wind rises, detailed maple leaves fall, burn inward from their
        edges, and dissolve into embers and ash that take over the scene (6.6–12.8) ---- */
const LEAF_PATH = "M 0 -32 L 5 -18 L 16 -26 L 12 -12 L 26 -14 L 16 -4 L 30 4 L 16 8 L 20 22 L 8 14 L 0 32 L -8 14 L -20 22 L -16 8 L -30 4 L -16 -4 L -26 -14 L -12 -12 L -16 -26 L -5 -18 Z";
const LEAF_VEINS = [[0, -28], [22, -11], [26, 3], [16, 18], [-16, 18], [-26, 3], [-22, -11]];
/* ---- transition: many SMALL gold leaves fall through the scene; from ~8.6s each ignites
        in its own moment — death by a thousand cuts — leaving embers and ash (2.4–12.8) ---- */
const LEAVES = Array.from({ length: 76 }, (_, i) => ({
  x: R(i) * 1920, delay: 2.8 + 8.0 * Math.pow(R(i + 5), 0.55), dur: 3.4 + R(i + 9) * 2.0,
  sway: 30 + R(i + 13) * 70, s: 5 + R(i + 17) * 9, rs: (R(i + 19) - 0.5) * 180,
  burnAt: 8.6 + R(i + 23) * 2.6, grad: R(i + 27) < 0.5,
}));
const EMBERS = Array.from({ length: 44 }, (_, i) => ({
  x: R(i + 200) * 1920, y0: 500 + R(i + 201) * 700, sp: 60 + R(i + 202) * 130,
  sw: 30 + R(i + 203) * 60, fr: 0.8 + R(i + 204) * 1.6, r: 2.5 + R(i + 205) * 4, hot: R(i + 206) < 0.5,
}));
const ASH = Array.from({ length: 30 }, (_, i) => ({
  x: R(i + 300) * 1920, sp: 40 + R(i + 301) * 70, sw: 40 + R(i + 302) * 70, r: 2 + R(i + 303) * 3.5,
}));
function BurningLeaf({ b, flick, grad, red }) {
  const s = 1 - 0.9 * Easing.easeInOutSine(b);   /* healthy heart shrinks as the edge burns inward */
  const cs = s + 0.22 * (1 - s);                 /* char stays a thin rim just outside the burn front */
  const fillId = red ? (grad ? "url(#omLeafA)" : "url(#omLeafB)") : (grad ? "url(#omLeafG)" : "url(#omLeafH)");
  return (
    <g>
      {b > 0 && <path d={LEAF_PATH} fill="#140A05" opacity={0.85 * b} transform={`scale(${cs.toFixed(3)})`} />}
      <g transform={`scale(${s.toFixed(3)})`}>
        <path d={LEAF_PATH} fill={fillId} />
        {LEAF_VEINS.map(([vx, vy], k) => (
          <line key={k} x1="0" y1="4" x2={vx} y2={vy} stroke="#6E1710" strokeWidth="1.4" opacity="0.5" />
        ))}
        <line x1="0" y1="30" x2="1" y2="43" stroke="#5A140E" strokeWidth="3" />
        {b > 0 && (
          <g>
            <path d={LEAF_PATH} fill="none" stroke={EMBER} strokeWidth={4 + 3 * flick} opacity="0.95" />
            <path d={LEAF_PATH} fill="none" stroke={EMBER2} strokeWidth={1.6} opacity={0.85 * flick} />
          </g>
        )}
      </g>
    </g>
  );
}
function LeafBurn({ T }) {
  if (T < 2.4 || T > 24.2) return null;
  const wind = clamp((T - 8.4) / 2.4, 0, 1);
  const red = T > 10.2;                                       /* the crimson turn */
  const takeover = clamp((T - 10.6) / 1.6, 0, 1);            /* embers claim the scene */
  const fadeOut = 1 - clamp((T - 22.6) / 1.4, 0, 1);         /* embers & ash carry through the burning of scene 2 */
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {LEAVES.map((l, i) => {
          const p = clamp((T - l.delay) / l.dur, 0, 1);
          if (p <= 0 || p >= 1) return null;
          const b = clamp((T - l.burnAt) / 0.9, 0, 1);        /* each small leaf gets its own cut */
          const gone = clamp((b - 0.7) / 0.3, 0, 1);
          if (gone >= 1) return null;
          const flick = 0.6 + 0.4 * Math.sin(T * 15 + i * 2.7);
          const x = l.x + Math.sin(T * 1.5 + i) * l.sway * (0.4 + wind) + wind * 130 * p;
          const y = -60 + 1250 * p;
          const sc = (l.s / 8) * (0.8 + p * 1.5);
          return (
            <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(T * l.rs + i * 47).toFixed(1)}) scale(${sc.toFixed(2)})`}
               opacity={1 - gone}>
              {b > 0 && b < 1 && <circle r={9 + 5 * flick} fill={EMBER} opacity={0.6 * (1 - b) * flick} />}
              <path d="M0 -8 Q7.5 -3 0 8 Q-7.5 -3 0 -8 Z"
                    fill={b > 0 ? (b > 0.85 ? "#9B948A" : b > 0.5 ? EMBER2 : EMBER) : (red ? RED : (l.grad ? GOLD : "#C9902A"))} />
              {b > 0.6 && <circle r="2.6" fill={EMBER2} opacity={flick} />}
            </g>
          );
        })}
        {/* red fire energy crackling faintly through the fall */}
        {T > 9.2 && T < 11.2 && [
          "M 300 200 L 420 340 L 380 420 L 560 600",
          "M 1600 160 L 1480 320 L 1540 420 L 1380 620",
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke={i % 2 ? EMBER : RED} strokeWidth="3" strokeLinecap="round"
                filter="url(#omBrush)" opacity={Math.max(0, Math.sin(T * 19 + i * 2.6)) * 0.4 * wind} />
        ))}
        {/* floating embers rise and take over — and keep rising through the burning of scene 2 */}
        {takeover > 0 && EMBERS.map((e, i) => {
          const y = e.y0 - ((T - 10.0) * e.sp) % 1400;
          const x = e.x + Math.sin(T * e.fr + i * 1.3) * e.sw;
          const fl = 0.5 + 0.5 * Math.sin(T * (6 + e.fr * 3) + i * 2.1);
          return (
            <g key={i} opacity={takeover * fadeOut}>
              <circle cx={x} cy={y} r={e.r * 2.6} fill={e.hot ? EMBER : RED} opacity={0.18 * fl} />
              <circle cx={x} cy={y} r={e.r} fill={e.hot ? EMBER2 : EMBER} opacity={0.5 + 0.5 * fl} />
            </g>
          );
        })}
        {/* ash rises on the heat with the embers */}
        {takeover > 0 && ASH.map((a, i) => {
          const y = 1130 - ((a.sp * 1.4 * (T - 10.0) + R(i + 310) * 1080) % 1180);
          const x = a.x + Math.sin(T * 0.9 + i * 1.9) * a.sw;
          return <circle key={i} cx={x} cy={y} r={a.r} fill="#9B948A"
                         opacity={0.5 * takeover * fadeOut * (0.5 + 0.5 * R(i + 311))} />;
        })}
      </svg>
      {/* the burn haze, then darkness into scene 2 */}
      <div style={{ position: "absolute", inset: 0, opacity: takeover * 0.5 * fadeOut, background:
        "radial-gradient(ellipse 80% 65% at 50% 70%, rgba(255,122,46,0.22), rgba(169,50,38,0.1) 50%, transparent 75%)" }} />
    </div>
  );
}

/* ---- 2 · Sauron: brimstone over the once-peaceful village (12–24) ---- */
const RINGS = Array.from({ length: 7 }, (_, i) => ({
  dx: (i - 3) * 150 + (R(i + 70) - 0.5) * 40, delay: 3.6 + i * 0.35, drift: R(i + 71) * 2,
}));
const METEORS = Array.from({ length: 8 }, (_, i) => ({
  ph: R(i + 80), tx: 260 + R(i + 81) * 1400, spd: 0.4 + R(i + 82) * 0.35,
}));
const VILLAGE_FIRE = [[380, 985], [560, 1000], [760, 990], [1210, 995], [1420, 985], [1620, 1000]];
function Sauron({ T, CUES }) {
  const t0 = CUES.Sauron, local = T - t0;
  const rise = MOTION.draw(T, t0 + 0.3, 1.6);
  const open = Easing.easeOutCubic(clamp((local - 1.6) / 1.4, 0, 1));
  const flick = 0.74 + 0.18 * Math.sin(T * 13) + 0.08 * Math.sin(T * 29 + 1.7);
  const trembleX = Math.sin(T * 31) * 2.2, trembleY = Math.cos(T * 27) * 1.6;
  const nameIn = Easing.easeOutCubic(clamp((local - 2.8) / 0.6, 0, 1));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - clamp((T - CUES.Party) / 1.1, 0, 1) }}>
      {/* brimstone sky and fire glow — already burning at the cut so the mountain reads immediately */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.55 + 0.45 * rise, background:
        `radial-gradient(ellipse 90% 45% at 50% 108%, rgba(255,122,46,0.4), rgba(169,50,38,0.18) 45%, transparent 72%),
         radial-gradient(ellipse 34% 26% at 22% 88%, rgba(255,122,46,0.22), transparent 70%),
         radial-gradient(ellipse 30% 22% at 78% 90%, rgba(255,122,46,0.2), transparent 70%),
         radial-gradient(ellipse 55% 35% at 50% 34%, rgba(255,122,46,${0.13 * flick}), transparent 70%)` }} />
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* the mountain, now his — rises from the horizon into the foreground */}
        {(() => { const s = 1 + 0.1 * Easing.easeOutCubic(clamp(local / 2.2, 0, 1));
          return <g transform={`translate(${960 * (1 - s)} ${1080 * (1 - s)}) scale(${s})`}>
            <path d="M -40 1080 L 420 830 L 960 430 L 1500 830 L 1980 1080 Z" fill="#0B0908"
                  opacity={0.45 + 0.55 * rise} filter="url(#omBrush)" />
            <path d="M -40 830 L 420 830 L 960 430 L 1500 830 L 1980 830" fill="none" stroke={EMBER}
                  strokeWidth="4" opacity={0.35 + 0.3 * rise} filter="url(#omBrush)" />
          </g>; })()}
        {/* BARAD-DÛR — the great tower: pronged crown, long shaft, flared rooted base */}
        <g opacity={MOTION.draw(T, t0 + 0.9, 1.3)} filter="url(#omBrush)">
          <path d="M 906 520 L 916 466 L 934 498 L 960 478 L 986 498 L 1004 466 L 1014 520 L 1002 706 L 918 706 Z" fill="#030201" />
          <path d="M 918 706 L 1002 706 L 1032 906 L 888 906 Z" fill="#030201" />
          <path d="M 888 906 L 1032 906 L 1096 1080 L 824 1080 Z" fill="#030201" />
          <path d="M 824 1080 L 888 906 L 846 894 L 758 1080 Z" fill="#050302" />
          <path d="M 1096 1080 L 1032 906 L 1074 894 L 1162 1080 Z" fill="#050302" />
          <path d="M 836 1080 L 846 754 L 861 730 L 876 754 L 882 1080 Z" fill="#050302" />
          <path d="M 1038 1080 L 1044 754 L 1059 730 L 1074 754 L 1084 1080 Z" fill="#050302" />
          {/* ember rim light — lifts the tower off the mountain */}
          <path d="M 916 466 L 934 498 L 960 478 L 986 498 L 1004 466 M 906 520 L 918 706 L 888 906 L 824 1080 M 1014 520 L 1002 706 L 1032 906 L 1096 1080 M 846 754 L 861 730 L 876 754 M 1044 754 L 1059 730 L 1074 754"
                fill="none" stroke={EMBER} strokeWidth="2.5" opacity={0.32 * flick} />
          <rect x="882" y="898" width="156" height="14" fill="#030201" stroke={EMBER} strokeWidth="1.5" strokeOpacity={0.25 * flick} />
          <rect x="908" y="700" width="104" height="12" fill="#030201" stroke={EMBER} strokeWidth="1.5" strokeOpacity={0.25 * flick} />
          {/* the gate, lit from within */}
          <path d="M 934 1080 L 934 1002 Q 960 976 986 1002 L 986 1080 Z" fill="#140300" />
          <path d="M 934 1080 L 934 1002 Q 960 976 986 1002 L 986 1080" fill="none" stroke={EMBER}
                strokeWidth="3" opacity={0.55 * flick} />
          {/* ember windows descending the shaft and towers */}
          {[[950, 560], [970, 610], [946, 660], [974, 730], [944, 790], [976, 850], [858, 800], [860, 880], [1056, 800], [1058, 880]].map(([wx, wy], k) => (
            <rect key={k} x={wx} y={wy} width="9" height="15" fill={EMBER}
                  opacity={0.45 + 0.4 * Math.sin(T * 3.3 + k * 1.9)} />
          ))}
        </g>
        {/* SAURON'S SHADOW — pours from the tower's base down the mountain, over the land */}
        {(() => {
          const sp = Easing.easeInOutSine(clamp((local - 1.6) / 4.6, 0, 1));
          if (sp <= 0) return null;
          const w = 1150 * sp;
          return (
            <g>
              <path d={`M 960 690 Q ${960 - w * 0.55} ${870 - 40 * sp} ${960 - w} 1080 L ${960 + w} 1080 Q ${960 + w * 0.55} ${870 - 40 * sp} 960 690 Z`}
                    fill="#030201" opacity={0.5 * sp} filter="url(#omBrush)" />
              <path d={`M 960 720 Q ${960 - w * 0.4} 920 ${960 - w * 0.8} 1080 L ${960 + w * 0.8} 1080 Q ${960 + w * 0.4} 920 960 720 Z`}
                    fill="#020101" opacity={0.62 * sp} filter="url(#omBrush)" />
            </g>
          );
        })()}
        {/* THE EYE — great, circular, wreathed in flame — seated on the keep below the name */}
        <g transform="translate(960 415)" opacity={open}>
          <circle r={150 * open} fill={EMBER} opacity={0.14 * flick} />
          <circle r={110 * open} fill={EMBER} opacity={0.2 * flick} />
          {Array.from({ length: 14 }, (_, k) => {
            const a = (k / 14) * Math.PI * 2 + T * 0.35;
            const fl = 0.6 + 0.4 * Math.sin(T * 6 + k * 2.3);
            return <line key={k} x1={Math.cos(a) * 72} y1={Math.sin(a) * 72}
                         x2={Math.cos(a) * (95 + 26 * fl)} y2={Math.sin(a) * (95 + 26 * fl)}
                         stroke={k % 2 ? EMBER : EMBER2} strokeWidth="7" strokeLinecap="round"
                         opacity={0.6 * fl * open} filter="url(#omBrush)" />;
          })}
          <circle r={72 * open} fill={EMBER} opacity={flick} filter="url(#omBrush)" />
          <circle r={56 * open} fill={EMBER2} opacity={0.85 * flick} />
          <path d={`M 0 ${-46 * open} Q ${13 * open} 0 0 ${46 * open} Q ${-13 * open} 0 0 ${-46 * open} Z`} fill="#140300" />
          <ellipse rx={3 * open} ry={30 * open} fill={EMBER2} opacity={0.5 * flick} />
        </g>
        {/* destruction rains on the village below */}
        {METEORS.map((m, i) => {
          const tt = ((local * m.spd + m.ph) % 1);
          if (local < 2.4) return null;
          const x0 = 960, y0 = 530, x1 = m.tx, y1 = 990;
          const x = x0 + (x1 - x0) * tt, y = y0 + (y1 - y0) * tt * tt;
          const xb = x0 + (x1 - x0) * Math.max(0, tt - 0.09), yb = y0 + (y1 - y0) * Math.pow(Math.max(0, tt - 0.09), 2);
          return (
            <g key={i} opacity={Math.min(1, tt * 6) * (tt > 0.94 ? (1 - tt) * 16 : 1)}>
              <line x1={xb} y1={yb} x2={x} y2={y} stroke={EMBER} strokeWidth="6" strokeLinecap="round" filter="url(#omBrush)" />
              <circle cx={x} cy={y} r="7" fill={EMBER2} />
            </g>
          );
        })}
        {/* the village burns */}
        {VILLAGE_FIRE.map(([fx, fy], i) => {
          const fl = 0.6 + 0.4 * Math.sin(T * 7 + i * 2.1);
          const p = clamp((local - 2.8 - i * 0.3) / 1.0, 0, 1);
          return (
            <g key={i} opacity={p}>
              <path d={`M ${fx - 34} ${fy} h 68 v -30 l -34 -18 l -34 18 Z`} fill="#0B0908" filter="url(#omBrush)" />
              <path d={`M ${fx - 18} ${fy - 44} Q ${fx - 22} ${fy - 66 - 22 * fl} ${fx} ${fy - 78 - 26 * fl} Q ${fx + 20} ${fy - 60 - 18 * fl} ${fx + 16} ${fy - 44} Z`}
                    fill={i % 2 ? EMBER : EMBER2} opacity={0.75 * fl} filter="url(#omBrush)" />
            </g>
          );
        })}
      </svg>
      {/* depth: foreground rocks and a drifting smoke band */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d="M -40 1080 L -40 980 Q 120 940 260 990 Q 340 1020 420 1080 Z" fill="#060302" />
        <path d="M 1980 1080 L 1980 960 Q 1820 930 1700 980 Q 1600 1030 1520 1080 Z" fill="#060302" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: "60%", height: "18%", filter: "blur(9px)",
        background: "linear-gradient(90deg, transparent, rgba(255,122,46,0.1) 35%, rgba(20,10,6,0.5) 70%, transparent)",
        transform: `translateX(${Math.sin(T * 0.28) * 60 - 40}px)`, opacity: rise * 0.9 }} />
      {/* hero text — above everything, subtext fully visible */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 54, textAlign: "center", zIndex: 5,
                    opacity: nameIn * (0.9 + 0.1 * flick) * (1 - clamp((local - 11.2) / 0.6, 0, 1)),
                    transform: `translate(${trembleX}px, ${trembleY + (1 - nameIn) * 40}px) scale(${1.3 - 0.3 * nameIn})` }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 190, lineHeight: 1, letterSpacing: "0.16em",
                      color: "#241108", textShadow: `0 0 ${60 * flick}px rgba(255,122,46,0.55), 0 0 14px rgba(255,122,46,0.4)`,
                      WebkitTextStroke: `2px rgba(255,122,46,${0.5 * flick})` }}>SAURON</div>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.8em", color: EMBER2, marginTop: 14,
                      textShadow: "0 2px 12px rgba(0,0,0,0.9)", opacity: MOTION.fade(T, t0 + 3.8, null, 0.8) }}>
          THE ORDER-IMPOSER
        </div>
      </div>
      {/* rings render in the persistent RingCarry overlay so they survive the scene cut */}
    </div>
  );
}

/* ---- the seven rings: born at the Eye, carried across the cut, equipped as each hero rises ---- */
function RingCarry({ T, CUES }) {
  const t0 = CUES.Sauron, tp = CUES.Party;
  if (T < t0 + 3.4 || T > tp + 7.0) return null;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, zIndex: 7, pointerEvents: "none" }}>
      {RINGS.map((r, i) => {
        const local = T - t0;
        const p = Easing.easeInOutSine(clamp((local - r.delay) / 3.4, 0, 1));
        if (p <= 0) return null;
        const at = tp + 2.2 + i * 0.25;
        const handoff = clamp((T - (at + 0.35)) / 0.2, 0, 1);         /* hero has risen into it */
        if (handoff >= 1) return null;
        const x1 = 960 + r.dx * Easing.easeOutCubic(p) + Math.sin(T * (1.1 + r.drift) + i) * 9 * (1 - p * 0.5);
        const y1 = 455 + 325 * p;                                    /* settle higher — clear of the captions */
        const travel = Easing.easeInOutCubic(clamp((T - (tp - 0.7 - i * 0.08)) / 1.7, 0, 1));
        const tx = 486 + i * 158, ty = 512 + Math.sin(T * 1.6 + i) * 6 * (1 - handoff);
        const x = x1 + (tx - x1) * travel, y = y1 + (ty - y1) * travel;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
             opacity={Math.min(1, p * 4) * (1 - handoff)}>
            <circle r={22 - 6 * travel} fill="none" stroke={GOLD} strokeWidth={7 - travel} filter="url(#omBrush)" />
            <circle r={22 - 6 * travel} fill="none" stroke={EMBER2} strokeWidth="2" opacity={0.5 + 0.4 * Math.sin(T * 5 + i)} />
          </g>
        );
      })}
    </svg>
  );
}

/* ---- 3 · Seven brave souls step forward and take the rings (24–36) ---- */
const PARTY = [
  { n: "Bruce", e: "the Relentless" }, { n: "Nathan", e: "the Swift" }, { n: "Narayan", e: "the Wise" },
  { n: "Joe", e: "the Unshaken" }, { n: "Tony", e: "the Forger" }, { n: "Eric", e: "the Founder" },
  { n: "Rodo", e: "the Steady" },
];
function Party({ T, CUES }) {
  const t0 = CUES.Party;
  const out = 1 - clamp((T - (t0 + 11.3)) / 1.1, 0, 1);          /* cross-dissolve into the forge */
  const fin = clamp((T - t0) / 1.1, 0, 1);                       /* fade in over the dimming brimstone */
  const dimC = 1 - 0.85 * clamp((T - (t0 + 9.6)) / 1.8, 0, 1);   /* the party recedes as the forger walks off */
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: PAPER, opacity: fin * out }}>
      {/* rings arrive via the persistent RingCarry overlay; heroes rise up into them */}
      <div style={{ textAlign: "center", opacity: dimC }}>
        <div style={{ fontFamily: SERIF, fontSize: 64, color: INK, marginBottom: 12,
                      ...MOTION.enter(T, t0 + 0.5, 1.2, 24) }}>Seven brave souls stepped forward.</div>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.4em", color: GOLDDIM, marginBottom: 56,
                      ...MOTION.enter(T, t0 + 1.6, 1.0, 14) }}>AND TOOK THE RINGS</div>
        <div style={{ display: "flex", gap: 30, justifyContent: "center" }}>
          {PARTY.map((p, i) => {
            const at = t0 + 2.2 + i * 0.25;
            const e = Easing.easeOutCubic(clamp((T - at) / 0.5, 0, 1));
            const stroke = MOTION.draw(T, at, 0.4);
            const equip = clamp((T - (at + 0.35)) / 0.2, 0, 1);   /* the overlay ring hands off here */
            const walkOff = i === 4 ? 1 - clamp((T - (t0 + 9.2)) / 0.5, 0, 1) : 1;   /* the Forger leaves for the anvil */
            return (
              <div key={p.n} style={{ opacity: e * walkOff, transform: `translateY(${(1 - e) * 130}px) scale(${0.9 + 0.1 * e})`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <svg width="128" height="180" viewBox="0 0 128 180" style={{ overflow: "visible" }}>
                  {equip > 0 && (
                    <g transform="translate(64 24)">
                      <circle r="16" fill="none" stroke={GOLD} strokeWidth="6" filter="url(#omBrush)" opacity={equip} />
                      {equip < 1 && <circle r={16 + 34 * equip} fill="none" stroke={GOLD} strokeWidth={3 * (1 - equip)}
                              opacity={0.8 * (1 - equip)} />}
                    </g>
                  )}
                  <path d={`M 64 ${168 - 110 * stroke} L 64.8 168`} stroke={INK} strokeWidth="9"
                        strokeLinecap="round" />
                  <circle cx="64" cy="52" r={11 * stroke} fill="none" stroke={INK} strokeWidth="5" filter="url(#omBrush)" />
                  {stroke > 0.9 && <line x1="64" y1="92" x2={64 + (i % 2 ? 32 : -32)} y2="72"
                        stroke={GOLDDIM} strokeWidth="5" strokeLinecap="round" filter="url(#omBrush)" />}
                </svg>
                <div style={{ fontFamily: SERIF, fontSize: 30, color: INK }}>{p.n}</div>
                <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.16em", color: INKMUTE }}>{p.e}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- the Forger walks from the party line to the anvil, across the cut, and takes up the hammer ---- */
function ForgeWalker({ T, CUES }) {
  const tf = CUES.Seed;
  const start = tf - 2.7, end = tf + 1.05;
  if (T < start || T > end + 0.5) return null;
  const p = Easing.easeInOutSine(clamp((T - start) / (end - start), 0, 1));
  const fade = Math.min(clamp((T - start) / 0.35, 0, 1), 1 - clamp((T - end) / 0.4, 0, 1));
  const cut = clamp((T - tf) / 0.7, 0, 1);                 /* ground turns dark — figure turns paper */
  const x = 1118 - 418 * p, y = 645 + 62 * p;
  const ph = T * 7.2, bob = Math.abs(Math.sin(ph)) * 4;
  const lg = Math.sin(ph) * 20;
  const stoop = Easing.easeInOutSine(clamp((T - (end - 0.5)) / 0.5, 0, 1)) * 18;   /* bends for the hammer */
  const fig = (col, op) => (
    <g stroke={col} strokeWidth="8" strokeLinecap="round" fill="none" opacity={op} filter="url(#omBrush)">
      <circle cx={-stoop * 0.8} cy={-118 + stoop * 0.5} r="11" strokeWidth="5" />
      <path d={`M 0 -42 Q ${-stoop * 0.5} ${-75 + stoop * 0.3} ${-stoop * 0.8} ${-104 + stoop * 0.5}`} />
      <path d={`M 0 -42 L ${-lg} 0`} /><path d={`M 0 -42 L ${lg} 0`} />
      <path d={`M ${-stoop * 0.4} -92 L ${-16 - Math.sin(ph + 1.5) * 12 - stoop} ${-52 + stoop}`} />
      <path d={`M ${-stoop * 0.4} -92 L ${14 + Math.sin(ph + 1.5) * 12} -54`} strokeWidth="6" opacity="0.8" />
    </g>
  );
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, zIndex: 7, pointerEvents: "none" }}>
      <g transform={`translate(${x.toFixed(1)} ${(y - bob).toFixed(1)})`}>
        {cut < 1 && fig(INK, fade * (1 - cut))}
        {cut > 0 && fig(PAPTXT, fade * cut * 0.9)}
      </g>
    </svg>
  );
}

/* ---- 4 · The forge: melt the rings down (36–46) ---- */
const CLANKS = [1.6, 2.75, 3.9, 5.05, 6.2];  /* local seconds; anvil SFX matches */
function Forge({ T, CUES }) {
  const t0 = CUES.Seed, local = T - t0;
  let strike = 0, sIdx = -1;
  CLANKS.forEach((c, i) => { const dt = local - c; if (dt > 0 && dt < 0.5) { strike = 1 - dt / 0.5; sIdx = i; } });
  const hammerAng = (() => {
    let a = 85;                                                                            /* raised high above the anvil */
    for (const c of CLANKS) {
      const dt = local - c;
      if (dt > -0.45 && dt <= 0) a = 85 - 85 * Easing.easeInCubic((dt + 0.45) / 0.45);    /* downswing from above onto the ring */
      else if (dt > 0 && dt < 0.6) a = 85 * Easing.easeOutCubic(dt / 0.6);                /* lift back up for the next blow */
    }
    return a;
  })();
  const melt = Easing.easeInOutCubic(clamp((local - 2.0) / 4.4, 0, 1));
  const v = 1000000 * Easing.easeOutExpo(clamp((local - 2.6) / 4.9, 0, 1));
  const glow = 0.5 + 0.25 * Math.sin(T * 3.1) + strike * 0.4;
  const fout = 1 - clamp((T - (CUES.Plan - 0.8)) / 0.8, 0, 1);   /* dissolve into the war room — no wipe */
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fout, transform: strike > 0.04
        ? `translate(${Math.sin(T * 90) * 6 * strike}px, ${Math.cos(T * 72) * 5 * strike}px)` : "none" }}>
      {/* strobe — the frame flashes with each blow */}
      {strike > 0 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
          background: sIdx % 2 ? "rgba(237,230,216,0.9)" : "rgba(255,194,77,0.85)",
          opacity: 0.4 * Math.pow(strike, 2.2) }} />
      )}
      <div style={{ position: "absolute", left: 340, top: 460, width: 560, height: 420,
        background: `radial-gradient(ellipse 50% 45% at 50% 60%, rgba(255,122,46,${0.3 * glow}), transparent 70%)` }} />
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g opacity={MOTION.draw(T, t0 + 0.2, 0.9)}>
          <path d="M 480 700 L 800 700 L 780 750 L 700 770 L 700 830 L 580 830 L 580 770 L 500 750 Z"
                fill="#0B0908" filter="url(#omBrush)" />
          <path d="M 800 700 L 870 690 L 850 730 L 780 750 Z" fill="#0B0908" filter="url(#omBrush)" />
        </g>
        <g transform="translate(640 672)" opacity={1 - melt}>
          <circle r={20 * (1 - melt * 0.5)} fill="none" stroke={GOLD} strokeWidth="7" filter="url(#omBrush)" />
        </g>
        {/* the blacksmith — the Forger arrives and takes his stance */}
        <g opacity={MOTION.draw(T, t0 + 1.0, 0.5)} filter="url(#omBrush)">
          <circle cx="838" cy="560" r="17" fill="#0B0908" />
          <path d="M 838 578 Q 826 640 820 700 L 794 830 L 772 830 L 806 700 L 806 640 Z" fill="#0B0908" />
          <path d="M 820 700 L 862 830 L 884 830 L 846 690 Z" fill="#0B0908" />
          <path d="M 828 610 Q 780 640 736 660 L 742 674 Q 790 656 832 632 Z" fill="#0B0908" />
        </g>
        {/* the hammer arm — lifted from the anvil side, head lands ON the ring */}
        <g transform={`translate(834 596) rotate(${hammerAng})`} opacity={MOTION.draw(T, t0 + 1.15, 0.4)}>
          <path d="M 0 0 Q -60 16 -110 38 L -104 52 Q -54 30 2 14 Z" fill="#0B0908" filter="url(#omBrush)" />
          <line x1="-104" y1="44" x2="-186" y2="70" stroke={INKSOFT} strokeWidth="11" strokeLinecap="round" filter="url(#omBrush)" />
          <rect x="-214" y="48" width="52" height="34" rx="5" fill="#0B0908" filter="url(#omBrush)" transform="rotate(18 -188 65)" />
        </g>
        {/* swing streaks — the motion-art trail of the blow, arcing down from above */}
        {strike > 0.45 && (
          <path d="M 700 430 Q 630 520 646 648 M 750 415 Q 660 510 660 656" fill="none" stroke={PAPER}
                strokeWidth="5" strokeLinecap="round" opacity={(strike - 0.45) * 1.1} filter="url(#omBrush)" />
        )}
        {strike > 0 && Array.from({ length: 15 }, (_, k) => {
          const a = R(sIdx * 17 + k) * Math.PI * 1.3 - Math.PI * 1.15, sp = 60 + R(sIdx * 7 + k) * 190;
          const d = (1 - strike);
          return <line key={k} x1={640 + Math.cos(a) * sp * d * 0.4} y1={668 + Math.sin(a) * sp * d * 0.4}
                       x2={640 + Math.cos(a) * sp * d} y2={668 + Math.sin(a) * sp * d}
                       stroke={k % 3 === 2 ? GOLD : EMBER2} strokeWidth={k % 2 ? 3 : 4.5} strokeLinecap="round" opacity={strike} />;
        })}
        <path d={`M 640 690 Q 660 ${740 + 40 * melt} 700 ${820}`} fill="none" stroke={GOLD}
              strokeWidth={10 * melt} opacity={melt * 0.9} filter="url(#omBrush)" />
        <ellipse cx="716" cy="856" rx={90 * melt} ry={16 * melt} fill={GOLD} opacity={0.85 * glow} filter="url(#omBrush)" />
      </svg>
      <div style={{ position: "absolute", right: 190, top: 330, textAlign: "right", ...MOTION.enter(T, t0 + 1.6, 1.2, 24) }}>
        <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: "0.5em", color: GOLDDIM, marginBottom: 22,
                      ...MOTION.enter(T, t0 + 1.2, 1.0, 12) }}>THE WIZARDS' FORGE</div>
        <div style={{ fontFamily: SERIF, fontSize: 52, lineHeight: 1.35, color: PAPTXT, marginBottom: 34 }}>
          They melted his gift<br />into a war chest.
        </div>
        <div style={{ fontFamily: MONO, fontSize: 76, color: GOLD, fontVariantNumeric: "tabular-nums",
                      textShadow: "0 0 30px rgba(227,168,58,0.35)" }}>
          ${Math.round(v).toLocaleString("en-US")}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: "0.3em", color: INKMUTE, marginTop: 18,
                      ...MOTION.enter(T, t0 + 7.4, 1.0, 12) }}>EACH · PAPER GOLD · SIM · ZERO DOWNSIDE</div>
      </div>
    </div>
  );
}

/* ---- 5 · The battle plan: candles drawn on the diagonal (46–56) ---- */
const PLAN_PTS = [
  [300, 830], [440, 745], [580, 660], [720, 565], [860, 480], [1000, 400], [1160, 470], [1330, 560], [1520, 640],
];
const PLAN_UP = [1, 1, 0, 1, 1, 1, 0, 1, 0];
function Plan({ T, CUES }) {
  const t0 = CUES.Plan;
  const fin = clamp((T - t0) / 0.9, 0, 1);                 /* quiet cross-fade in — no wipe */
  const arrow = MOTION.draw(T, t0 + 7.8, 1.4), AL = 1650;
  const vixIn = Easing.easeOutCubic(clamp((T - (t0 + 0.9)) / 1.0, 0, 1));   /* enters with “The fear is high…” */
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fin }}>
      {/* war-room glow — a low candlelit wash behind the charts */}
      <div style={{ position: "absolute", inset: 0, background:
        "radial-gradient(ellipse 70% 55% at 46% 56%, rgba(227,168,58,0.07), transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.07, background:
        `repeating-linear-gradient(0deg, transparent 0 46px, ${PAPER} 46px 47px), repeating-linear-gradient(90deg, transparent 0 46px, ${PAPER} 46px 47px)` }} />
      <div style={{ position: "absolute", left: 150, top: 130 }}>
        <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: "0.5em", color: GOLDDIM, marginBottom: 20,
                      ...MOTION.enter(T, t0 + 0.3, 1.0, 18) }}>THE BATTLE PLAN</div>
        <div style={{ fontFamily: SERIF, fontSize: 44, color: PAPTXT, lineHeight: 1.4, ...MOTION.enter(T, t0 + 0.8, 1.0, 20) }}>“The fear is high…”</div>
        <div style={{ fontFamily: SERIF, fontSize: 44, color: PAPTXT, lineHeight: 1.4, ...MOTION.enter(T, t0 + 3.0, 1.0, 20) }}>“Will the support bands hold…”</div>
        <div style={{ fontFamily: SERIF, fontSize: 44, color: GOLD, lineHeight: 1.4, textShadow: "0 0 26px rgba(227,168,58,0.3)", ...MOTION.enter(T, t0 + 5.8, 1.0, 20) }}>“The candles will light the way.”</div>
      </div>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {PLAN_PTS.map(([x, y], i) => {
          const e = Easing.easeOutCubic(clamp((T - (t0 + 5.8 + i * 0.38)) / 0.9, 0, 1));
          const up = PLAN_UP[i], col = up ? "#79B366" : "#D4483A";
          const w = 26 + Math.floor(R(i + 64) * 14), h = (44 + R(i + 60) * 118) * e;
          const wickUp = (14 + R(i + 66) * 34) * e, wickDn = (10 + R(i + 67) * 26) * e;
          return (
            <g key={i} opacity={e}>
              <line x1={x + w / 2} y1={y - h - wickUp} x2={x + w / 2} y2={y + wickDn} stroke={col} strokeWidth="3.5" opacity="0.75" />
              <rect x={x} y={y - h} width={w} height={Math.max(h, 1)} fill={up ? "none" : col}
                    stroke={col} strokeWidth={3 + R(i + 68) * 2} filter="url(#omBrush)" />
              {up && <rect x={x + 3} y={y - h + 3} width={w - 6} height={Math.max(h - 6, 1)} fill="#79B366" opacity="0.18" />}
            </g>
          );
        })}
        {/* Bollinger envelope \u2014 reveals with \u201cWill the support bands hold\u2026\u201d */}
        <g opacity={MOTION.fade(T, t0 + 3.0, null, 0.9)}>
          <path d="M 260 800 L 1020 280 L 1180 360 L 1600 540" fill="none" stroke={PAPTXT} strokeWidth="3" strokeDasharray="10 12" opacity="0.55" />
          <path d="M 260 960 L 1020 440 L 1180 520 L 1600 700" fill="none" stroke={PAPTXT} strokeWidth="3" strokeDasharray="10 12" opacity="0.55" />
          <path d="M 260 800 L 1020 280 L 1180 360 L 1600 540 L 1600 700 L 1180 520 L 1020 440 L 260 960 Z" fill={PAPER} opacity="0.05" />
          <text x="1614" y="544" fontFamily={MONO} fontSize="15" fill={PAPTXT} opacity="0.7" letterSpacing="1">BOLL +2σ</text>
          <text x="1614" y="704" fontFamily={MONO} fontSize="15" fill={PAPTXT} opacity="0.7" letterSpacing="1">BOLL −2σ</text>
        </g>
        {/* moving averages — the golden cross */}
        <Stroke d="M 280 852 Q 700 660 1000 440 Q 1260 500 1560 610" len={1550} p={MOTION.draw(T, t0 + 3.4, 1.4)} color={GOLD} w={5} />
        <Stroke d="M 280 780 Q 700 730 1050 640 Q 1300 610 1560 648" len={1400} p={MOTION.draw(T, t0 + 3.8, 1.4)} color={PAPTXT} w={5} op={0.5} />
        <g opacity={MOTION.fade(T, t0 + 5.2, null, 0.85)}>
          <circle cx="872" cy="702" r="13" fill="none" stroke={GOLD} strokeWidth="3" />
          <text x="898" y="735" fontFamily={MONO} fontSize="15" fill={GOLD} letterSpacing="1">GOLDEN CROSS · MA50 ↑ MA200</text>
        </g>
        {/* the fear gauge — rises in beside its line, “The fear is high…” */}
        <g transform={`translate(340 ${470 + 26 * (1 - vixIn)})`} opacity={vixIn}>
          <path d="M -80 0 A 80 80 0 0 1 0 -80" fill="none" stroke={GOLDDIM} strokeWidth="7" />
          <path d="M 0 -80 A 80 80 0 0 1 80 0" fill="none" stroke="#D4483A" strokeWidth="7" />
          <line x1="0" y1="0" x2={Math.cos(-0.85 + 0.06 * Math.sin(T * 2.6)) * 62} y2={Math.sin(-0.85 + 0.06 * Math.sin(T * 2.6)) * 62}
                stroke={PAPTXT} strokeWidth="5" strokeLinecap="round" />
        </g>
        {/* the greeks — the blade's geometry */}
        <g opacity={MOTION.fade(T, t0 + 4.6, null, 0.8)}>
          <text x="1620" y="318" fontFamily={MONO} fontSize="16" fill={GOLD} letterSpacing="3">THE GREEKS</text>
          {["Δ delta 0.62", "Γ gamma 0.07", "Θ theta −0.04", "ν vega 0.18"].map((s, k) => (
            <text key={k} x="1620" y={350 + k * 30} fontFamily={MONO} fontSize="17" fill={PAPTXT} opacity="0.72" letterSpacing="1">{s}</text>
          ))}
        </g>
        {/* RSI — momentum beneath the advance */}
        <g opacity={MOTION.fade(T, t0 + 5.0, null, 0.9)}>
          <rect x="1040" y="750" width="520" height="120" fill={PAPER} opacity="0.05" />
          <line x1="1040" y1="786" x2="1560" y2="786" stroke="#D4483A" strokeWidth="2" strokeDasharray="6 8" opacity="0.65" />
          <line x1="1040" y1="834" x2="1560" y2="834" stroke={GOLDDIM} strokeWidth="2" strokeDasharray="6 8" opacity="0.65" />
          <text x="1046" y="780" fontFamily={MONO} fontSize="13" fill={PAPTXT} opacity="0.6">70</text>
          <text x="1046" y="852" fontFamily={MONO} fontSize="13" fill={PAPTXT} opacity="0.6">30</text>
          <text x="1560" y="742" textAnchor="end" fontFamily={MONO} fontSize="15" fill={PAPTXT} opacity="0.7" letterSpacing="2">RSI 14 · 62</text>
        </g>
        <Stroke d="M 1060 848 Q 1120 800 1180 826 Q 1240 850 1300 806 Q 1360 770 1420 812 Q 1470 842 1540 792"
                len={620} p={MOTION.draw(T, t0 + 5.4, 1.3)} color={PAPTXT} w={4} op={0.75} />
        <Stroke d="M 260 880 L 1020 360 L 1180 440 L 1600 620" len={AL} p={arrow} color={GOLD} w={7} />
        {arrow > 0.97 && <polygon points="1600,620 1568,606 1580,636" fill={GOLD} />}
        <g opacity={MOTION.fade(T, t0 + 8.4, null, 0.95)} fontFamily={MONO} fontSize="17" letterSpacing="2">
          <text x="300" y="960" fill={GOLD}>ENTRY — NAME THE WHY</text>
          <text x="880" y="960" fill={PAPTXT} opacity="0.75">RISK — KNOWN BEFORE THE BLOW</text>
          <text x="1460" y="960" fill="#D4483A">EXIT — CHOSEN, NOT SUFFERED</text>
        </g>
      </svg>
      {/* gauge labels as HTML — immune to svg-text raster clipping in the host view */}
      <div style={{ position: "absolute", left: 190, top: 424, width: 300, textAlign: "center", opacity: vixIn,
                    transform: `translateY(${26 * (1 - vixIn)}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 1, color: PAPTXT }}>VIX 31</div>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 2, color: PAPTXT, opacity: 0.75, marginTop: 33 }}>CALM → GREED</div>
      </div>
    </div>
  );
}

/* ---- 6 · Darkness… then the battle erupts (56–68) ---- */
const BOOMS = [1.6, 4.6, 7.8];
const SLASHES = [
  { at: 2.2, x1: 300, y1: 260, x2: 900, y2: 620 }, { at: 2.7, x1: 1620, y1: 240, x2: 1050, y2: 600 },
  { at: 5.2, x1: 500, y1: 820, x2: 1080, y2: 380 }, { at: 5.8, x1: 1500, y1: 780, x2: 950, y2: 420 },
  { at: 8.4, x1: 700, y1: 200, x2: 1150, y2: 560 },
];
const SPELLS = [
  { at: 3.4, d: "M 200 900 Q 700 300 1120 430" }, { at: 6.4, d: "M 1750 860 Q 1300 260 1000 420" },
];
function Battle({ T, CUES }) {
  const t0 = CUES.Climb, local = T - t0;
  const dark = local < 1.6;
  let flash = 0;
  for (const b of BOOMS) { const dt = local - b; if (dt > 0 && dt < 0.7) flash = Math.max(flash, 1 - dt / 0.7); }
  const shake = flash > 0.04 ? `translate(${Math.sin(T * 95) * 14 * flash}px, ${Math.cos(T * 74) * 11 * flash}px)` : "none";
  const path = MOTION.draw(T, t0 + 2.0, 8.0);
  const emberDot = 0.5 + 0.5 * Math.sin(T * 9);
  const bout = 1 - clamp((T - (CUES.Credits - 0.9)) / 0.9, 0, 1);   /* dissolve into the credits — no wipe */
  return (
    <div style={{ position: "absolute", inset: 0, transform: shake, opacity: bout }}>
      {dark && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <div style={{ width: 10, height: 10, borderRadius: 6, background: EMBER,
                        boxShadow: `0 0 ${30 + 24 * emberDot}px rgba(255,122,46,0.8)`,
                        opacity: 0.6 + 0.4 * emberDot }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: PAPER, opacity: flash * 0.3 }} />
      <div style={{ position: "absolute", inset: 0, opacity: dark ? 0 : 1, transition: "opacity 0.2s" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <path d="M 560 1080 L 960 330 L 1360 1080 Z" fill={PAPER} opacity="0.05" />
          <path d={RIDGE} fill="none" stroke={PAPER} strokeWidth="6" opacity="0.35" filter="url(#omBrush)" strokeLinecap="round" />
          <Stroke d="M -40 840 L 300 720 L 560 780 L 960 330" len={1400} p={path} color={GOLD} w={9} />
          {path > 0.1 && <circle cx={interpolate([0.1, 1], [300, 960], Easing.linear)(Math.min(path, 1))}
                  cy={interpolate([0.1, 1], [720, 340], Easing.linear)(Math.min(path, 1))}
                  r="11" fill={GOLD} />}
          <g transform="translate(960 290)">
            <circle r={30 + 6 * Math.sin(T * 13)} fill={EMBER} opacity="0.3" />
            <circle r="22" fill={EMBER} opacity={0.85 + 0.15 * Math.sin(T * 13)} filter="url(#omBrush)" />
            <path d="M 0 -15 Q 3 0 0 15 Q -3 0 0 -15 Z" fill="#140300" />
          </g>
          {BOOMS.map((b, i) => {
            const dt = local - b;
            if (dt <= 0 || dt > 0.7) return null;
            const p = dt / 0.7, cx = [340, 1580, 760][i], cy = [760, 700, 820][i];
            return Array.from({ length: 10 }, (_, k) => {
              const a = (k / 10) * Math.PI * 2 + R(i * 31 + k);
              return <line key={i * 20 + k} x1={cx + Math.cos(a) * 30 * p} y1={cy + Math.sin(a) * 30 * p}
                           x2={cx + Math.cos(a) * (60 + 160 * p)} y2={cy + Math.sin(a) * (60 + 160 * p)}
                           stroke={i % 2 ? EMBER2 : EMBER} strokeWidth="5" strokeLinecap="round" opacity={1 - p} />;
            });
          })}
          {SLASHES.map((s, i) => {
            const dt = local - s.at;
            if (dt <= 0 || dt > 0.45) return null;
            const p = Easing.easeOutCubic(Math.min(dt / 0.22, 1)), fadeS = 1 - dt / 0.45;
            return <line key={i} x1={s.x1} y1={s.y1} x2={s.x1 + (s.x2 - s.x1) * p} y2={s.y1 + (s.y2 - s.y1) * p}
                         stroke={PAPER} strokeWidth="7" strokeLinecap="round" opacity={fadeS * 0.9} filter="url(#omBrush)" />;
          })}
          {SPELLS.map((s, i) => {
            const p = clamp((local - s.at) / 1.1, 0, 1);
            if (p <= 0 || p >= 1) return null;
            return <Stroke key={i} d={s.d} len={1300} p={Easing.easeInOutCubic(p)} color={RED} w={6}
                           op={1 - Easing.easeInCubic(p) * 0.7} />;
          })}
        </svg>
        <div style={{ position: "absolute", left: 150, bottom: 190, fontFamily: SERIF, fontSize: 50,
                      lineHeight: 1.35, color: PAPTXT, ...MOTION.enter(T, t0 + 3.2, 1.4, 26) }}>
          Capital is the only weapon.<br />Claw your way up.
        </div>
      </div>
    </div>
  );
}

/* ---- 7 · End credits (68–82) — closes on the Season Two tease ---- */
function Credits({ T, CUES }) {
  const t0 = CUES.Credits, local = T - t0;
  const fadeB = 1 - Easing.easeInOutSine(clamp((local - 7.3) / 0.7, 0, 1));    /* starring block yields to the tease */
  const linkIn = Easing.easeOutCubic(clamp((local - 12.9) / 0.9, 0, 1));       /* the guide link — its own closing beat */
  const out = 1;                                                               /* play-once: the end card holds */
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", justifyItems: "center", alignContent: "start", paddingTop: 58, opacity: out }}>
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ fontFamily: SERIF, fontSize: 96, letterSpacing: "0.07em", color: PAPTXT,
                      opacity: Math.min(1, Easing.easeOutCubic(clamp(local / 1.2, 0, 1)) * 1.4),
                      transform: `scale(${1.6 - 0.6 * Easing.easeOutCubic(clamp((local - 0.2) / 0.6, 0, 1))})` }}>
          SKYNET<span style={{ color: GOLD }}>·</span>CAPITAL
        </div>
        <div style={{ margin: "22px auto 0", width: 440, height: 6, background: GOLDDIM, borderRadius: 4,
                      transform: `skewX(-24deg) scaleX(${MOTION.draw(T, t0 + 1.2, 0.6)})`, opacity: 0.9 }} />
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: "0.44em", color: GOLD, marginTop: 30,
                      textShadow: "0 0 24px rgba(227,168,58,0.35)",
                      ...MOTION.enter(T, t0 + 1.8, 1.0, 14) }}>SEASON ONE — SAURON'S SHADOW</div>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.4em", color: GOLDDIM, marginTop: 16,
                      ...MOTION.enter(T, t0 + 2.4, 1.0, 12) }}>TAKE DOWN SAURON</div>
        <div style={{ marginTop: 40, position: "relative", ...MOTION.enter(T, t0 + 3.0, 1.2, 16) }}>
         <div style={{ opacity: fadeB }}>
          <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.4em", color: INKMUTE, marginBottom: 14 }}>STARRING</div>
          <div style={{ fontFamily: SERIF, fontSize: 27, color: PAPTXT, opacity: 0.9 }}>
            Bruce · Nathan · Narayan · Joe · Tony · Eric · Rodo
          </div>
          <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.32em", color: INKMUTE, marginTop: 12,
                        ...MOTION.enter(T, t0 + 3.8, 1.0, 8) }}>OPEN INVITE — THE MORE THE MERRIER</div>
         </div>
        {/* SEASON TWO — takes the starring block's exact place */}
        {local > 7.6 && (
          <div style={{ position: "absolute", left: -240, right: -240, top: 56, bottom: -110, display: "grid",
                        placeItems: "center", textAlign: "center",
                        opacity: Easing.easeOutCubic(clamp((local - 7.8) / 1.0, 0, 1)) }}>
            <div>
            <div style={{ fontFamily: SERIF, fontSize: 32, color: PAPTXT, opacity: 0.85 }}>In his shadow, others stir…</div>
            <div style={{ fontFamily: MONO, fontSize: 27, letterSpacing: "0.42em", color: GOLD, marginTop: 36,
                          textShadow: "0 0 26px rgba(227,168,58,0.4)",
                          opacity: Easing.easeOutCubic(clamp((local - 10.2) / 1.0, 0, 1)) }}>SEASON TWO — THE WIZARDS' FORGE</div>
            <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.34em", color: INKMUTE, marginTop: 26,
                          opacity: Easing.easeOutCubic(clamp((local - 11.2) / 1.0, 0, 1)) }}>
              THE FATE OF SEASON ONE WRITES THE PROPHECY</div>
            </div>
          </div>
        )}
        </div>
        {/* the guide link — last in, set off by its own divider, unmistakably clickable */}
        <div style={{ margin: "236px auto 0", width: 440, height: 1, opacity: linkIn,
                      background: `linear-gradient(90deg, transparent, ${GOLDDIM} 48px, ${GOLDDIM} calc(100% - 48px), transparent)` }} />
        <a href="https://claude.ai/code/artifact/06cae3e4-8e05-454f-8cb9-d1c2b5de4ba1" target="_blank" rel="noopener"
           style={{ display: "inline-flex", alignItems: "center", gap: 16, marginTop: 34, opacity: linkIn,
           pointerEvents: linkIn > 0.4 ? "auto" : "none", whiteSpace: "nowrap",
           fontFamily: MONO, fontSize: 30, fontWeight: 700, letterSpacing: "0.32em", color: GOLD, textDecoration: "none",
           paddingBottom: 10, borderBottom: `3px solid ${GOLD}`, textShadow: "0 0 24px rgba(227,168,58,0.45)",
           animation: "omLinkGlow 2.8s ease-in-out infinite" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6 L15 12 L9 18" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="10.5" stroke={GOLD} strokeWidth="2" opacity="0.55" />
          </svg>
          THE FIELD GUIDE → GETTING STARTED</a>
      </div>
      {/* SEASON TWO tease — in his shadow, new towers stir on the horizon */}
      {local > 8.0 && (() => {
        const tin = Easing.easeOutCubic(clamp((local - 8.2) / 1.4, 0, 1));
        const tout = 1 - Easing.easeInOutSine(clamp((local - 12.4) / 1.4, 0, 1));   /* a brief appearance — they slip back into the dark */
        const gnd = Easing.easeInOutSine(clamp((local - 8.8) / 3.0, 0, 1));   /* darkness gathers slowly — no jump */
        return (
          <div style={{ position: "absolute", inset: 0, opacity: tin * tout, pointerEvents: "none" }}>
            <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="omS2gnd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#030201" stopOpacity="0" />
                  <stop offset="0.45" stopColor="#030201" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#030201" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <rect x="0" y="840" width="1920" height="240" fill="url(#omS2gnd)" opacity={gnd} />
              <path d="M 0 952 L 1920 952" stroke={EMBER} strokeWidth="2" opacity={0.12 * gnd} filter="url(#omBrush)" />
              {[[350, 66, 0], [705, 96, 0.55], [1010, 74, 1.05], [1330, 108, 1.5], [1640, 60, 2.0]].map(([tx, h, d], k) => {
                const rp = Easing.easeOutCubic(clamp((local - 9.0 - d) / 1.6, 0, 1));
                const eyeIn = clamp((local - 8.4 - d * 0.45) / 0.5, 0, 1);
                if (eyeIn <= 0) return null;
                const hh = h * rp;
                const ey = 952 - h * 0.62;                                   /* the eyes hang at their final height */
                const blink = 0.2 + 0.8 * Math.abs(Math.sin(T * 2.1 + k * 1.7));
                return (
                  <g key={k} filter="url(#omBrush)">
                    {/* the eyes' glow — a low ember light that reveals the rise beneath */}
                    <circle cx={tx} cy={ey + 4} r={26 + 8 * blink} fill={EMBER} opacity={0.08 * eyeIn * blink} />
                    {rp > 0 && (
                      <path d={`M ${tx - 16} 952 L ${tx - 9} ${952 - hh} L ${tx - 4} ${952 - hh - 9 * rp} L ${tx} ${952 - hh} L ${tx + 4} ${952 - hh - 9 * rp} L ${tx + 9} ${952 - hh} L ${tx + 16} 952 Z`}
                            fill="#0B0908" />
                    )}
                    <g opacity={eyeIn * blink}>
                      <rect x={tx - 8} y={ey} width="5" height="6" fill={EMBER} />
                      <rect x={tx + 3} y={ey} width="5" height="6" fill={EMBER} />
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        );
      })()}
      </div>
    </div>
  );
}

/* ---- ink wipes ---- */
function Wipe({ T, at, color }) {
  if (T < at - 0.65 || T >= at) return null;
  const p = Easing.easeInOutCubic((T - (at - 0.65)) / 0.65);
  const lead = -500 + 3100 * p;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080"
         style={{ position: "absolute", inset: 0, transform: "rotate(-5deg) scale(1.25)" }}>
      <rect x={lead - 4200} y="-200" width="4200" height="1480" fill={color} />
      <circle cx={lead + 8} cy="180" r="130" fill={color} />
      <circle cx={lead - 24} cy="520" r="180" fill={color} />
      <circle cx={lead + 16} cy="880" r="150" fill={color} />
    </svg>
  );
}

/* ---- captions ---- */
const CAPTIONS = [
  { at: 8.0, until: 12.4, reg: "warm", text: "What the boy drew, the man built — field by field, the vision made real." },
  { at: 12.9, until: 17.2, reg: "warm", text: "From his tower, a shadow poured over the land." },
  { at: 18.2, until: 25.0, reg: "warm", lift: true, text: "His bait: seven rings — power, for obedience." },
  { at: 19.6, until: 25.0, reg: "mono", text: "his plan · the rings bind their wearers to his will" },
  { at: 25.8, until: 34.6, reg: "warm", text: "They accepted anyway — certain character could beat his power." },
  { at: 36.6, until: 45.4, reg: "mono", text: "melt_ring() → $1,000,000 · tools, not chains" },
  { at: 46.8, until: 55.4, reg: "mono", text: "the strategy: stocks & options · every strike named before it lands" },
  { at: 59.0, until: 66.6, reg: "warm", text: "Every trade a sword-stroke. Every gain a foothold." },
];
function CaptionTrack({ T, dark }) {
  const cs = CAPTIONS.filter((c) => T >= c.at && T < c.until);
  if (!cs.length) return null;
  return (
    <div>
      {cs.map((c) => {
        const o = MOTION.fade(T, c.at, c.until, 1.2);
        return (
          <div key={c.at} style={{ position: "absolute", left: 0, right: 0, bottom: c.lift ? 134 : 56,
                                   display: "flex", justifyContent: "center", opacity: o, zIndex: 8 }}>
            <div style={c.reg === "mono"
              ? { fontFamily: MONO, fontSize: 26, fontWeight: 500, color: dark ? EMBER2 : INK, letterSpacing: "0.06em",
                  border: `1px solid ${dark ? INKSOFT : "#C9BCA0"}`, borderRadius: 6, padding: "14px 30px", whiteSpace: "nowrap",
                  background: dark ? "rgba(11,9,8,0.85)" : "rgba(237,230,216,0.92)" }
              : { fontFamily: SERIF, fontSize: 34, fontWeight: 500, color: dark ? PAPTXT : INK, letterSpacing: "0.02em", whiteSpace: "nowrap",
                  textShadow: dark ? "0 2px 18px rgba(0,0,0,0.8)" : "none" }}>
              {c.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Piece({ tweaks }) {
  const { T, CUES } = useComposition();
  const playingRef = React.useRef({ t: -1, wall: 0 });
  React.useEffect(() => {
    if (!window.SFX) return;
    window.SFX.setVolume(tweaks.sfx ? 0.76 : 0);
    const now = performance.now();
    const moving = T !== playingRef.current.t && now - playingRef.current.wall < 400;
    if (T !== playingRef.current.t) playingRef.current = { t: T, wall: now };
    window.SFX.sync(T, tweaks.sfx && moving);
  }, [T, tweaks.sfx]);
  /* grounds: paper prologue → brimstone-dark Sauron → paper party → ink forge → paper plan → black battle → ink credits */
  const flips = [[CUES.Sauron, "#0E0805"], [CUES.Party, PAPER], [CUES.Seed, INK], [CUES.Plan, "#12100B"], [CUES.Climb, "#080604"], [CUES.Credits, INK]];
  let bg = PAPER;
  for (const [at, c] of flips) if (T >= at) bg = c;
  const dark = bg !== PAPER;
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`}
         style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="omBrush" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" seed="7" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="7" />
          </filter>
          <radialGradient id="omLeafA" cx="38%" cy="34%" r="80%">
            <stop offset="0%" stopColor="#C64A32" /><stop offset="55%" stopColor="#A93226" /><stop offset="100%" stopColor="#7E1F16" />
          </radialGradient>
          <radialGradient id="omLeafB" cx="38%" cy="34%" r="80%">
            <stop offset="0%" stopColor="#D06A2C" /><stop offset="55%" stopColor="#B3491F" /><stop offset="100%" stopColor="#7E2812" />
          </radialGradient>
          <radialGradient id="omLeafG" cx="38%" cy="34%" r="80%">
            <stop offset="0%" stopColor="#F0C24E" /><stop offset="55%" stopColor="#E3A83A" /><stop offset="100%" stopColor="#A8781F" />
          </radialGradient>
          <radialGradient id="omLeafH" cx="38%" cy="34%" r="80%">
            <stop offset="0%" stopColor="#E8B23C" /><stop offset="55%" stopColor="#C9902A" /><stop offset="100%" stopColor="#8F6418" />
          </radialGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 70% at 50% 42%, transparent 55%, rgba(0,0,0,0.16) 100%)" }} />
      <Shot from={0} to={CUES.Sauron + 1.3}><Prologue T={T} /></Shot>
      <Shot from={CUES.Sauron - 0.1} to={CUES.Party + 1.25}><Sauron T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Party - 0.1} to={CUES.Seed + 0.1}><Party T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Seed - 0.1} to={CUES.Plan + 0.1}><Forge T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Plan - 0.1} to={CUES.Climb + 0.05}><Plan T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Climb - 0.05} to={CUES.Credits + 0.1}><Battle T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Credits - 0.1} to={9999}><Credits T={T} CUES={CUES} /></Shot>
      <Petals T={T} dark={dark} on={tweaks.petals && (T < CUES.Sauron || (T >= CUES.Party && T < CUES.Seed))} />
      <LeafBurn T={T} />
      <RingCarry T={T} CUES={CUES} />
      <ForgeWalker T={T} CUES={CUES} />
      {/* film grain — quiet texture over every scene */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="none"
           style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none", mixBlendMode: "overlay" }}>
        <filter id="omGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="11" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1920" height="1080" filter="url(#omGrain)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.5) 3px 4px)" }} />
      {tweaks.captions && <CaptionTrack T={T} dark={dark} />}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES}
                        playback={window.OM_PLAYBACK} autoplay={false} bg={INK}>
        <Piece tweaks={t} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Video" />
        <TweakToggle label="Falling petals" value={t.petals} onChange={(v) => setTweak("petals", v)} />
        <TweakToggle label="Captions" value={t.captions} onChange={(v) => setTweak("captions", v)} />
        <TweakToggle label="Sound (preview only)" value={t.sfx} onChange={(v) => setTweak("sfx", v)} />
        <TweakSection label="Editing" />
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak("motionEditor", v)} />
      </TweaksPanel>
    </div>
  );
}
window.SkynetPromo = App;
