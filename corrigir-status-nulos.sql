-- =====================================================
-- CORREÇÃO: Preencher status nulos como "Pendência Faturamento"
-- Execute se você quiser que todos os pacientes sem status 
-- assumam "Pendência Faturamento" como padrão inicial
-- =====================================================

UPDATE agendamentos 
SET 
  status_aih = 'Pendência Faturamento',
  aih_dt_pendencia_faturamento = NOW()
WHERE 
  (status_aih IS NULL OR status_aih = '') 
  AND nome_paciente IS NOT NULL 
  AND nome_paciente != '';

-- Verificar resultado
SELECT count(*) as total_corrigidos 
FROM agendamentos 
WHERE status_aih = 'Pendência Faturamento' 
  AND aih_dt_pendencia_faturamento >= NOW() - INTERVAL '1 minute';
