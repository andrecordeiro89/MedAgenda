-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO E CRIAÇÃO DE TABELAS
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR SE AS TABELAS EXISTEM
-- ============================================================================

-- Verificar tabelas existentes
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'metas_especialidades',
    'grades_cirurgicas',
    'grades_cirurgicas_dias',
    'grades_cirurgicas_itens'
)
ORDER BY tablename;

-- Se o resultado acima estiver vazio, as tabelas não existem!
-- Execute os scripts de criação primeiro:
-- 1. create-metas-especialidades-table.sql
-- 2. create-grades-cirurgicas-table.sql

-- ============================================================================
-- 2. VERIFICAR POLÍTICAS RLS EXISTENTES
-- ============================================================================

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'metas_especialidades',
    'grades_cirurgicas',
    'grades_cirurgicas_dias',
    'grades_cirurgicas_itens'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- 3. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'metas_especialidades',
    'grades_cirurgicas',
    'grades_cirurgicas_dias',
    'grades_cirurgicas_itens'
);

-- Se rowsecurity = false, execute:
-- ALTER TABLE metas_especialidades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grades_cirurgicas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grades_cirurgicas_dias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grades_cirurgicas_itens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. DESABILITAR RLS TEMPORARIAMENTE (PARA TESTAR)
-- ============================================================================

-- OPÇÃO 1: Desabilitar RLS completamente (NÃO RECOMENDADO EM PRODUÇÃO)
-- Descomente as linhas abaixo se quiser desabilitar RLS temporariamente:

/*
ALTER TABLE metas_especialidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas_dias DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas_itens DISABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- 5. OPÇÃO 2: RECRIAR POLÍTICAS MAIS PERMISSIVAS (RECOMENDADO)
-- ============================================================================

-- Remover todas as políticas antigas
DO $$ 
BEGIN
    -- metas_especialidades
    DROP POLICY IF EXISTS "Permitir leitura de metas" ON metas_especialidades;
    DROP POLICY IF EXISTS "Permitir inserção de metas" ON metas_especialidades;
    DROP POLICY IF EXISTS "Permitir atualização de metas" ON metas_especialidades;
    DROP POLICY IF EXISTS "Permitir exclusão de metas" ON metas_especialidades;

    -- grades_cirurgicas
    DROP POLICY IF EXISTS "Permitir leitura de grades" ON grades_cirurgicas;
    DROP POLICY IF EXISTS "Permitir inserção de grades" ON grades_cirurgicas;
    DROP POLICY IF EXISTS "Permitir atualização de grades" ON grades_cirurgicas;
    DROP POLICY IF EXISTS "Permitir exclusão de grades" ON grades_cirurgicas;

    -- grades_cirurgicas_dias
    DROP POLICY IF EXISTS "Permitir leitura de dias" ON grades_cirurgicas_dias;
    DROP POLICY IF EXISTS "Permitir inserção de dias" ON grades_cirurgicas_dias;
    DROP POLICY IF EXISTS "Permitir atualização de dias" ON grades_cirurgicas_dias;
    DROP POLICY IF EXISTS "Permitir exclusão de dias" ON grades_cirurgicas_dias;

    -- grades_cirurgicas_itens
    DROP POLICY IF EXISTS "Permitir leitura de itens" ON grades_cirurgicas_itens;
    DROP POLICY IF EXISTS "Permitir inserção de itens" ON grades_cirurgicas_itens;
    DROP POLICY IF EXISTS "Permitir atualização de itens" ON grades_cirurgicas_itens;
    DROP POLICY IF EXISTS "Permitir exclusão de itens" ON grades_cirurgicas_itens;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Uma ou mais tabelas não existem. Execute os scripts de criação primeiro.';
    WHEN undefined_object THEN
        RAISE NOTICE 'Uma ou mais políticas não existem. Continuando...';
END $$;

-- Criar políticas MUITO permissivas (apenas para desenvolvimento)
DO $$
BEGIN
    -- metas_especialidades
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'metas_especialidades') THEN
        CREATE POLICY "Permitir tudo metas" ON metas_especialidades
        FOR ALL 
        TO public
        USING (true)
        WITH CHECK (true);
    END IF;

    -- grades_cirurgicas
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grades_cirurgicas') THEN
        CREATE POLICY "Permitir tudo grades" ON grades_cirurgicas
        FOR ALL 
        TO public
        USING (true)
        WITH CHECK (true);
    END IF;

    -- grades_cirurgicas_dias
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grades_cirurgicas_dias') THEN
        CREATE POLICY "Permitir tudo dias" ON grades_cirurgicas_dias
        FOR ALL 
        TO public
        USING (true)
        WITH CHECK (true);
    END IF;

    -- grades_cirurgicas_itens
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grades_cirurgicas_itens') THEN
        CREATE POLICY "Permitir tudo itens" ON grades_cirurgicas_itens
        FOR ALL 
        TO public
        USING (true)
        WITH CHECK (true);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Política já existe. Continuando...';
END $$;

-- ============================================================================
-- 6. VERIFICAR RESULTADO FINAL
-- ============================================================================

-- Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'metas_especialidades',
    'grades_cirurgicas',
    'grades_cirurgicas_dias',
    'grades_cirurgicas_itens'
)
ORDER BY tablename;

-- ============================================================================
-- 7. SE AS TABELAS NÃO EXISTEM, CRIE PRIMEIRO
-- ============================================================================

/*
IMPORTANTE: Se a verificação acima mostrou que as tabelas não existem,
você PRECISA executar os scripts de criação na ordem:

1. create-metas-especialidades-table.sql
2. create-grades-cirurgicas-table.sql

Depois execute este script novamente para verificar.
*/

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

