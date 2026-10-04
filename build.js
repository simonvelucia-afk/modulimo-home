#!/usr/bin/env node
// ============================================================
// MODULIMO — build.js : génération des pages FR / EN / ES
// ============================================================
// Les pages sources (src/**/index.html) contiennent les trois
// langues via <span data-lang="fr|en|es|zh"> (et quelques <div>).
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
const crypto = require('crypto');

const SITE = 'https://www.modulimo.com';
const LANGS = ['fr', 'en', 'es', 'zh'];
const HREFLANG = { fr: 'fr-CA', en: 'en', es: 'es', zh: 'zh-Hans' };
// Alternance pour les expressions regulieres ci-dessous : construite a
// partir de LANGS, pour qu'une langue ajoutee n'oblige pas a retrouver
// trois motifs eparpilles dans le fichier.
const ALT = LANGS.join('|');
const ALT_TRAD = LANGS.filter((l) => l !== 'fr').join('|');

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
      zh: 'MODULIMO — 生态住宅与出行',
    },
    desc: {
      fr: "MODULIMO structure un écosystème résidentiel intégré combinant logement familial, mobilité, services et logiciel. Projet Pointe Est à Montréal.",
      en: "MODULIMO builds an integrated residential ecosystem combining family housing, mobility, services and software. Pointe Est project in Montreal.",
      es: "MODULIMO estructura un ecosistema residencial integrado que combina vivienda familiar, movilidad, servicios y software. Proyecto Pointe Est en Montreal.",
      zh: "MODULIMO 构建一体化住宅生态系统，融合家庭住宅、出行、服务与软件。蒙特利尔 Pointe Est 项目。",
    },
  },
  {
    src: 'src/mobilite/index.html', route: 'mobilite/',
    title: {
      fr: 'Mobilité inter-modale, TOD et MaaS — Modulimo',
      en: 'Inter-modal mobility, TOD and MaaS — Modulimo',
      es: 'Movilidad intermodal, TOD y MaaS — Modulimo',
      zh: '多式联运出行、TOD 与 MaaS — Modulimo',
    },
    desc: {
      fr: "Mobilité partagée, vélomobile et accès direct au transport en commun, réunis dans une seule offre (MaaS) via CoHabitat — la mobilité fait partie du milieu de vie Modulimo.",
      en: "Shared mobility, velomobile and direct access to public transit, brought together in a single offer (MaaS) through CoHabitat — mobility is part of the Modulimo living environment.",
      es: "Movilidad compartida, velomóvil y acceso directo al transporte público, reunidos en una sola oferta (MaaS) mediante CoHabitat — la movilidad forma parte del entorno de vida Modulimo.",
      zh: "共享出行、卧式篷车与公共交通直达，通过 CoHabitat 汇合为同一项服务（MaaS）— 出行是 Modulimo 生活环境的组成部分。",
    },
  },
  {
    src: 'src/securite/index.html', route: 'securite/',
    title: {
      fr: 'Sécurité — Modulimo',
      en: 'Security — Modulimo',
      es: 'Seguridad — Modulimo',
      zh: '安全 — Modulimo',
    },
    desc: {
      fr: "La sécurité des résidents au cœur du modèle Modulimo — prévention, surveillance et résilience du milieu de vie.",
      en: "Resident safety at the core of the Modulimo model — prevention, monitoring and resilience of the living environment.",
      es: "La seguridad de los residentes en el centro del modelo Modulimo — prevención, vigilancia y resiliencia del entorno de vida.",
      zh: "住户安全是 Modulimo 模式的核心 — 预防、监控与生活环境的韧性。",
    },
  },
  {
    src: 'src/projets/index.html', route: 'projets/',
    title: {
      fr: 'Projets — MODULIMO',
      en: 'Projects — MODULIMO',
      es: 'Proyectos — MODULIMO',
      zh: '项目 — MODULIMO',
    },
    desc: {
      fr: "Les projets immobiliers Modulimo — Pointe Est et futurs déploiements du modèle résidentiel intégré.",
      en: "Modulimo real estate projects — Pointe Est and future deployments of the integrated residential model.",
      es: "Los proyectos inmobiliarios Modulimo — Pointe Est y futuros despliegues del modelo residencial integrado.",
      zh: "Modulimo 的房地产项目 — Pointe Est 及一体化住宅模式的后续部署。",
    },
  },
  {
    src: 'src/projets/pointe-est/index.html', route: 'projets/pointe-est/',
    title: {
      fr: 'Pointe Est — Projets MODULIMO',
      en: 'Pointe Est — MODULIMO Projects',
      es: 'Pointe Est — Proyectos MODULIMO',
      zh: 'Pointe Est — MODULIMO 项目',
    },
    desc: {
      fr: "Pointe Est — premier projet immobilier Modulimo à Pointe-aux-Trembles, Montréal. 6 logements multigénérationnels, construction industrialisée performante, démarche PPCMOI en cours.",
      en: "Pointe Est — first Modulimo real estate project in Pointe-aux-Trembles, Montreal. 6 multigenerational homes, high-performance industrialized construction, PPCMOI process underway.",
      es: "Pointe Est — primer proyecto inmobiliario Modulimo en Pointe-aux-Trembles, Montreal. 6 viviendas multigeneracionales, construcción industrializada de alto rendimiento, trámite PPCMOI en curso.",
      zh: "Pointe Est — Modulimo 在蒙特利尔 Pointe-aux-Trembles 的首个房地产项目。6 套多代同堂住宅，高性能工业化建造，PPCMOI 审批程序进行中。",
    },
  },
  {
    src: 'src/confidentialite/index.html', route: 'confidentialite/',
    title: {
      fr: 'Politique de confidentialité — Modulimo',
      en: 'Privacy Policy — Modulimo',
      es: 'Política de privacidad — Modulimo',
      zh: '隐私政策 — Modulimo',
    },
    desc: {
      fr: "Politique de confidentialité de Modulimo inc. — renseignements personnels recueillis, finalités, témoins, droits d'accès et de rectification (Loi 25).",
      en: "Modulimo inc. privacy policy — personal information collected, purposes, cookies, access and rectification rights (Quebec Law 25).",
      es: "Política de privacidad de Modulimo inc. — información personal recopilada, finalidades, cookies, derechos de acceso y rectificación (Ley 25 de Quebec).",
      zh: "Modulimo inc. 隐私政策 — 收集的个人信息、使用目的、Cookie、查阅与更正权（魁北克第 25 号法案）。",
    },
  },
  {
    src: 'src/produits/index.html', route: 'produits/', protege: true,
    title: {
      fr: 'MODULIMO | Produits',
      en: 'MODULIMO | Products',
      es: 'MODULIMO | Productos',
      zh: 'MODULIMO | 产品',
    },
    desc: {
      fr: "MODULIMO structure un écosystème intégré combinant habitation familiale, mobilité, services, infrastructure logicielle, construction industrialisée et innovation avancée.",
      en: "MODULIMO builds an integrated ecosystem combining family housing, mobility, services, software infrastructure, industrialized construction and advanced innovation.",
      es: "MODULIMO estructura un ecosistema integrado que combina vivienda familiar, movilidad, servicios, infraestructura de software, construcción industrializada e innovación avanzada.",
      zh: "MODULIMO 构建一体化生态系统，融合家庭住宅、出行、服务、软件基础设施、工业化建造与前沿创新。",
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
const LANG_OPEN_RE = new RegExp('^<(span|div)((?:[^>"]|"[^"]*")*?)\\sdata-lang="(' + ALT + ')"((?:[^>"]|"[^"]*")*?)>');

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
    const idx = html.slice(pos).search(new RegExp('<(?:span|div)(?:[^>"]|"[^"]*")*?\\sdata-lang="(?:' + ALT + ')"'));
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

// alt multilingues : data-alt-en / data-alt-es / data-alt-zh remplacent alt
// selon la langue cible, puis les attributs data-alt-* sont retirés partout.
//
// Le traitement se fait balise par balise. L'ancien motif partait de alt="…"
// et s'arrêtait au premier data-alt-* rencontré : les sources listant en, es
// puis zh, seul l'anglais était jamais appliqué, et les pages espagnoles
// servaient donc l'alternative française.
function applyAlts(html, lang) {
  if (lang !== 'fr') {
    html = html.replace(/<img\s(?:[^<>"]|"[^"]*")*?>/g, (balise) => {
      const m = new RegExp('\\sdata-alt-' + lang + '="([^"]*)"').exec(balise);
      if (!m) return balise;
      return balise.replace(/\salt="[^"]*"/, ' alt="' + m[1] + '"');
    });
  }
  return html.replace(new RegExp('\\sdata-alt-(?:' + ALT_TRAD + ')="[^"]*"', 'g'), '');
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

// La grande étoile est dessinée, les quatre petites sont des points : à
// 16 px de large, une étoile à cinq branches de moins d'un pixel de rayon
// n'est plus qu'une tache, alors que leur arc reste reconnaissable.
const DRAPEAU_CHINE = (() => {
  const etoile = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rayon = (i % 2) ? r * 0.382 : r;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((cx + rayon * Math.cos(a)).toFixed(2) + ',' + (cy + rayon * Math.sin(a)).toFixed(2));
    }
    return `<polygon points="${pts.join(' ')}" fill="#ffde00"/>`;
  };
  const petites = [[8, 1.6], [9.6, 3.2], [9.6, 5.6], [8, 7.2]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.6" fill="#ffde00"/>`).join('');
  return '<svg viewBox="0 0 24 16" width="16" height="11" aria-hidden="true"'
    + ' style="display:block;border-radius:2px;flex-shrink:0;">'
    + '<rect width="24" height="16" fill="#de2910"/>'
    + etoile(4, 4, 2.4) + petites
    + '</svg>';
})();

const DRAPEAUX = { fr: DRAPEAU_QUEBEC, en: DRAPEAU_USA, es: DRAPEAU_MEXIQUE, zh: DRAPEAU_CHINE };

// Le nom de chaque langue dans sa propre langue : un hispanophone reconnaît
// « Español » sans savoir que le site appelle sa langue « ES ».
const NOMS = { fr: 'Français', en: 'English', es: 'Español', zh: '中文' };

const ARIA = {
  ouvrir: { fr: 'Choisir la langue', en: 'Choose language', es: 'Elegir idioma', zh: '选择语言' },
  aller:  { fr: 'Afficher en français', en: 'Display in English', es: 'Mostrar en español', zh: '显示中文' },
};

// Avis de traduction, ajouté au pied des versions traduites seulement : la
// version française fait foi, les autres sont fournies à titre informatif.
// Rien à ajouter sur la version française, qui est l'originale.
const AVIS = {
  en: 'This page is a translation provided for information only. It carries no promise, commitment or guarantee, and may be updated without notice. Should any discrepancy arise, the French version prevails in all respects.',
  es: 'Esta página es una traducción facilitada únicamente a título informativo. No constituye promesa, compromiso ni garantía alguna, y puede modificarse sin previo aviso. En caso de discrepancia, la versión francesa prevalece en todos sus términos.',
  zh: '本页面为仅供参考的译文，不构成任何承诺、约定或保证，并可能随时更新，恕不另行通知。如与法文版本有任何出入，一概以法文版本为准。',
};

function avisTraduction(lang) {
  if (!AVIS[lang]) return '';
  return `<p class="avis-traduction" lang="${lang}">${AVIS[lang]}</p>`;
}

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
  //
  // La balise porte parfois d'autres attributs — src/produits/index.html a
  // gardé un class="lang-fr" de son site d'origine. L'ancien motif exigeait le
  // « > » juste après lang, si bien que cette page se déclarait en français
  // dans toutes ses versions traduites. La classe suit la langue elle aussi,
  // pour ne pas laisser deux indications contradictoires sur la même balise.
  html = html.replace(/<html([^>]*?)\slang="[a-zA-Z-]*"([^>]*)>/i,
    (m, avant, apres) => `<html${avant} lang="${lang}"${apres}>`);
  html = html.replace(/(<html[^>]*\sclass="[^"]*?)lang-[a-z-]+/i, `$1lang-${lang}`);

  // Avis de traduction, avant la fermeture du pied de page. Les trois pieds
  // de page du site n'ont pas la même forme, mais tous ferment sur </footer>.
  const avis = avisTraduction(lang);
  if (avis) html = html.replace('</footer>', avis + '\n  </footer>');

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

// ------------------------------------------------------------
// Pages protégées par NIP (protege: true dans PAGES)
// ------------------------------------------------------------
// GitHub Pages ne sert que des fichiers fixes : aucun serveur ne peut
// vérifier un mot de passe. La page générée est donc chiffrée en entier
// (AES-256-GCM, clé dérivée du NIP par PBKDF2-SHA256) et remplacée par un
// écran qui demande le NIP, déchiffre dans le navigateur et réécrit le
// document — les scripts de la page (formulaire, lightbox…) s'exécutent
// alors normalement.
//
// Le NIP n'est jamais écrit dans le dépôt, qui est public : il est fourni
// au build par la variable d'environnement MODULIMO_PIN. Sans elle, les
// pages protégées ne sont pas régénérées (les versions chiffrées déjà
// committées restent en place) — jamais publiées en clair.
//
// Limite à connaître : les sources src/produits/ restent lisibles sur
// GitHub. Ce chiffrement protège le site, pas le dépôt.
const PBKDF2_ITER = 600000;

function chiffrer(html, cle, sel) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', cle, iv);
  const corps = Buffer.concat([c.update(html, 'utf-8'), c.final(), c.getAuthTag()]);
  return { sel: sel.toString('base64'), iv: iv.toString('base64'), data: corps.toString('base64'), iter: PBKDF2_ITER };
}

const PORTE = {
  titre:  { fr: 'Accès réservé', en: 'Restricted access', es: 'Acceso reservado', zh: '限制访问' },
  texte:  { fr: 'Cette section est réservée. Entrez le NIP à 10 chiffres qui vous a été remis.', en: 'This section is restricted. Enter the 10-digit PIN you were given.', es: 'Esta sección es reservada. Introduzca el PIN de 10 dígitos que se le entregó.', zh: '此栏目仅限授权访问。请输入您获得的 10 位数字 PIN 码。' },
  champ:  { fr: 'NIP (10 chiffres)', en: 'PIN (10 digits)', es: 'PIN (10 dígitos)', zh: 'PIN 码（10 位数字）' },
  bouton: { fr: 'Entrer', en: 'Enter', es: 'Entrar', zh: '进入' },
  attente:{ fr: 'Vérification…', en: 'Checking…', es: 'Verificando…', zh: '验证中…' },
  erreur: { fr: 'NIP incorrect.', en: 'Incorrect PIN.', es: 'PIN incorrecto.', zh: 'PIN 码错误。' },
  format: { fr: 'Le NIP compte exactement 10 chiffres.', en: 'The PIN is exactly 10 digits.', es: 'El PIN tiene exactamente 10 dígitos.', zh: 'PIN 码必须为 10 位数字。' },
  retour: { fr: '← Retour à l\'accueil', en: '← Back to home', es: '← Volver al inicio', zh: '← 返回首页' },
};

function pagePorte(page, lang, paquet) {
  const t = (k) => PORTE[k][lang];
  const accueil = lang === 'fr' ? '/' : '/' + lang + '/';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${esc(t('titre'))} — Modulimo</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root { --off:#f7f5f0; --dark:#1a1a1a; --mid:#4a4a4a; --green:#2d7a4f; --border:#e0ddd8; --err:#b3261e; }
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { min-height:100vh; background:var(--off); color:var(--dark); font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; padding:24px 16px; }
    .porte { width:100%; max-width:420px; background:#fff; border:1px solid var(--border); padding:2.5rem 2rem; }
    .porte img { height:34px; width:auto; margin-bottom:2rem; display:block; }
    .tag { font-size:.68rem; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:var(--green); margin-bottom:.75rem; }
    h1 { font-family:'Syne',sans-serif; font-weight:800; font-size:1.7rem; line-height:1.15; margin-bottom:.75rem; }
    p { color:var(--mid); font-size:.95rem; line-height:1.6; margin-bottom:1.5rem; }
    label { display:block; font-size:.75rem; font-weight:500; letter-spacing:.04em; text-transform:uppercase; color:var(--mid); margin-bottom:.4rem; }
    input { width:100%; font:inherit; font-size:1.35rem; letter-spacing:.25em; padding:.7rem .8rem; border:1.5px solid var(--border); background:#fff; color:var(--dark); outline:none; }
    input:focus { border-color:var(--green); }
    button { margin-top:1rem; width:100%; font:inherit; font-weight:600; font-size:.95rem; padding:.85rem; border:none; background:var(--green); color:#fff; cursor:pointer; }
    button:disabled { opacity:.6; cursor:wait; }
    .msg { min-height:1.4em; margin-top:.75rem; font-size:.85rem; color:var(--err); }
    .retour { display:inline-block; margin-top:1.5rem; font-size:.85rem; color:var(--green); text-decoration:none; }
  </style>
</head>
<body>
  <main class="porte">
    <a href="${accueil}"><img src="/images/ModulimoLogoSobre.png" alt="Modulimo" /></a>
    <div class="tag">${esc(page.title[lang].split(' — ')[0])}</div>
    <h1>${esc(t('titre'))}</h1>
    <p>${esc(t('texte'))}</p>
    <form id="porte" autocomplete="off" novalidate>
      <label for="nip">${esc(t('champ'))}</label>
      <input id="nip" type="password" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" autocomplete="off" required autofocus />
      <button type="submit" id="go">${esc(t('bouton'))}</button>
      <div class="msg" id="msg" role="alert" aria-live="polite"></div>
    </form>
    <a class="retour" href="${accueil}">${esc(t('retour'))}</a>
  </main>
  <script>
  (function () {
    var P = ${JSON.stringify(paquet)};
    var CLE_SESSION = 'modulimo-nip-' + P.sel;
    var b64 = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
    var hex = function (u) { return Array.prototype.map.call(u, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); };
    var dehex = function (h) { return new Uint8Array(h.match(/../g).map(function (x) { return parseInt(x, 16); })); };

    function deriver(nip) {
      return crypto.subtle.importKey('raw', new TextEncoder().encode(nip), 'PBKDF2', false, ['deriveBits'])
        .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(P.sel), iterations: P.iter }, k, 256); })
        .then(function (bits) { return new Uint8Array(bits); });
    }
    function ouvrir(brute) {
      return crypto.subtle.importKey('raw', brute, 'AES-GCM', false, ['decrypt'])
        .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(P.iv) }, k, b64(P.data)); })
        .then(function (buf) {
          try { sessionStorage.setItem(CLE_SESSION, hex(brute)); } catch (e) {}
          var html = new TextDecoder().decode(buf);
          document.open(); document.write(html); document.close();
        });
    }

    // Déjà déverrouillé dans cet onglet (même build) : pas de nouvelle saisie.
    // On attend la fin du chargement : un document.open() lancé pendant que
    // la page se charge encore est ignoré par le navigateur.
    var memo = null;
    try { memo = sessionStorage.getItem(CLE_SESSION); } catch (e) {}
    if (memo) {
      document.documentElement.style.visibility = 'hidden';
      var auto = function () {
        ouvrir(dehex(memo)).catch(function () {
          try { sessionStorage.removeItem(CLE_SESSION); } catch (e) {}
          document.documentElement.style.visibility = '';
        });
      };
      if (document.readyState === 'complete') auto(); else window.addEventListener('load', auto);
    }

    var f = document.getElementById('porte'), champ = document.getElementById('nip'),
        go = document.getElementById('go'), msg = document.getElementById('msg');
    champ.addEventListener('input', function () { champ.value = champ.value.replace(/\\D/g, '').slice(0, 10); msg.textContent = ''; });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nip = champ.value;
      if (!/^[0-9]{10}$/.test(nip)) { msg.textContent = ${JSON.stringify(t('format'))}; return; }
      go.disabled = true; go.textContent = ${JSON.stringify(t('attente'))};
      deriver(nip).then(ouvrir).catch(function () {
        go.disabled = false; go.textContent = ${JSON.stringify(t('bouton'))};
        msg.textContent = ${JSON.stringify(t('erreur'))}; champ.select();
      });
    });
  })();
  </script>
