// =============== Audio (Web Audio API piano synth) ===============
let audioCtx = null;
let masterGain = null;
let audioOn = false;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.18;
    // soft reverb-ish via convolver fallback to delay
    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.18;
    const fb = audioCtx.createGain();
    fb.gain.value = 0.22;
    const wet = audioCtx.createGain();
    wet.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
    masterGain.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playNote(freq, duration = 1.4) {
  if (!audioOn) return;
  ensureAudio();
  const now = audioCtx.currentTime;

  // Two sine partials + soft sawtooth for that warm piano-ish texture
  const fund = audioCtx.createOscillator();
  const harm = audioCtx.createOscillator();
  const sub = audioCtx.createOscillator();
  fund.type = 'sine'; fund.frequency.value = freq;
  harm.type = 'sine'; harm.frequency.value = freq * 2;
  sub.type = 'triangle'; sub.frequency.value = freq;

  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const gh = audioCtx.createGain();
  gh.gain.setValueAtTime(0.0001, now);
  gh.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
  gh.gain.exponentialRampToValueAtTime(0.0008, now + duration * 0.6);

  const gs = audioCtx.createGain();
  gs.gain.setValueAtTime(0.0001, now);
  gs.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gs.gain.exponentialRampToValueAtTime(0.0008, now + duration);

  fund.connect(g).connect(masterGain);
  harm.connect(gh).connect(masterGain);
  sub.connect(gs).connect(masterGain);

  fund.start(now); harm.start(now); sub.start(now);
  fund.stop(now + duration + 0.1);
  harm.stop(now + duration + 0.1);
  sub.stop(now + duration + 0.1);
}

// =============== Piano keys generation ===============
// Two octaves spanning C3 — B4 for a richer span
const KEYS = [
  // Octave 3
  { n: 'C3', f: 130.81, b: false }, { n: 'C#3', f: 138.59, b: true },
  { n: 'D3', f: 146.83, b: false }, { n: 'D#3', f: 155.56, b: true },
  { n: 'E3', f: 164.81, b: false },
  { n: 'F3', f: 174.61, b: false }, { n: 'F#3', f: 185.00, b: true },
  { n: 'G3', f: 196.00, b: false }, { n: 'G#3', f: 207.65, b: true },
  { n: 'A3', f: 220.00, b: false }, { n: 'A#3', f: 233.08, b: true },
  { n: 'B3', f: 246.94, b: false },
  // Octave 4
  { n: 'C4', f: 261.63, b: false }, { n: 'C#4', f: 277.18, b: true },
  { n: 'D4', f: 293.66, b: false }, { n: 'D#4', f: 311.13, b: true },
  { n: 'E4', f: 329.63, b: false },
  { n: 'F4', f: 349.23, b: false }, { n: 'F#4', f: 369.99, b: true },
  { n: 'G4', f: 392.00, b: false }, { n: 'G#4', f: 415.30, b: true },
  { n: 'A4', f: 440.00, b: false }, { n: 'A#4', f: 466.16, b: true },
  { n: 'B4', f: 493.88, b: false },
];

function buildPiano() {
  const piano = document.getElementById('piano');
  if (!piano) return;
  const whites = KEYS.filter(k => !k.b);
  const whiteCount = whites.length;
  // first build whites
  whites.forEach((k, i) => {
    const el = document.createElement('div');
    el.className = 'key white';
    el.dataset.freq = k.f;
    el.dataset.note = k.n;
    el.innerHTML = `<span class="label">${k.n}</span>`;
    piano.appendChild(el);
    el.addEventListener('mouseenter', () => triggerKey(el, k.f));
    el.addEventListener('click', () => triggerKey(el, k.f));
  });
  // overlay blacks (positioned by % across container)
  const widthPct = 100 / whiteCount;
  let whiteIdx = 0;
  KEYS.forEach((k) => {
    if (k.b) {
      // black sits between previous white and next white
      const left = whiteIdx * widthPct - (widthPct * 0.21);
      const el = document.createElement('div');
      el.className = 'key black';
      el.dataset.freq = k.f;
      el.dataset.note = k.n;
      el.style.left = left + '%';
      el.style.width = (widthPct * 0.42) + '%';
      el.innerHTML = `<span class="label">${k.n.replace('#', '♯')}</span>`;
      piano.appendChild(el);
      el.addEventListener('mouseenter', () => triggerKey(el, k.f));
      el.addEventListener('click', () => triggerKey(el, k.f));
    } else {
      whiteIdx++;
    }
  });
}

