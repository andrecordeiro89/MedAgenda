-- ============================================================================
-- CORREÇÃO RÁPIDA DE PERMISSÕES - ESPECIALIDADES
-- Execute este script para resolver o erro 401 Unauthorized
-- ============================================================================

-- Desabilitar RLS (Row Level Security) para especialidades
ALTER TABLE especialidades DISABLE ROW LEVEL SECURITY;

-- Garantir permissões de leitura
GRANT SELECT ON especialidades TO authenticated;
GRANT SELECT ON especialidades TO anon;

-- Verificar se funcionou
SELECT 'Permissões corrigidas!' as status;
SELECT count(*) as total_especialidades FROM especialidades;
