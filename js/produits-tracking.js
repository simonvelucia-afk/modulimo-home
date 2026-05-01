// MODULIMO — Tracking des produits / sections sur /produits
// Dépend de window.trackFeature() défini dans js/analytics.js
(function () {
  'use strict';
  if (typeof window.trackFeature !== 'function') return;

  var SECTION_NAMES = {
    'cohabitat':      'CoHabitat — plateforme',
    'build':          'Construction industrialisée',
    'court-terme':    'Services & habitation',
    'autosuffisance': 'Autosuffisance urbaine',
    'family':         'Habitation familiale',
    'ambitieux':      'Mobilité — vélomobile',
    'lab':            'Forest Bunker — laboratoire',
    'roadmap':        'Feuille de route'
  };

  function productOf(el) {
    var section = el.closest && el.closest('section[id]');
    if (!section) return null;
    var name = SECTION_NAMES[section.id];
    return name ? { id: section.id, name: name } : null;
  }

  // 1) Impressions — chaque section comptée une seule fois par chargement
  var seen = Object.create(null);
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      if (seen[id]) return;
      seen[id] = true;
      window.trackFeature('produits', 'product_view', {
        product_id: id,
        product_name: SECTION_NAMES[id]
      });
    });
  }, { threshold: 0.5 }) : null;

  if (io) {
    Object.keys(SECTION_NAMES).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // 2) Clics sur CTA, démos, images plein écran, liens externes
  document.addEventListener('click', function (e) {
    var target = e.target && e.target.closest && e.target.closest('a[href], button');
    if (!target) return;
    var product = productOf(target);
    if (!product) return;

    var href  = target.getAttribute('href') || '';
    var label = (target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    var action = 'product_click';

    if (target.hasAttribute('data-image-fullscreen')) action = 'product_image_fullscreen';
    else if (target.hasAttribute('data-dashboard-fullscreen')) action = 'product_dashboard_open';
    else if (target.classList.contains('dashboard-link')) action = 'product_dashboard_link';
    else if (/^https?:\/\//.test(href)) action = 'product_external_click';

    window.trackFeature('produits', action, {
      product_id:   product.id,
      product_name: product.name,
      link_label:   label,
      link_url:     href || null
    });
  }, true);

  // 3) Changements de langue (intéressant pour segmenter l'audience)
  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.trackFeature('produits', 'lang_change', {
        lang: this.getAttribute('data-set-lang')
      });
    });
  });
})();
