-- ============================================
-- MIGRATION: Adicionar coluna de especificação de procedimento
-- Data: 2025-11-27
-- Descrição: Permite adicionar especificação/subnome ao procedimento base
-- ============================================

-- Adicionar coluna para especificação do procedimento
-- O procedimento base (coluna 'procedimentos') fica fixo
-- A especificação pode ser editada livremente
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS procedimento_especificacao TEXT DEFAULT NULL;

-- Comentário na coluna (documentação)
COMMENT ON COLUMN agendamentos.procedimento_especificacao IS 
'Especificação ou subnome do procedimento. Ex: se procedimento é "MENISCO", especificação pode ser "Meniscectomia medial". Exibição final: "MENISCO - Meniscectomia medial"';

-- Criar índice para buscas (opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_agendamentos_procedimento_especificacao 
ON agendamentos(procedimento_especificacao) 
WHERE procedimento_especificacao IS NOT NULL;

-- ============================================
-- EXEMPLOS DE USO:
-- ============================================
-- Procedimento original: 'MENISCO'
-- Especificação: 'Meniscectomia medial'
-- Display: 'MENISCO - Meniscectomia medial'
--
-- Procedimento original: 'LIGAMENTO CRUZADO ANTERIOR'
-- Especificação: 'Reconstrução com enxerto'
-- Display: 'LIGAMENTO CRUZADO ANTERIOR - Reconstrução com enxerto'
--
-- Procedimento original: 'CISTOLITOTRIPSIA'
-- Especificação: NULL (sem especificação)
-- Display: 'CISTOLITOTRIPSIA'
-- ============================================

-- ============================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- ============================================
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se a coluna foi criada:
--    SELECT column_name, data_type, is_nullable 
--    FROM information_schema.columns 
--    WHERE table_name = 'agendamentos' 
--    AND column_name = 'procedimento_especificacao';
-- ============================================

