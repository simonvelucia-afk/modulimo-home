// ============================================================
// MODULIMO — cadenas de l'onglet Produits
// ============================================================
// L'onglet Produits est caché par défaut. Un cadenas, en haut à droite de
// l'en-tête, demande le NIP à 10 chiffres ; une fois ouvert, l'onglet (et
// tout lien vers /produits/) réapparaît sur tout le site, et la page
// Produits — chiffrée, voir build.js — s'ouvre sans nouvelle saisie.
// Refermer le cadenas retire l'accès : l'onglet disparaît et, si l'on est
// sur la page Produits, on revient à l'accueil.
//
// L'état vit dans localStorage ('modulimo-produits' = { sel, cle }) : il
// dure jusqu'à ce que le visiteur referme le cadenas. Le NIP est vérifié
// en déchiffrant le témoin de window.MODULIMO_VERROU (verrou.json), injecté
// par build.js dans le <head> de chaque page.
(function () {
  'use strict';
  var V = window.MODULIMO_VERROU;
  var bar = document.querySelector('.topbar-inner');
  if (!V || !bar || !window.crypto || !crypto.subtle) return;

  var CLE = 'modulimo-produits';
  var racine = document.documentElement;
  var lang = (racine.lang || 'fr').slice(0, 2);
  var T = {
    fermer:  { fr: 'Refermer le cadenas (retirer l\'accès à Produits)', en: 'Lock again (remove access to Products)', es: 'Cerrar el candado (retirar el acceso a Productos)', zh: '重新上锁（取消产品页访问）' },
    ouvrir:  { fr: 'Ouvrir le cadenas (accès à Produits)', en: 'Unlock (access to Products)', es: 'Abrir el candado (acceso a Productos)', zh: '解锁（访问产品页）' },
    titre:   { fr: 'Accès Produits', en: 'Products access', es: 'Acceso a Productos', zh: '产品页访问' },
    champ:   { fr: 'NIP (10 chiffres)', en: 'PIN (10 digits)', es: 'PIN (10 dígitos)', zh: 'PIN 码（10 位数字）' },
    ok:      { fr: 'Ouvrir', en: 'Unlock', es: 'Abrir', zh: '解锁' },
    attente: { fr: 'Vérification…', en: 'Checking…', es: 'Verificando…', zh: '验证中…' },
    erreur:  { fr: 'NIP incorrect.', en: 'Incorrect PIN.', es: 'PIN incorrecto.', zh: 'PIN 码错误。' },
    format:  { fr: 'Le NIP compte exactement 10 chiffres.', en: 'The PIN is exactly 10 digits.', es: 'El PIN tiene exactamente 10 dígitos.', zh: 'PIN 码必须为 10 位数字。' },
  };
  var t = function (k) { return T[k][lang] || T[k].fr; };

  var b64 = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
  var hex = function (u) { return Array.prototype.map.call(u, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); };

  function estOuvert() {
    try {
      var v = JSON.parse(localStorage.getItem(CLE) || 'null');
      return !!(v && v.sel === V.sel);
    } catch (e) { return false; }
  }

  // Icônes : cadenas fermé / ouvert (l'anse se soulève).
  var ICONE = {
    ferme: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    ouvert: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.8"/></svg>',
  };

  var style = document.createElement('style');
  style.textContent =
    '.topbar-inner{position:relative}' +
    '.topbar-inner>.nav,.topbar-inner>.menu-toggle{margin-left:auto}' +
    '.cadenas{order:99;flex-shrink:0;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;' +
      'background:transparent;border:1px solid rgba(0,0,0,.18);border-radius:6px;color:inherit;cursor:pointer;opacity:.75;transition:opacity .2s,color .2s,border-color .2s}' +
    '.cadenas:hover,.cadenas:focus-visible{opacity:1}' +
    '.cadenas.est-ouvert{color:#2d7a4f;border-color:#2d7a4f;opacity:1}' +
    '.cadenas-pop{position:absolute;top:calc(100% + 8px);right:24px;z-index:60;width:min(300px,calc(100vw - 32px));background:#fff;color:#1a1a1a;' +
      'border:1px solid #e0ddd8;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,.16);padding:1rem;font-family:inherit}' +
    '.cadenas-pop[hidden]{display:none}' +
    '.cadenas-pop strong{display:block;font-size:.95rem;margin-bottom:.6rem}' +
    '.cadenas-pop label{display:block;font-size:.7rem;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a;margin-bottom:.3rem}' +
    '.cadenas-pop input{width:100%;box-sizing:border-box;font:inherit;font-size:1.15rem;letter-spacing:.2em;padding:.55rem .65rem;border:1.5px solid #e0ddd8;border-radius:4px;outline:none;background:#fff;color:#1a1a1a}' +
    '.cadenas-pop input:focus{border-color:#2d7a4f}' +
    '.cadenas-pop button{margin-top:.6rem;width:100%;font:inherit;font-weight:600;padding:.6rem;border:none;border-radius:4px;background:#2d7a4f;color:#fff;cursor:pointer}' +
    '.cadenas-pop button:disabled{opacity:.6;cursor:wait}' +
    '.cadenas-msg{min-height:1.2em;margin-top:.45rem;font-size:.8rem;color:#b3261e}' +
    '@media (max-width:640px){.cadenas-pop{right:16px}}';
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cadenas';
  btn.setAttribute('aria-haspopup', 'dialog');

  var pop = document.createElement('form');
  pop.className = 'cadenas-pop';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('autocomplete', 'off');
  pop.noValidate = true;
  pop.innerHTML =
    '<strong></strong>' +
    '<label for="cadenas-nip"></label>' +
    '<input id="cadenas-nip" type="password" inputmode="numeric" maxlength="10" autocomplete="off" />' +
    '<button type="submit"></button>' +
    '<div class="cadenas-msg" role="alert" aria-live="polite"></div>';
  pop.querySelector('strong').textContent = t('titre');
  pop.querySelector('label').textContent = t('champ');
  var champ = pop.querySelector('input');
  var go = pop.querySelector('button');
  var msg = pop.querySelector('.cadenas-msg');
  go.textContent = t('ok');

  bar.appendChild(btn);
  bar.appendChild(pop);

  function rafraichir() {
    var ouvert = estOuvert();
    racine.classList.toggle('produits-ouverts', ouvert);
    btn.classList.toggle('est-ouvert', ouvert);
    btn.innerHTML = ouvert ? ICONE.ouvert : ICONE.ferme;
    btn.setAttribute('aria-label', ouvert ? t('fermer') : t('ouvrir'));
    btn.title = ouvert ? t('fermer') : t('ouvrir');
  }

  function fermerPop() { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); }

  function verrouiller() {
    try { localStorage.removeItem(CLE); } catch (e) {}
    rafraichir();
    // Sur la page Produits elle-même : l'accès est retiré, on quitte la page.
    if (/\/produits\/?$/.test(location.pathname)) {
      location.href = lang === 'fr' ? '/' : '/' + lang + '/';
    }
  }

  btn.addEventListener('click', function () {
    if (estOuvert()) { verrouiller(); return; }
    if (!pop.hidden) { fermerPop(); return; }
    pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    msg.textContent = '';
    champ.value = '';
    champ.focus();
  });

  document.addEventListener('click', function (e) {
    if (!pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) fermerPop();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !pop.hidden) { fermerPop(); btn.focus(); }
  });

  champ.addEventListener('input', function () {
    champ.value = champ.value.replace(/\D/g, '').slice(0, 10);
    msg.textContent = '';
  });

  pop.addEventListener('submit', function (e) {
    e.preventDefault();
    var nip = champ.value;
    if (!/^[0-9]{10}$/.test(nip)) { msg.textContent = t('format'); return; }
    go.disabled = true; go.textContent = t('attente');
    var brute;
    crypto.subtle.importKey('raw', new TextEncoder().encode(nip), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(V.sel), iterations: V.iter }, k, 256); })
      .then(function (bits) {
        brute = new Uint8Array(bits);
        return crypto.subtle.importKey('raw', brute, 'AES-GCM', false, ['decrypt']);
      })
      .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(V.iv) }, k, b64(V.data)); })
      .then(function () {
        try { localStorage.setItem(CLE, JSON.stringify({ sel: V.sel, cle: hex(brute) })); } catch (e2) {}
        go.disabled = false; go.textContent = t('ok');
        fermerPop();
        rafraichir();
      })
      .catch(function () {
        go.disabled = false; go.textContent = t('ok');
        msg.textContent = t('erreur');
        champ.select();
      });
  });

  // Un autre onglet ouvre ou referme le cadenas : on suit.
  window.addEventListener('storage', function (e) {
    if (e.key === CLE) {
      rafraichir();
      if (!estOuvert() && /\/produits\/?$/.test(location.pathname)) verrouiller();
    }
  });

  rafraichir();
})();