</body>
</html>
`;
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
    if (page.protege) continue; // derrière un NIP : rien à indexer
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
  const nip = process.env.MODULIMO_PIN;
  if (nip !== undefined && !/^[0-9]{10}$/.test(nip)) {
    throw new Error('MODULIMO_PIN doit compter exactement 10 chiffres.');
  }
  // Un seul sel par build : la clé dérivée sert à toutes les pages
  // protégées, on ne ressaisit pas le NIP en passant de l'une à l'autre.
  const sel = crypto.randomBytes(16);
  const cle = nip ? crypto.pbkdf2Sync(nip, sel, PBKDF2_ITER, 32, 'sha256') : null;
  const sautees = [];
  for (const page of PAGES) {
    for (const lang of LANGS) {
      if (page.protege) {
        if (!cle) { sautees.push(page.route); break; }
        const html = buildPage(page, lang);
        written.push(writeOut(page.route, lang, pagePorte(page, lang, chiffrer(html, cle, sel))));
      } else {
        written.push(writeOut(page.route, lang, buildPage(page, lang)));
      }
    }
  }
  if (sautees.length) {
    console.warn('⚠️  MODULIMO_PIN absent : pages protégées NON régénérées (' + sautees.join(', ')
      + ').\n   Relancez avec  MODULIMO_PIN=xxxxxxxxxx node build.js  si elles ont changé.');
  }
  fs.writeFileSync('sitemap.xml', buildSitemap());
  fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  written.push('sitemap.xml', 'robots.txt');
  console.log('Généré :\n  ' + written.join('\n  '));
}

main();
