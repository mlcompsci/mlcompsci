#!/usr/bin/env node
// Generates every SVG in assets/ from data/profile.json.
// Usage: node scripts/build.mjs   (no dependencies, Node 18+)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = JSON.parse(readFileSync(join(ROOT, 'data', 'profile.json'), 'utf8'));

const C = {
  bg: '#090c17', bg2: '#0f1326', card: '#111631', edge: '#232b4d', grid: '#1c2346',
  text: '#eceefb', sub: '#a7aed0', muted: '#6c7499',
  violet: '#a78bfa', pink: '#f472b6', amber: '#fbbf24', green: '#34d399', sky: '#38bdf8',
};
const SANS = `'Segoe UI', -apple-system, BlinkMacSystemFont, Inter, Roboto, Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', 'Cascadia Code', 'JetBrains Mono', Consolas, Menlo, monospace`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;
const len = (s) => [...s].length;
// Rough glyph-width estimates; good enough for layout and wrapping.
const textW = (s, size, mono = false) => len(s) * size * (mono ? 0.6 : 0.54);

function wrap(text, maxW, size) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && textW(next, size) > maxW) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shared CSS. Every animation starts from the visible state, so reduced motion
// (or a renderer without CSS animation) still shows the finished picture.
const BASE_CSS = `
.sans{font-family:${SANS}} .mono{font-family:${MONO}}
.rise{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.pulse{animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}`;

function svg(w, h, title, body, css = '', defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>${BASE_CSS}${css}</style>
<defs>
  <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.bg}"/><stop offset="1" stop-color="#120e2c"/></linearGradient>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r=".9" fill="${C.grid}"/></pattern>
  <clipPath id="frame"><rect width="${w}" height="${h}" rx="18"/></clipPath>
  <filter id="blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
  ${defs}
</defs>
<g clip-path="url(#frame)">
<rect width="${w}" height="${h}" fill="url(#bgGrad)"/>
<rect width="${w}" height="${h}" fill="url(#dots)"/>
${body}
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="17.5" fill="none" stroke="${C.edge}"/>
</svg>
`;
}

function chip(x, y, label, color, { size = 11, h = 22, mono = true } = {}) {
  const w = textW(label, size, mono) + 20;
  return {
    w,
    svg: `<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="${h}" rx="${h / 2}" fill="${color}" fill-opacity=".1" stroke="${color}" stroke-opacity=".4"/>
<text class="${mono ? 'mono' : 'sans'}" x="${r1(x + w / 2)}" y="${y + h / 2 + size * 0.36}" font-size="${size}" fill="${C.sub}" text-anchor="middle">${esc(label)}</text>`,
  };
}

// ---------------------------------------------------------------- hero

function hero() {
  const W = 900, H = 300, H_ = P.hero;
  let defs = '', body = '';

  defs += `<radialGradient id="glowR"><stop offset="0" stop-color="${C.violet}" stop-opacity=".28"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/></radialGradient>
<radialGradient id="glowL"><stop offset="0" stop-color="${C.pink}" stop-opacity=".12"/><stop offset="1" stop-color="${C.pink}" stop-opacity="0"/></radialGradient>
<linearGradient id="nameGrad" gradientUnits="userSpaceOnUse" x1="48" y1="0" x2="348" y2="0" spreadMethod="reflect">
  <stop offset="0" stop-color="#c4b5fd"/><stop offset=".55" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.amber}"/>
  <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="600 0" dur="9s" repeatCount="indefinite"/>
