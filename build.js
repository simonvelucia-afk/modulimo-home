#!/usr/bin/env node
// ============================================================
// MODULIMO — build.js : génération des pages FR / EN / ES
// ============================================================
// Les pages sources (src/**/index.html) contiennent les trois
// langues via <span data-lang="fr|en|es"> (et quelques <div>).
// Ce script génère, sans dépendance externe :
//   /            → français (langue principale)
//   /en/…        → anglais
//   /es/…        → espagnol
// avec lang, canonical, hreflang croisés, sélecteur de langue
// par URL, sitemap.xml et robots.txt.
//
// Usage :  node build.js
// ============================================================

'use strict';

const fs = require('fs');
const path = require('path');

const SITE = 'https://www.modulimo.com';
const LANGS = ['fr', 'en', 'es'];
const HREFLANG = { fr: 'fr-CA', en: 'en', es: 'es' };

// Pages générées. `route` est le chemin public FR (préfixé /en/ ou /es/
// pour les autres langues). title/desc remplacent <title> et la meta
// description par langue.
const PAGES = [
  {
    src: 'src/index.html', route: '',
    title: {
      fr: 'MODULIMO — Habitat et mobilité écologique',
      en: 'MODULIMO — Housing and ecological mobility',
      es: 'MODULIMO — Hábitat y movilidad ecológica',
    },
    desc: {
      fr: "MODULIMO structure un écosystème résidentiel intégré combinant logement familial, mobilité, services et logiciel. Projet Pointe Est à Montréal.",
      en: "MODULIMO builds an integrated residential ecosystem combining family housing, mobility, services and software. Pointe Est project in Montreal.",
      es: "MODULIMO estructura un ecosistema residencial integrado que combina vivienda familiar, movilidad, servicios y software. Proyecto Pointe Est en Montreal.",
    },
  },
  {
    src: 'src/mobilite/index.html', route: 'mobilite/',
    title: {
      fr: 'Mobilité inter-modale — Modulimo',
      en: 'Inter-modal mobility — Modulimo',
      es: 'Movilidad intermodal — Modulimo',
    },
    desc: {
      fr: "Covoiturage intégré, vélomobile et accès direct au transport en commun — la mobilité fait partie du milieu de vie Modulimo.",
      en: "Built-in ride-share, velomobile and direct access to public transit — mobility is part of the Modulimo living environment.",
      es: "Carpooling integrado, velomóvil y acceso directo al transporte público — la movilidad forma parte del entorno de vida Modulimo.",
    },
  },
  {
    src: 'src/securite/index.html', route: 'securite/',
    title: {
      fr: 'Sécurité — Modulimo',
      en: 'Security — Modulimo',
      es: 'Seguridad — Modulimo',
    },
    desc: {
      fr: "La sécurité des résidents au cœur du modèle Modulimo — prévention, surveillance et résilience du milieu de vie.",
      en: "Resident safety at the core of the Modulimo model — prevention, monitoring and resilience of the living environment.",
      es: "La seguridad de los residentes en el centro del modelo Modulimo — prevención, vigilancia y resiliencia del entorno de vida.",
    },
  },
  {
    src: 'src/projets/index.html', route: 'projets/',
    title: {
      fr: 'Projets — MODULIMO',
      en: 'Projects — MODULIMO',
      es: 'Proyectos — MODULIMO',
    },
    desc: {
      fr: "Les projets immobiliers Modulimo — Pointe Est et futurs déploiements du modèle résidentiel intégré.",
      en: "Modulimo real estate projects — Pointe Est and future deployments of the integrated residential model.",
      es: "Los proyectos inmobiliarios Modulimo — Pointe Est y futuros despliegues del modelo residencial integrado.",
    },
  },
  {
    src: 'src/projets/pointe-est/index.html', route: 'projets/pointe-est/',
    title: {
      fr: 'Pointe Est — Projets MODULIMO',
      en: 'Pointe Est — MODULIMO Projects',
      es: 'Pointe Est — Proyectos MODULIMO',
    },
    desc: {
      fr: "Pointe Est — premier projet immobilier Modulimo à Pointe-aux-Trembles, Montréal. 6 logements multigénérationnels, construction industrialisée performante, démarche PPCMOI en cours.",
      en: "Pointe Est — first Modulimo real estate project in Pointe-aux-Trembles, Montreal. 6 multigenerational homes, high-performance industrialized construction, PPCMOI process underway.",
      es: "Pointe Est — primer proyecto inmobiliario Modulimo en Pointe-aux-Trembles, Montreal. 6 viviendas multigeneracionales, construcción industrializada de alto rendimiento, trámite PPCMOI en curso.",
    },
  },
  {
    src: 'src/confidentialite/index.html', route: 'confidentialite/',
    title: {
      fr: 'Politique de confidentialité — Modulimo',
      en: 'Privacy Policy — Modulimo',
      es: 'Política de privacidad — Modulimo',
    },
    desc: {
      fr: "Politique de confidentialité de Modulimo inc. — renseignements personnels recueillis, finalités, témoins, droits d'accès et de rectification (Loi 25).",
      en: "Modulimo inc. privacy policy — personal information collected, purposes, cookies, access and rectification rights (Quebec Law 25).",
      es: "Política de privacidad de Modulimo inc. — información personal recopilada, finalidades, cookies, derechos de acceso y rectificación (Ley 25 de Quebec).",
    },
  },
  {
    src: 'src/produits/index.html', route: 'produits/',
    title: {
      fr: 'MODULIMO | Produits',
      en: 'MODULIMO | Products',
      es: 'MODULIMO | Productos',
    },
    desc: {
      fr: "MODULIMO structure un écosystème intégré combinant habitation familiale, mobilité, services, infrastructure logicielle, construction industrialisée et innovation avancée.",
      en: "MODULIMO builds an integrated ecosystem combining family housing, mobility, services, software infrastructure, industrialized construction and advanced innovation.",
      es: "MODULIMO estructura un ecosistema integrado que combina vivienda familiar, movilidad, servicios, infraestructura de software, construcción industrializada e innovación avanzada.",
    },
  },
];

