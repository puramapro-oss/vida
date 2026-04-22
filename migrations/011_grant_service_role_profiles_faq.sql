-- 011 — Ajoute GRANT SELECT service_role sur profiles + faq_articles
-- Raison : API /api/impact/public a besoin de count(*) côté serveur.
-- RLS reste active — service_role bypass RLS de toute façon.

GRANT SELECT ON vida_sante.profiles      TO service_role;
GRANT SELECT ON vida_sante.faq_articles  TO service_role;

-- Reload PostgREST schema cache pour prise en compte immédiate
NOTIFY pgrst, 'reload schema';
