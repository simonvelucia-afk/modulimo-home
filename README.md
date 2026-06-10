modulimo-home
Site corporatif de MODULIMO — hébergé sur GitHub Pages.

## Langues (FR / EN / ES)

Chaque langue a ses propres URLs :

| Langue | URLs |
|---|---|
| Français (principale) | `/`, `/mobilite/`, `/securite/`, `/projets/`, `/projets/pointe-est/`, `/produits/` |
| Anglais | `/en/`, `/en/mobilite/`, … |
| Espagnol | `/es/`, `/es/mobilite/`, … |

Les pages **sources** vivent dans `src/` et contiennent les trois langues
via `<span data-lang="fr|en|es">…</span>` (éléments adjacents = une « grappe »,
le build choisit la bonne langue ; si une grappe n'a pas de version EN/ES,
le français est utilisé en repli). Les attributs `alt` se traduisent avec
`data-alt-en` / `data-alt-es` sur l'image.

### Build

```bash
node build.js
```

Sans dépendance (Node ≥ 16). Génère :

- les pages FR à la racine et les pages `/en/`, `/es/` ;
- `lang` correct sur `<html>`, `<title>` et meta description localisés ;
- `canonical` + `hreflang` croisés (fr-CA, en, es, x-default) ;
- sélecteur de langue du header pointant vers l'URL équivalente ;
- `sitemap.xml` (avec alternates hreflang) et `robots.txt`.

⚠️ **Ne modifiez jamais les pages générées** (racine, `en/`, `es/`) : éditez
`src/**/index.html` puis relancez `node build.js` et committez le tout
(les pages générées doivent être committées — GitHub Pages sert la branche
`main` telle quelle, sans étape de build).

Titres et meta descriptions par langue : voir le tableau `PAGES` en tête
de `build.js`.

## Structure

```
/
├── build.js                ← générateur FR/EN/ES (node build.js)
├── src/                    ← pages SOURCES trilingues (à éditer)
│   ├── index.html
│   ├── mobilite/index.html
│   ├── securite/index.html
│   ├── projets/index.html
│   ├── projets/pointe-est/index.html
│   └── produits/index.html
├── index.html              ← GÉNÉRÉ (français)
├── mobilite/ securite/ projets/ produits/   ← GÉNÉRÉS (français)
├── en/  es/                ← GÉNÉRÉS (anglais, espagnol)
├── postuler/               ← formulaire de candidature (hors build, FR)
├── js/                     ← scripts partagés (lead-form, analytics, …)
├── images/
├── supabase/               ← backend formulaire de leads (référence)
├── sitemap.xml  robots.txt ← GÉNÉRÉS
├── CNAME                   ← www.modulimo.com
└── README.md
```

## Formulaire de leads Pointe Est

Le formulaire (accueil, `/projets/`, `/projets/pointe-est/`) envoie vers
l'Edge Function Supabase `submit-lead-pointe-est` (projet Central).
Voir `supabase/README.md` pour le déploiement. Le client est `js/lead-form.js`
(URL de la fonction en constante en tête de fichier).

## Déploiement

GitHub Pages → branch `main` → dossier racine `/`

DNS GoDaddy

Enregistrements `A` (racine `@`) pointant vers GitHub Pages :
`185.199.108.153`
`185.199.109.153`
`185.199.110.153`
`185.199.111.153`

Enregistrement `CNAME` pour le sous-domaine `www` :
Nom : `www`
Valeur : `simonvelucia-afk.github.io`
