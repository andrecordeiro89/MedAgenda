-- ============================================
-- MIGRATION: Adicionar colunas de Faturamento
-- Data: 2025-11-27
-- Descrição: Adiciona colunas para controle de
--            liberação de faturamento G-SUS
-- ============================================

-- Adicionar coluna para indicar se foi liberado para faturamento
-- NULL = não avaliado ainda
-- TRUE = liberado (apenas visual, não salva no banco)
-- FALSE = não liberado (salva com observação obrigatória)
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS faturamento_liberado BOOLEAN DEFAULT NULL;

-- Adicionar coluna para observação quando NÃO LIBERADO
-- Campo obrigatório quando faturamento_liberado = FALSE
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS faturamento_observacao TEXT DEFAULT NULL;

-- Adicionar coluna para data/hora da marcação
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS faturamento_data TIMESTAMP DEFAULT NULL;

-- Comentários nas colunas (documentação)
COMMENT ON COLUMN agendamentos.faturamento_liberado IS 
'Indica se o paciente foi liberado para faturamento G-SUS. NULL=não avaliado, TRUE=liberado (visual), FALSE=não liberado (salvo)';

COMMENT ON COLUMN agendamentos.faturamento_observacao IS 
'Observação obrigatória quando faturamento_liberado = FALSE. Explica o motivo de não ter sido liberado.';

COMMENT ON COLUMN agendamentos.faturamento_data IS 
'Data e hora em que a marcação de faturamento foi feita (liberado ou não liberado).';

-- Criar índice para otimizar consultas de não liberados
CREATE INDEX IF NOT EXISTS idx_agendamentos_faturamento_liberado 
ON agendamentos(faturamento_liberado) 
WHERE faturamento_liberado IS NOT NULL;

-- ============================================
-- INSTRUÇÕES DE USO:
-- ============================================
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se as colunas foram criadas:
--    SELECT column_name, data_type, is_nullable 
--    FROM information_schema.columns 
--    WHERE table_name = 'agendamentos' 
--    AND column_name LIKE 'faturamento%';
-- ============================================

