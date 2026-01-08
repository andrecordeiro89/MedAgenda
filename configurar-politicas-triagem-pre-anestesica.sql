BEGIN;

ALTER TABLE IF EXISTS public.triagem_pre_anestesica
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS triagem_pre_anestesica_select_all ON public.triagem_pre_anestesica;
DROP POLICY IF EXISTS triagem_pre_anestesica_insert_all ON public.triagem_pre_anestesica;
DROP POLICY IF EXISTS triagem_pre_anestesica_update_all ON public.triagem_pre_anestesica;

CREATE POLICY triagem_pre_anestesica_select_all
ON public.triagem_pre_anestesica
FOR SELECT
USING (true);

CREATE POLICY triagem_pre_anestesica_insert_all
ON public.triagem_pre_anestesica
FOR INSERT
WITH CHECK (true);

CREATE POLICY triagem_pre_anestesica_update_all
ON public.triagem_pre_anestesica
FOR UPDATE
USING (true)
WITH CHECK (true);

COMMIT;
