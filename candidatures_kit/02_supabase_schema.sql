-- ============================================================
-- MODULIMO — Table des candidatures locataires
-- Conforme Loi 25 (RGPD-like Québec)
-- ============================================================
-- À exécuter dans Supabase SQL Editor (modulimo-central de préférence)

-- 0. Prérequis — table des rôles utilisateurs
-- Référencée par les policies RLS §3 et la fonction §4.
-- Idempotente : si vous avez déjà cette table (ou un équivalent) dans un
-- autre module, vous pouvez retirer cette section. Le schéma minimal ici
-- (user_id, role) suffit aux besoins du kit candidatures.
create table if not exists public.user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

-- Chaque utilisateur peut lire SES propres rôles. C'est nécessaire pour
-- que les policies RLS de candidatures (§3b/3c/3d) puissent résoudre le
-- check `where ur.user_id = auth.uid()` côté authenticated.
drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read on public.user_roles
  for select
  using (user_id = auth.uid());

-- Grant Data API (cf. §7) — SELECT seulement ; la RLS limite aux propres rôles.
-- Aucun grant INSERT/UPDATE/DELETE à anon/authenticated : la gestion des
-- rôles doit passer par la service_role (SQL Editor, scripts admin, etc.).
grant select on public.user_roles to authenticated;

-- Pour seeder un administrateur :
--   insert into public.user_roles (user_id, role) values
--     ('<uuid de l''utilisateur Supabase Auth>', 'admin');

-- 1. Table principale
create table if not exists public.candidatures (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Référence à l'immeuble (optionnel — si formulaire intégré à un immeuble précis)
  -- FK ajoutée conditionnellement en §1b si public.buildings existe.
  building_id     uuid,

  -- Statut du dossier
  status          text not null default 'recu'
    check (status in ('recu', 'en_evaluation', 'accepte', 'refuse', 'retire', 'expire')),

  -- Données brutes du formulaire (JSON, pour flexibilité)
  form_data       jsonb not null,

  -- Champs dénormalisés pour recherche rapide (anonymisables)
  applicant_email text generated always as (form_data->>'email') stored,
  applicant_name  text generated always as (
    coalesce(form_data->>'first_name', '') || ' ' || coalesce(form_data->>'last_name', '')
  ) stored,
  target_rent     numeric generated always as (
    nullif(form_data->>'target_rent', '')::numeric
  ) stored,
  annual_income   numeric generated always as (
    coalesce(nullif(form_data->>'annual_income', '')::numeric, 0) +
    coalesce(nullif(form_data->>'co_income', '')::numeric, 0)
  ) stored,

  -- Score calculé côté serveur (jamais exposé au candidat)
  score_total     integer,
  score_category  text check (score_category in ('excellent', 'bon', 'a_evaluer', 'a_risque', null)),
  score_breakdown jsonb,         -- détail par critère
  score_computed_at timestamptz,

  -- Notes admin
  admin_notes     text,
  reviewed_by     uuid references auth.users(id),
  reviewed_at     timestamptz,
  decision_at     timestamptz,

  -- Loi 25 — métadonnées
  consents        jsonb,         -- récap des consentements
  retention_until timestamptz,   -- date limite de conservation (12 mois si refus)
  destroyed_at    timestamptz,   -- date de destruction effective

  -- Métadonnées techniques
  user_agent      text,
  locale          text,
  ip_hash         text           -- hash sha256 de l'IP, jamais l'IP brute
);

-- 1b. FK conditionnelle vers public.buildings
-- Le kit candidatures peut être installé avant le module "immeubles".
-- On n'attache la contrainte que si la table cible existe, et seulement
-- si elle n'a pas déjà été créée (idempotent).
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'buildings' and c.relkind = 'r'
  ) and not exists (
    select 1 from pg_constraint
    where conname = 'candidatures_building_id_fkey'
      and conrelid = 'public.candidatures'::regclass
  ) then
    alter table public.candidatures
      add constraint candidatures_building_id_fkey
      foreign key (building_id) references public.buildings(id) on delete set null;
  end if;
end
$$;

create index if not exists idx_candidatures_status on public.candidatures(status);
create index if not exists idx_candidatures_building on public.candidatures(building_id);
create index if not exists idx_candidatures_created on public.candidatures(created_at desc);
create index if not exists idx_candidatures_email on public.candidatures(applicant_email);
create index if not exists idx_candidatures_retention on public.candidatures(retention_until)
  where destroyed_at is null;

-- 2. Trigger pour updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_candidatures_updated on public.candidatures;
create trigger trg_candidatures_updated
  before update on public.candidatures
  for each row execute function public.set_updated_at();

