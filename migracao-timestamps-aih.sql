-- =====================================================
-- MIGRAÇÃO: Preencher timestamps AIH com base no status atual
-- Execute este script UMA VEZ para atualizar registros existentes
-- =====================================================

-- Todos os registros com status "Autorizado" terão o timestamp preenchido
UPDATE agendamentos 
SET aih_dt_autorizado = NOW()
WHERE status_aih = 'Autorizado' 
  AND aih_dt_autorizado IS NULL;

-- Pendência Faturamento
UPDATE agendamentos 
SET aih_dt_pendencia_faturamento = NOW()
WHERE status_aih = 'Pendência Faturamento' 
  AND aih_dt_pendencia_faturamento IS NULL;

-- Pendência Hospital
UPDATE agendamentos 
SET aih_dt_pendencia_hospital = NOW()
WHERE status_aih = 'Pendência Hospital' 
  AND aih_dt_pendencia_hospital IS NULL;

-- Auditor Externo
UPDATE agendamentos 
SET aih_dt_auditor_externo = NOW()
WHERE status_aih = 'Auditor Externo' 
  AND aih_dt_auditor_externo IS NULL;

-- Aguardando Ciência SMS
UPDATE agendamentos 
SET aih_dt_ag_ciencia_sms = NOW()
WHERE status_aih = 'Aguardando Ciência SMS' 
  AND aih_dt_ag_ciencia_sms IS NULL;

-- Ag. Correção
UPDATE agendamentos 
SET aih_dt_ag_correcao = NOW()
WHERE status_aih = 'Ag. Correção' 
  AND aih_dt_ag_correcao IS NULL;

-- N/A - Urgência
UPDATE agendamentos 
SET aih_dt_na_urgencia = NOW()
WHERE status_aih = 'N/A - Urgência' 
  AND aih_dt_na_urgencia IS NULL;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================
SELECT 
  status_aih,
  COUNT(*) AS total,
  COUNT(aih_dt_autorizado) AS com_dt_autorizado,
  COUNT(aih_dt_pendencia_faturamento) AS com_dt_pend_fat,
  COUNT(aih_dt_pendencia_hospital) AS com_dt_pend_hosp,
  COUNT(aih_dt_auditor_externo) AS com_dt_auditor,
  COUNT(aih_dt_ag_ciencia_sms) AS com_dt_ciencia,
  COUNT(aih_dt_ag_correcao) AS com_dt_correcao,
  COUNT(aih_dt_na_urgencia) AS com_dt_urgencia
FROM agendamentos
WHERE status_aih IS NOT NULL
GROUP BY status_aih
ORDER BY status_aih;