</linearGradient>
<linearGradient id="sigGrad" gradientUnits="userSpaceOnUse" x1="590" y1="0" x2="824" y2="0"><stop offset="0" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.pink}"/></linearGradient>`;
  body += `<circle cx="707" cy="140" r="230" fill="url(#glowR)"/><circle cx="110" cy="30" r="260" fill="url(#glowL)"/>`;

  // --- left: identity
  body += `<text class="mono" x="48" y="70" font-size="14"><tspan fill="${C.green}">mohan@uoft</tspan><tspan fill="${C.muted}">:</tspan><tspan fill="${C.violet}">~</tspan><tspan fill="${C.muted}">$ </tspan><tspan fill="${C.text}">whoami</tspan></text>
<text class="sans" x="46" y="130" font-size="56" font-weight="800" fill="url(#nameGrad)" letter-spacing="-1">${esc(P.name)}</text>
<text class="sans" x="48" y="166" font-size="15" font-weight="600" letter-spacing="4"><tspan fill="#c4b5fd">${esc(H_.role)}</tspan><tspan fill="${C.muted}" letter-spacing="1">   ·   ${esc(H_.school)}</tspan></text>`;

  // --- left: typing line (SMIL so it runs everywhere an <img> SVG animates)
  const cw = 9, tx = 72, ty = 214;
  const events = [];
  let t = 0;
  H_.phrases.forEach((ph, i) => {
    const n = len(ph);
    for (let k = 0; k <= n; k++) { events.push({ t, i, k }); t += 0.055; }
    t += 2.4;
    for (let k = n - 1; k >= 0; k--) { events.push({ t, i, k }); t += 0.018; }
    t += 0.35;
  });
  const T = t.toFixed(3);
  const keyTimes = events.map((e) => (e.t / t).toFixed(5)).join(';');
  body += `<text class="mono" x="48" y="${ty}" font-size="15" font-weight="700" fill="${C.pink}">›</text>`;
  H_.phrases.forEach((ph, i) => {
    const values = events.map((e) => (e.i === i ? e.k * cw : 0)).join(';');
    defs += `<clipPath id="type${i}"><rect x="${tx}" y="${ty - 17}" height="24" width="0"><animate attributeName="width" dur="${T}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${values}"/></rect></clipPath>`;
    body += `<text class="mono" x="${tx}" y="${ty}" font-size="15" fill="${C.text}" textLength="${len(ph) * cw}" lengthAdjust="spacing" clip-path="url(#type${i})">${esc(ph)}</text>`;
  });
  const cursorX = events.map((e) => tx + e.k * cw + 1).join(';');
  body += `<rect class="cursor" x="${tx}" y="${ty - 14}" width="8.5" height="18" rx="1.5" fill="${C.pink}"><animate attributeName="x" dur="${T}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${cursorX}"/></rect>`;

  // --- left: tags
  let cx = 48;
  for (const tag of H_.tags) {
    const c = chip(cx, 240, tag, C.violet);
    body += c.svg;
    cx += c.w + 8;
  }

  // --- right: a small network whose activations flow forward
  const { inputs, outputs } = H_.network;
  const layers = [inputs.length, 5, 5, outputs.length];
  const lx = [590, 668, 746, 824], cy = 132, gap = 34;
  const nodes = layers.map((n, li) => Array.from({ length: n }, (_, j) => ({ x: lx[li], y: cy + (j - (n - 1) / 2) * gap })));
  const STEP = 0.55, CYCLE = 3.3;
  const rand = rng(7);
  let edges = '', sigs = '', nodeSvg = '';
  for (let li = 0; li < 3; li++) {
    for (const a of nodes[li]) {
      for (const b of nodes[li + 1]) {
        const d = `M${a.x} ${r1(a.y)}L${b.x} ${r1(b.y)}`;
        edges += `<path d="${d}" stroke="#2e3868"/>`;
        if (rand() < 0.6) sigs += `<path class="sig" d="${d}" pathLength="100" style="animation-delay:${(li * STEP + 0.05 + rand() * 0.1).toFixed(2)}s"/>`;
      }
    }
  }
  nodes.forEach((layer, li) => layer.forEach((n) => {
    const fill = li === 0 ? C.violet : li === 3 ? C.pink : '#c084fc';
    const delay = `animation-delay:${(li * STEP).toFixed(2)}s`;
    nodeSvg += `<circle cx="${n.x}" cy="${r1(n.y)}" r="12" fill="${fill}" filter="url(#blur)" class="fire" style="${delay}"/>
<circle cx="${n.x}" cy="${r1(n.y)}" r="6.5" fill="${C.bg2}" stroke="url(#sigGrad)" stroke-width="2"/>
<circle cx="${n.x}" cy="${r1(n.y)}" r="2.2" fill="${fill}" class="fire" style="${delay}"/>`;
  }));
  const labels = inputs.map((s, j) => `<text class="mono" x="${lx[0] - 14}" y="${r1(nodes[0][j].y + 3.5)}" font-size="10.5" fill="${C.muted}" text-anchor="end">${esc(s)}</text>`).join('')
    + outputs.map((s, j) => `<text class="mono" x="${lx[3] + 14}" y="${r1(nodes[3][j].y + 3.5)}" font-size="10.5" fill="${C.sub}">${esc(s)}</text>`).join('');
  body += `<g fill="none" stroke-width="1">${edges}</g>${sigs}${nodeSvg}${labels}`;

  // --- right: a training-loss curve drawing itself under the network
  const lr = rng(42), pts = [], N = 52, x0 = 584, x1 = 836, yTop = 236, yBot = 272;
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const v = Math.exp(-f * 4.2) + (lr() - 0.5) * 0.14 * (1 - f * 0.8);
    pts.push(`${r1(x0 + f * (x1 - x0))} ${r1(yBot - Math.max(0, Math.min(1, v)) * (yBot - yTop))}`);
  }
  const last = pts[pts.length - 1].split(' ');
  body += `<path d="M${x0} ${yBot + 6}H${x1}" stroke="#222a4c" stroke-dasharray="2 4"/>
<path class="loss" d="M${pts.join('L')}" pathLength="100" fill="none" stroke="url(#sigGrad)" stroke-width="1.8" stroke-linejoin="round"/>
<circle class="pulse" cx="${last[0]}" cy="${last[1]}" r="3" fill="${C.pink}"/>
<text class="mono" x="${x1}" y="${yTop + 6}" font-size="10" fill="${C.muted}" text-anchor="end">train loss ↓</text>`;

  const css = `
.cursor{animation:blink 1.05s linear infinite}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:.15}}
.sig{fill:none;stroke:url(#sigGrad);stroke-width:2;stroke-linecap:round;stroke-dasharray:14 200;stroke-dashoffset:-100;animation:flow ${CYCLE}s linear infinite}
@keyframes flow{0%{stroke-dashoffset:14}18%,100%{stroke-dashoffset:-100}}
.fire{animation:fire ${CYCLE}s ease-out infinite}
@keyframes fire{0%{opacity:.15}5%{opacity:.95}30%,100%{opacity:.15}}
.loss{animation:draw 3.8s ease-out .3s both}
@keyframes draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
.loss{stroke-dasharray:100}`;
  return svg(W, H, `${P.name} — ${H_.role} · ${H_.school}`, body, css, defs);
}

