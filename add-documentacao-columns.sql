-- ========================================
-- ADICIONAR COLUNAS DE DOCUMENTAÇÃO
-- ========================================
-- Este script adiciona colunas para controlar
-- o fluxo de documentação pré-cirúrgica
-- ========================================

-- 1. Adicionar coluna para indicar se documentos estão OK (Recepção)
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS documentos_ok BOOLEAN DEFAULT FALSE;

-- 2. Adicionar coluna para armazenar URLs dos documentos (JSON)
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS documentos_urls TEXT;

-- 3. Adicionar coluna para data/hora do upload dos documentos
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS documentos_data TIMESTAMPTZ;

-- 4. Adicionar coluna para indicar se ficha pré-anestésica está OK
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS ficha_pre_anestesica_ok BOOLEAN DEFAULT FALSE;

-- 5. Adicionar coluna para URL da ficha pré-anestésica
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS ficha_pre_anestesica_url TEXT;

-- 6. Adicionar coluna para data/hora do upload da ficha
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS ficha_pre_anestesica_data TIMESTAMPTZ;

-- 7. Adicionar coluna para observações/comentários
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- ========================================
-- Verificar estrutura atualizada
-- ========================================
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'agendamentos'
ORDER BY ordinal_position;

