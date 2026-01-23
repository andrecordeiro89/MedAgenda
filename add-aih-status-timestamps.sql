-- =====================================================
-- CONTROLE DE HISTÓRICO DE STATUS AIH
-- Script para criar colunas de timestamp na tabela agendamentos
-- =====================================================

-- Cada coluna armazena a data/hora em que o paciente ENTROU naquele status
-- Isso permite calcular quanto tempo ficou em cada etapa

-- 1. AUTORIZADO (status final)
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS aih_dt_autorizado TIMESTAMPTZ;

-- 2. PENDÊNCIA HOSPITAL
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS aih_dt_pendencia_hospital TIMESTAMPTZ;

-- 3. PENDÊNCIA FATURAMENTO
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS aih_dt_pendencia_faturamento TIMESTAMPTZ;

-- 4. AUDITOR EXTERNO
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS aih_dt_auditor_externo TIMESTAMPTZ;

-- 5. AGUARDANDO CIÊNCIA SMS
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS aih_dt_ag_ciencia_sms TIMESTAMPTZ;

-- 6. AG. CORREÇÃO
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS aih_dt_ag_correcao TIMESTAMPTZ;

-- 7. N/A - URGÊNCIA
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS aih_dt_na_urgencia TIMESTAMPTZ;

-- =====================================================
-- COMENTÁRIOS NAS COLUNAS (documentação no banco)
-- =====================================================
COMMENT ON COLUMN agendamentos.aih_dt_autorizado IS 'Data/hora em que o status AIH foi alterado para Autorizado';
COMMENT ON COLUMN agendamentos.aih_dt_pendencia_hospital IS 'Data/hora em que o status AIH foi alterado para Pendência Hospital';
COMMENT ON COLUMN agendamentos.aih_dt_pendencia_faturamento IS 'Data/hora em que o status AIH foi alterado para Pendência Faturamento';
COMMENT ON COLUMN agendamentos.aih_dt_auditor_externo IS 'Data/hora em que o status AIH foi alterado para Auditor Externo';
COMMENT ON COLUMN agendamentos.aih_dt_ag_ciencia_sms IS 'Data/hora em que o status AIH foi alterado para Aguardando Ciência SMS';
COMMENT ON COLUMN agendamentos.aih_dt_ag_correcao IS 'Data/hora em que o status AIH foi alterado para Ag. Correção';
COMMENT ON COLUMN agendamentos.aih_dt_na_urgencia IS 'Data/hora em que o status AIH foi alterado para N/A - Urgência';

-- =====================================================
-- VERIFICAR SE AS COLUNAS FORAM CRIADAS
-- =====================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'aih_dt_%'
ORDER BY column_name;