// ---------------------------------------------------------------- course map

function courseMap() {
  const W = 900, H = 520, CW = 174, CH = 76;
  const { terms, tracks, courses } = P;
  const colX = (i) => 233.5 + i * 187;
  const laneY = (i) => 140 + i * 96;
  const byCode = {};
  for (const c of courses) {
    const col = terms.indexOf(c.term), lane = tracks.findIndex((tr) => tr.id === c.track);
    if (col < 0) throw new Error(`${c.code}: term "${c.term}" is not listed in "terms"`);
    if (lane < 0) throw new Error(`${c.code}: track "${c.track}" is not listed in "tracks"`);
    byCode[c.code] = { ...c, x: colX(col), y: laneY(lane), color: tracks[lane].color, now: c.term === P.current_term };
  }
  let defs = '', body = '';

  // window chrome
  body += `<rect width="${W}" height="46" fill="#0c1022"/><path d="M0 46H${W}" stroke="${C.edge}"/>
<circle cx="24" cy="23" r="5.5" fill="#ff5f57"/><circle cx="43" cy="23" r="5.5" fill="#febc2e"/><circle cx="62" cy="23" r="5.5" fill="#28c840"/>
<text class="mono" x="${W / 2}" y="27.5" font-size="12.5" fill="${C.sub}" text-anchor="middle">~/uoft/cs — the transit map of my degree</text>
<text class="mono" x="${W - 22}" y="27.5" font-size="11" fill="${C.muted}" text-anchor="end">${courses.length} stops · ${tracks.length} lines</text>`;

  // term columns
  terms.forEach((term, i) => {
    const x = colX(i), now = term === P.current_term;
    body += `<path d="M${x} 108V470" stroke="${C.grid}" stroke-dasharray="3 5"/>`;
    const label = now ? `${term} · now` : term;
    body += `<text class="mono" x="${x}" y="88" font-size="11" letter-spacing="2" fill="${now ? C.pink : C.muted}" text-anchor="middle">${esc(label.toUpperCase())}</text>`;
    if (now) body += `<circle class="pulse" cx="${r1(x - textW(label, 11, true) / 2 - 2 * len(label) / 2 - 10)}" cy="84.5" r="3" fill="${C.pink}"/>`;
  });

  // lanes: a rail, flowing dots, and a train that runs the whole line
  tracks.forEach((tr, i) => {
    const y = laneY(i), n = courses.filter((c) => c.track === tr.id).length;
    defs += `<linearGradient id="lane${i}" gradientUnits="userSpaceOnUse" x1="140" y1="0" x2="892" y2="0"><stop offset="0" stop-color="${tr.color}" stop-opacity=".7"/><stop offset=".8" stop-color="${tr.color}" stop-opacity=".45"/><stop offset="1" stop-color="${tr.color}" stop-opacity="0"/></linearGradient>`;
    body += `<path d="M140 ${y}H892" stroke="url(#lane${i})" stroke-width="1" opacity=".5"/>
<path class="rail" d="M140 ${y}H892" stroke="url(#lane${i})" stroke-width="3" stroke-linecap="round"/>
<circle r="4" cy="${y}" fill="${tr.color}" filter="url(#blur)"><animate attributeName="cx" values="140;892" dur="9s" begin="-${(i * 2.3).toFixed(1)}s" repeatCount="indefinite"/></circle>
<circle r="2.6" cy="${y}" fill="#fff"><animate attributeName="cx" values="140;892" dur="9s" begin="-${(i * 2.3).toFixed(1)}s" repeatCount="indefinite"/></circle>
<circle cx="30" cy="${y - 4}" r="5" fill="${tr.color}"/>
<text class="sans" x="44" y="${y}" font-size="12.5" font-weight="700" fill="${C.text}">${esc(tr.name)}</text>
<text class="mono" x="44" y="${y + 14}" font-size="9.5" fill="${C.muted}">${n} stop${n === 1 ? '' : 's'}</text>`;
  });

  // "led to" connections
  courses.forEach((c, ci) => (c.leads_to || []).forEach((to, ti) => {
    const a = byCode[c.code], b = byCode[to];
    if (!b) throw new Error(`${c.code}: leads_to "${to}" is not a listed course`);
    const x1 = a.x + CW / 2, x2 = b.x - CW / 2;
    // Pull the curve no further than half the gap, or adjacent columns loop back on themselves.
    const k = Math.min(70, Math.max(6, (x2 - x1) / 2));
    const d = a.y === b.y ? `M${x1} ${a.y}H${x2}` : `M${x1} ${a.y}C${x1 + k} ${a.y} ${x2 - k} ${b.y} ${x2} ${b.y}`;
    const id = `edge${ci}_${ti}`;
    defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="0" x2="${x2}" y2="0"><stop offset="0" stop-color="${a.color}"/><stop offset="1" stop-color="${b.color}"/></linearGradient>`;
    body += `<path d="${d}" fill="none" stroke="url(#${id})" stroke-width="2.5" opacity=".55"/>
<path class="flow" d="${d}" fill="none" stroke="url(#${id})" stroke-width="2.5" stroke-linecap="round"/>`;
  }));

  // stations
  Object.values(byCode).forEach((c, idx) => {
    const x = c.x - CW / 2, y = c.y - CH / 2;
    const nameSize = Math.min(12, r1((CW - 30) / (len(c.name) * 0.54)));
    body += `<g class="rise" style="animation-delay:${(0.15 + idx * 0.12).toFixed(2)}s">`;
    if (c.now) body += `<rect class="pulse" x="${x - 2}" y="${y - 2}" width="${CW + 4}" height="${CH + 4}" rx="14" fill="none" stroke="${c.color}" stroke-width="3" filter="url(#blur)"/>`;
    body += `<rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="12" fill="${C.card}" stroke="${c.color}" stroke-opacity="${c.now ? 0.9 : 0.4}" stroke-width="${c.now ? 1.5 : 1}"/>
<rect x="${x + 8}" y="${y + 14}" width="2.5" height="${CH - 28}" rx="1.25" fill="${c.color}"/>
<text class="mono" x="${x + 18}" y="${y + 24}" font-size="15" font-weight="700" fill="${c.color}">${esc(c.code)}</text>
<text class="sans" x="${x + 18}" y="${y + 44}" font-size="${nameSize}" fill="${C.text}">${esc(c.name)}</text>
<text class="mono" x="${x + 18}" y="${y + 62}" font-size="10" fill="${C.sub}">↳ ${esc(c.built)}</text>`;
    if (c.now) {
      body += `<rect x="${x + CW - 52}" y="${y + 11}" width="42" height="17" rx="8.5" fill="${C.pink}" fill-opacity=".14" stroke="${C.pink}" stroke-opacity=".6"/>
<circle class="pulse" cx="${x + CW - 43}" cy="${y + 19.5}" r="2.5" fill="${C.pink}"/>
<text class="mono" x="${x + CW - 37}" y="${y + 23}" font-size="9.5" font-weight="700" fill="${C.pink}">NOW</text>`;
    }
    body += `<circle cx="${x}" cy="${c.y}" r="4" fill="${C.bg}" stroke="${c.color}" stroke-width="2"/><circle cx="${x + CW}" cy="${c.y}" r="4" fill="${C.bg}" stroke="${c.color}" stroke-width="2"/></g>`;
  });

  body += `<text class="mono" x="${W / 2}" y="500" font-size="10.5" fill="${C.muted}" text-anchor="middle" xml:space="preserve">◉ station = course     ↳ = what i built in it     ━ = what it led to     → more stops coming</text>`;

  const css = `
.rail{stroke-dasharray:2 9;animation:rail 1.1s linear infinite}
@keyframes rail{to{stroke-dashoffset:-11}}
.flow{stroke-dasharray:7 11;animation:flowEdge 1s linear infinite}
@keyframes flowEdge{to{stroke-dashoffset:-18}}`;
  const alt = courses.map((c) => `${c.code} ${c.name} (${c.term})`).join(', ');
  return svg(W, H, `Course map — ${alt}`, body, css, defs);
}

// ---------------------------------------------------------------- project cards

const ART = {
  hanabi() {
    const colors = ['#f87171', '#facc15', '#4ade80', '#60a5fa', '#e5e7eb'];
    return colors.map((col, i) => {
      const a = (i - 2) * 14;
      return `<g transform="rotate(${a} 373 140)"><animateTransform attributeName="transform" type="rotate" values="${a} 373 140;${r1(a * 1.15)} 373 140;${a} 373 140" dur="4s" repeatCount="indefinite"/>
<rect x="361" y="58" width="24" height="36" rx="4" fill="${col}" stroke="#0b0f1f" stroke-width="1.5"/>
<text class="mono" x="373" y="81" font-size="13" font-weight="800" fill="#0b0f1f" text-anchor="middle">${i + 1}</text></g>`;
    }).join('');
  },
  classifier(color) {
    const rows = [['apple', 0.94], ['pear', 0.04], ['lime', 0.02]];
    return `<text class="mono" x="332" y="34" font-size="9" fill="${C.muted}">softmax</text>` + rows.map(([label, p], i) => {
      const y = 50 + i * 26, w = r1(Math.max(2, p * 84));
      return `<text class="mono" x="332" y="${y}" font-size="10" fill="${i ? C.muted : C.text}">${label}</text>
<text class="mono" x="416" y="${y}" font-size="10" fill="${i ? C.muted : color}" text-anchor="end">.${String(Math.round(p * 100)).padStart(2, '0')}</text>
<rect x="332" y="${y + 5}" width="84" height="6" rx="3" fill="#1b2244"/>
<rect x="332" y="${y + 5}" width="${w}" height="6" rx="3" fill="${i ? C.muted : color}"><animate attributeName="width" values="0;${w};${w};0" keyTimes="0;.25;.85;1" dur="5s" begin="${i * 0.15}s" repeatCount="indefinite"/></rect>`;
    }).join('');
  },
  waveform() {
    const rand = rng(3);
    let out = `<linearGradient id="wave" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="100"><stop offset="0" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.violet}"/></linearGradient>`;
    for (let i = 0; i < 13; i++) {
      const x = 340 + i * 6, h = 10 + Math.sin(i / 12 * Math.PI) * 30 * (0.5 + rand() * 0.5);
      const hs = [h, h * 1.6, h * 0.5, h * 1.25, h].map((v) => r1(Math.min(62, v)));
      const dur = `${(1.4 + rand()).toFixed(2)}s`;
      out += `<rect x="${r1(x)}" width="3.6" rx="1.8" fill="url(#wave)" y="${r1(70 - h / 2)}" height="${r1(h)}">
<animate attributeName="height" values="${hs.join(';')}" dur="${dur}" repeatCount="indefinite"/>
<animate attributeName="y" values="${hs.map((v) => r1(70 - v / 2)).join(';')}" dur="${dur}" repeatCount="indefinite"/></rect>`;
    }
    return out + `<text class="mono" x="373" y="118" font-size="9" fill="${C.muted}" text-anchor="middle">valence · arousal</text>`;
  },
  agent(color) {
    return `<rect x="330" y="28" width="86" height="64" rx="7" fill="#0c1124" stroke="${color}" stroke-opacity=".5"/>
<path d="M330 40H416" stroke="${color}" stroke-opacity=".35"/>
<circle cx="337" cy="34" r="1.8" fill="#ff5f57"/><circle cx="343" cy="34" r="1.8" fill="#febc2e"/><circle cx="349" cy="34" r="1.8" fill="#28c840"/>
<rect x="338" y="48" width="44" height="5" rx="2.5" fill="${C.muted}" opacity=".5"/>
<rect x="338" y="58" width="30" height="11" rx="3" fill="${color}" fill-opacity=".3"/>
<rect x="374" y="74" width="34" height="11" rx="3" fill="${color}" fill-opacity=".3"/>
<g><animateTransform attributeName="transform" type="translate" values="350 62;390 78;390 78;350 62;350 62" keyTimes="0;.35;.5;.85;1" dur="4s" repeatCount="indefinite"/>
<circle r="7" fill="${color}" opacity="0"><animate attributeName="opacity" values="0;0;.5;0;0" keyTimes="0;.34;.38;.5;1" dur="4s" repeatCount="indefinite"/></circle>
<path d="M0 0L0 12L3.4 9L5.8 14L7.8 13.1L5.4 8.2L9.6 8.2Z" fill="#fff" stroke="#0b0f1f" stroke-width=".8"/></g>
${['#f472b6', '#a78bfa', '#34d399'].map((col, i) => `<circle cx="${355 + i * 18}" cy="110" r="6.5" fill="${col}" fill-opacity=".25" stroke="${col}"><animate attributeName="fill-opacity" values=".25;.9;.25;.25" keyTimes="0;.15;.33;1" dur="6s" begin="${i * 2}s" repeatCount="indefinite"/></circle>`).join('')}`;
  },
  pipes(color) {
    const node = (x, y, label) => `<circle cx="${x}" cy="${y}" r="11" fill="#0c1124" stroke="${color}" stroke-width="1.6"/><text class="mono" x="${x}" y="${y + 3}" font-size="8.5" fill="${C.text}" text-anchor="middle">${label}</text>`;
    return `<path d="M366 42L351 81M380 42L395 81" stroke="${color}" stroke-opacity=".6" stroke-width="1.5"/>
<text class="mono" x="389" y="35" font-size="8.5" fill="${C.muted}">fork()</text>
<rect x="356" y="88" width="34" height="9" rx="4.5" fill="none" stroke="${color}" stroke-opacity=".7"/>
${[0, 1, 2].map((i) => `<circle cy="92.5" r="2" fill="${color}"><animate attributeName="cx" values="360;386" dur="1.5s" begin="${i * 0.5}s" repeatCount="indefinite"/></circle>`).join('')}
${node(373, 32, 'P0')}${node(345, 92, 'P1')}${node(401, 92, 'P2')}
<text class="mono" x="373" y="118" font-size="8.5" fill="${C.muted}" text-anchor="middle">pipe → read()</text>`;
  },
  pills() {
    const capsule = (cx, cy, a, l, r) => `<g transform="translate(${cx} ${cy}) rotate(${a})">
<path d="M0 -6.5H-8.5A6.5 6.5 0 0 0 -8.5 6.5H0Z" fill="${l}"/><path d="M0 -6.5H8.5A6.5 6.5 0 0 1 8.5 6.5H0Z" fill="${r}"/>
<path d="M0 -6.5V6.5" stroke="#0b0f1f" stroke-width="1"/></g>`;
    return `<g><animateTransform attributeName="transform" type="translate" values="0 -46;0 0;0 0" keyTimes="0;.35;1" dur="3s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.9;1" dur="3s" repeatCount="indefinite"/>${capsule(360, 62, 0, '#f87171', '#60a5fa')}</g>
${capsule(394, 70, 90, '#facc15', '#f87171')}${capsule(352, 92, 0, '#60a5fa', '#facc15')}
<g transform="translate(398 102)"><circle r="9" fill="#4ade80"/><circle cx="-3.2" cy="-1.5" r="2" fill="#0b0f1f"/><circle cx="3.2" cy="-1.5" r="2" fill="#0b0f1f"/><path d="M-3 3.5Q0 1.5 3 3.5" stroke="#0b0f1f" stroke-width="1.3" fill="none"/>
<animateTransform attributeName="transform" type="translate" values="398 102;398 99;398 102" dur="1.2s" repeatCount="indefinite"/></g>`;
  },
};

function projectCard(p) {
  const W = 440, H = 190;
  const lines = wrap(p.desc, 292, 12.5);
  if (lines.length > 3) console.warn(`! ${p.id}: description wraps to ${lines.length} lines (3 fit)`);
  let body = `<radialGradient id="cardGlow"><stop offset="0" stop-color="${p.color}" stop-opacity=".22"/><stop offset="1" stop-color="${p.color}" stop-opacity="0"/></radialGradient>
<circle cx="${W - 66}" cy="64" r="150" fill="url(#cardGlow)"/>
<path d="M24 0H${W - 24}" stroke="${p.color}" stroke-width="3" opacity=".8"/>
<text class="mono" x="24" y="36" font-size="10.5" letter-spacing="1.6" fill="${p.color}">${esc(p.tag)}</text>
<text class="sans" x="24" y="66" font-size="${Math.min(22, r1(290 / (len(p.title) * 0.6)))}" font-weight="800" fill="${C.text}">${esc(p.title)}</text>
${lines.map((l, i) => `<text class="sans" x="24" y="${92 + i * 18}" font-size="12.5" fill="${C.sub}">${esc(l)}</text>`).join('\n')}
${ART[p.art](p.color)}`;
  let x = 24;
  for (const t of p.tech) {
    const c = chip(x, 150, t, p.color, { size: 10.5, h: 21 });
    body += c.svg;
    x += c.w + 6;
  }
  body += `<text class="mono" x="${W - 24}" y="164.5" font-size="10.5" fill="${C.muted}" text-anchor="end">↗ ${esc(p.role)}</text>`;
  return svg(W, H, `${p.title} — ${p.desc}`, body);
}

// ---------------------------------------------------------------- stack

function stack() {
  const W = 900, H = 40 + P.stack.length * 48;
  let body = '';
  P.stack.forEach((row, i) => {
    const y = 26 + i * 48;
    body += `<text class="mono" x="28" y="${y + 18}" font-size="11" letter-spacing="2" fill="${row.color}">${esc(row.label.toUpperCase())}</text>`;
    let x = 150;
    row.items.forEach((item, j) => {
      const w = textW(item, 13) + 34;
      body += `<g class="rise" style="animation-delay:${(i * 0.15 + j * 0.06).toFixed(2)}s">
<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="28" rx="14" fill="${row.color}" fill-opacity="${i ? 0.07 : 0.12}" stroke="${row.color}" stroke-opacity="${i ? 0.3 : 0.55}"/>
<circle cx="${r1(x + 14)}" cy="${y + 14}" r="3" fill="${row.color}"/>
<text class="sans" x="${r1(x + 23)}" y="${y + 18.5}" font-size="13" fill="${C.text}">${esc(item)}</text></g>`;
      x += w + 10;
    });
    if (x > W - 14) console.warn(`! stack row "${row.label}" overflows by ${Math.round(x - W + 14)}px`);
  });
  return svg(W, H, `Stack — ${P.stack.map((r) => `${r.label}: ${r.items.join(', ')}`).join('; ')}`, body);
}

// ---------------------------------------------------------------- footer

function footer() {
  const W = 900, H = 64, F = P.footer, n = 10, dur = 2.6, barX = 236, barW = 300;
  const labelEnd = 28 + textW(`${F.label}:`, 13, true);
  let body = `<text class="mono" x="28" y="37" font-size="13" fill="${C.sub}">${esc(F.label)}:</text>`;
  for (let k = 0; k <= n; k++) {
    const begin = (k * dur / n).toFixed(2);
    const timing = k === n ? `begin="${begin}s" fill="freeze"` : `begin="${begin}s" dur="${(dur / n).toFixed(2)}s"`;
    body += `<text class="mono" x="${r1(labelEnd + 44)}" y="37" font-size="13" fill="${C.text}" text-anchor="end" opacity="0">${k * 10}%<set attributeName="opacity" to="1" ${timing}/></text>`;
  }
  body += `<linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.pink}"/></linearGradient>
<rect x="${barX}" y="25" width="${barW}" height="14" rx="4" fill="#141a36" stroke="#2a3358"/>
<rect x="${barX + 2}" y="27" width="${barW - 4}" height="10" rx="3" fill="url(#bar)"><animate attributeName="width" values="0;${barW - 4}" dur="${dur}s" fill="freeze"/></rect>
<text class="mono" x="${barX + barW + 16}" y="37" font-size="13" fill="${C.muted}">${F.sections}/${F.sections} sections</text>
<text class="mono" x="${W - 28}" y="37" font-size="13" fill="${C.pink}" text-anchor="end" opacity="0">${esc(F.message)}<set attributeName="opacity" to="1" begin="${dur}s" fill="freeze"/></text>`;
  return svg(W, H, `${F.label}: 100% — ${F.message}`, body);
}

// ---------------------------------------------------------------- write

const out = (rel, content) => {
  const file = join(ROOT, 'assets', rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log(`✓ assets/${rel}`);
};
out('hero.svg', hero());
out('course-map.svg', courseMap());
for (const p of P.projects) out(`projects/${p.id}.svg`, projectCard(p));
out('stack.svg', stack());
out('footer.svg', footer());
