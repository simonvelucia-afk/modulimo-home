(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem('modulimo_lang');
  const browser = (navigator.language || navigator.userLanguage || 'fr').toLowerCase();
  const initial = stored || (browser.startsWith('fr') ? 'fr' : browser.startsWith('es') ? 'es' : 'en');

  function setLang(lang) {
    root.classList.remove('lang-fr', 'lang-en', 'lang-es');
    root.classList.add('lang-' + lang);
    root.setAttribute('lang', lang);
    try { localStorage.setItem('modulimo_lang', lang); } catch (e) {}
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-set-lang') === lang);
    });
  }

  setLang(initial);

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-set-lang]');
    if (!btn) return;
    setLang(btn.getAttribute('data-set-lang'));
  });
})();
