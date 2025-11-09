-- ============================================================================
-- CORRIGIR PERMISSÕES DA TABELA MEDICOS
-- Execute este script no Supabase SQL Editor para resolver o erro 401
-- ============================================================================

-- ============================================================================
-- OPÇÃO 1: DESABILITAR RLS (MAIS SIMPLES)
-- ============================================================================

-- Desabilitar RLS na tabela medicos
ALTER TABLE public.medicos DISABLE ROW LEVEL SECURITY;

-- Dar permissões completas para anon e authenticated
GRANT ALL ON public.medicos TO anon, authenticated;

-- ============================================================================
-- OPÇÃO 2: MANTER RLS MAS CRIAR POLÍTICAS PERMISSIVAS (MAIS SEGURO)
-- ============================================================================
-- Se preferir manter RLS habilitado, descomente as linhas abaixo:

-- -- Habilitar RLS
-- ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;

-- -- Remover políticas antigas (se existirem)
-- DROP POLICY IF EXISTS "Permitir leitura de medicos" ON public.medicos;
-- DROP POLICY IF EXISTS "Permitir inserção de medicos" ON public.medicos;
-- DROP POLICY IF EXISTS "Permitir atualização de medicos" ON public.medicos;
-- DROP POLICY IF EXISTS "Permitir exclusão de medicos" ON public.medicos;

-- -- Criar políticas permissivas para anon e authenticated
-- CREATE POLICY "Permitir leitura de medicos" ON public.medicos
-- FOR SELECT 
-- TO anon, authenticated
-- USING (true);

-- CREATE POLICY "Permitir inserção de medicos" ON public.medicos
-- FOR INSERT 
-- TO anon, authenticated
-- WITH CHECK (true);

-- CREATE POLICY "Permitir atualização de medicos" ON public.medicos
-- FOR UPDATE 
-- TO anon, authenticated
-- USING (true);

-- CREATE POLICY "Permitir exclusão de medicos" ON public.medicos
-- FOR DELETE 
-- TO anon, authenticated
-- USING (true);

-- ============================================================================
-- VERIFICAR STATUS
-- ============================================================================

-- Verificar se RLS está desabilitado
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS HABILITADO'
        ELSE '🔓 RLS DESABILITADO'
    END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'medicos';

-- Verificar permissões
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'medicos'
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

