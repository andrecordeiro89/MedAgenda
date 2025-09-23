-- ============================================================================
-- VERIFICAÇÃO DA NOVA TABELA ESPECIALIDADES
-- Execute após criar a nova tabela para verificar se tudo está correto
-- ============================================================================

-- 1. Verificar total de especialidades
SELECT 
    '=== RESUMO DA MIGRAÇÃO ===' as titulo,
    (SELECT count(*) FROM especialidades) as total_especialidades,
    (SELECT count(*) FROM medicos WHERE especialidade_id IS NOT NULL) as medicos_com_id,
    (SELECT count(*) FROM medicos WHERE especialidade IS NOT NULL) as medicos_com_texto;

-- 2. Listar todas as especialidades criadas
SELECT '=== ESPECIALIDADES DISPONÍVEIS ===' as titulo;
SELECT 
    ROW_NUMBER() OVER (ORDER BY nome) as "#",
    nome as "Especialidade",
    created_at::date as "Criada em"
FROM especialidades 
ORDER BY nome;

-- 3. Verificar migração dos médicos
SELECT '=== MIGRAÇÃO DE MÉDICOS ===' as titulo;
SELECT 
    e.nome as "Especialidade",
    count(m.id) as "Qtd Médicos"
FROM especialidades e
LEFT JOIN medicos m ON e.id = m.especialidade_id
GROUP BY e.nome
HAVING count(m.id) > 0
ORDER BY count(m.id) DESC, e.nome;

-- 4. Verificar médicos que não foram migrados (se houver)
SELECT '=== MÉDICOS NÃO MIGRADOS ===' as titulo;
SELECT 
    especialidade as "Especialidade Original",
    count(*) as "Qtd Médicos"
FROM medicos 
WHERE especialidade IS NOT NULL 
AND especialidade_id IS NULL
GROUP BY especialidade
ORDER BY count(*) DESC;

-- 5. Verificar estrutura das tabelas
SELECT '=== ESTRUTURA DAS TABELAS ===' as titulo;
SELECT 
    'medicos' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null
FROM information_schema.columns 
WHERE table_name = 'medicos' 
AND column_name IN ('especialidade', 'especialidade_id')
UNION ALL
SELECT 
    'procedimentos' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null
FROM information_schema.columns 
WHERE table_name = 'procedimentos' 
AND column_name = 'especialidade_id'
UNION ALL
SELECT 
    'especialidades' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null
FROM information_schema.columns 
WHERE table_name = 'especialidades'
ORDER BY tabela, coluna;

-- 6. Verificar índices criados
SELECT '=== ÍNDICES CRIADOS ===' as titulo;
SELECT 
    schemaname as schema,
    tablename as tabela,
    indexname as indice,
    indexdef as definicao
FROM pg_indexes 
WHERE tablename IN ('especialidades', 'medicos', 'procedimentos')
AND indexname LIKE '%especialidade%'
ORDER BY tablename, indexname;

-- 7. Verificar configuração RLS
SELECT '=== CONFIGURAÇÃO RLS ===' as titulo;
SELECT 
    schemaname as schema,
    tablename as tabela,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'especialidades';

SELECT '=== VERIFICAÇÃO CONCLUÍDA ===' as status;
