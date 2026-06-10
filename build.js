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
      fr: "Pointe Est — premier projet immobilier Modulimo à Pointe-aux-Trembles, Montréal. 6 logements multigénérationnels, bois massif CLT, démarche PPCMOI en cours.",
      en: "Pointe Est — first Modulimo real estate project in Pointe-aux-Trembles, Montreal. 6 multigenerational homes, CLT mass timber, PPCMOI process underway.",
      es: "Pointe Est — primer proyecto inmobiliario Modulimo en Pointe-aux-Trembles, Montreal. 6 viviendas multigeneracionales, madera maciza CLT, trámite PPCMOI en curso.",
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
const ROUTE_SLUGS = ['mobilite', 'securite', 'projets/pointe-est', 'projets', 'produits'];

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

// Sélecteur de langue : liens vers l'URL équivalente.
function langSwitcher(route, lang) {
  const links = LANGS.map((l) => {
    const url = (l === 'fr' ? '' : '/' + l) + '/' + route;
    const active = l === lang ? ' active' : '';
    const labels = { fr: 'Afficher en français', en: 'Display in English', es: 'Mostrar en español' };
    return `<a class="lang-btn${active}" href="${url}" lang="${l}" hreflang="${HREFLANG[l]}" aria-label="${labels[l]}">${l.toUpperCase()}</a>`;
  }).join('\n          ');
  return `<div class="lang-switch">\n          ${links}\n        </div>`;
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
