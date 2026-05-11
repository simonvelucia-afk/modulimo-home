# Modulimo — Système de candidatures locataires

Système complet pour recueillir et évaluer les candidatures de futurs locataires Modulimo.

## Fichiers

| Fichier | Rôle | Où le déployer |
|---|---|---|
| `01_formulaire_candidat.html` | Formulaire public soumis par les candidats | Site public (cohabitat.ca/postuler ou modulimo.com) |
| `02_supabase_schema.sql` | Schéma SQL : table, RLS, fonctions Loi 25 | Supabase SQL Editor (modulimo-central recommandé) |
| `03_edge_function_submit-candidature.ts` | Calcul du score côté serveur + insertion | Supabase Edge Functions |
| `04_admin_panel.html` | Tableau de bord admin (auth requise) | Modulimo Admin (modulimo-admin) |

## Architecture du score (caché côté candidat)

Le score est calculé **uniquement côté serveur** dans l'Edge Function. Le candidat ne le voit jamais — ni via le HTML, ni via la réponse API. Seuls les administrateurs Modulimo authentifiés y ont accès via `04_admin_panel.html`.

### Total : 100 points

| Critère | Pts | Logique |
|---|---|---|
| Capacité financière | 22 | Ratio loyer cible / revenu mensuel : ≤25% = 22, ≤30% = 19, ≤35% = 14, ≤40% = 8, >40% = 2 |
| Stabilité d'emploi | 10 | Type d'emploi (max 6) + ancienneté (max 4) |
| Stabilité résidentielle | 8 | Mois à l'adresse actuelle |
| Références | 6 | Propriétaire actuel + 2 références personnelles |
| Déclarations | 10 | -2 TAL, -4 expulsion, -2 faillite, -4 poursuite |
| Consentements Loi 25 | 6 | Crédit (2) + employeur (1) + propriétaire (2) + références (1) |
| Engagement CoHabitat | 18 | Aisance numérique (3) + paiement via app (3) + comm (2) + services (10) |
| Valeurs Modulimo | 15 | Environnement (5) + Sécurité (5) + Innovation (5) |
| Complétude | 5 | Ratio des champs critiques remplis |

### Catégories
- **Excellent** : ≥ 80
- **Bon** : 65–79
- **À évaluer** : 50–64
- **À risque** : < 50

Un drapeau rouge (expulsion antérieure, poursuite en cours) déclasse automatiquement la candidature d'une catégorie.

## Déploiement Supabase

### Étape 1 — Schéma
```bash
# Dans Supabase SQL Editor, copier/coller le contenu de 02_supabase_schema.sql
# Vérifier que la table user_roles existe et contient les rôles 'admin' et 'gestionnaire'
```

### Étape 2 — Edge Function
```bash
mkdir -p supabase/functions/submit-candidature
cp 03_edge_function_submit-candidature.ts supabase/functions/submit-candidature/index.ts

supabase functions deploy submit-candidature --no-verify-jwt
# --no-verify-jwt : permet aux candidats anonymes de soumettre
```

### Étape 3 — Variables d'environnement de l'Edge Function
Aucune à configurer manuellement — `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont auto-injectées.

### Étape 4 — Configurer les HTML
Dans `01_formulaire_candidat.html` et `04_admin_panel.html`, remplacer :
```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Ou injecter dynamiquement via `<script>window.MODULIMO_SUPABASE_URL = '...'</script>` avant le HTML, ce qui permet de garder les fichiers identiques entre environnements.

### Étape 5 — Job nightly Loi 25
Planifier `purge_expired_candidatures()` via pg_cron ou un cron externe :
```sql
select cron.schedule(
  'purge-candidatures-loi25',
  '0 3 * * *',  -- 3h du matin chaque nuit
  $$select public.purge_expired_candidatures()$$
);
```

## Conformité Loi 25 — Points clés

1. **Finalité claire** : énoncée dans le formulaire et le consentement
2. **Minimisation** : aucun NAS, aucune photo de pièce d'identité, aucun relevé bancaire
3. **Consentement explicite** : cases à cocher distinctes pour crédit / employeur / propriétaire / références
4. **Décision automatisée** : le candidat est informé qu'une analyse assistée est faite, mais que la décision finale est humaine (article 12.1)
5. **Conservation** : 12 mois maximum après refus, automatiquement purgé via cron
6. **Destruction sur demande** : fonction `destroy_candidature_pii()` accessible depuis le panneau admin
7. **Hash IP** : l'adresse IP n'est jamais stockée en clair, seulement son SHA-256
8. **RLS strict** : seul le rôle `admin` ou `gestionnaire` peut lire les candidatures

## Intégration CoHabitat

Le formulaire peut être intégré à CoHabitat de plusieurs façons :

**Option A — Iframe sur la page publique d'un immeuble**
```html
<iframe src="https://candidatures.modulimo.com/?building=<UUID>"
        style="width:100%;border:none;height:2400px"></iframe>
```

**Option B — Page autonome avec deep-link**
```
https://candidatures.modulimo.com/postuler/<building_id>
```

Dans les deux cas, le `building_id` est passé via `window.MODULIMO_BUILDING_ID` pour pré-associer la candidature à un immeuble.

## Évolutions suggérées

- Notification courriel automatique à chaque soumission (Resend, déjà intégré dans modulimo-central)
- Webhook vers Slack #candidatures pour alerte temps réel
- Export CSV des candidatures pour rapports trimestriels
- Page candidate self-service pour consulter le statut (sans le score)
- Intégration Equifax Soft Inquiry API pour automatiser la vérif de crédit après consentement
