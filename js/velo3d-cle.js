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
    return natif(url.replace(/modele\.json$/, 'modele.chiffre.json'), opts)
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
})();
