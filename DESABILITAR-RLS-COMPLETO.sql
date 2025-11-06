-- ============================================================================
-- DESABILITAR RLS COMPLETAMENTE - SOLUÇÃO RÁPIDA
-- Execute este script para resolver os erros 401, 406 e 42501
-- ============================================================================

-- ============================================================================
-- DESABILITAR RLS EM TODAS AS TABELAS PROBLEMÁTICAS
-- ============================================================================

-- Desabilitar RLS (ignora erros se tabelas não existem)
DO $$ 
BEGIN
    -- Metas de Especialidades
    BEGIN
        ALTER TABLE metas_especialidades DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado em metas_especialidades';
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ Tabela metas_especialidades não existe. Execute create-metas-especialidades-table.sql primeiro.';
    END;

    -- Grades Cirúrgicas
    BEGIN
        ALTER TABLE grades_cirurgicas DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado em grades_cirurgicas';
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ Tabela grades_cirurgicas não existe. Execute create-grades-cirurgicas-table.sql primeiro.';
    END;

    -- Grades Cirúrgicas Dias
    BEGIN
        ALTER TABLE grades_cirurgicas_dias DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado em grades_cirurgicas_dias';
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ Tabela grades_cirurgicas_dias não existe. Execute create-grades-cirurgicas-table.sql primeiro.';
    END;

    -- Grades Cirúrgicas Itens
    BEGIN
        ALTER TABLE grades_cirurgicas_itens DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado em grades_cirurgicas_itens';
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ Tabela grades_cirurgicas_itens não existe. Execute create-grades-cirurgicas-table.sql primeiro.';
    END;
END $$;

-- ============================================================================
-- VERIFICAR STATUS DO RLS
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS HABILITADO'
        ELSE '🔓 RLS DESABILITADO'
    END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND (
    tablename LIKE '%grade%' 
    OR tablename LIKE '%meta%'
)
ORDER BY tablename;

-- Se aparecer "RLS HABILITADO", execute o script novamente!

-- ============================================================================
-- VERIFICAR SE AS TABELAS EXISTEM
-- ============================================================================

SELECT 
    'Tabelas encontradas:' as info,
    COUNT(*) as total
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'metas_especialidades',
    'grades_cirurgicas',
    'grades_cirurgicas_dias',
    'grades_cirurgicas_itens'
);

-- Resultado esperado: total = 4
-- Se total < 4, você precisa executar os scripts de criação primeiro!

-- ============================================================================
-- LISTAR TABELAS CRIADAS
-- ============================================================================

SELECT 
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

-- ============================================================================
-- LIMPAR POLÍTICAS (OPCIONAL)
-- ============================================================================

-- Remover todas as políticas para garantir acesso total
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN (
            'metas_especialidades',
            'grades_cirurgicas',
            'grades_cirurgicas_dias',
            'grades_cirurgicas_itens'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE '🗑️ Política removida: %.%', pol.tablename, pol.policyname;
    END LOOP;
END $$;

-- ============================================================================
-- RESULTADO FINAL
-- ============================================================================

SELECT 
    '🎉 RLS DESABILITADO EM TODAS AS TABELAS!' as status,
    'Execute Ctrl+Shift+R no navegador para recarregar a aplicação' as proxima_acao;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

