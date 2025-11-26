-- ============================================================================
-- LIBERAR PERMISSÕES DE SELECT E UPDATE
-- ============================================================================
-- O UPDATE está funcionando mas o SELECT está bloqueado
-- Vamos corrigir isso!
-- ============================================================================

-- OPÇÃO 1: DESABILITAR RLS (MAIS SIMPLES)
-- ============================================================================
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
  tablename, 
  rowsecurity AS "RLS Ativo (deve ser FALSE)"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- ============================================================================
-- OPÇÃO 2: CRIAR POLÍTICAS (SE QUISER MANTER RLS ATIVO)
-- ============================================================================
-- Se você quiser manter RLS mas permitir SELECT e UPDATE:

-- Habilitar RLS
-- ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
-- DROP POLICY IF EXISTS "Permitir SELECT" ON agendamentos;
-- DROP POLICY IF EXISTS "Permitir UPDATE" ON agendamentos;

-- Criar política de SELECT
-- CREATE POLICY "Permitir SELECT para todos"
--   ON agendamentos
--   FOR SELECT
--   TO public
--   USING (true);

-- Criar política de UPDATE
-- CREATE POLICY "Permitir UPDATE para todos"
--   ON agendamentos
--   FOR UPDATE
--   TO public
--   USING (true)
--   WITH CHECK (true);

-- ============================================================================
-- ✅ RECOMENDAÇÃO: USE A OPÇÃO 1 (DESABILITAR RLS)
-- ============================================================================
-- É mais simples e funciona imediatamente!

