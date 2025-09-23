-- ============================================================================
-- VERIFICAÇÃO DA TABELA ESPECIALIDADES EXISTENTE
-- Execute este script primeiro para ver o estado atual
-- ============================================================================

-- 1. Verificar estrutura da tabela especialidades
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'especialidades' 
ORDER BY ordinal_position;

-- 2. Verificar quantas especialidades já existem
SELECT 
    'Total de especialidades:' as info,
    count(*) as quantidade
FROM especialidades;

-- 3. Listar especialidades existentes
SELECT 
    'Especialidades já cadastradas:' as info;
SELECT 
    nome,
    created_at
FROM especialidades 
ORDER BY nome;

-- 4. Verificar se as colunas especialidade_id já existem nas outras tabelas
SELECT 
    'Estrutura da tabela medicos:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'medicos' 
AND column_name IN ('especialidade', 'especialidade_id')
ORDER BY column_name;

SELECT 
    'Estrutura da tabela procedimentos:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'procedimentos' 
AND column_name IN ('especialidade_id')
ORDER BY column_name;

-- 5. Verificar especialidades únicas nos médicos (para migração)
SELECT 
    'Especialidades únicas nos médicos:' as info;
SELECT 
    especialidade,
    count(*) as quantidade_medicos
FROM medicos 
WHERE especialidade IS NOT NULL 
AND especialidade != ''
GROUP BY especialidade 
ORDER BY quantidade_medicos DESC, especialidade;
