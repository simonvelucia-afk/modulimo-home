# Génération du PDF de l'étude

Produit `docs/immotique-pointe-est.pdf` à partir de `docs/immotique-pointe-est.md`,
avec en-tête Modulimo (logo) et pagination.

```bash
node docs/pdf/build-pdf.mjs
```

Prérequis : Node ≥ 18 et un Chromium. Le script cherche successivement
`$CHROME_PATH`, le Chromium de Playwright (`/opt/pw-browsers/…`), puis
`chromium` / `google-chrome` dans le `PATH`.

- `md2html.py` — convertisseur Markdown → HTML (sans dépendance).
- `make-html.py` — assemble la couverture, les styles d'impression et le corps.
- `build-pdf.mjs` — pilote Chromium (protocole DevTools) et écrit le PDF :
  en-tête avec logo sur chaque page, pied de page numéroté, format Lettre.

Les polices utilisées sont celles du système (Charter / Liberation Sans) :
aucune ressource n'est téléchargée à la génération.
