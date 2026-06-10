# Supabase — formulaire de contact Pointe Est

Backend du formulaire « Informez-vous » (accueil et `/projets/pointe-est`).
Projet Supabase **Central** : `bpxscgrbxjscicpnheep`.

## Composants

| Fichier | Rôle |
|---|---|
| `leads_pointe_est.sql` | Table `public.leads_pointe_est` + RLS + fonction de destruction des PII (Loi 25) |
| `functions/submit-lead-pointe-est/index.ts` | Edge Function : valide le formulaire (honeypot, consentement), insère le lead, notifie par courriel via Resend |

## Déploiement

1. **Table** — exécuter `leads_pointe_est.sql` dans le SQL Editor du projet Central
   (idempotent, peut être rejoué).

2. **Edge Function** :

   ```bash
   supabase functions deploy submit-lead-pointe-est --project-ref bpxscgrbxjscicpnheep
   ```

   Ou via le dashboard : Edge Functions → New Function → `submit-lead-pointe-est`
   → coller `functions/submit-lead-pointe-est/index.ts` → Deploy.

3. **Secrets** — `RESEND_KEY` et `RESEND_FROM` sont déjà configurés côté Supabase
   (utilisés par `send-email`). Ne jamais les dupliquer dans ce repo. Optionnel :

   ```bash
   supabase secrets set LEADS_NOTIFY_TO='vous@exemple.com' --project-ref bpxscgrbxjscicpnheep
   ```

   Par défaut, les notifications vont à `contribution@modulimo.com`.

## Frontend

Le client est dans `js/lead-form.js` (racine du site). L'URL de la fonction est
une constante en haut du fichier (`FN_URL`) — facile à remplacer si la fonction
change de nom ou de projet. Le formulaire envoie :

```json
{
  "first_name": "…", "last_name": "…", "email": "…", "message": "…",
  "consent": true, "consent_text_version": "2026-06-v1",
  "website": "",            // honeypot — doit rester vide
  "locale": "fr", "source_page": "/", "user_agent": "…"
}
```

Réponses : `200 {ok:true, lead_id}` · `400 {error: missing_name | invalid_email | missing_consent}` · `500 {error: storage_error}`.

## Sécurité / Loi 25

- Aucune clé secrète dans ce repo (la clé anon publique est la seule utilisée côté client).
- Insertion uniquement via l'Edge Function (`service_role`) — aucune policy `INSERT` pour `anon`.
- Consentement explicite horodaté + version du texte affiché, IP hashée (SHA-256), jamais brute.
- Droit de retrait : `select public.destroy_lead_pointe_est_pii('<uuid>');`
