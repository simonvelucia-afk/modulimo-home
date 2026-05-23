(function () {
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lb-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<button type="button" class="lb-close" aria-label="Fermer">&times;</button>' +
    '<img class="lb-image" alt="" />';
  document.body.appendChild(overlay);

  const img = overlay.querySelector('.lb-image');
  const closeBtn = overlay.querySelector('.lb-close');
  let lastFocus = null;

  function open(src, alt) {
    lastFocus = document.activeElement;
    img.src = src;
    img.alt = alt || '';
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    img.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  triggers.forEach(function (el) {
    el.style.cursor = 'zoom-in';
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', el.getAttribute('aria-label') || 'Agrandir l’image');
    function trigger(e) {
      e.preventDefault();
      const src = el.getAttribute('data-lightbox');
      const alt = el.getAttribute('data-lightbox-alt') || el.getAttribute('alt') || '';
      open(src, alt);
    }
    el.addEventListener('click', trigger);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') trigger(e);
    });
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });
})();
