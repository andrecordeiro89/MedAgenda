-- Adiciona coluna para persistir tipo por anexo (url/tipo) em JSON
ALTER TABLE public.agendamentos
ADD COLUMN IF NOT EXISTS documentos_meta JSONB;

-- Opcional: índice para consultas futuras
-- CREATE INDEX IF NOT EXISTS idx_agendamentos_documentos_meta ON public.agendamentos USING GIN (documentos_meta);

-- Observação:
-- Após executar este script no Supabase (SQL Editor), a aplicação começará
-- a persistir o mapeamento por arquivo (url/tipo) nesta coluna.
