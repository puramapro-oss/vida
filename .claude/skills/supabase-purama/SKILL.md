---
name: supabase-purama
description: Règles Supabase self-hosted Purama (instance VPS auth.purama.dev)
---

# Supabase Purama — self-hosted VPS

- URL : `https://auth.purama.dev` (pas `*.supabase.co`)
- VPS : `72.62.191.111` — SSH `sshpass -p '+Awy3cwg;NoutOTH' ssh root@...`
- Schéma VIDA : `vida_sante` (exposé dans `PGRST_DB_SCHEMAS`)
- DB password : `POSTGRES_PASSWORD` env

## Règles

1. **Server Components** → `createServerClient` de `@supabase/ssr` (cookies httpOnly)
2. **Client Components** → `createBrowserClient`
3. `SUPABASE_SERVICE_ROLE_KEY` JAMAIS côté client — uniquement routes API serveur
4. **RLS** obligatoire sur TOUTES les tables (ENABLE ROW LEVEL SECURITY + policy)
5. Migrations dans `/migrations/` timestamp ISO (`001_xxx.sql`, `002_xxx.sql`)
6. Appliquer migration :
```bash
sshpass -p '+Awy3cwg;NoutOTH' ssh root@72.62.191.111 \
  "docker exec -i supabase-db psql -U postgres -d postgres" < migrations/00X_xxx.sql
```
7. Après nouveau schéma : `docker compose up -d --force-recreate rest`
8. Auth email + Google OAuth déjà configurés VPS (GOTRUE_URI_ALLOW_LIST=https://*.purama.dev/**)
