BEGIN;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.triagem_pre_anestesica
TO anon, authenticated;

COMMIT;