-- 3. RLS — Row Level Security
alter table public.candidatures enable row level security;

-- 3a. INSERT public (anon) — toute personne peut soumettre une candidature
-- via l'Edge Function uniquement (l'Edge Function utilise la service_role key)
-- L'API anon NE doit PAS pouvoir insérer directement (sécurité du score).
drop policy if exists candidatures_anon_insert on public.candidatures;
-- (volontairement aucune policy INSERT pour anon : tout passe par l'Edge Function)

-- 3b. SELECT pour les administrateurs Modulimo uniquement
drop policy if exists candidatures_admin_select on public.candidatures;
create policy candidatures_admin_select on public.candidatures
  for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'gestionnaire')
    )
  );

-- 3c. UPDATE pour les administrateurs (statut, notes, décision)
drop policy if exists candidatures_admin_update on public.candidatures;
create policy candidatures_admin_update on public.candidatures
  for update
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'gestionnaire')
    )
  );

-- 3d. DELETE — seulement admin (rare ; on préfère destroy_personal_data)
drop policy if exists candidatures_admin_delete on public.candidatures;
create policy candidatures_admin_delete on public.candidatures
  for delete
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

-- 4. Fonction de destruction des données personnelles (Loi 25)
-- Conserve la candidature pour l'audit mais efface les PII
create or replace function public.destroy_candidature_pii(p_candidature_id uuid)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'gestionnaire')
  ) then
    raise exception 'Permission refusée';
  end if;

  update public.candidatures
  set
    form_data = jsonb_build_object(
      '_destroyed', true,
      'status_at_destruction', status,
      'score_category_at_destruction', score_category
    ),
    consents = null,
    user_agent = null,
    ip_hash = null,
    destroyed_at = now()
  where id = p_candidature_id;
end;
$$;

-- 5. Job nightly — détruire les PII des candidatures refusées > 12 mois
-- À planifier via pg_cron ou un cron externe
create or replace function public.purge_expired_candidatures()
returns integer language plpgsql security definer as $$
declare
  v_count integer;
begin
  with purged as (
    update public.candidatures
    set
      form_data = jsonb_build_object(
        '_auto_purged', true,
        'status_at_destruction', status
      ),
      consents = null,
      user_agent = null,
      ip_hash = null,
      destroyed_at = now()
    where destroyed_at is null
      and retention_until < now()
      and status in ('refuse', 'retire', 'expire')
    returning 1
  )
  select count(*) into v_count from purged;

  return v_count;
end;
$$;

-- 6. Vue admin pratique (sans PII pour rapports / analytics)
create or replace view public.candidatures_analytics as
select
  date_trunc('month', created_at) as month,
  building_id,
  status,
  score_category,
  count(*) as total,
  avg(score_total)::numeric(5,2) as avg_score,
  avg(target_rent)::numeric(10,2) as avg_target_rent
from public.candidatures
where destroyed_at is null
group by 1, 2, 3, 4;

comment on table public.candidatures is
  'Candidatures de location Modulimo. Conforme Loi 25. Le score est calculé côté Edge Function et n''est jamais exposé au candidat.';
comment on column public.candidatures.score_total is
  'Score sur 100. Calculé par l''Edge Function submit-candidature. Outil d''aide à la décision uniquement — la décision finale demeure humaine.';
comment on column public.candidatures.retention_until is
  'Date limite de conservation des PII. Loi 25 : 12 mois max après refus.';

-- 7. Grants Data API (Supabase — changement de défaut)
-- Depuis le 30 mai 2026 (nouveaux projets) et le 30 octobre 2026 (nouvelles
-- tables des projets existants), les tables du schéma public ne sont plus
-- exposées automatiquement à la Data API (PostgREST / GraphQL / supabase-js).
-- Sans ces GRANTs, le panneau admin (04_admin_panel.html) ne peut plus lire
-- ni mettre à jour les candidatures via supabase-js.
--
-- Modèle d'accès :
--   anon          → AUCUN grant. Les soumissions publiques passent par
--                   l'Edge Function submit-candidature, qui utilise la
--                   service_role key et contourne à la fois les grants
--                   et la RLS. Ne pas accorder de droits à anon sans
--                   repenser la confidentialité du score.
--   authenticated → SELECT / UPDATE / DELETE, alignés sur les policies
--                   RLS 3b/3c/3d. La RLS reste la garde principale —
--                   ces GRANTs ne font que rendre la table joignable
--                   par PostgREST. INSERT reste fermé (aucune policy).
--   service_role  → tous les droits par défaut, non concerné.
-- (Le grant SELECT sur public.user_roles est déclaré en §0.)
grant select, update, delete on public.candidatures to authenticated;
grant select on public.candidatures_analytics to authenticated;
