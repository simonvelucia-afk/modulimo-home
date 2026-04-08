modulimo-home
Site corporatif de MODULIMO — hébergé sur GitHub Pages.
Structure
```
/
├── index.html              ← Page d'accueil
├── mobilite/
│   └── index.html
├── securite/
│   └── index.html
├── projets/
│   └── index.html
├── produits/
│   └── index.html
├── images/
│   ├── hero_home.png
│   ├── ResidentsForme.png
│   ├── Menace guerre.webp
│   ├── Plan_assault.webp
│   ├── Menace nucléaire.webp
│   ├── Plan_radiation.webp
│   └── (+ autres)
├── CNAME                   ← modulimo.com
└── README.md
```
Déploiement
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
