-- ============================================================================
-- ADICIONAR COLUNA PREFIXO NA TABELA PROCEDIMENTOS
-- ============================================================================

-- Adicionar coluna prefixo (campo de texto simples para guardar o prefixo do procedimento)
ALTER TABLE procedimentos 
ADD COLUMN IF NOT EXISTS prefixo VARCHAR(50);

COMMENT ON COLUMN procedimentos.prefixo IS 'Prefixo do procedimento usado nas grades cirúrgicas (ex: LCA, MENISCO, PTJ)';

-- Criar índice para busca rápida por prefixo
CREATE INDEX IF NOT EXISTS idx_procedimentos_prefixo ON procedimentos(prefixo);

-- Verificar estrutura final
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'procedimentos'
ORDER BY ordinal_position;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

