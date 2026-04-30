// Vanilla JS Tweaks panel — follows host protocol
// Persists via __edit_mode_set_keys; defaults wrapped in EDITMODE markers.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "warm-dark",
  "typeface": "instrument",
  "accent": "copper",
  "grain": true,
  "ambient": false
}/*EDITMODE-END*/;

const PALETTES = {
  "warm-dark": { ink: "#0E0B08", bone: "#F4ECDF", paper: "#F8F2E6", inkSoft: "#1a1410", boneWarm: "#EADFCB" },
  "ivory":     { ink: "#1a1410", bone: "#FAF6EC", paper: "#FFFDF8", inkSoft: "#241b14", boneWarm: "#F0E8D8" },
  "midnight":  { ink: "#0a0d18", bone: "#EFECE3", paper: "#F4F1E8", inkSoft: "#141828", boneWarm: "#E5E0D2" },
  "burnt":     { ink: "#1c0d08", bone: "#F2E8D8", paper: "#F8EFDE", inkSoft: "#2a1610", boneWarm: "#E8DCC4" }
};

const ACCENTS = {
  copper:   { copper: "#C8804A", copperDeep: "#A86332", burgundy: "#7A1F2B", burgundyDeep: "#5A1520", gold: "#D4A574" },
  rose:     { copper: "#C44569", copperDeep: "#9A2B4C", burgundy: "#5C1A2E", burgundyDeep: "#3F0F1F", gold: "#E89AB1" },
  emerald:  { copper: "#3A7D5C", copperDeep: "#255A41", burgundy: "#1F4032", burgundyDeep: "#0F2820", gold: "#A8C8A0" },
  cobalt:   { copper: "#3D5A8C", copperDeep: "#2A4068", burgundy: "#1F2D4A", burgundyDeep: "#101830", gold: "#9AAFD0" },
  saffron:  { copper: "#D4A028", copperDeep: "#A87A18", burgundy: "#7A4A0F", burgundyDeep: "#5A3208", gold: "#E8C870" }
};

const TYPEFACES = {
  instrument: { serif: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif", text: "'Crimson Pro', 'EB Garamond', Georgia, serif" },
  playfair:   { serif: "'Playfair Display', Georgia, serif", text: "'Lora', Georgia, serif" },
  fraunces:   { serif: "'Fraunces', Georgia, serif", text: "'Fraunces', Georgia, serif" },
  bodoni:     { serif: "'Bodoni Moda', 'Didot', Georgia, serif", text: "'Cormorant Garamond', Georgia, serif" }
};

let state = { ...TWEAK_DEFAULTS };

function applyTweaks() {
  const pal = PALETTES[state.palette] || PALETTES["warm-dark"];
  const acc = ACCENTS[state.accent] || ACCENTS["copper"];
  const tf  = TYPEFACES[state.typeface] || TYPEFACES["instrument"];

  const r = document.documentElement.style;
  r.setProperty('--ink', pal.ink);
  r.setProperty('--bone', pal.bone);
  r.setProperty('--paper', pal.paper);
  r.setProperty('--ink-soft', pal.inkSoft);
  r.setProperty('--bone-warm', pal.boneWarm);
  r.setProperty('--copper', acc.copper);
  r.setProperty('--copper-deep', acc.copperDeep);
  r.setProperty('--burgundy', acc.burgundy);
  r.setProperty('--burgundy-deep', acc.burgundyDeep);
  r.setProperty('--gold', acc.gold);
  r.setProperty('--serif', tf.serif);
  r.setProperty('--serif-text', tf.text);

  const grain = document.querySelector('.hero-grain');
  if (grain) grain.style.display = state.grain ? '' : 'none';
}

function persist(key, value) {
  state[key] = value;
  applyTweaks();
  try {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
  } catch (e) {}
}

// ---- Build panel ----
function buildPanel() {
  const wrap = document.createElement('div');
  wrap.id = 'tweaks-panel';
  wrap.innerHTML = `
    <div class="tw-head">
      <span class="tw-title">Tweaks</span>
      <button class="tw-close" aria-label="Close">×</button>
    </div>
    <div class="tw-body">
      <div class="tw-section">Palette</div>
      <div class="tw-row" data-key="palette">
        ${Object.keys(PALETTES).map(k => `
          <button class="tw-swatch ${state.palette === k ? 'on' : ''}" data-val="${k}" title="${k}">
            <span style="background:${PALETTES[k].ink}"></span>
            <span style="background:${PALETTES[k].bone}"></span>
          </button>`).join('')}
      </div>

      <div class="tw-section">Accent</div>
      <div class="tw-row" data-key="accent">
        ${Object.keys(ACCENTS).map(k => `
          <button class="tw-swatch one ${state.accent === k ? 'on' : ''}" data-val="${k}" title="${k}">
            <span style="background:${ACCENTS[k].copper}"></span>
          </button>`).join('')}
      </div>

      <div class="tw-section">Typeface</div>
      <div class="tw-radio" data-key="typeface">
        ${Object.keys(TYPEFACES).map(k => `
          <button class="${state.typeface === k ? 'on' : ''}" data-val="${k}">${k}</button>`).join('')}
      </div>

      <div class="tw-section">Effects</div>
      <label class="tw-toggle">
        <span>Film grain</span>
        <input type="checkbox" data-key="grain" ${state.grain ? 'checked' : ''} />
      </label>
    </div>
  `;
  document.body.appendChild(wrap);

  wrap.querySelector('.tw-close').onclick = () => {
    wrap.style.display = 'none';
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch(e) {}
  };

  wrap.querySelectorAll('.tw-row, .tw-radio').forEach(row => {
    const key = row.dataset.key;
    row.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        row.querySelectorAll('button').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        persist(key, btn.dataset.val);
      };
    });
  });

  wrap.querySelectorAll('.tw-toggle input').forEach(inp => {
    inp.onchange = () => persist(inp.dataset.key, inp.checked);
  });

  return wrap;
}

// ---- Host protocol ----
let panel = null;
window.addEventListener('message', (e) => {
  const t = e.data && e.data.type;
  if (t === '__activate_edit_mode') {
    if (!panel) panel = buildPanel();
    panel.style.display = '';
  } else if (t === '__deactivate_edit_mode') {
    if (panel) panel.style.display = 'none';
  }
});

window.addEventListener('DOMContentLoaded', () => {
  applyTweaks();
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
});
