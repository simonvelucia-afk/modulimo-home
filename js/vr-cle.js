// ============================================================
// MODULIMO — clé de la visite 3D / VR de Pointe Est (/vr/)
// ============================================================
// Le code de la visite (dépôt privé modulimo-vr) n'est publié que CHIFFRÉ :
// vr/app.chiffre.json, avec la même clé que la page Produits (voir
// build.js → publierVr). Ce script :
//   1. prend la clé que le cadenas a mise en localStorage
//      ('modulimo-produits' = { sel, cle }, voir js/cadenas.js) ;
//      cadenas fermé, il demande le code d'accès (ce qui ouvre aussi le
//      cadenas du site) ;
//   2. déchiffre le paquet de modules JavaScript ;
//   3. crée une importmap qui relie les noms « @pe/… » et Three.js aux
//      modules déchiffrés, puis lance src/main.js.
// Changer le code d'accès (MODULIMO_PIN au build) rend l'ancien inutile.
(function () {
  'use strict';
  var CLE = 'modulimo-produits';
  var V = window.MODULIMO_VERROU;
  var lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'fr'; // comme la visite : français par défaut
  var T = {
    titre:   { fr: 'Visite VR réservée', en: 'Restricted VR tour' },
    texte:   { fr: 'Entrez le code d’accès qui vous a été remis. Pour en obtenir un : info@modulimo.com.', en: 'Enter the access code you were given. To get one: info@modulimo.com.' },
    champ:   { fr: 'Code d’accès', en: 'Access code' },
    ok:      { fr: 'Ouvrir', en: 'Unlock' },
    attente: { fr: 'Vérification…', en: 'Checking…' },
    faux:    { fr: 'Code d’accès incorrect.', en: 'Incorrect access code.' },
    court:   { fr: 'Code d’accès trop court.', en: 'Access code too short.' },
    perime:  { fr: 'Le code d’accès a changé : entrez le nouveau code.', en: 'The access code has changed: enter the new one.' },
    erreur:  { fr: 'La visite n’a pas pu être chargée. Rechargez la page.', en: 'The tour could not be loaded. Reload the page.' },
  };
  var b64 = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
  var hex = function (u) { return Array.prototype.map.call(u, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); };
  var dehex = function (h) { return new Uint8Array(h.match(/../g).map(function (x) { return parseInt(x, 16); })); };

  function texteChargement(s) {
    var p = document.querySelector('.loader-text');
    if (p) p.textContent = s;
  }

  function memo() {
    try { var m = JSON.parse(localStorage.getItem(CLE) || 'null'); return m && m.cle && m.sel === V.sel ? m : null; }
    catch (e) { return null; }
  }

  // --- Déchiffrement du paquet et lancement de la visite ---
  function lancer(m) {
    return fetch('app.chiffre.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (P) {
        if (P.sel !== m.sel) throw new Error('cle');
        return crypto.subtle.importKey('raw', dehex(m.cle), 'AES-GCM', false, ['decrypt'])
          .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(P.iv) }, k, b64(P.data)); })
          .catch(function () { throw new Error('cle'); });
      })
      .then(function (buf) {
        var modules = JSON.parse(new TextDecoder().decode(buf));
        var imports = Object.assign({}, window.PE_IMPORTS || {});
        Object.keys(modules).forEach(function (chemin) {
          imports['@pe/' + chemin] = URL.createObjectURL(new Blob([modules[chemin]], { type: 'text/javascript' }));
        });
        var s = document.createElement('script');
        s.type = 'importmap';
        s.textContent = JSON.stringify({ imports: imports });
        document.head.appendChild(s);
        return import('@pe/src/main.js');
      });
  }

  // --- Saisie du code (même vérification que js/cadenas.js) ---
  function demanderCode(message) {
    var fond = document.createElement('div');
    fond.setAttribute('role', 'dialog');
    fond.setAttribute('aria-modal', 'true');
    fond.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;'
      + 'padding:16px;background:rgba(243,236,224,.97);font:15px system-ui,sans-serif';
    fond.innerHTML = '<form style="background:#fcf9f3;color:#1d1d1b;border-radius:16px;padding:26px;width:min(380px,100%);'
      + 'box-shadow:0 12px 34px rgba(20,18,12,.16)">'
      + '<img src="assets/brand/logo_main.webp" alt="Modulimo" style="height:30px;display:block;margin-bottom:16px">'
      + '<div style="font-weight:700;font-size:19px;color:#123731;margin-bottom:8px">🔒 ' + T.titre[lang] + '</div>'
      + '<div style="color:#47443c;margin-bottom:16px;line-height:1.45">' + T.texte[lang] + '</div>'
      + '<input type="password" autocomplete="off" aria-label="' + T.champ[lang] + '" placeholder="' + T.champ[lang] + '" '
      + 'style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #d8d1c4;border-radius:10px;font:inherit;font-size:18px">'
      + '<div data-msg role="alert" style="color:#9b2c1f;min-height:20px;margin:8px 0 6px;font-size:13px"></div>'
      + '<button type="submit" style="width:100%;padding:13px;border:0;border-radius:999px;background:#123731;color:#fff;font:inherit;font-weight:600;cursor:pointer">'
      + T.ok[lang] + '</button></form>';
    var form = fond.querySelector('form'), champ = fond.querySelector('input'),
        msg = fond.querySelector('[data-msg]'), go = fond.querySelector('button');
    if (message) msg.textContent = message;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // même normalisation que build.js (normaliserNip) et js/cadenas.js
      var nip = champ.value.normalize('NFC').toLowerCase().replace(/\s+/g, '');
      if (nip.length < 10) { msg.textContent = T.court[lang]; return; }
      go.disabled = true; go.textContent = T.attente[lang];
      var brute;
      crypto.subtle.importKey('raw', new TextEncoder().encode(nip), 'PBKDF2', false, ['deriveBits'])
        .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(V.sel), iterations: V.iter }, k, 256); })
        .then(function (bits) { brute = new Uint8Array(bits); return crypto.subtle.importKey('raw', brute, 'AES-GCM', false, ['decrypt']); })
        .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(V.iv) }, k, b64(V.data)); })
        .then(function () {
          var m = { sel: V.sel, cle: hex(brute) };
          try { localStorage.setItem(CLE, JSON.stringify(m)); } catch (e2) {}
          fond.remove();
          demarrer(m);
        })
        .catch(function () {
          go.disabled = false; go.textContent = T.ok[lang];
          msg.textContent = T.faux[lang];
          champ.select();
        });
    });
    document.body.appendChild(fond);
    champ.focus();
  }

  function demarrer(m) {
    lancer(m).catch(function (e) {
      if (e && e.message === 'cle') {
        // Code changé depuis la dernière ouverture : on redemande
        try { localStorage.removeItem(CLE); } catch (e2) {}
        demanderCode(T.perime[lang]);
      } else {
        console.error(e);
        texteChargement(T.erreur[lang]);
      }
    });
  }

  if (!V || !window.crypto || !crypto.subtle) { texteChargement(T.erreur[lang]); return; }
  var m = memo();
  if (m) demarrer(m); else demanderCode('');
})();