// Slugs internes réécrits avec préfixe de langue (le reste — /postuler,
// /images, /js, ancres, externes — ne change pas).
const ROUTE_SLUGS = ['mobilite', 'securite', 'projets/pointe-est', 'projets', 'produits', 'confidentialite'];

// ------------------------------------------------------------
// Extraction d'une langue. Les éléments data-lang consécutifs
// (séparés par des blancs) forment une « grappe » : on garde
// l'élément de la langue cible s'il existe, sinon celui en
// français (fallback — certaines pages n'ont pas 100 % de
// couverture EN/ES). L'attribut data-lang est retiré, le
// contenu est traité récursivement (grappes imbriquées).
// ------------------------------------------------------------
const LANG_OPEN_RE = /^<(span|div)((?:[^>"]|"[^"]*")*?)\sdata-lang="(fr|en|es)"((?:[^>"]|"[^"]*")*?)>/;

// Localise l'élément data-lang à partir de `from` (qui doit pointer sur
// son '<'), retourne { tag, attrs, lang, inner, end } ou null.
function readLangEl(html, from) {
  const m = LANG_OPEN_RE.exec(html.slice(from));
  if (!m) return null;
  const tag = m[1];
  const innerStart = from + m[0].length;
  let depth = 1;
  let i = innerStart;
  for (;;) {
    const nextOpen = html.indexOf('<' + tag, i);
    const nextClose = html.indexOf('</' + tag + '>', i);
    if (nextClose === -1) throw new Error(`Balise <${tag} data-lang> non fermée près de : ${html.slice(from, from + 120)}`);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + tag.length + 1;
    } else {
      depth -= 1;
      if (depth === 0) {
        return {
          tag,
          attrs: (m[2] + m[4]).replace(/\s+/g, ' ').trimEnd(),
          lang: m[3],
          inner: html.slice(innerStart, nextClose),
          end: nextClose + tag.length + 3,
        };
      }
      i = nextClose + tag.length + 3;
    }
  }
}

function extractLang(html, lang) {
  let out = '';
  let pos = 0;
  for (;;) {
    const idx = html.slice(pos).search(/<(?:span|div)(?:[^>"]|"[^"]*")*?\sdata-lang="(?:fr|en|es)"/);
    if (idx === -1) { out += html.slice(pos); break; }
    const start = pos + idx;
    out += html.slice(pos, start);

    // lire la grappe : éléments data-lang consécutifs (blancs entre eux)
    const cluster = [];
    let cur = start;
    for (;;) {
      const el = readLangEl(html, cur);
      if (!el) break;
      cluster.push(el);
      const ws = /^\s*/.exec(html.slice(el.end))[0];
      const next = el.end + ws.length;
      if (LANG_OPEN_RE.test(html.slice(next))) cur = next;
      else break;
    }
    const last = cluster[cluster.length - 1];
    const chosen = cluster.find((e) => e.lang === lang) || cluster.find((e) => e.lang === 'fr') || cluster[0];
    out += `<${chosen.tag}${chosen.attrs}>` + extractLang(chosen.inner, lang) + `</${chosen.tag}>`;
    pos = last.end;
  }
  return out;
}

// alt trilingues : data-alt-en / data-alt-es remplacent alt selon la
// langue cible, puis les attributs data-alt-* sont retirés partout.
function applyAlts(html, lang) {
  if (lang !== 'fr') {
    html = html.replace(/alt="([^"]*)"((?:[^>"]|"[^"]*")*?)\sdata-alt-(en|es)="([^"]*)"/g,
      (full, frAlt, between, l, txt) => {
        if (l === lang) return `alt="${txt}"${between} data-alt-${l}="${txt}"`;
        return full;
      });
    // 2e passe : l'autre attribut (ordre en puis es dans les sources)
    html = html.replace(/alt="[^"]*"/g, (a) => a); // no-op, lisibilité
  }
  return html.replace(/\sdata-alt-(?:en|es)="[^"]*"/g, '');
}

// Liens internes : préfixe /en/ ou /es/ + barre oblique finale.
function rewriteLinks(html, lang) {
  const prefix = lang === 'fr' ? '' : '/' + lang;
  const slugAlt = ROUTE_SLUGS.join('|');
  // href="/slug", href="/slug/", href="/slug#ancre"
  html = html.replace(new RegExp(`href="/(${slugAlt})(/?)(#[^"]*)?"`, 'g'),
    (full, slug, slash, anchor) => `href="${prefix}/${slug}/${anchor || ''}"`);
  // accueil : href="/" (pas /images, /js, /postuler…)
  html = html.replace(/href="\/"/g, `href="${prefix || ''}/"`);
  return html;
}

// Chemins d'actifs relatifs → absolus (les pages /en/ et /es/ ont une
// profondeur différente des sources).
function absolutizeAssets(html) {
  return html.replace(/(src|href|data-lightbox)="(?:\.\.\/)*((?:images|js)\/[^"]+)"/g, '$1="/$2"');
}

// Drapeaux du sélecteur de langue, identiques à ceux de CoHabitat et du
// kiosque Machine Lunch.
//
// Ils sont dessinés plutôt qu'écrits en emoji, pour deux raisons. Le
// Québec n'a pas d'emoji : Unicode ne code que les pays (ISO 3166-1), les
// seules subdivisions codées étant l'Écosse, le pays de Galles et
// l'Angleterre. Et les emojis drapeaux ne sont pas rendus partout —
// Chrome sous Windows n'embarque aucune police qui les dessine et retombe
// sur les deux lettres de l'indicateur régional, si bien que « 🇺🇸 EN » se
// lit « US EN ». Dessinés, les trois s'affichent partout.
const DRAPEAU_QUEBEC = (() => {
  const lis = (x, y) => `<g transform="translate(${x},${y})" fill="#fff">`
    + '<path d="M0,-2.3 C1,-1.2 1,-0.2 0,0.6 C-1,-0.2 -1,-1.2 0,-2.3 Z"/>'
    + '<path d="M-2.1,-0.5 C-1.3,-1.3 -0.6,-0.9 -0.4,0.2 C-1.2,0.6 -1.9,0.3 -2.1,-0.5 Z"/>'
    + '<path d="M2.1,-0.5 C1.3,-1.3 0.6,-0.9 0.4,0.2 C1.2,0.6 1.9,0.3 2.1,-0.5 Z"/>'
    + '<rect x="-1.6" y="0.6" width="3.2" height="0.7"/>'
    + '<rect x="-0.5" y="1.3" width="1" height="1.4"/></g>';
  return '<svg viewBox="0 0 24 16" width="16" height="11" aria-hidden="true"'
    + ' style="display:block;border-radius:2px;flex-shrink:0;">'
    + '<rect width="24" height="16" fill="#095797"/>'
    + lis(5.6, 3.6) + lis(18.4, 3.6) + lis(5.6, 12.4) + lis(18.4, 12.4)
    + '<rect x="10.4" y="0" width="3.2" height="16" fill="#fff"/>'
    + '<rect x="0" y="6.4" width="24" height="3.2" fill="#fff"/>'
    + '</svg>';
})();

// Les 50 étoiles ne tiennent pas à 16 px de large : six points suffisent à
// signer le canton.
const DRAPEAU_USA = (() => {
  let bandes = '';
  for (let i = 0; i < 7; i++) {
    bandes += `<rect x="0" y="${(i * 2.4615).toFixed(2)}" width="24" height="1.2308" fill="#b22234"/>`;
  }
  let etoiles = '';
  for (const x of [3.2, 6.4]) {
    for (const y of [2.2, 4.4, 6.6]) {
      etoiles += `<circle cx="${x}" cy="${y}" r="0.55" fill="#fff"/>`;
    }
  }
  return '<svg viewBox="0 0 24 16" width="16" height="11" aria-hidden="true"'
    + ' style="display:block;border-radius:2px;flex-shrink:0;">'
    + '<rect width="24" height="16" fill="#fff"/>' + bandes
    + '<rect width="9.6" height="8.62" fill="#3c3b6e"/>' + etoiles
    + '</svg>';
})();

// Sans son emblème central, le drapeau mexicain est celui de l'Italie :
// mêmes trois bandes verte, blanche et rouge. La tache sombre au centre
// n'est pas lisible comme un aigle à cette taille, mais elle suffit à
// lever la confusion.
const DRAPEAU_MEXIQUE = '<svg viewBox="0 0 24 16" width="16" height="11"'
  + ' aria-hidden="true" style="display:block;border-radius:2px;flex-shrink:0;">'
  + '<rect width="8" height="16" fill="#006847"/>'
  + '<rect x="8" width="8" height="16" fill="#fff"/>'
  + '<rect x="16" width="8" height="16" fill="#ce1126"/>'
  + '<ellipse cx="12" cy="7.4" rx="1.7" ry="2" fill="#7a5230"/>'
  + '<path d="M9.9,9.4 A2.7,2.7 0 0 0 14.1,9.4" fill="none" stroke="#006847"'
  + ' stroke-width="0.8" stroke-linecap="round"/>'
  + '</svg>';

const DRAPEAUX = { fr: DRAPEAU_QUEBEC, en: DRAPEAU_USA, es: DRAPEAU_MEXIQUE };

// Le nom de chaque langue dans sa propre langue : un hispanophone reconnaît
// « Español » sans savoir que le site appelle sa langue « ES ».
const NOMS = { fr: 'Français', en: 'English', es: 'Español' };

const ARIA = {
  ouvrir: { fr: 'Choisir la langue', en: 'Choose language', es: 'Elegir idioma' },
  aller:  { fr: 'Afficher en français', en: 'Display in English', es: 'Mostrar en español' },
};

// Sélecteur de langue : un menu déroulant, liens vers l'URL équivalente.
//
// Bâti sur <details> plutôt que sur du JavaScript. Le site est statique et
// n'a pas de script commun à toutes les pages ; <details> ouvre et ferme
// tout seul, se pilote au clavier sans qu'on écrive quoi que ce soit, et
// survit à un JavaScript désactivé. Le menu ne se referme pas au clic
// ailleurs — mais chacune de ses entrées est un lien qui change de page, et
// la question ne se pose donc jamais.
//
// Ajouter une langue, c'est l'ajouter à LANGS, HREFLANG, NOMS, DRAPEAUX et
// aux deux libellés d'ARIA. Le menu suit tout seul.
function langSwitcher(route, lang) {
  const items = LANGS.map((l) => {
    const url = (l === 'fr' ? '' : '/' + l) + '/' + route;
    const active = l === lang ? ' active' : '';
    return `<a class="lang-item${active}" href="${url}" lang="${l}" hreflang="${HREFLANG[l]}" aria-label="${ARIA.aller[l]}">${DRAPEAUX[l]}<span>${NOMS[l]}</span></a>`;
  }).join('\n            ');
  return `<details class="lang-switch">
          <summary class="lang-btn" aria-label="${ARIA.ouvrir[lang]}">${DRAPEAUX[lang]}<span>${lang.toUpperCase()}</span><span class="lang-caret">&#9662;</span></summary>
          <div class="lang-menu">
            ${items}
          </div>
        </details>`;
}

function headLinks(route, lang) {
  const urlFor = (l) => SITE + (l === 'fr' ? '' : '/' + l) + '/' + route;
  return [
    `<link rel="canonical" href="${urlFor(lang)}" />`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${urlFor(l)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${urlFor('fr')}" />`,
  ].map((l) => '  ' + l).join('\n');
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildPage(page, lang) {
  let html = fs.readFileSync(page.src, 'utf-8');

  html = extractLang(html, lang);
  html = applyAlts(html, lang);
  html = absolutizeAssets(html);
  html = rewriteLinks(html, lang);

  // <html lang="…">
  html = html.replace(/<html lang="[a-z-]*">/i, `<html lang="${lang}">`);

  // titre + meta description localisés
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(page.title[lang]).replace(/&quot;/g, '"')}</title>`);
  const desc = `<meta name="description" content="${esc(page.desc[lang])}" />`;
  if (/<meta name="description"[^>]*>/i.test(html)) {
    html = html.replace(/<meta name="description"[^>]*>/i, desc);
  } else {
    html = html.replace(/<\/title>/i, `</title>\n  ${desc}`);
  }

  // canonical + hreflang juste après la meta description
  html = html.replace(desc, desc + '\n' + headLinks(page.route, lang));

  // sélecteur de langue par URL
  html = html.replace(/<div class="lang-switch">[\s\S]*?<\/div>/, langSwitcher(page.route, lang));

  return html;
}

function writeOut(route, lang, html) {
  const dir = path.join(lang === 'fr' ? '.' : lang, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return path.join(dir, 'index.html');
}

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const loc = SITE + (lang === 'fr' ? '' : '/' + lang) + '/' + page.route;
      const alts = LANGS.map((l) =>
        `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${SITE + (l === 'fr' ? '' : '/' + l) + '/' + page.route}"/>`
      ).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${page.route}"/>`;
      urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n${alts}\n  </url>`);
    }
  }
  // pages hors build (FR seulement)
  urls.push(`  <url>\n    <loc>${SITE}/postuler/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

function main() {
  process.chdir(__dirname);
  const written = [];
  for (const page of PAGES) {
    for (const lang of LANGS) {
      written.push(writeOut(page.route, lang, buildPage(page, lang)));
    }
  }
  fs.writeFileSync('sitemap.xml', buildSitemap());
  fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  written.push('sitemap.xml', 'robots.txt');
  console.log('Généré :\n  ' + written.join('\n  '));
}

main();
