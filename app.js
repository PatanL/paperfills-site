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
  const inlineVideo = document.getElementById('inline-demo-video');
  const inlineToggle = document.getElementById('inline-video-toggle');
  let manuallyPaused = false;
  let inlineInView = false;
  let inlineUserPaused = false;
  let inlineMotionOptIn = false;
  let inlineFailed = false;
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
    updateInlinePlayback();
  }
  function afterClose() {
    video.pause();
    body.style.overflow = '';
    if (dialogOpener && document.contains(dialogOpener)) dialogOpener.focus({ preventScroll: true });
    dialogOpener = null;
    updateInlinePlayback();
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
    document.getElementById('preview-action-label').firstChild.textContent = 'Watch with sound';
    document.getElementById('preview-action-note').textContent = 'Buy, sell, and practice across paper wallets';
    document.getElementById('preview-dialog-note').textContent = 'Native Axiom controls. Simulated funds.';
    document.getElementById('media-caption').textContent = 'The PaperFills launch demo: real markets, paper money.';
    document.querySelector('.film-status').textContent = 'LAUNCH DEMO';
    document.querySelector('.play-icon use').setAttribute('href', '#icon-play');
    document.getElementById('open-preview').setAttribute('aria-label', 'Watch PaperFills demo video');
    // Older cached markup can still open the full demo during deployment.
    if (inlineVideo && inlineToggle) {
      inlineToggle.hidden = false;
      // Set both the default and live mute state before any media source loads.
      inlineVideo.defaultMuted = true;
      inlineVideo.muted = true;
      inlineVideo.addEventListener('playing', () => {
        document.getElementById('open-preview').classList.add('has-inline-video');
        updateInlineButton();
      });
      inlineVideo.addEventListener('pause', updateInlineButton);
      inlineVideo.addEventListener('error', () => {
        inlineFailed = true;
        inlineVideo.pause();
        document.getElementById('open-preview').classList.remove('has-inline-video');
        inlineToggle.hidden = true;
      });
    }
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
      video.muted = false;
      video.currentTime = 0;
      video.play().catch(() => {
        if (video.error) {
          video.hidden = true; poster.hidden = false;
          document.getElementById('video-error').hidden = false;
        }
      });
    }
  });

  function motionPaused() { return manuallyPaused || reducedMotion.matches; }
  function updateInlineButton() {
    if (!inlineVideo || !inlineToggle) return;
    inlineToggle.textContent = inlineVideo.paused ? 'Play video' : 'Pause video';
    inlineToggle.setAttribute('aria-pressed', String(!inlineVideo.paused));
  }
  function updateInlinePlayback() {
    if (!videoUrl || !inlineVideo || inlineFailed) return;
    const shouldPlay = inlineInView && !document.hidden && !inlineUserPaused
      && (!motionPaused() || inlineMotionOptIn) && !previewDialog.open && !storeDialog.open;
    if (shouldPlay) {
      if (!inlineVideo.getAttribute('src')) inlineVideo.src = videoUrl;
      inlineVideo.muted = true;
      if (inlineVideo.paused) inlineVideo.play().catch(updateInlineButton);
    } else {
      inlineVideo.pause();
    }
    updateInlineButton();
  }
  inlineToggle?.addEventListener('click', () => {
    inlineUserPaused = !inlineVideo.paused;
    // Reduced-motion users can still explicitly choose to play the demo.
    inlineMotionOptIn = !inlineUserPaused;
    updateInlinePlayback();
  });
  if (inlineVideo && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(entries => {
      inlineInView = entries[0].isIntersecting && entries[0].intersectionRatio >= .25;
      updateInlinePlayback();
    }, { threshold: [0, .25] });
    videoObserver.observe(inlineVideo);
  } else {
    // Older browsers retain an explicit, user-initiated playback control.
    inlineInView = true;
    inlineUserPaused = true;
  }
  function updateMotionPreference() {
    body.classList.toggle('motion-paused', motionPaused());
    motionButton.textContent = reducedMotion.matches ? 'Reduced motion on' : (manuallyPaused ? 'Resume motion' : 'Pause motion');
    motionButton.setAttribute('aria-pressed', String(motionPaused()));
    motionButton.disabled = reducedMotion.matches;
    inlineMotionOptIn = false;
    updateInlinePlayback();
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    updateInlinePlayback();
  });
  updateMotionPreference();
})();
