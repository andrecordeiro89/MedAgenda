-- ============================================================================
-- ADICIONAR COLUNA ESPECIALIDADE NA TABELA PROCEDIMENTOS
-- Script para adicionar coluna física especialidade na tabela procedimentos
-- ============================================================================

-- 1. Verificar estrutura atual da tabela procedimentos
SELECT 'Estrutura atual da tabela procedimentos:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'procedimentos' 
ORDER BY ordinal_position;

-- 2. Adicionar coluna especialidade na tabela procedimentos
ALTER TABLE procedimentos 
ADD COLUMN IF NOT EXISTS especialidade VARCHAR(255);

-- 3. Popular a coluna especialidade com base no relacionamento especialidade_id
UPDATE procedimentos 
SET especialidade = e.nome
FROM especialidades e
WHERE procedimentos.especialidade_id = e.id
AND procedimentos.especialidade IS NULL;

-- 4. Verificar quantos procedimentos foram atualizados
SELECT 
    'Resultado da atualização:' as info,
    count(*) as total_procedimentos,
    count(especialidade) as procedimentos_com_especialidade,
    count(especialidade_id) as procedimentos_com_especialidade_id
FROM procedimentos;

-- 5. Mostrar alguns exemplos dos procedimentos atualizados
SELECT 'Exemplos de procedimentos com especialidade:' as info;
SELECT 
    nome,
    tipo,
    especialidade,
    created_at::date as criado_em
FROM procedimentos 
WHERE especialidade IS NOT NULL
ORDER BY nome
LIMIT 10;

-- 6. Criar índice para otimizar consultas por especialidade
CREATE INDEX IF NOT EXISTS idx_procedimentos_especialidade ON procedimentos(especialidade);

-- 7. Verificar estrutura final da tabela
SELECT 'Estrutura final da tabela procedimentos:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'procedimentos' 
AND column_name IN ('nome', 'tipo', 'especialidade', 'especialidade_id', 'hospital_id')
ORDER BY column_name;

-- 8. Mostrar estatísticas por especialidade
SELECT 'Estatísticas por especialidade:' as info;
SELECT 
    COALESCE(especialidade, 'Sem especialidade') as especialidade,
    count(*) as quantidade_procedimentos
FROM procedimentos 
GROUP BY especialidade 
ORDER BY count(*) DESC, especialidade;

SELECT 'COLUNA ESPECIALIDADE ADICIONADA COM SUCESSO!' as resultado;