function triggerKey(el, freq) {
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 180);
  playNote(parseFloat(freq), 1.6);
}

// =============== Scroll reveal ===============
function setupReveal() {
  const els = document.querySelectorAll('.reveal');
  const triggered = new WeakSet();

  function showInView() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    els.forEach(el => {
      if (triggered.has(el)) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh - 40 && r.bottom > 0) {
        el.classList.add('in');
        triggered.add(el);
      }
    });
  }

  showInView();
  // Multi-target scroll listener (handles edge cases where the page is in a wrapper)
  ['scroll', 'resize'].forEach(ev => {
    window.addEventListener(ev, showInView, { passive: true });
    document.addEventListener(ev, showInView, { passive: true });
  });

  // Final safety net: after 3 seconds, anything still hidden gets shown
  setTimeout(() => {
    els.forEach(el => { if (!triggered.has(el)) el.classList.add('in'); });
  }, 3000);
}

// =============== Cursor ===============
function setupCursor() {
  if (matchMedia('(max-width: 900px)').matches) return;
  const c = document.createElement('div');
  c.className = 'cursor';
  document.body.appendChild(c);
  let tx = 0, ty = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
  function loop() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    c.style.transform = `translate(${cx - 7}px, ${cy - 7}px)`;
    requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll('a, button, .reel-card, .work-row, .key, .audio-toggle').forEach(el => {
    el.addEventListener('mouseenter', () => c.classList.add('hover'));
    el.addEventListener('mouseleave', () => c.classList.remove('hover'));
  });
}

// =============== Work hover preview ===============
function setupWorkPreviews() {
  const preview = document.getElementById('work-preview');
  if (!preview) return;
  let img = preview.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    img.alt = '';
    preview.appendChild(img);
  }
  document.querySelectorAll('.work-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      const src = row.dataset.preview;
      if (src) { img.src = src; preview.classList.add('show'); }
    });
    row.addEventListener('mouseleave', () => {
      preview.classList.remove('show');
    });
    row.addEventListener('mousemove', (e) => {
      preview.style.left = e.clientX + 'px';
      preview.style.top = e.clientY + 'px';
    });
  });
}

// =============== Audio toggle ===============
function setupAudioToggle() {
  const btn = document.getElementById('audio-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    audioOn = !audioOn;
    btn.classList.toggle('on', audioOn);
    btn.querySelector('.lbl').textContent = audioOn ? 'Sound on' : 'Sound off';
    if (audioOn) {
      ensureAudio();
      // welcome chord — a soft Cmaj9 ish
      playNote(261.63, 2.4);
      setTimeout(() => playNote(329.63, 2.4), 80);
      setTimeout(() => playNote(392.00, 2.4), 160);
      setTimeout(() => playNote(493.88, 2.4), 240);
    }
  });
}

// =============== Hero name kinetic effect ===============
function setupHeroKinetic() {
  // Subtle parallax of portrait + name on mousemove
  const hero = document.querySelector('.hero');
  const portrait = document.querySelector('.hero-portrait');
  const name = document.querySelector('.hero-name');
  if (!hero) return;
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const dx = (e.clientX - rect.width / 2) / rect.width;
    const dy = (e.clientY - rect.height / 2) / rect.height;
    if (portrait) portrait.style.transform = `translate(${dx * -10}px, ${dy * -8}px)`;
    if (name) name.style.transform = `translate(${dx * 8}px, ${dy * 4}px)`;
  });
  hero.addEventListener('mouseleave', () => {
    if (portrait) portrait.style.transform = '';
    if (name) name.style.transform = '';
  });
}

// =============== Nav scroll state ===============
function setupNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  // Sections with light backgrounds — flip nav text color when over them
  const lightSections = [...document.querySelectorAll('.works, .teaching, .contact, .ticker')];
  function update() {
    const scrolled = window.scrollY > 40;
    nav.classList.toggle('scrolled', scrolled);
    // Determine if nav center is over a light section
    const navY = 30;
    let onLight = false;
    for (const s of lightSections) {
      const r = s.getBoundingClientRect();
      if (r.top <= navY && r.bottom >= navY) { onLight = true; break; }
    }
    nav.classList.toggle('on-light', onLight);
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
}

// =============== Init ===============
function initAll() {
  document.documentElement.classList.add('js');
  buildPiano();
  setupReveal();
  setupCursor();
  setupWorkPreviews();
  setupAudioToggle();
  setupHeroKinetic();
  setupNav();
  // Safety: if for any reason reveals are still hidden after 2.5s, force-show
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('in');
    });
  }, 800);
}
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
