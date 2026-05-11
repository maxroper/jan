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

  const revealPulse = setInterval(showInView, 160);
  setTimeout(() => clearInterval(revealPulse), 3200);

  // Final safety net: after 3 seconds, anything still hidden gets shown
  setTimeout(() => {
    els.forEach(el => { if (!triggered.has(el)) el.classList.add('in'); });
  }, 3000);
}

// =============== Work hover preview ===============
function setupWorkPreviews() {
  const preview = document.getElementById('work-preview');
  if (!preview) return;
  let img = preview.querySelector('img');
  function ensurePreviewImage() {
    if (img) return img;
    img = document.createElement('img');
    img.alt = '';
    preview.appendChild(img);
    return img;
  }
  document.querySelectorAll('.work-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      const src = row.dataset.preview;
      if (src) {
        ensurePreviewImage().src = src;
        preview.classList.add('show');
      }
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

// =============== Hero name kinetic effect ===============
function setupHeroKinetic() {
  const hero = document.querySelector('.hero');
  const portrait = document.querySelector('.hero-portrait');
  const name = document.querySelector('.hero-name');
  if (!hero) return;
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const dx = (e.clientX - rect.width / 2) / rect.width;
    const dy = (e.clientY - rect.height / 2) / rect.height;
    if (portrait) portrait.style.transform = `translate(${dx * -8}px, ${dy * -5}px) scale(1.02)`;
    if (name) name.style.transform = `translate(${dx * 5}px, ${dy * 3}px)`;
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
  function update() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
}

// =============== Init ===============
function initAll() {
  document.documentElement.classList.add('js');
  setupReveal();
  setupWorkPreviews();
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
