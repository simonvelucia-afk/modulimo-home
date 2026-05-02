// MODULIMO — Google Analytics 4 + bandeau de consentement (Loi 25 / RGPD)
// Mesure désactivée par défaut, activée seulement après consentement explicite.
(function () {
  'use strict';

  var GA_ID = 'G-EWP5ER8KFJ';
  var STORAGE_KEY = 'ga_consent';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window._gaConsent = localStorage.getItem(STORAGE_KEY);
  window._gaLoaded = false;

  function loadGA() {
    if (window._gaLoaded) return;
    window._gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    s.onload = function () {
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, {
        page_path: window.location.pathname,
        page_title: document.title,
        anonymize_ip: true
      });
    };
  }

  if (window._gaConsent === 'granted') loadGA();

  window.trackFeature = function (category, action, details) {
    if (window._gaConsent !== 'granted' || typeof window.gtag !== 'function') return;
    var payload = {
      feature_category: category,
      page_path: window.location.pathname,
      page_title: document.title,
      timestamp: Date.now()
    };
    if (details) {
      for (var k in details) if (Object.prototype.hasOwnProperty.call(details, k)) payload[k] = details[k];
    }
    window.gtag('event', action, payload);
  };

  function showBanner() {
    if (window._gaConsent === 'granted' || window._gaConsent === 'denied') return;
    if (document.getElementById('ga-consent-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'ga-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentement aux témoins');
    banner.style.cssText = [
      'position:fixed', 'bottom:16px', 'left:16px', 'right:16px',
      'max-width:520px', 'margin:0 auto',
      'background:#1e3d32', 'color:#fff',
      'padding:18px 20px', 'border-radius:10px',
      'box-shadow:0 8px 32px rgba(0,0,0,.25)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif',
      'font-size:.92rem', 'line-height:1.5', 'z-index:10000'
    ].join(';');
    banner.innerHTML =
      '<p style="margin:0 0 12px;">Nous utilisons Google Analytics (IP anonymisée) pour mesurer la fréquentation du site. Acceptez-vous ces témoins&nbsp;?</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button type="button" id="ga-accept" style="background:#3a7a62;color:#fff;border:0;padding:9px 18px;border-radius:6px;font-size:.9rem;cursor:pointer;font-weight:600;">Accepter</button>' +
      '<button type="button" id="ga-reject" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4);padding:9px 18px;border-radius:6px;font-size:.9rem;cursor:pointer;">Refuser</button>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('ga-accept').addEventListener('click', function () {
      localStorage.setItem(STORAGE_KEY, 'granted');
      window._gaConsent = 'granted';
      loadGA();
      banner.remove();
    });
    document.getElementById('ga-reject').addEventListener('click', function () {
      localStorage.setItem(STORAGE_KEY, 'denied');
      window._gaConsent = 'denied';
      banner.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
