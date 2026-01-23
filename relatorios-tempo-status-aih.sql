-- =====================================================
-- CONSULTAS DE RELATÓRIO - TEMPO EM CADA STATUS AIH
-- Execute no Editor SQL do Supabase
-- =====================================================

-- 1. VER TODOS OS TIMESTAMPS DE UM PACIENTE ESPECÍFICO
-- Mostra quando o paciente entrou em cada status
SELECT 
  nome_paciente,
  status_aih AS status_atual,
  aih_dt_pendencia_faturamento AS "Pendência Fat.",
  aih_dt_pendencia_hospital AS "Pendência Hosp.",
  aih_dt_auditor_externo AS "Auditor Ext.",
  aih_dt_ag_ciencia_sms AS "Ag. Ciência SMS",
  aih_dt_ag_correcao AS "Ag. Correção",
  aih_dt_autorizado AS "Autorizado",
  aih_dt_na_urgencia AS "N/A Urgência"
FROM agendamentos
WHERE nome_paciente ILIKE '%NOME_PACIENTE%'
ORDER BY data_agendamento DESC;

-- =====================================================
-- 2. TEMPO TOTAL DESDE PENDÊNCIA ATÉ AUTORIZAÇÃO (em horas)
-- Mostra quantas horas um paciente levou desde a primeira pendência até ser autorizado
SELECT 
  nome_paciente,
  procedimentos,
  aih_dt_pendencia_faturamento,
  aih_dt_autorizado,
  ROUND(
    EXTRACT(EPOCH FROM (aih_dt_autorizado - aih_dt_pendencia_faturamento)) / 3600, 
    1
  ) AS horas_ate_autorizacao,
  ROUND(
    EXTRACT(EPOCH FROM (aih_dt_autorizado - aih_dt_pendencia_faturamento)) / 86400, 
    1
  ) AS dias_ate_autorizacao
FROM agendamentos
WHERE aih_dt_pendencia_faturamento IS NOT NULL 
  AND aih_dt_autorizado IS NOT NULL
ORDER BY dias_ate_autorizacao DESC;

-- =====================================================
-- 3. PACIENTES AINDA EM CADA STATUS (não autorizados)
-- Mostra quantos pacientes estão "parados" em cada status
SELECT 
  status_aih,
  COUNT(*) AS quantidade
FROM agendamentos
WHERE status_aih IS NOT NULL
  AND status_aih NOT IN ('Autorizado', 'N/A - Urgência')
  AND nome_paciente IS NOT NULL
  AND nome_paciente != ''
GROUP BY status_aih
ORDER BY quantidade DESC;

-- =====================================================
-- 4. TEMPO EM PENDÊNCIA HOSPITAL (pacientes que passaram por lá)
SELECT 
  nome_paciente,
  procedimentos,
  aih_dt_pendencia_hospital,
  -- Se foi para outro status depois, calcular a diferença
  COALESCE(
    aih_dt_auditor_externo, 
    aih_dt_ag_correcao, 
    aih_dt_autorizado, 
    NOW()
  ) AS saiu_em,
  ROUND(
    EXTRACT(EPOCH FROM (
      COALESCE(aih_dt_auditor_externo, aih_dt_ag_correcao, aih_dt_autorizado, NOW()) 
      - aih_dt_pendencia_hospital
    )) / 3600, 
    1
  ) AS horas_em_pendencia_hospital
FROM agendamentos
WHERE aih_dt_pendencia_hospital IS NOT NULL
ORDER BY horas_em_pendencia_hospital DESC
LIMIT 50;

-- =====================================================
-- 5. MÉDIA DE TEMPO POR STATUS (últimos 30 dias)
-- OBS: Este é um cálculo aproximado baseado nos timestamps disponíveis
SELECT 
  'Pendência Faturamento → Autorizado' AS fluxo,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (aih_dt_autorizado - aih_dt_pendencia_faturamento)) / 86400
  ), 1) AS media_dias
FROM agendamentos
WHERE aih_dt_pendencia_faturamento IS NOT NULL 
  AND aih_dt_autorizado IS NOT NULL
  AND aih_dt_autorizado > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Pendência Hospital → Autorizado' AS fluxo,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (aih_dt_autorizado - aih_dt_pendencia_hospital)) / 86400
  ), 1) AS media_dias
FROM agendamentos
WHERE aih_dt_pendencia_hospital IS NOT NULL 
  AND aih_dt_autorizado IS NOT NULL
  AND aih_dt_autorizado > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Auditor Externo → Autorizado' AS fluxo,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (aih_dt_autorizado - aih_dt_auditor_externo)) / 86400
  ), 1) AS media_dias
FROM agendamentos
WHERE aih_dt_auditor_externo IS NOT NULL 
  AND aih_dt_autorizado IS NOT NULL
  AND aih_dt_autorizado > NOW() - INTERVAL '30 days';

-- =====================================================
-- 6. PACIENTES HÁ MAIS DE X DIAS NO MESMO STATUS
-- Altere o número 7 para quantos dias quiser verificar
SELECT 
  nome_paciente,
  status_aih,
  data_agendamento,
  CASE status_aih
    WHEN 'Pendência Hospital' THEN aih_dt_pendencia_hospital
    WHEN 'Pendência Faturamento' THEN aih_dt_pendencia_faturamento
    WHEN 'Auditor Externo' THEN aih_dt_auditor_externo
    WHEN 'Aguardando Ciência SMS' THEN aih_dt_ag_ciencia_sms
    WHEN 'Ag. Correção' THEN aih_dt_ag_correcao
  END AS entrou_no_status_em,
  ROUND(
    EXTRACT(EPOCH FROM (NOW() - 
      CASE status_aih
        WHEN 'Pendência Hospital' THEN aih_dt_pendencia_hospital
        WHEN 'Pendência Faturamento' THEN aih_dt_pendencia_faturamento
        WHEN 'Auditor Externo' THEN aih_dt_auditor_externo
        WHEN 'Aguardando Ciência SMS' THEN aih_dt_ag_ciencia_sms
        WHEN 'Ag. Correção' THEN aih_dt_ag_correcao
      END
    )) / 86400, 
    1
  ) AS dias_no_status
FROM agendamentos
WHERE status_aih NOT IN ('Autorizado', 'N/A - Urgência')
  AND nome_paciente IS NOT NULL
  AND (
    (status_aih = 'Pendência Hospital' AND aih_dt_pendencia_hospital < NOW() - INTERVAL '7 days')
    OR (status_aih = 'Pendência Faturamento' AND aih_dt_pendencia_faturamento < NOW() - INTERVAL '7 days')
    OR (status_aih = 'Auditor Externo' AND aih_dt_auditor_externo < NOW() - INTERVAL '7 days')
    OR (status_aih = 'Aguardando Ciência SMS' AND aih_dt_ag_ciencia_sms < NOW() - INTERVAL '7 days')
    OR (status_aih = 'Ag. Correção' AND aih_dt_ag_correcao < NOW() - INTERVAL '7 days')
  )
ORDER BY dias_no_status DESC;
