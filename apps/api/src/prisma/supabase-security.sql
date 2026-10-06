-- Supabase hardening — à exécuter dans Supabase → SQL Editor (DB prod).
-- Idempotent : peut être relancé sans risque (après un db push, une recréation de projet…).
--
-- Pourquoi : Supabase expose le schéma `public` via son Data API (PostgREST).
-- Sans RLS, quiconque connaît l'URL du projet + la clé anon peut lire/écrire
-- toutes les tables (dont User.passwordHash). L'app n'utilise pas ce Data API :
-- Prisma se connecte en rôle `postgres` (propriétaire des tables → RLS ignorée)
-- et PowerSync utilise un rôle BYPASSRLS + la réplication logique (non soumise à RLS).
-- Activer RLS sans aucune policy = accès refusé à anon/authenticated, zéro impact app.

-- 1. RLS sur toutes les tables existantes du schéma public
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END;
$$;

-- 2. RLS automatique sur les futures tables (prisma db push ne gère pas RLS)
-- Source : https://supabase.com/docs/guides/database/postgres/event-triggers
CREATE OR REPLACE FUNCTION rls_auto_enable()
RETURNS EVENT_TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
      AND schema_name = 'public'
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
EXECUTE FUNCTION rls_auto_enable();

-- 3. Vérification : toutes les lignes doivent avoir rowsecurity = true
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
