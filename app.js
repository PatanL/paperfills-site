/* PaperFills landing-page motion and media. No paper orders or wallet access. */
(function () {
  'use strict';
  const config = window.GHOSTTRADE_SITE || {};
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storeDialog = document.getElementById('store-dialog');
  const previewDialog = document.getElementById('preview-dialog');
  const motionButton = document.getElementById('motion-toggle');
  const film = document.getElementById('film-stage');
  const video = document.getElementById('demo-video');
  const poster = document.getElementById('dialog-poster');
  let manuallyPaused = false;
  let frame = null;
  let dialogOpener = null;

  function safeStoreUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'chromewebstore.google.com'
        && /^\/detail\/[^/]+\/[a-p]{32}\/?$/.test(url.pathname) ? url.href : null;
    } catch (_) { return null; }
  }

  function safeMediaUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'https:' || (url.protocol === 'http:' && url.origin === window.location.origin)
        ? url.href : null;
    } catch (_) { return null; }
  }

  const listing = safeStoreUrl(config.chromeStoreUrl);
  const videoUrl = safeMediaUrl(config.demoVideoUrl);
  const captionsUrl = safeMediaUrl(config.demoCaptionsUrl);

  function openDialog(dialog, opener) {
    dialogOpener = opener;
    dialog.showModal();
    body.style.overflow = 'hidden';
  }
  function afterClose() {
    video.pause();
    body.style.overflow = '';
    if (dialogOpener && document.contains(dialogOpener)) dialogOpener.focus({ preventScroll: true });
    dialogOpener = null;
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', afterClose);
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right
        || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
  document.querySelectorAll('[data-close-dialog]').forEach(button =>
    button.addEventListener('click', () => button.closest('dialog').close()));

  document.querySelectorAll('[data-store-link]').forEach(link => {
    if (listing) {
      link.href = listing;
      link.removeAttribute('aria-haspopup');
      link.removeAttribute('aria-controls');
    } else {
      link.addEventListener('click', event => {
        event.preventDefault();
        openDialog(storeDialog, link);
      });
    }
  });
  if (listing) document.querySelectorAll('[data-store-note]').forEach(note => {
    note.textContent = note.classList.contains('install-status') ? 'Available on the Chrome Web Store.' : 'Chrome Web Store';
  });

  document.getElementById('alpha-instructions').addEventListener('click', () => {
    storeDialog.close();
    const instructions = document.querySelector('.install-guide');
    instructions.open = true;
    window.setTimeout(() => instructions.querySelector('summary').focus({ preventScroll: true }), 0);
  });

  if (videoUrl) {
    document.getElementById('preview-action-label').firstChild.textContent = 'Watch the demo';
    document.getElementById('preview-action-note').textContent = 'Buy, sell, and practice across paper wallets';
    document.getElementById('preview-dialog-note').textContent = 'Native Axiom controls. Simulated funds.';
    document.getElementById('media-caption').textContent = 'The PaperFills launch demo: real markets, paper money.';
    document.querySelector('.film-status').textContent = 'LAUNCH DEMO';
    document.querySelector('.play-icon use').setAttribute('href', '#icon-play');
    document.getElementById('open-preview').setAttribute('aria-label', 'Watch PaperFills demo video');
    if (captionsUrl) {
      const track = document.createElement('track');
      track.kind = 'captions'; track.label = 'English'; track.srclang = 'en'; track.src = captionsUrl; track.default = true;
      video.appendChild(track);
    }
    video.addEventListener('error', () => {
      video.hidden = true;
      poster.hidden = false;
      document.getElementById('video-error').hidden = false;
      document.getElementById('preview-dialog-note').textContent = 'Launch demo temporarily unavailable. Please try again shortly.';
    });
  }

  document.getElementById('open-preview').addEventListener('click', event => {
    openDialog(previewDialog, event.currentTarget);
    if (videoUrl) {
      document.getElementById('video-error').hidden = true;
      poster.hidden = true;
      video.hidden = false;
      if (!video.getAttribute('src')) video.src = videoUrl;
      video.play().catch(() => {
        if (video.error) {
          video.hidden = true; poster.hidden = false;
          document.getElementById('video-error').hidden = false;
        }
      });
    }
  });

  function motionPaused() { return manuallyPaused || reducedMotion.matches; }
  function updateMotionPreference() {
    body.classList.toggle('motion-paused', motionPaused());
    motionButton.textContent = reducedMotion.matches ? 'Reduced motion on' : (manuallyPaused ? 'Resume motion' : 'Pause motion');
    motionButton.setAttribute('aria-pressed', String(motionPaused()));
    motionButton.disabled = reducedMotion.matches;
    updateScroll();
  }
  motionButton.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    updateMotionPreference();
  });
  reducedMotion.addEventListener('change', updateMotionPreference);

  function updateScroll() {
    frame = null;
    body.classList.toggle('scrolled', window.scrollY > 40);
    const midpoint = window.innerHeight * .53;
    const sections = Array.from(document.querySelectorAll('main [data-tone]'));
    let tone = 'dark';
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= midpoint) tone = section.dataset.tone;
    }
    if (body.dataset.tone !== tone) body.dataset.tone = tone;
    if (!motionPaused()) {
      const rect = film.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight * .8)));
      film.style.setProperty('--film-rise', ((1 - progress) * 22).toFixed(2) + 'px');
      film.style.setProperty('--film-tilt', ((1 - progress) * 5).toFixed(2) + 'deg');
    }
  }
  function scheduleScroll() { if (frame === null) frame = window.requestAnimationFrame(updateScroll); }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  updateMotionPreference();
})();
