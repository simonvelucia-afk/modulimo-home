// ============================================================
// MODULIMO — clé de la visionneuse 3D du vélomobile (/velomobile-3d/)
// ============================================================
// La visionneuse (copiée telle quelle du kit CAO) charge « data/modele.json ».
// Sur le site, ce fichier n'existe pas en clair : build.js publie
// data/modele.chiffre.json, chiffré avec la même clé que la page Produits.
// Ce script, chargé avant la visionneuse, intercepte ce fetch et déchiffre
// le modèle avec la clé que le cadenas a mise en localStorage
// ('modulimo-produits' = { sel, cle }, voir js/cadenas.js). Sans cadenas
// ouvert, la visionneuse affiche un message au lieu du modèle.
(function () {
  'use strict';
  var CLE = 'modulimo-produits';
  var lang = ((navigator.language || 'fr').slice(0, 2) === 'fr') ? 'fr' : 'en';
  var MSG = {
    ferme: {
      fr: 'Modèle réservé : ouvrez le cadenas sur www.modulimo.com (code d’accès), puis rechargez cette page.',
      en: 'Restricted model: unlock the padlock on www.modulimo.com (access code), then reload this page.',
    },
    erreur: {
      fr: 'Le modèle n’a pas pu être déchiffré : refermez puis rouvrez le cadenas sur www.modulimo.com.',
      en: 'The model could not be decrypted: lock and unlock the padlock again on www.modulimo.com.',
    },
  };
  var b64 = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
  var dehex = function (h) { return new Uint8Array(h.match(/../g).map(function (x) { return parseInt(x, 16); })); };

  var natif = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    if (typeof url !== 'string' || !/(^|\/)data\/modele\.json$/.test(url)) return natif(url, opts);
    var memo = null;
    try { memo = JSON.parse(localStorage.getItem(CLE) || 'null'); } catch (e) {}
    if (!memo || !memo.cle) return Promise.reject(new Error(MSG.ferme[lang]));
    // revalider auprès du serveur à chaque ouverture : le modèle évolue, une copie en cache
    // afficherait une ancienne version (GitHub Pages renvoie 304 si rien n'a changé)
    return natif(url.replace(/modele\.json$/, 'modele.chiffre.json'), Object.assign({ cache: 'no-cache' }, opts))
      .then(function (r) { if (!r.ok) throw new Error(MSG.erreur[lang]); return r.json(); })
      .then(function (P) {
        if (P.sel !== memo.sel) throw new Error(MSG.erreur[lang]);
        return crypto.subtle.importKey('raw', dehex(memo.cle), 'AES-GCM', false, ['decrypt'])
          .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(P.iv) }, k, b64(P.data)); });
      })
      .then(function (buf) {
        return new Response(buf, { status: 200, headers: { 'Content-Type': 'application/json' } });
      }, function (e) {
        throw new Error(e && e.message && e.message !== 'OperationError' && e.name !== 'OperationError' ? e.message : MSG.erreur[lang]);
      });
  };

  // Cadenas fermé : la visionneuse demande elle-même le code d'accès.
  // Elle peut ainsi s'ouvrir hors du site (dans le Lab de la démo
  // CoHabitat, par exemple) sans passer par le cadenas de l'en-tête. Même
  // vérification que js/cadenas.js : le code déchiffre le témoin de
  // /verrou.json ; la clé dérivée est gardée sous la même entrée, ce qui
  // ouvre aussi le cadenas du site.
  var T = {
    titre:   { fr: 'Modèle réservé', en: 'Restricted model' },
    texte:   { fr: 'Entrez le code d’accès qui vous a été remis.', en: 'Enter the access code you were given.' },
    champ:   { fr: 'Code d’accès', en: 'Access code' },
    ok:      { fr: 'Ouvrir', en: 'Unlock' },
    attente: { fr: 'Vérification…', en: 'Checking…' },
    faux:    { fr: 'Code d’accès incorrect.', en: 'Incorrect access code.' },
    court:   { fr: 'Code d’accès trop court.', en: 'Access code too short.' },
  };
  var hex = function (u) { return Array.prototype.map.call(u, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); };

  function ouvert(V) {
    try { var m = JSON.parse(localStorage.getItem(CLE) || 'null'); return !!(m && m.cle && m.sel === V.sel); }
    catch (e) { return false; }
  }

  function demanderCode(V) {
    var fond = document.createElement('div');
    fond.setAttribute('role', 'dialog');
    fond.setAttribute('aria-modal', 'true');
    fond.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;'
      + 'padding:16px;background:rgba(20,25,23,.55);font:14px system-ui,sans-serif';
    fond.innerHTML = '<form style="background:#fff;color:#1c2420;border-radius:10px;padding:22px;width:min(320px,100%);'
      + 'box-shadow:0 12px 40px rgba(0,0,0,.3)">'
      + '<div style="font-weight:700;font-size:16px;margin-bottom:6px">' + T.titre[lang] + '</div>'
      + '<div style="color:#5a6862;margin-bottom:14px">' + T.texte[lang] + '</div>'
      + '<input type="password" autocomplete="off" aria-label="' + T.champ[lang] + '" placeholder="' + T.champ[lang] + '" '
      + 'style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #c6d0cb;border-radius:6px;font:inherit">'
      + '<div data-msg style="color:#b23a2a;min-height:18px;margin:8px 0 4px;font-size:13px"></div>'
      + '<button type="submit" style="width:100%;padding:10px;border:0;border-radius:6px;background:#1c2420;color:#fff;font:inherit;font-weight:600;cursor:pointer">'
      + T.ok[lang] + '</button></form>';
    var form = fond.querySelector('form'), champ = fond.querySelector('input'),
        msg = fond.querySelector('[data-msg]'), go = fond.querySelector('button');
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
          try { localStorage.setItem(CLE, JSON.stringify({ sel: V.sel, cle: hex(brute) })); } catch (e2) {}
          location.reload();
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

  if (!window.crypto || !crypto.subtle) return;
  natif('/verrou.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (V) {
      if (!V || ouvert(V)) return;
      if (document.body) demanderCode(V);
      else document.addEventListener('DOMContentLoaded', function () { demanderCode(V); });
    })
    .catch(function () {});
})();
