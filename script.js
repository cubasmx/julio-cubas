const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) revealItems.forEach((item) => item.classList.add('is-visible'));
else {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
}

/* terminal-card: ventana de escritorio (arrastrar, redimensionar, minimizar, maximizar) */
(() => {
  const card = document.querySelector('.terminal-card');
  if (!card) return;
  const hero = card.closest('.hero-visual');
  const bar = card.querySelector('.terminal-top');
  const resizeHandle = card.querySelector('.window-resize');
  if (!hero || !bar) return;

  const MIN_W = 320;
  const MIN_H = 220;
  const BAR_H = 48;
  const mobileQuery = window.matchMedia('(max-width: 850px)');

  const dots = {
    reset: card.querySelector('[data-window-action="reset"]'),
    minimize: card.querySelector('[data-window-action="minimize"]'),
    maximize: card.querySelector('[data-window-action="maximize"]')
  };

  let active = false;
  let geometry = null;
  let original = null;
  let savedGeometry = null;
  let maximized = false;
  let minimized = false;
  let drag = null;
  let resize = null;

  const box = () => ({ w: hero.clientWidth, h: hero.clientHeight });

  function clampGeometry(g) {
    const { w, h } = box();
    const width = Math.max(MIN_W, Math.min(g.width, Math.max(MIN_W, w)));
    const height = Math.max(MIN_H, Math.min(g.height, Math.max(MIN_H, h)));
    const left = Math.max(0, Math.min(g.left, Math.max(0, w - width)));
    const top = Math.max(0, Math.min(g.top, Math.max(0, h - height)));
    return { left, top, width, height };
  }

  function render() {
    if (!active) return;
    const base = maximized ? { left: 0, top: 0, width: box().w, height: box().h } : geometry;
    card.style.left = base.left + 'px';
    card.style.top = base.top + 'px';
    card.style.width = base.width + 'px';
    card.style.height = Math.max(0, minimized ? BAR_H : base.height) + 'px';
  }

  function updateLabels() {
    if (dots.minimize) {
      dots.minimize.setAttribute('title', minimized ? 'Restaurar ventana' : 'Minimizar ventana');
      dots.minimize.setAttribute('aria-label', minimized ? 'Restaurar ventana' : 'Minimizar ventana');
    }
    if (dots.maximize) {
      dots.maximize.setAttribute('title', maximized ? 'Restaurar tamaño' : 'Maximizar ventana');
      dots.maximize.setAttribute('aria-label', maximized ? 'Restaurar tamaño' : 'Maximizar ventana');
    }
  }

  function enable() {
    if (active) return;
    active = true;
    const c = card.getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    geometry = clampGeometry({ left: c.left - hr.left, top: c.top - hr.top, width: c.width, height: c.height });
    original = { ...geometry };
    maximized = false;
    minimized = false;
    card.classList.remove('is-minimized', 'is-maximized');
    card.classList.add('is-window');
    render();
    updateLabels();
  }

  function disable() {
    active = false;
    drag = null;
    resize = null;
    maximized = false;
    minimized = false;
    card.classList.remove('is-window', 'is-minimized', 'is-maximized', 'is-dragging', 'is-resizing', 'is-interacting');
    ['left', 'top', 'width', 'height'].forEach((prop) => card.style.removeProperty(prop));
    updateLabels();
  }

  function reset() {
    maximized = false;
    minimized = false;
    card.classList.remove('is-minimized', 'is-maximized');
    if (active && original) geometry = { ...original };
    render();
    updateLabels();
  }

  function toggleMinimize() {
    minimized = !minimized;
    card.classList.toggle('is-minimized', minimized);
    render();
    updateLabels();
  }

  function toggleMaximize() {
    if (mobileQuery.matches) {
      maximized = !maximized;
      if (maximized) {
        minimized = false;
        card.classList.remove('is-minimized');
      }
      card.classList.toggle('is-maximized', maximized);
      updateLabels();
      return;
    }
    if (!maximized) {
      savedGeometry = geometry ? { ...geometry } : null;
      maximized = true;
    } else {
      maximized = false;
      if (savedGeometry) geometry = { ...savedGeometry };
    }
    minimized = false;
    card.classList.remove('is-minimized');
    render();
    updateLabels();
  }

  function onBarDown(e) {
    if (!active || maximized || e.button > 0) return;
    if (e.target.closest('[data-window-action]')) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: geometry.left, top: geometry.top };
    card.classList.add('is-interacting', 'is-dragging');
    try { bar.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    e.preventDefault();
  }

  function onBarMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const next = clampGeometry({
      ...geometry,
      left: drag.left + (e.clientX - drag.x),
      top: drag.top + (e.clientY - drag.y)
    });
    geometry.left = next.left;
    geometry.top = next.top;
    render();
    e.preventDefault();
  }

  function onBarUp(e) {
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.id)) return;
    drag = null;
    card.classList.remove('is-interacting', 'is-dragging');
  }

  function onResizeDown(e) {
    if (!active || maximized || minimized || e.button > 0) return;
    resize = { id: e.pointerId, x: e.clientX, y: e.clientY, width: geometry.width, height: geometry.height };
    card.classList.add('is-interacting', 'is-resizing');
    try { resizeHandle.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    e.preventDefault();
  }

  function onResizeMove(e) {
    if (!resize || e.pointerId !== resize.id) return;
    const { w, h } = box();
    const next = clampGeometry({
      left: geometry.left,
      top: geometry.top,
      width: resize.width + (e.clientX - resize.x),
      height: resize.height + (e.clientY - resize.y)
    });
    geometry.width = Math.min(next.width, w - geometry.left);
    geometry.height = Math.min(next.height, h - geometry.top);
    render();
    e.preventDefault();
  }

  function onResizeUp(e) {
    if (!resize || (e.pointerId !== undefined && e.pointerId !== resize.id)) return;
    resize = null;
    card.classList.remove('is-interacting', 'is-resizing');
  }

  bar.addEventListener('pointerdown', onBarDown);
  bar.addEventListener('pointermove', onBarMove);
  bar.addEventListener('pointerup', onBarUp);
  bar.addEventListener('pointercancel', onBarUp);
  bar.addEventListener('lostpointercapture', onBarUp);
  bar.addEventListener('dblclick', (e) => {
    if (!active || e.target.closest('[data-window-action]')) return;
    toggleMaximize();
  });

  if (resizeHandle) {
    resizeHandle.addEventListener('pointerdown', onResizeDown);
    resizeHandle.addEventListener('pointermove', onResizeMove);
    resizeHandle.addEventListener('pointerup', onResizeUp);
    resizeHandle.addEventListener('pointercancel', onResizeUp);
    resizeHandle.addEventListener('lostpointercapture', onResizeUp);
  }

  if (dots.reset) dots.reset.addEventListener('click', reset);
  if (dots.minimize) dots.minimize.addEventListener('click', toggleMinimize);
  if (dots.maximize) dots.maximize.addEventListener('click', toggleMaximize);

  function syncMode() {
    if (mobileQuery.matches) disable();
    else enable();
  }

  window.addEventListener('resize', () => {
    if (!active) return;
    geometry = clampGeometry(geometry);
    render();
  });

  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', syncMode);
  else if (mobileQuery.addListener) mobileQuery.addListener(syncMode);

  syncMode();
})();
